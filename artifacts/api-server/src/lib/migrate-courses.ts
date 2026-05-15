import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

/**
 * Adds the pricing / enrollment columns to the courses table if they don't
 * already exist.  Safe to run on every startup (uses ADD COLUMN IF NOT EXISTS).
 */
export async function migrateCoursesTable(): Promise<void> {
  try {
    await db.execute(sql`
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS enrollment_type text NOT NULL DEFAULT 'free';
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS price real;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD';
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS max_students integer;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS what_you_learn json;
      ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites text;
    `);
    logger.info("migrateCoursesTable: columns ensured");
  } catch (err) {
    logger.error({ err }, "migrateCoursesTable failed");
  }
}

export async function migrateQuizzesTable(): Promise<void> {
  try {
    await db.execute(sql`
      ALTER TABLE quizzes ADD COLUMN IF NOT EXISTS enrollment_type text NOT NULL DEFAULT 'free';
    `);
    logger.info("migrateQuizzesTable: columns ensured");
  } catch (err) {
    logger.error({ err }, "migrateQuizzesTable failed");
  }
}

export async function migrateLessonsTable(): Promise<void> {
  try {
    await db.execute(sql`
      ALTER TABLE lessons ADD COLUMN IF NOT EXISTS enrollment_type text NOT NULL DEFAULT 'free';
    `);
    logger.info("migrateLessonsTable: columns ensured");
  } catch (err) {
    logger.error({ err }, "migrateLessonsTable failed");
  }
}
