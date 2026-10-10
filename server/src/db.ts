import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL no está definida. Copiá server/.env.example a server/.env.");
}

export const pool = new pg.Pool({ connectionString: url });
