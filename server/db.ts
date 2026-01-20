import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

// Fallback for build time or initial deployment setup
// If DATABASE_URL is missing, we use a dummy pool to prevent startup crash
const connectionString = process.env.DATABASE_URL;

export const pool = connectionString 
  ? new Pool({ 
      connectionString,
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false }
    })
  : new Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/postgres" }); // Dummy fallback

export const db = drizzle(pool, { schema });
