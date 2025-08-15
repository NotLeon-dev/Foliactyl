import { createClient } from '@libsql/client';

// If TURSO env vars are provided, attempt to use the Turso (libsql) client.
// Otherwise, fall back to a simple in-memory Map store so the app can run in dev.
let client = null;
const memory = new Map();

const useTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
if (useTurso) {
  try {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });

    // Ensure the keyv table exists
    await client.execute(`CREATE TABLE IF NOT EXISTS keyv (key TEXT PRIMARY KEY, value TEXT)`);
  } catch (e) {
    console.warn('[DATABASE] Failed to initialize Turso client, falling back to in-memory store: ' + e);
    client = null;
  }
} else {
  console.warn('[DATABASE] TURSO_DATABASE_URL or TURSO_AUTH_TOKEN not set - using in-memory fallback store');
}

export default {
  async get(key) {
    if (client) {
      const result = await client.execute({
        sql: 'SELECT value FROM keyv WHERE key = ?',
        args: [`keyv:${key}`]
      });
      return result.rows[0] ? JSON.parse(result.rows[0].value).value : undefined;
    }

    return memory.has(key) ? memory.get(key) : undefined;
  },

  async set(key, value) {
    if (client) {
      // Upsert
      await client.execute({
        sql: 'INSERT OR REPLACE INTO keyv (key, value) VALUES (?, ?)',
        args: [
          `keyv:${key}`,
          JSON.stringify({ value: value, expires: null })
        ]
      });
      return true;
    }

    memory.set(key, value);
    return true;
  },

  async delete(key) {
    if (client) {
      await client.execute({
        sql: 'DELETE FROM keyv WHERE key = ?',
        args: [`keyv:${key}`]
      });
      return true;
    }

    memory.delete(key);
    return true;
  }
};