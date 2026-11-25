const crypto = require("crypto");
const express = require("express");
const { loadConfig } = require("./config");
const { createLogger } = require("./logger");
const { AppError, NotFound } = require("./errors");
const { EventRepository } = require("./repositories/eventRepository");
const { RegistrationRepository } = require("./repositories/registrationRepository");
const { EventService } = require("./services/eventService");
const { RegistrationService } = require("./services/registrationService");
const eventRoutes = require("./routes/events");
const registrationRoutes = require("./routes/registrations");

// Creates the app: wiring, middleware, routes and error handling in one place.
// Repositories can be passed in (tests use this to inject fakes).
function createApp({
  config = loadConfig(),
  eventRepository = new EventRepository(),
  registrationRepository = new RegistrationRepository(),
} = {}) {
  const logger = createLogger(config.LOG_LEVEL);
  const httpLog = logger("http");

  //wiring (dependency injection)
  const eventService = new EventService(eventRepository, config.MAX_SEATS, logger("eventService"));
  const registrationService = new RegistrationService(registrationRepository, eventRepository, logger("registrationService"));

  const app = express();

  //middleware: request ID + one log line per request
  app.use((req, res, next) => {
    const incoming = req.get("X-Request-ID");
    req.id = incoming && /^[\w-]{1,64}$/.test(incoming) ? incoming : crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    res.set("X-Request-ID", req.id);
    res.on("finish", () => httpLog.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} [${req.id}]`));
    next();
  });
  app.use(express.json({ limit: "10kb" }));

  //routes
  app.get("/", (req, res) => res.send("Volunteer Network Server is running"));
  app.use("/events", eventRoutes(eventService));
  app.use("/", registrationRoutes(registrationService));

  //unknown route
  app.use(() => {
    throw new NotFound("Route not found");
  });

  //centralized error handler: one format (RFC 9457) for every failure
  app.use((err, req, res, next) => {
    if (err instanceof AppError) {
      return sendProblem(req, res, err.status, err.title, err.message, err.type, err.errors);
    }
    // body-parser errors (bad JSON, body too large) are safe to show
    if (err.expose && err.status < 500) {
      return sendProblem(req, res, err.status, "Bad request", err.message, "bad-request");
    }
    // unexpected: full details to the log, nothing internal to the client
    httpLog.error(`unhandled error [${req.id}]`, err);
    sendProblem(req, res, 500, "Internal server error", "Something went wrong", "internal-error");
  });

  return app;
}

function sendProblem(req, res, status, title, detail, type, errors) {
  res
    .status(status)
    .type("application/problem+json")
    .json({
      type: `/problems/${type}`,
      title,
      status,
      detail,
      instance: req.originalUrl,
      requestId: req.id,
      ...(errors && { errors }),
    });
}

module.exports = { createApp };
