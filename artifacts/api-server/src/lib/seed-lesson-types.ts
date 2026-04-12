import { db } from "@workspace/db";
import { lessonTypesTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const DEFAULT_LESSON_TYPES = [
  { key: "writing",       label: "Writing",       icon: "PenLine",    color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30", order: 1 },
  { key: "listening",     label: "Listening",     icon: "Headphones", color: "text-green-600",  bg: "bg-green-50 dark:bg-green-950/30",   order: 2 },
  { key: "speaking",      label: "Speaking",      icon: "Mic",        color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30", order: 3 },
  { key: "reading",       label: "Reading",       icon: "BookText",   color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/30",     order: 4 },
  { key: "grammar",       label: "Grammar",       icon: "AlignLeft",  color: "text-rose-600",   bg: "bg-rose-50 dark:bg-rose-950/30",     order: 5 },
  { key: "vocabulary",    label: "Vocabulary",    icon: "BookMarked", color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/30",   order: 6 },
  { key: "pronunciation", label: "Pronunciation", icon: "Volume2",    color: "text-sky-600",    bg: "bg-sky-50 dark:bg-sky-950/30",       order: 7 },
  { key: "translation",   label: "Translation",   icon: "Languages",  color: "text-teal-600",   bg: "bg-teal-50 dark:bg-teal-950/30",     order: 8 },
];

export async function seedLessonTypesIfEmpty() {
  try {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM lesson_types`);
    const count = Number((result.rows[0] as { count: string }).count);
    if (count > 0) return;

    for (const lt of DEFAULT_LESSON_TYPES) {
      await db.insert(lessonTypesTable).values(lt);
    }
    console.log("Seeded default lesson types.");
  } catch (err) {
    console.error("Failed to seed lesson types:", err);
  }
}
