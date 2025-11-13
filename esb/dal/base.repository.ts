/**
 * ESB - Data Access Layer - Repositorio Base
 * Ahora con driver interno: 'memory' (Map) o 'pg' (PostgreSQL)
 * SIN CAMBIAR las firmas públicas.
 */

import { Pool, PoolConfig } from 'pg';

export interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  /** Ya la usas en varios repos (reserva, detalle, pago, pre-reserva, etc.) */
  findByField<K extends keyof T>(field: K, value: T[K]): Promise<T[]>;
  create(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  exists(id: string): Promise<boolean>;
  count(): Promise<number>;
  clear(): Promise<void>;
}

/** Driver elegido por ENV: 'memory' (default) o 'pg' */
function getDataBackend(): 'memory' | 'pg' {
  const v = (process.env.DATA_BACKEND || 'memory').toLowerCase();
  return v === 'pg' ? 'pg' : 'memory';
}

/** Quota identificadores SQL (nombres de tabla/columna) */
function q(ident: string): string {
  return `"${ident.replace(/"/g, '""')}"`;
}

/** Construye el Pool de PG una sola vez */
let sharedPool: Pool | null = null;
function getPgPool(): Pool {
  if (sharedPool) return sharedPool;
  const sslEnabled = String(process.env.PGSSL || 'false').toLowerCase() === 'true';
  const rejectUnauthorized = String(process.env.PGSSL_REJECT_UNAUTHORIZED || 'false').toLowerCase() === 'true';

  const cfg: PoolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: sslEnabled ? { rejectUnauthorized } : undefined,
  };
  sharedPool = new Pool(cfg);
  return sharedPool;
}

/** Deep-clone barato para aislar valores en memoria */
function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Repositorio Base genérico.
 * idField: nombre del campo id (ej. 'idUsuario')
 * tableName: nombre de tabla (ej. 'usuario') SOLO necesario en modo 'pg'
 * persistableFields: columnas que existen físicamente en la tabla
 *   - Evita intentar insertar propiedades que no existen (ej. 'detalles' en Reserva).
 *   - Si no se provee, intentará todas las keys del objeto (útil si el objeto coincide 1:1 con columnas).
 */
export abstract class BaseRepository<T extends Record<string, any>> implements IRepository<T> {
  private mode: 'memory' | 'pg';
  private storage = new Map<string, T>(); // usado SOLO en modo memory
  private pool: Pool | null = null;

  constructor(
    protected readonly idField: keyof T & string,
    protected readonly tableName?: string,
    protected readonly persistableFields?: (keyof T & string)[]
  ) {
    this.mode = getDataBackend();
    if (this.mode === 'pg') {
      if (!this.tableName) {
        throw new Error(`BaseRepository(${String(this.idField)}): tableName es requerido en modo 'pg'`);
      }
      this.pool = getPgPool();
    }
  }

  // ====================== MÉTODOS PÚBLICOS (NO CAMBIAR FIRMAS) ======================

  async findAll(): Promise<T[]> {
    if (this.mode === 'memory') {
      return Array.from(this.storage.values()).map(clone);
    }
    const sql = `SELECT * FROM ${q(this.tableName!)};`;
    const { rows } = await this.pool!.query(sql);
    return rows as T[];
  }

  async findById(id: string): Promise<T | null> {
    if (this.mode === 'memory') {
      const v = this.storage.get(id);
      return v ? clone(v) : null;
    }
    const sql = `SELECT * FROM ${q(this.tableName!)} WHERE ${q(this.idField)} = $1 LIMIT 1;`;
    const { rows } = await this.pool!.query(sql, [id]);
    return rows[0] ?? null;
  }

  async findByField<K extends keyof T>(field: K, value: T[K]): Promise<T[]> {
    if (this.mode === 'memory') {
      const all = await this.findAll();
      return all.filter(item => item[field] === value);
    }
    const sql = `SELECT * FROM ${q(this.tableName!)} WHERE ${q(String(field))} = $1;`;
    const { rows } = await this.pool!.query(sql, [value as any]);
    return rows as T[];
  }

