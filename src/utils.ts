import { FastifyRequest } from "fastify";
import { Address4, Address6 } from "ip-address";
import { settings } from "./settings";

const isValidIp = (ip: string): boolean => {
  return Address4.isValid(ip) || Address6.isValid(ip);
};

export const getRequestUserIp = (request: FastifyRequest): string => {
  const ipFromHeader = request.headers["x-forwarded-for"] as string | undefined;
  const ip = ipFromHeader?.split(",")[0]?.trim() || request?.ip;
  return isValidIp(ip) ? ip : "";
};

export const formShortenedUrl = (alias: string): string => {
  const apiHost = settings.API_HOST;
  return `https://${apiHost}/${alias}`;
};

export const validateUrl = (url: string): boolean => {
  const urlPattern =
    /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/i;
  return urlPattern.test(url);
};
