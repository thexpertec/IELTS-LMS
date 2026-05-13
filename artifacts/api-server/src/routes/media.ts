import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, mediaFilesTable } from "@workspace/db";
import { ObjectStorageService } from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

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
  const { name, originalName, mimeType, fileSize, objectPath, mediaType } = req.body as {
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

  const [file] = await db
    .insert(mediaFilesTable)
    .values({
      name: name || originalName,
      originalName,
      mimeType: mimeType || "application/octet-stream",
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
