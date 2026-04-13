import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

export async function repairDuplicateEnrollments(): Promise<void> {
  try {
    // Remove duplicate enrollments, keeping only the row with the smallest id
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
