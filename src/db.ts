import { fastify } from '.';
import { CreateUserUrlPayload } from './types/api';


export const initDb = async (): Promise<void> => {
  try {
    await fastify.pg.query(`
      CREATE TABLE IF NOT EXISTS user_urls (
        id SERIAL PRIMARY KEY,
        alias VARCHAR(50) UNIQUE,
        full_url VARCHAR(255),
        shortened_url VARCHAR(100),
        user_ip VARCHAR(45)
      )
    `);
    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
};

export const insertShortenedUrl = async (payload: CreateUserUrlPayload): Promise<string> => {
  try {
    const { rows } = await fastify.pg.query(
      `
      INSERT INTO user_urls (alias, full_url, shortened_url, user_ip)
      VALUES ($1, $2, $3, $4)
      RETURNING shortened_url
      `,
      [payload.alias, payload.full_url, payload.shortened_url, payload.user_ip]
    );
    return rows[0].shortened_url;
  } catch (err: any) {
    if (err.code === '23505') { // PostgreSQL unique violation error code
      console.error('Duplicate alias:', err);
      throw new Error('Alias already exists');
    }
    console.error('Database error:', err);
    throw err;
  }
};

export const getUserUrls = async (userIp: string): Promise<{ shortened_url: string; full_url: string }[]> => {
  try {
    const { rows } = await fastify.pg.query(
      'SELECT shortened_url, full_url FROM user_urls WHERE user_ip = $1',
      [userIp]
    );
    return rows;
  } catch (err) {
    console.error('Error fetching user URLs:', err);
    throw err;
  }
};

export const getUserUrlByAlias = async (alias: string): Promise<string> => {
  try {
    const { rows } = await fastify.pg.query(
      'SELECT full_url FROM user_urls WHERE alias = $1',
      [alias]
    );
    if (rows.length === 0) {
      throw new Error('Alias not found');
    }
    return rows[0].full_url;
  } catch (err) {
    console.error('Error fetching URL by alias:', err);
    throw err;
  }
};
