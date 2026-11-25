// Use cases run directly, without starting a web server.
const { EventService } = require("../src/services/eventService");
const { RegistrationService } = require("../src/services/registrationService");
const { EventRepository } = require("../src/repositories/eventRepository");
const { RegistrationRepository } = require("../src/repositories/registrationRepository");
const { Conflict, ValidationFailed } = require("../src/errors");

const silentLog = { info() {}, warn() {}, error() {}, debug() {} };

describe("Services (no HTTP)", () => {
  let eventService, registrationService;
  beforeEach(() => {
    const eventRepo = new EventRepository();
    eventService = new EventService(eventRepo, 100, silentLog);
    registrationService = new RegistrationService(new RegistrationRepository(), eventRepo, silentLog);
  });

  test("seats above MAX_SEATS are rejected", async () => {
    await expect(eventService.createEvent({ title: "Big", date: "2026-12-01", seats: 101 })).rejects.toBeInstanceOf(ValidationFailed);
  });

  test("registering when no seats are left throws Conflict", async () => {
    const event = await eventService.createEvent({ title: "Small", date: "2026-12-01", seats: 1 });
    await registrationService.register(event.id, { name: "A", email: "a@example.com" });

    await expect(registrationService.register(event.id, { name: "B", email: "b@example.com" })).rejects.toBeInstanceOf(Conflict);
    expect((await eventService.getEvent(event.id)).seats).toBe(0);
  });
});
