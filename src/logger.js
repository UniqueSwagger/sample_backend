// Tiny leveled logger that writes to stdout/stderr.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 99 };

function createLogger(level = "info") {
  const min = LEVELS[String(level).toLowerCase()] ?? LEVELS.info;

  // returns a named logger, e.g. logger("eventService")
  return (name) => {
    const write = (lvl, method) => (...args) => {
      if (LEVELS[lvl] >= min) {
        console[method](new Date().toISOString(), lvl.toUpperCase(), name, ...args);
      }
    };
    return {
      debug: write("debug", "log"),
      info: write("info", "log"),
      warn: write("warn", "warn"),
      error: write("error", "error"),
    };
  };
}

module.exports = { createLogger };
