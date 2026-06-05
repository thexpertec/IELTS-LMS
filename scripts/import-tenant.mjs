import pg from "pg";
import { readFileSync } from "fs";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const { Pool } = pg;

const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) throw new Error("No database connection string found");

const pool = new Pool({ connectionString });

const BACKUP_PATH = "./attached_assets/backup-secure-ielts-2026-06-05_1780674158671.json";
const TENANT_NAME = "Secure Ielts";
const TENANT_SLUG = "secure-ielts";
const ADMIN_EMAIL = "info@secureielts.com";
const ADMIN_PASSWORD = "admin123";

function generateDbPrefix() {
  return "t" + randomBytes(4).toString("hex");
}

async function run() {
  const client = await pool.connect();
  try {
    console.log("Reading backup file...");
    const backup = JSON.parse(readFileSync(BACKUP_PATH, "utf-8"));
    console.log(`Backup: ${backup.summary.courses} courses, ${backup.summary.chapters} chapters, ${backup.summary.lessons} lessons, ${backup.summary.quizzes} quizzes, ${backup.summary.quizQuestions} questions`);

    await client.query("BEGIN");

    // 1. Create tenant
    console.log("\nCreating tenant...");
    const dbPrefix = generateDbPrefix();
    const tenantRes = await client.query(
      `INSERT INTO tenants (name, slug, db_prefix, admin_email, admin_name, plan, status)
       VALUES ($1, $2, $3, $4, $5, 'professional', 'active')
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, admin_email = EXCLUDED.admin_email
       RETURNING id`,
      [TENANT_NAME, TENANT_SLUG, dbPrefix, ADMIN_EMAIL, "Secure IELTS Admin"]
    );
    const tenantId = tenantRes.rows[0].id;
    console.log(`Tenant created with ID: ${tenantId}`);

    // 2. Create admin user for this tenant
    console.log("Creating admin user...");
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await client.query(
      `INSERT INTO users (email, username, name, password_hash, role, tenant_id)
       VALUES ($1, $2, $3, $4, 'admin', $5)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, tenant_id = EXCLUDED.tenant_id`,
      [ADMIN_EMAIL, "secure-ielts-admin", "Secure IELTS Admin", passwordHash, tenantId]
    );
    console.log("Admin user created");

    // 3. Import lesson types
    if (backup.lessonTypes?.length) {
      console.log(`\nImporting ${backup.lessonTypes.length} lesson types...`);
      for (const lt of backup.lessonTypes) {
        await client.query(
          `INSERT INTO lesson_types (tenant_id, key, label, icon, color, bg, "order", is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (tenant_id, key) DO UPDATE SET label = EXCLUDED.label`,
          [tenantId, lt.key, lt.label, lt.icon || "BookOpen", lt.color || "text-blue-600", lt.bg || "bg-blue-50 dark:bg-blue-950/30", lt.order || 1, lt.isActive !== false]
        );
      }
      console.log("Lesson types imported");
    }

    // 4. Import courses, mapping old IDs to new IDs
    const courseIdMap = {}; // oldId -> newId
    console.log(`\nImporting ${backup.courses.length} courses...`);
    for (const course of backup.courses) {
      const res = await client.query(
        `INSERT INTO courses (title, description, category, instructor, level, image_url, duration_hours, tenant_id, is_published, enrollment_type, price, currency, max_students, what_you_learn, prerequisites)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING id`,
        [course.title, course.description, course.category, course.instructor, course.level, course.imageUrl, course.durationHours, tenantId, course.isPublished, course.enrollmentType || "free", course.price, course.currency || "USD", course.maxStudents, course.whatYouLearn ? JSON.stringify(course.whatYouLearn) : null, course.prerequisites]
      );
      courseIdMap[course.id] = res.rows[0].id;
    }
    console.log("Courses imported");

    // 5. Import chapters, mapping old IDs to new IDs
    const chapterIdMap = {}; // oldId -> newId
    console.log(`\nImporting ${backup.chapters.length} chapters...`);
    for (const ch of backup.chapters) {
      const newCourseId = courseIdMap[ch.courseId];
      if (!newCourseId) { console.warn(`  Skipping chapter ${ch.id}: course ${ch.courseId} not found`); continue; }
      const res = await client.query(
        `INSERT INTO chapters (course_id, title, "order") VALUES ($1,$2,$3) RETURNING id`,
        [newCourseId, ch.title, ch.order || 1]
      );
      chapterIdMap[ch.id] = res.rows[0].id;
    }
    console.log("Chapters imported");

    // 6. Import lessons, mapping old IDs to new IDs
    const lessonIdMap = {}; // oldId -> newId
    console.log(`\nImporting ${backup.lessons.length} lessons...`);
    for (const l of backup.lessons) {
      const newCourseId = courseIdMap[l.courseId];
      if (!newCourseId) { console.warn(`  Skipping lesson ${l.id}: course ${l.courseId} not found`); continue; }
      const newChapterId = l.chapterId ? chapterIdMap[l.chapterId] : null;
      const res = await client.query(
        `INSERT INTO lessons (course_id, chapter_id, title, description, content, video_url, image_url, audio_url, image_urls, audio_urls, duration_minutes, lesson_type, enrollment_type, "order")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
         RETURNING id`,
        [newCourseId, newChapterId, l.title, l.description || "", l.content || "", l.videoUrl, l.imageUrl, l.audioUrl, l.imageUrls ? JSON.stringify(l.imageUrls) : null, l.audioUrls ? JSON.stringify(l.audioUrls) : null, l.durationMinutes, l.lessonType || "reading", l.enrollmentType || "free", l.order || 1]
      );
      lessonIdMap[l.id] = res.rows[0].id;
    }
    console.log("Lessons imported");

    // 7. Import quizzes, mapping old IDs to new IDs
    const quizIdMap = {}; // oldId -> newId
    console.log(`\nImporting ${backup.quizzes.length} quizzes...`);
    for (const q of backup.quizzes) {
      const newCourseId = q.courseId ? courseIdMap[q.courseId] : null;
      const newChapterId = q.chapterId ? chapterIdMap[q.chapterId] : null;
      const newLessonId = q.lessonId ? lessonIdMap[q.lessonId] : null;
      const res = await client.query(
        `INSERT INTO quizzes (title, description, passage_text, parts, course_id, chapter_id, lesson_id, lesson_type, video_url, image_urls, audio_urls, time_limit_minutes, is_published, enrollment_type, tenant_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
         RETURNING id`,
        [q.title, q.description || "", q.passageText, q.parts ? JSON.stringify(q.parts) : null, newCourseId, newChapterId, newLessonId, q.lessonType, q.videoUrl, q.imageUrls ? JSON.stringify(q.imageUrls) : null, q.audioUrls ? JSON.stringify(q.audioUrls) : null, q.timeLimitMinutes, q.isPublished || false, q.enrollmentType || "free", tenantId]
      );
      quizIdMap[q.id] = res.rows[0].id;
    }
    console.log("Quizzes imported");

    // 8. Import quiz questions
    console.log(`\nImporting ${backup.quizQuestions.length} quiz questions...`);
    let skipped = 0;
    for (const qq of backup.quizQuestions) {
      const newQuizId = quizIdMap[qq.quizId];
      if (!newQuizId) { skipped++; continue; }
      await client.query(
        `INSERT INTO quiz_questions (quiz_id, type, "order", question_text, options)
         VALUES ($1,$2,$3,$4,$5)`,
        [newQuizId, qq.type, qq.order || 1, qq.questionText || "", JSON.stringify(qq.options || {})]
      );
    }
    if (skipped) console.warn(`  Skipped ${skipped} questions with missing quiz`);
    console.log("Quiz questions imported");

    await client.query("COMMIT");

    console.log("\n✅ Import complete!");
    console.log(`   Tenant: ${TENANT_NAME} (ID: ${tenantId})`);
    console.log(`   Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`   Courses: ${Object.keys(courseIdMap).length}`);
    console.log(`   Chapters: ${Object.keys(chapterIdMap).length}`);
    console.log(`   Lessons: ${Object.keys(lessonIdMap).length}`);
    console.log(`   Quizzes: ${Object.keys(quizIdMap).length}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Import failed, rolled back:", err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
