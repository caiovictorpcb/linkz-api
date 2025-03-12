import fastifyPostgres from "@fastify/postgres";
import Fastify, {
  FastifyReply,
  FastifyRequest,
  type FastifyInstance,
} from "fastify";
import { getUserUrlByAlias, getUserUrls, insertShortenedUrl } from "./db";
import { CreateUserUrlPayload } from "./types/api";
import { getRequestUserIp, validateUrl } from "./utils";

export const fastify: FastifyInstance = Fastify({ logger: true });

const sslConfig =
  process.env.NODE_ENV === "production"
    ? {
        ssl: {
          ca: process.env.CA_CERT,
          rejectUnauthorized: true,
        },
      }
    : {};

fastify.register(fastifyPostgres, {
  connectionString: process.env.DB_CONNECTION_URL,
  ...sslConfig,
});

fastify.get<{ Querystring: { url: string } }>(
  "/short",
  {
    config: { rateLimit: { max: 50, timeWindow: "1 minute" } },
    schema: {
      querystring: {
        type: "object",
        required: ["url"],
        properties: { url: { type: "string" } },
      },
      response: {
        200: { type: "object", properties: { shortUrl: { type: "string" } } },
      },
    },
  },
  async (request): Promise<{ shortUrl: string }> => {
    const clientIp = getRequestUserIp(request);
    const url = request.query.url;
    const validUrl = validateUrl(url);

    if (!url || !validUrl) {
      throw new Error("URL is invalid!");
    }

    const payload: CreateUserUrlPayload = {
      full_url: url,
      user_ip: clientIp,
    };

    const shortenedUrl = await insertShortenedUrl(payload);
    return { shortUrl: shortenedUrl };
  }
);

fastify.get(
  "/my-urls",
  {
    config: { rateLimit: { max: 50, timeWindow: "1 minute" } },
  },
  async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<{ shortened_url: string; full_url: string }[]> => {
    const userUrls = await getUserUrls(request);
    return userUrls;
  }
);

fastify.get<{ Params: { alias: string } }>(
  "/:alias",
  { config: { rateLimit: { max: 50, timeWindow: "1 minute" } } },
  async (
    request: FastifyRequest<{ Params: { alias: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const fullUrl = await getUserUrlByAlias(request.params.alias);
    if (!fullUrl?.length) {
      reply.code(404).send({ error: "Alias not found" });
      return;
    }
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      reply.redirect('https://' + fullUrl, 302);
      return
    }
    reply.redirect(fullUrl, 302);
  }
);

const start = async () => {
  try {
    await fastify.listen({
      port: process.env.PORT ? Number(process.env.PORT) : 3000,
      host: "0.0.0.0",
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
