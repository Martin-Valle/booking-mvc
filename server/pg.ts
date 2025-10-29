import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false }  // descomenta si tu DB exige SSL
});

export async function one<T=any>(text: string, params?: any[]): Promise<T|null> {
  const { rows } = await pool.query(text, params);
  return rows[0] ?? null;
}
export async function many<T=any>(text: string, params?: any[]): Promise<T[]> {
  const { rows } = await pool.query(text, params);
  return rows as T[];
}
export async function exec(text: string, params?: any[]) {
  return pool.query(text, params);
}