  async create(entity: T): Promise<T> {
    if (this.mode === 'memory') {
      const data = clone(entity);
      let id = data[this.idField];
      if (!id) {
        // Genera UUID si no hay; en mem basta un id pseudo-único
        (data as any)[this.idField] = `id-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      }
      this.storage.set(String((data as any)[this.idField]), data);
      return clone(data);
    }

    // PG: INSERT dinámico solo con columnas persistibles y valores definidos
    const body = { ...entity };
    // Si id viene undefined, lo omitimos para que aplique DEFAULT (gen_random_uuid())
    if (body[this.idField] === undefined) {
      delete (body as any)[this.idField];
    }

    const keysAll = Object.keys(body) as (keyof T & string)[];
    const keys = (this.persistableFields?.length ? this.persistableFields : keysAll)
      .filter(k => (body as any)[k] !== undefined);

    if (!keys.length) {
      // Insert vacío → confiar en defaults (mínimo id) → RETURNING *
      const sqlEmpty = `INSERT INTO ${q(this.tableName!)} DEFAULT VALUES RETURNING *;`;
      const { rows } = await this.pool!.query(sqlEmpty);
      return rows[0] as T;
    }

    const cols = keys.map(k => q(k)).join(', ');
    const params = keys.map((_, i) => `$${i + 1}`).join(', ');
    const args = keys.map(k => (body as any)[k]);
    const sql = `INSERT INTO ${q(this.tableName!)} (${cols}) VALUES (${params}) RETURNING *;`;
    const { rows } = await this.pool!.query(sql, args);
    return rows[0] as T;
  }

  async update(id: string, patch: Partial<T>): Promise<T> {
    if (this.mode === 'memory') {
      const current = this.storage.get(id);
      if (!current) throw new Error(`No existe entidad con id: ${id}`);
      // No permitir cambiar id desde patch
      const { [this.idField]: _ignore, ...rest } = patch as any;
      const merged = { ...current, ...rest };
      this.storage.set(id, merged);
      return clone(merged);
    }

    const body = { ...patch } as Record<string, any>;
    delete body[this.idField]; // nunca actualizamos el id con update()

    const keysAll = Object.keys(body) as (keyof T & string)[];
    const keys = (this.persistableFields?.length ? this.persistableFields : keysAll)
      .filter(k => body[k] !== undefined && k in body);

    if (!keys.length) {
      // Nada que actualizar → devolvemos el actual (o lanzamos error)
      const found = await this.findById(id);
      if (!found) throw new Error(`No existe entidad con id: ${id}`);
      return found;
    }

    const setExpr = keys.map((k, i) => `${q(k)} = $${i + 1}`).join(', ');
    const args = keys.map(k => body[k]);
    args.push(id);

    const sql = `UPDATE ${q(this.tableName!)} SET ${setExpr} WHERE ${q(this.idField)} = $${keys.length + 1} RETURNING *;`;
    const { rows } = await this.pool!.query(sql, args);
    if (!rows[0]) throw new Error(`No existe entidad con id: ${id}`);
    return rows[0] as T;
  }

  async delete(id: string): Promise<boolean> {
    if (this.mode === 'memory') {
      return this.storage.delete(id);
    }
    const sql = `DELETE FROM ${q(this.tableName!)} WHERE ${q(this.idField)} = $1;`;
    const { rowCount } = await this.pool!.query(sql, [id]);
    return rowCount > 0;
  }

  async exists(id: string): Promise<boolean> {
    if (this.mode === 'memory') {
      return this.storage.has(id);
    }
    const sql = `SELECT 1 FROM ${q(this.tableName!)} WHERE ${q(this.idField)} = $1 LIMIT 1;`;
    const { rowCount } = await this.pool!.query(sql, [id]);
    return rowCount > 0;
  }

  async count(): Promise<number> {
    if (this.mode === 'memory') {
      return this.storage.size;
    }
    const sql = `SELECT COUNT(*)::int AS c FROM ${q(this.tableName!)};`;
    const { rows } = await this.pool!.query(sql);
    return rows[0]?.c ?? 0;
  }

  async clear(): Promise<void> {
    if (this.mode === 'memory') {
      this.storage.clear();
      return;
    }
    // ATENCIÓN: limpia tabla completa. Úsalo en test/dev.
    const sql = `TRUNCATE ${q(this.tableName!)} RESTART IDENTITY CASCADE;`;
    await this.pool!.query(sql);
  }
}
