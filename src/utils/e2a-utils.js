/* =========================================================
 * E2A Utility Functions
 * ========================================================= */

import { LOG_LEVEL } from "../e2a-config.js";

let activeLogLevel = LOG_LEVEL;

export function setLogLevel(level) {
  const nextLevel = Number(level);
  activeLogLevel = Number.isFinite(nextLevel) ? nextLevel : LOG_LEVEL;
}

/**
 * Logging utility that respects the configured LOG_LEVEL
 * Levels: 0 = off, 1 = error only, 2 = error + warn, 3 = error + warn + info, 4 = all (debug)
 */
export const logger = {
  debug: (...args) => activeLogLevel >= 4 && console.log(...args),
  info: (...args) => activeLogLevel >= 3 && console.log(...args),
  warn: (...args) => activeLogLevel >= 2 && console.warn(...args),
  error: (...args) => activeLogLevel >= 1 && console.error(...args)
};
