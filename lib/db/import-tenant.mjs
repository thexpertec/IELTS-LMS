import pg from "pg";
import { readFileSync } from "fs";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const { Pool } = pg;
const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) throw new Error("NEON_DATABASE_URL not set");

const pool = new Pool({ connectionString });
const BACKUP_PATH = "/home/runner/workspace/attached_assets/backup-secure-ielts-2026-06-05_1780674158671.json";
const TENANT_NAME = "Secure Ielts";
const TENANT_SLUG = "secure-ielts";
const ADMIN_EMAIL = "info@secureielts.com";
const ADMIN_PASSWORD = "admin123";

function bulkInsert(client, table, columns, rows) {
  if (!rows.length) return Promise.resolve({ rows: [] });
  const params = [];
  const placeholders = rows.map((row, i) => {
    const offset = i * columns.length;
    row.forEach(v => params.push(v));
    return "(" + columns.map((_, j) => `$${offset + j + 1}`).join(",") + ")";
  });
  const colsSql = columns.map(c => c.startsWith('"') ? c : `"${c}"`).join(",");
  const sql = `INSERT INTO ${table} (${colsSql}) VALUES ${placeholders.join(",")} RETURNING id`;
  return client.query(sql, params);
}

const backup = JSON.parse(readFileSync(BACKUP_PATH, "utf-8"));
console.log(`Backup: ${backup.summary.courses} courses, ${backup.summary.chapters} chapters, ${backup.summary.lessons} lessons, ${backup.summary.quizzes} quizzes, ${backup.summary.quizQuestions} questions`);

