import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPg from "connect-pg-simple";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import { getTenantCached } from "./lib/tenant-cache";

const PgStore = connectPg(session);

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgStore({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15,
    }),
    secret: process.env["SESSION_SECRET"] ?? "dev-fallback-secret",
    resave: false,
    saveUninitialized: false,
    name: "sid",
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);

const PUBLIC_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/health",
]);

app.use("/api", async (req: Request, res: Response, next: NextFunction) => {
  if (PUBLIC_PATHS.has(req.path) || !req.session.tenantId) {
    return next();
  }

  const tenant = await getTenantCached(req.session.tenantId).catch(() => null);

  if (!tenant) {
    req.session.destroy(() => {});
    res.status(401).json({ message: "Tenant not found. Please log in again." });
    return;
  }

  if (tenant.status !== "active") {
    res.status(403).json({ message: "Your organisation account is not active." });
    return;
  }

  if (!req.session.tenantDbPrefix) {
    req.session.tenantDbPrefix = tenant.dbPrefix;
  }

  next();
});

app.use("/api", router);

export default app;
