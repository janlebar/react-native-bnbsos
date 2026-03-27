/**
 * utils/logger.ts
 *
 * H-4 Security fix: dev-gated logger that prevents sensitive data from being
 * written to the console in production builds.
 *
 * Rules:
 *  - logger.debug() only outputs in __DEV__ (development builds). Silent in production.
 *  - logger.warn()  always outputs (but never include tokens or PII).
 *  - logger.error() always outputs (but never include tokens or PII).
 *
 * NEVER pass the following to any logger method:
 *   - Access tokens or refresh tokens
 *   - Passwords or password hashes
 *   - Email addresses (use a placeholder like "[email]" if needed)
 *   - Full API response bodies that may contain the above
 */

const isDev = __DEV__;

export const logger = {
  /**
   * Debug log — only emitted in development builds.
   * Safe for structural/flow messages that do NOT contain PII or tokens.
   */
  debug: (...args: any[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },

  /**
   * Warning log — always emitted. Do NOT include PII or token values.
   */
  warn: (...args: any[]): void => {
    // eslint-disable-next-line no-console
    console.warn(...args);
  },

  /**
   * Error log — always emitted. Do NOT include PII or token values.
   */
  error: (...args: any[]): void => {
    // eslint-disable-next-line no-console
    console.error(...args);
  },
};