const client = await pool.connect();
try {
  await client.query("BEGIN");

  // 1. Tenant
  const dbPrefix = "t" + randomBytes(4).toString("hex");
  const tenantRes = await client.query(
    `INSERT INTO tenants (name, slug, db_prefix, admin_email, admin_name, plan, status)
     VALUES ($1,$2,$3,$4,$5,'professional','active')
     ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, admin_email=EXCLUDED.admin_email, plan='professional'
     RETURNING id`,
    [TENANT_NAME, TENANT_SLUG, dbPrefix, ADMIN_EMAIL, "Secure IELTS Admin"]
  );
  const tenantId = tenantRes.rows[0].id;
  console.log("Tenant ID:", tenantId);

  // 2. Admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await client.query(
    `INSERT INTO users (email, username, name, password_hash, role, tenant_id)
     VALUES ($1,$2,$3,$4,'admin',$5)
     ON CONFLICT (email) DO UPDATE SET password_hash=EXCLUDED.password_hash, tenant_id=EXCLUDED.tenant_id, role='admin'`,
    [ADMIN_EMAIL, "secure-ielts-admin", "Secure IELTS Admin", passwordHash, tenantId]
  );
  console.log("Admin user ready");

  // 3. Lesson types
  if (backup.lessonTypes?.length) {
    for (const lt of backup.lessonTypes) {
      await client.query(
        `INSERT INTO lesson_types (tenant_id, key, label, icon, color, bg, "order", is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (tenant_id, key) DO UPDATE SET label=EXCLUDED.label`,
        [tenantId, lt.key, lt.label, lt.icon||"BookOpen", lt.color||"text-blue-600", lt.bg||"bg-blue-50 dark:bg-blue-950/30", lt.order||1, lt.isActive!==false]
      );
    }
    console.log(`${backup.lessonTypes.length} lesson types imported`);
  }

  // 4. Courses (bulk)
  const courseRows = backup.courses.map(c => [
    c.title, c.description, c.category, c.instructor, c.level, c.imageUrl,
    c.durationHours, tenantId, c.isPublished, c.enrollmentType||"free",
    c.price, c.currency||"USD", c.maxStudents,
    c.whatYouLearn ? JSON.stringify(c.whatYouLearn) : null, c.prerequisites
  ]);
  const courseRes = await bulkInsert(client, "courses",
    ["title","description","category","instructor","level","image_url","duration_hours","tenant_id","is_published","enrollment_type","price","currency","max_students","what_you_learn","prerequisites"],
    courseRows);
  const courseIdMap = {};
  backup.courses.forEach((c, i) => { courseIdMap[c.id] = courseRes.rows[i].id; });
  console.log(`${backup.courses.length} courses imported`);

  // 5. Chapters (bulk)
  const validChapters = backup.chapters.filter(ch => courseIdMap[ch.courseId]);
  const chapterRes = await bulkInsert(client, "chapters",
    ["course_id","title","order"],
    validChapters.map(ch => [courseIdMap[ch.courseId], ch.title, ch.order||1]));
  const chapterIdMap = {};
  validChapters.forEach((ch, i) => { chapterIdMap[ch.id] = chapterRes.rows[i].id; });
  console.log(`${validChapters.length} chapters imported`);

  // 6. Lessons (bulk)
  const validLessons = backup.lessons.filter(l => courseIdMap[l.courseId]);
  const lessonRes = await bulkInsert(client, "lessons",
    ["course_id","chapter_id","title","description","content","video_url","image_url","audio_url","image_urls","audio_urls","duration_minutes","lesson_type","enrollment_type","order"],
    validLessons.map(l => [
      courseIdMap[l.courseId], l.chapterId ? chapterIdMap[l.chapterId] : null,
      l.title, l.description||"", l.content||"", l.videoUrl, l.imageUrl, l.audioUrl,
      l.imageUrls ? JSON.stringify(l.imageUrls) : null,
      l.audioUrls ? JSON.stringify(l.audioUrls) : null,
      l.durationMinutes, l.lessonType||"reading", l.enrollmentType||"free", l.order||1
    ]));
  const lessonIdMap = {};
  validLessons.forEach((l, i) => { lessonIdMap[l.id] = lessonRes.rows[i].id; });
  console.log(`${validLessons.length} lessons imported`);

  // 7. Quizzes (bulk in batches of 50)
  const quizIdMap = {};
  for (let i = 0; i < backup.quizzes.length; i += 50) {
    const batch = backup.quizzes.slice(i, i + 50);
    const res = await bulkInsert(client, "quizzes",
      ["title","description","passage_text","parts","course_id","chapter_id","lesson_id","lesson_type","video_url","image_urls","audio_urls","time_limit_minutes","is_published","enrollment_type","tenant_id"],
      batch.map(q => [
        q.title, q.description||"", q.passageText,
        q.parts ? JSON.stringify(q.parts) : null,
        q.courseId ? courseIdMap[q.courseId] : null,
        q.chapterId ? chapterIdMap[q.chapterId] : null,
        q.lessonId ? lessonIdMap[q.lessonId] : null,
        q.lessonType, q.videoUrl,
        q.imageUrls ? JSON.stringify(q.imageUrls) : null,
        q.audioUrls ? JSON.stringify(q.audioUrls) : null,
        q.timeLimitMinutes, q.isPublished||false, q.enrollmentType||"free", tenantId
      ]));
    batch.forEach((q, j) => { quizIdMap[q.id] = res.rows[j].id; });
  }
  console.log(`${backup.quizzes.length} quizzes imported`);

  // 8. Quiz questions (bulk in batches of 200)
  let total = 0, skipped = 0;
  for (let i = 0; i < backup.quizQuestions.length; i += 200) {
    const batch = backup.quizQuestions.slice(i, i + 200);
    const valid = batch.filter(qq => quizIdMap[qq.quizId]);
    skipped += batch.length - valid.length;
    if (!valid.length) continue;
    await bulkInsert(client, "quiz_questions",
      ["quiz_id","type","order","question_text","options"],
      valid.map(qq => [quizIdMap[qq.quizId], qq.type, qq.order||1, qq.questionText||"", JSON.stringify(qq.options||{})]));
    total += valid.length;
    process.stdout.write(`\r  questions: ${total}/${backup.quizQuestions.length}`);
  }
  console.log(`\n${total} quiz questions imported${skipped ? ` (${skipped} skipped)` : ""}`);

  await client.query("COMMIT");
  console.log("\n✅ Import complete!");
  console.log(`Tenant: "${TENANT_NAME}" (ID: ${tenantId})`);
  console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);

} catch (err) {
  await client.query("ROLLBACK");
  console.error("FAILED, rolled back:", err.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
