// instrumentation.js
export async function register() {
  // Only run in the Node.js runtime (not edge runtime)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { default: pg } = await import('pg');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.error('DATABASE_URL environment variable is not set');
      process.exit(1);
    }

    const client = new pg.Client({ connectionString });
    try {
      await client.connect();
      await client.query(`
        CREATE TABLE IF NOT EXISTS notes (
          id          serial       PRIMARY KEY,
          title       text         NOT NULL,
          body        text,
          pinned      boolean      NOT NULL DEFAULT false,
          created_at  timestamptz  NOT NULL DEFAULT now()
        )
      `);
      console.log('Migration: notes table ready');
    } catch (err) {
      console.error('Migration failed:', err);
      process.exit(1);
    } finally {
      await client.end();
    }
  }
}
