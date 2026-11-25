const { Event, validateEvent } = require("../domain/event");
const { NotFound } = require("../errors");

// Use cases for events. Knows nothing about HTTP.
class EventService {
  constructor(eventRepository, maxSeats, log) {
    this.events = eventRepository;
    this.maxSeats = maxSeats;
    this.log = log;
  }

  async createEvent(input) {
    const data = validateEvent(input, { maxSeats: this.maxSeats });
    const event = await this.events.add(new Event(data));
    this.log.info(`event created id=${event.id}`);
    return event;
  }

  async listEvents() {
    return this.events.list();
  }

  async getEvent(id) {
    const event = await this.events.get(id);
    if (!event) throw new NotFound("Event not found");
    return event;
  }

  async updateEvent(id, input) {
    const event = await this.getEvent(id);
    const changes = validateEvent(input, { partial: true, maxSeats: this.maxSeats });
    Object.assign(event, changes);
    await this.events.save(event);
    this.log.info(`event updated id=${event.id}`);
    return event;
  }

  async deleteEvent(id) {
    await this.getEvent(id);
    await this.events.delete(id);
    this.log.info(`event deleted id=${id}`);
  }
}

module.exports = { EventService };
