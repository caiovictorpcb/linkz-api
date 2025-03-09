import fastifyPostgres from '@fastify/postgres';
import Fastify, { FastifyReply, FastifyRequest, type FastifyInstance } from 'fastify';
import { getUserUrlByAlias, getUserUrls, insertShortenedUrl } from './db';
import { gerarStringUnica } from './shorter';
import { CreateUserUrlPayload, ShortUrlBody } from './types/api';
import { formShortenedUrl, getRequestUserIp } from './utils';

export const fastify: FastifyInstance = Fastify({ logger: true });

fastify.register(fastifyPostgres, {
  connectionString: process.env.DB_CONNECTION_URL,
});

fastify.post<{ Body: string }>('/short', {
  config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
}, async (request: FastifyRequest<{ Body: string }>): Promise<{ shortUrl: string }> => {
  const clientIp = getRequestUserIp(request);
  const body = JSON.parse(request.body) as ShortUrlBody
  const urlAlias = gerarStringUnica();
  const formedUrl = formShortenedUrl(urlAlias);
  const isUrl = body.url.includes("http") || body.url.includes("https");
  if(!body.url || body.url.includes("DROP") || body.url.includes("UPDATE") || !isUrl) {
    throw new Error('URL is required')
  }
  const payload: CreateUserUrlPayload = {
    full_url: body.url,
    shortened_url: formedUrl,
    alias: urlAlias,
    user_ip: clientIp,
  };
  const shortenedUrl = await insertShortenedUrl(payload);
  return {shortUrl: shortenedUrl};
});

fastify.get('/my-urls', {
  config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
}, async (request: FastifyRequest, reply: FastifyReply): Promise<{ shortened_url: string; full_url: string }[]> => {
  const userIp = getRequestUserIp(request);
  const userUrls = await getUserUrls(userIp);
  return userUrls;
});

fastify.get<{ Params: { alias: string } }>('/:alias', async (request: FastifyRequest<{ Params: { alias: string } }>, reply: FastifyReply): Promise<void> => {
  const fullUrl = await getUserUrlByAlias(request.params.alias);
  reply.redirect(fullUrl, 302); 
});


const start = async () => {
  try {
    await fastify.listen({port: process.env.PORT ? Number(process.env.PORT) : 3000, host: '0.0.0.0'})
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();