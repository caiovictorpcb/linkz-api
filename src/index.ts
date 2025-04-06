import cors from "@fastify/cors";
import fastifyPostgres from "@fastify/postgres";
import rateLimit from "@fastify/rate-limit";
import fastifyRedis from "@fastify/redis";
import Fastify, {
  FastifyReply,
  FastifyRequest,
  type FastifyInstance,
} from "fastify";
import { getUserUrlByAlias, getUserUrls, insertShortenedUrl } from "./db";
import { settings } from "./settings";
import { CreateUserUrlPayload } from "./types/api";
import { getRequestUserIp, validateUrl } from "./utils";
export const fastify: FastifyInstance = Fastify({ logger: true });

const checkRequiredEnvVars = (requiredVars: string[]) => {
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  return missingVars.length === 0;
};

const sslConfig =
  settings.NODE_ENV === "production"
    ? {
        ssl: {
          ca: settings.CA_CERT,
          rejectUnauthorized: true,
        },
      }
    : {};

fastify.register(fastifyPostgres, {
  connectionString: settings.DB_CONNECTION_URL,
  ...sslConfig,
});

fastify.register(rateLimit, {
  global: true,
  max: 100,
  timeWindow: "1 minute",
  addHeaders: {
    "x-ratelimit-limit": true,
    "x-ratelimit-remaining": true,
    "x-ratelimit-reset": true,
  },
});

fastify.register(fastifyRedis, {
  host: "linkz.redis.cache.windows.net",
  port: 6380,
  password: settings.REDIS_PASSWORD,
  tls: {},
});

await fastify.register(cors, {
  origin: settings.APP_HOST,
  methods: ["GET", "POST"],
});

fastify.post<{ Body: { url: string } }>(
  "/short",
  {
    schema: {
      body: {
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
    const url = request.body.url as string;
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
  {},
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
  {},
  async (
    request: FastifyRequest<{ Params: { alias: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const fullUrl = await getUserUrlByAlias(request.params.alias);
    if (fullUrl) {
      reply.code(200).send({ fullUrl });
    }
    if (!fullUrl?.length) {
      reply.code(404).send({ error: "Alias not found" });
      return;
    }
    if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
      reply.redirect("https://" + fullUrl, 302);
      return;
    }
    reply.redirect(fullUrl, 302);
  }
);

fastify.after(() => {
  fastify.log.info("Using pg-native:", fastify.pg.pool._native !== undefined);
});

const getRequiredVars = () => {
  const environment = settings.NODE_ENV || "development";
  if (environment === "production") {
    return [
      "DB_CONNECTION_URL",
      "REDIS_PASSWORD",
      "CA_CERT",
      "NODE_ENV",
      "PORT",
    ];
  } else if (environment === "development") {
    return ["DB_CONNECTION_URL", "REDIS_PASSWORD"];
  } else {
    throw new Error(
      "Invalid NODE_ENV value. Use 'production' or 'development'."
    );
  }
};

const start = async () => {
  try {
    const requiredVars = getRequiredVars();
    const isValid = checkRequiredEnvVars(requiredVars);
    if (!isValid) {
      throw new Error("Invalid environment variables");
    }
    await fastify.listen({
      port: settings.PORT ? Number(settings.PORT) : 3000,
      host: "0.0.0.0",
    });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
