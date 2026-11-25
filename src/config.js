// All settings come from environment variables; tests pass overrides.
function loadConfig(overrides = {}) {
  const env = process.env;
  const config = {
    APP_ENV: env.APP_ENV || "development",
    PORT: Number(env.PORT || 5000),
    LOG_LEVEL: env.LOG_LEVEL || "info",
    MAX_SEATS: Number(env.MAX_SEATS || 500),
    ...overrides,
  };

  // fail fast on bad settings
  for (const key of ["PORT", "MAX_SEATS"]) {
    if (!Number.isInteger(config[key]) || config[key] <= 0) {
      throw new Error(`Invalid config: ${key} must be a positive integer`);
    }
  }
  return Object.freeze(config);
}

module.exports = { loadConfig };
