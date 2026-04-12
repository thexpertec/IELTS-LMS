import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db } from "@workspace/db";
import { lessonTypesTable } from "@workspace/db/schema";

const router: IRouter = Router();

router.get("/lesson-types", async (_req, res): Promise<void> => {
  const types = await db
    .select()
    .from(lessonTypesTable)
    .orderBy(asc(lessonTypesTable.order));
  res.json(types);
});

router.post("/lesson-types", async (req, res): Promise<void> => {
  const { key, label, icon, color, bg, order, isActive } = req.body as {
    key?: string; label?: string; icon?: string; color?: string; bg?: string; order?: number; isActive?: boolean;
  };
  if (!key || !label) {
    res.status(400).json({ error: "key and label are required" });
    return;
  }
  const existing = await db.select().from(lessonTypesTable).where(eq(lessonTypesTable.key, key)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "A lesson type with this key already exists" });
    return;
  }
  const maxOrder = await db.select({ order: lessonTypesTable.order }).from(lessonTypesTable).orderBy(asc(lessonTypesTable.order));
  const nextOrder = maxOrder.length > 0 ? Math.max(...maxOrder.map(r => r.order)) + 1 : 1;
  const [created] = await db
    .insert(lessonTypesTable)
    .values({ key, label, icon: icon ?? "BookOpen", color: color ?? "text-blue-600", bg: bg ?? "bg-blue-50 dark:bg-blue-950/30", order: order ?? nextOrder, isActive: isActive ?? true })
    .returning();
  res.status(201).json(created);
});

router.put("/lesson-types/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const { key, label, icon, color, bg, order, isActive } = req.body as {
    key?: string; label?: string; icon?: string; color?: string; bg?: string; order?: number; isActive?: boolean;
  };
  const updates: Partial<{ key: string; label: string; icon: string; color: string; bg: string; order: number; isActive: boolean }> = {};
  if (key !== undefined) updates.key = key;
  if (label !== undefined) updates.label = label;
  if (icon !== undefined) updates.icon = icon;
  if (color !== undefined) updates.color = color;
  if (bg !== undefined) updates.bg = bg;
  if (order !== undefined) updates.order = order;
  if (isActive !== undefined) updates.isActive = isActive;
  const [updated] = await db.update(lessonTypesTable).set(updates).where(eq(lessonTypesTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Lesson type not found" }); return; }
  res.json(updated);
});

router.delete("/lesson-types/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [deleted] = await db.delete(lessonTypesTable).where(eq(lessonTypesTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Lesson type not found" }); return; }
  res.sendStatus(204);
});

export default router;
