import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, mediaFilesTable } from "@workspace/db";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/bmp",
  "image/tiff",
  "image/avif",
  "image/heic",
  "image/heif",
]);

async function convertToWebP(
  objectPath: string,
  originalName: string
): Promise<{ objectPath: string; fileSize: number; name: string }> {
  // Dynamically import sharp so it doesn't break startup if unavailable
  const sharp = (await import("sharp")).default;

  // 1. Download original buffer from GCS
  const gcsFile = await objectStorageService.getObjectEntityFile(objectPath);
  const [buffer] = await gcsFile.download();

  // 2. Convert to WebP (quality 85 — good balance of size and fidelity)
  const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();

  // 3. Request a fresh presigned URL for the new WebP file
  const uploadUrl = await objectStorageService.getObjectEntityUploadURL();

  // 4. Upload WebP buffer directly to GCS via the presigned URL
  const uploadRes = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "image/webp" },
    body: webpBuffer,
    // @ts-expect-error — Node 18 fetch accepts Buffer bodies
    duplex: "half",
  });
  if (!uploadRes.ok) {
    throw new Error(`WebP upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
  }

  // 5. Normalise the GCS URL to an objectPath (/objects/uploads/<uuid>)
  const newObjectPath = objectStorageService.normalizeObjectEntityPath(
    uploadUrl.split("?")[0]
  );

  // 6. Delete the original file (best-effort)
  try {
    await gcsFile.delete();
  } catch {
    // Non-fatal — the record will point to the WebP
  }

  // Strip the old extension and add .webp
  const baseName = originalName.replace(/\.[^/.]+$/, "");

  return {
    objectPath: newObjectPath,
    fileSize: webpBuffer.length,
    name: `${baseName}.webp`,
  };
}

router.get("/media", async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId ?? null;
  const { type } = req.query;

  const conditions = [];
  if (tenantId) conditions.push(eq(mediaFilesTable.tenantId, tenantId));
  if (type && typeof type === "string") conditions.push(eq(mediaFilesTable.mediaType, type));

  const files = await db
    .select()
    .from(mediaFilesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(mediaFilesTable.createdAt));

  res.json(files);
});

router.post("/media", async (req, res): Promise<void> => {
  const tenantId = req.session.tenantId ?? null;
  let { name, originalName, mimeType, fileSize, objectPath, mediaType } = req.body as {
    name: string;
    originalName: string;
    mimeType: string;
    fileSize?: number;
    objectPath: string;
    mediaType: string;
  };

  if (!objectPath || !mediaType || !originalName) {
    res.status(400).json({ error: "objectPath, mediaType, and originalName are required" });
    return;
  }

  // Auto-convert images to WebP
  if (mediaType === "image" && IMAGE_MIME_TYPES.has(mimeType) && mimeType !== "image/webp") {
    try {
      const converted = await convertToWebP(objectPath, originalName);
      objectPath = converted.objectPath;
      fileSize = converted.fileSize;
      name = converted.name;
      originalName = converted.name;
      mimeType = "image/webp";
    } catch (err) {
      // Log but don't fail — store the original if conversion errors
      console.error("WebP conversion failed, storing original:", err);
    }
  }

  const [file] = await db
    .insert(mediaFilesTable)
    .values({
      name: name || originalName,
      originalName,
      mimeType,
      fileSize: fileSize ?? null,
      objectPath,
      mediaType,
      tenantId,
    })
    .returning();

  res.status(201).json(file);
});

router.delete("/media/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const tenantId = req.session.tenantId ?? null;
  const conditions = [eq(mediaFilesTable.id, id)];
  if (tenantId) conditions.push(eq(mediaFilesTable.tenantId, tenantId));

  const [file] = await db.select().from(mediaFilesTable).where(and(...conditions));
  if (!file) { res.status(404).json({ error: "Not found" }); return; }

  try {
    const objectFile = await objectStorageService.getObjectEntityFile(file.objectPath);
    await objectFile.delete();
  } catch {
    // Continue even if GCS deletion fails — remove the DB record
  }

  await db.delete(mediaFilesTable).where(and(...conditions));
  res.status(204).end();
});

export default router;
