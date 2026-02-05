import { Request } from 'express';

/**
 * Validates if an origin should be allowed to access the API
 *
 * @param allowedOrigins Array of allowed origin strings
 * @param tokenValidator Function to validate auth tokens
 * @returns A CORS origin validator function
 */
export const createOriginValidator = (
  allowedOrigins: string[],
  tokenValidator: (req: Request) => boolean,
) => {
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
    req?: Request,
  ) => {
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (req && tokenValidator(req)) {
      return callback(null, true);
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  };
};

/**
 * Creates a configured CORS options object
 *
 * @param allowedOrigins Array of allowed origins
 * @param tokenValidator Function to validate auth tokens
 * @returns CORS options object
 */
export const createCorsOptions = (
  allowedOrigins: string[],
  tokenValidator: (req: Request) => boolean,
) => {
  const hasAllowedOrigins =
    Array.isArray(allowedOrigins) && allowedOrigins.length > 0;
  const origin = hasAllowedOrigins
    ? createOriginValidator(allowedOrigins, tokenValidator)
    : '*';
  const credentials = hasAllowedOrigins ? true : false;
  return {
    origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials,
  };
};

/**
 * Parse space-separated string of allowed origins into array
 *
 * @param originsString Space-separated string of origins
 * @returns Array of origin strings
 */
export const parseAllowedOrigins = (originsString: string): string[] => {
  return originsString.split(' ').filter((origin) => origin.trim() !== '');
};

/**
 * Validates if a request has a valid api key
 *
 * @param req Express request object
 * @returns Boolean indicating if token is valid
 */
export const hasValidKey = (req: Request): boolean => {
  const apiKey = req.headers['x-api-key'] as string;

  if (apiKey) {
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
    return validApiKeys.includes(apiKey);
  }

  return false;
};
