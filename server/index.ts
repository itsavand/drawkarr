import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { db } from "./db";
import { sql } from "drizzle-orm";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    if (process.env.DATABASE_URL) {
      log("Verifying database connection and syncing schema...");
      await db.execute(sql`SELECT 1`);
      
      // Automatic migration/table creation for development/Railway
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS rooms (
          id SERIAL PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          host_id TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'waiting',
          secret_word TEXT,
          liar_id INTEGER,
          total_rounds INTEGER NOT NULL DEFAULT 1,
          current_round INTEGER NOT NULL DEFAULT 1,
          phase_end_time TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS players (
          id SERIAL PRIMARY KEY,
          room_id INTEGER NOT NULL REFERENCES rooms(id),
          session_id TEXT NOT NULL,
          name TEXT NOT NULL,
          is_liar BOOLEAN DEFAULT FALSE,
          has_voted BOOLEAN DEFAULT FALSE,
          is_ready BOOLEAN DEFAULT FALSE,
          score INTEGER DEFAULT 0,
          last_score_at TIMESTAMP,
          joined_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          room_id INTEGER NOT NULL REFERENCES rooms(id),
          player_id INTEGER NOT NULL REFERENCES players(id),
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      log("Database connection successful and schema synced.");
    } else {
      log("DATABASE_URL not set. Running in limited mode.");
    }
  } catch (err) {
    console.error("Database connection failed:", err);
  }

  await registerRoutes(httpServer, app);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
