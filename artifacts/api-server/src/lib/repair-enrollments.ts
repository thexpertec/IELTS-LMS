import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function repairDuplicateEnrollments(): Promise<void> {
  try {
    const result = await db.execute(sql`
      DELETE FROM enrollments
      WHERE id NOT IN (
        SELECT MIN(id)
        FROM enrollments
        GROUP BY course_id, student_email
      )
    `);
    const deleted = (result as any).rowCount ?? 0;
    if (deleted > 0) {
      console.log(`Repaired ${deleted} duplicate enrollment(s).`);
    }
  } catch (err) {
    console.error("Failed to repair duplicate enrollments:", err);
  }
}

export async function ensureEnrollmentUniqueConstraint(): Promise<void> {
  try {
    await db.execute(sql`
      CREATE UNIQUE INDEX IF NOT EXISTS enrollments_course_student_unique
      ON enrollments (course_id, student_email)
    `);
  } catch (err) {
    console.error("Failed to create enrollment unique constraint:", err);
  }
}

export async function backfillTenantIds(): Promise<void> {
  try {
    // Backfill quizzes.tenant_id from their parent course
    const quizResult = await db.execute(sql`
      UPDATE quizzes
      SET tenant_id = courses.tenant_id
      FROM courses
      WHERE quizzes.course_id = courses.id
        AND quizzes.tenant_id IS NULL
        AND courses.tenant_id IS NOT NULL
    `);
    const quizFixed = (quizResult as any).rowCount ?? 0;
    if (quizFixed > 0) {
      console.log(`Backfilled tenant_id on ${quizFixed} quiz row(s).`);
    }

    // Backfill assignments.tenant_id from their parent course
    const asnResult = await db.execute(sql`
      UPDATE assignments
      SET tenant_id = courses.tenant_id
      FROM courses
      WHERE assignments.course_id = courses.id
        AND assignments.tenant_id IS NULL
        AND courses.tenant_id IS NOT NULL
    `);
    const asnFixed = (asnResult as any).rowCount ?? 0;
    if (asnFixed > 0) {
      console.log(`Backfilled tenant_id on ${asnFixed} assignment row(s).`);
    }
  } catch (err) {
    console.error("Failed to backfill tenant IDs:", err);
  }
}
