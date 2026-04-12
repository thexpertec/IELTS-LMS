import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { sql } from "drizzle-orm";

const DEMO_USERS = [
  {
    email: "admin@lms.com",
    username: "admin",
    name: "Admin User",
    password: "admin123",
    role: "admin",
  },
  {
    email: "alice@example.com",
    username: "alice",
    name: "Alice Johnson",
    password: "student123",
    role: "student",
  },
  {
    email: "bob@example.com",
    username: "bob",
    name: "Bob Smith",
    password: "student123",
    role: "student",
  },
  {
    email: "carol@example.com",
    username: "carol",
    name: "Carol White",
    password: "student123",
    role: "student",
  },
  {
    email: "david@example.com",
    username: "david",
    name: "David Lee",
    password: "student123",
    role: "student",
  },
  {
    email: "operator@platform.com",
    username: "sysadmin",
    name: "System Operator",
    password: "admin123",
    role: "saas_admin",
  },
];

export async function seedUsersIfEmpty() {
  try {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
    const count = Number((result.rows[0] as { count: string }).count);
    if (count > 0) return;

    for (const user of DEMO_USERS) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await db.insert(usersTable).values({
        email: user.email,
        username: user.username,
        name: user.name,
        passwordHash,
        role: user.role,
      });
    }
    console.log("Seeded demo users.");
  } catch (err) {
    console.error("Failed to seed users:", err);
  }
}
