import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  const result = await pool.query(
    `UPDATE public.news_categories
        SET filter_type = 'GEO_BASED',
            keywords    = '[]'
      WHERE name = '本地'`
  );
  console.log(`✓ Updated ${result.rowCount} row(s): 本地 filterType → GEO_BASED`);
  console.log('✨ Done!');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
} finally {
  await pool.end();
}
