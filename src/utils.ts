import { FastifyRequest } from 'fastify';

export const getRequestUserIp = (request: FastifyRequest): string => {
    const ifValue = request.headers['x-forwarded-for'] as string;
    if (ifValue) {
        const clientIp = ifValue.split(',')[0].trim();
        return clientIp;
    }
  return request?.ip;
};

export const formShortenedUrl = (alias: string): string => {
  const appHost = process.env.APP_HOST;
  return `https://${appHost}/${alias}`;
};