import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  // Only initialize if DSN is provided
  if (!dsn) {
    console.log('[Sentry] DSN not configured, error tracking disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [nodeProfilingIntegration()],

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

    // Profiling
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Release tracking (set via CI/CD)
    release: process.env.SENTRY_RELEASE || `trackpro-api@${process.env.npm_package_version || '0.0.0'}`,

    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['authorization'];
        delete event.request.headers['cookie'];
        delete event.request.headers['x-api-key'];
      }

      // Remove sensitive data from body
      if (event.request?.data) {
        const data = event.request.data;
        if (typeof data === 'object' && data !== null) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sanitized: Record<string, any> = { ...data };
          const sensitiveFields = [
            'password',
            'passwordHash',
            'token',
            'refreshToken',
            'accessToken',
            'apiKey',
            'secret',
            'credential',
          ];
          for (const field of sensitiveFields) {
            if (field in sanitized) {
              sanitized[field] = '[REDACTED]';
            }
          }
          event.request.data = sanitized;
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Ignore common validation errors
      'BadRequestException',
      'UnauthorizedException',
      'ForbiddenException',
      'NotFoundException',
      // Ignore client disconnects
      'ECONNRESET',
      'EPIPE',
      // Ignore rate limiting
      'ThrottlerException',
    ],
  });

  console.log(`[Sentry] Initialized for ${environment} environment`);
}

// Export Sentry for manual error capturing
export { Sentry };
