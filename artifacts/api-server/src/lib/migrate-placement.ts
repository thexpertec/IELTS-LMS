import { db } from "@workspace/db";
import { sql } from "drizzle-orm";
import { logger } from "./logger";

export async function migratePlacementTables(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS placement_attempts (
        id SERIAL PRIMARY KEY,
        student_email TEXT NOT NULL,
        tenant_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        max_score INTEGER NOT NULL DEFAULT 100,
        level TEXT NOT NULL,
        recommended_course_id INTEGER,
        source TEXT NOT NULL DEFAULT 'online',
        notes TEXT,
        taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS course_assignments (
        id SERIAL PRIMARY KEY,
        student_email TEXT NOT NULL,
        course_id INTEGER NOT NULL,
        tenant_id INTEGER NOT NULL,
        placement_attempt_id INTEGER,
        assigned_by_email TEXT NOT NULL,
        assignment_type TEXT NOT NULL DEFAULT 'manual',
        notes TEXT,
        is_active BOOLEAN NOT NULL DEFAULT true,
        assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    logger.info("migratePlacementTables: tables ensured");
  } catch (err) {
    logger.error({ err }, "migratePlacementTables failed");
  }
}
