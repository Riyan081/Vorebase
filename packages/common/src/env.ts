/**
 * Vorebase — Environment Variable Validation
 *
 * Fail-fast if required environment variables are missing.
 * Call validateEnv() at service startup before anything else.
 */

export class EnvError extends Error {
  constructor(missing: string[]) {
    super(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join("\n")}\n\nPlease set them in your .env file or environment.`
    );
    this.name = "EnvError";
  }
}

/**
 * Validates that all required environment variables are set.
 * Throws EnvError if any are missing.
 *
 * @param required - Array of required env var names
 * @returns Record of validated env vars with their values
 */
export function validateEnv<T extends string>(
  required: readonly T[]
): Record<T, string> {
  const missing: string[] = [];
  const result = {} as Record<T, string>;

  for (const key of required) {
    const value = process.env[key];
    if (!value || value.trim() === "") {
      missing.push(key);
    } else {
      result[key] = value;
    }
  }

  if (missing.length > 0) {
    throw new EnvError(missing);
  }

  return result;
}

/**
 * Gets an environment variable with a fallback default.
 * Use for optional variables only — required vars should use validateEnv().
 */
export function getEnv(key: string, fallback: string): string {
  return process.env[key] || fallback;
}
