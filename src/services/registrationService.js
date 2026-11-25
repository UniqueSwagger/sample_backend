const { Registration, validateRegistration } = require("../domain/registration");
const { NotFound, Conflict } = require("../errors");

// Use cases for registering to an event. Knows nothing about HTTP.
class RegistrationService {
  constructor(registrationRepository, eventRepository, log) {
    this.registrations = registrationRepository;
    this.events = eventRepository;
    this.log = log;
  }

  async register(eventId, input) {
    const data = validateRegistration(input);

    const event = await this.events.get(eventId);
    if (!event) throw new NotFound("Event not found");

    if (await this.registrations.findByEventAndEmail(eventId, data.email)) {
      throw new Conflict("This email is already registered for the event");
    }

    event.reserveSeat(); // throws Conflict when no seats are left
    await this.events.save(event);

    const registration = await this.registrations.add(new Registration({ ...data, eventId }));
    this.log.info(`registered id=${registration.id} eventId=${eventId} seatsLeft=${event.seats}`);
    return registration;
  }

  async listRegistrations() {
    return this.registrations.list();
  }

  async getRegistration(id) {
    const registration = await this.registrations.get(id);
    if (!registration) throw new NotFound("Registration not found");
    return registration;
  }

  // cancelling gives the seat back
  async cancelRegistration(id) {
    const registration = await this.getRegistration(id);
    const event = await this.events.get(registration.eventId);
    if (event) {
      event.releaseSeat();
      await this.events.save(event);
    }
    await this.registrations.delete(id);
    this.log.info(`registration cancelled id=${id} eventId=${registration.eventId}`);
  }
}

module.exports = { RegistrationService };
