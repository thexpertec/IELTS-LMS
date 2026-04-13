import app from "./app";
import { logger } from "./lib/logger";
import { seedUsersIfEmpty } from "./lib/seed-users";
import { seedLessonTypesIfEmpty } from "./lib/seed-lesson-types";
import { repairDuplicateEnrollments, ensureEnrollmentUniqueConstraint } from "./lib/repair-enrollments";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  void repairDuplicateEnrollments()
    .then(() => ensureEnrollmentUniqueConstraint())
    .catch((err) => logger.error({ err }, "Startup repair failed"));
  seedUsersIfEmpty();
  seedLessonTypesIfEmpty();
});
