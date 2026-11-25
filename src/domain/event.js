const { Conflict, ValidationFailed } = require("../errors");

const DATE = /^\d{4}-\d{2}-\d{2}$/;

class Event {
  constructor({ id = null, title, description = "", date, seats }) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.date = date;
    this.seats = seats;
  }

  // business rule: cannot register when no seats are left
  reserveSeat() {
    if (this.seats === 0) throw new Conflict("No seats left for this event");
    this.seats -= 1;
  }

  releaseSeat() {
    this.seats += 1;
  }
}

// Allow-lists the fields a client may set (no mass assignment).
// partial = true is used for PATCH: only the given fields are checked.
function validateEvent(input, { partial = false, maxSeats = 500 } = {}) {
  const body = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const errors = [];
  const data = {};

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      errors.push({ field: "title", message: "title is required" });
    } else data.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (typeof body.description !== "string") {
      errors.push({ field: "description", message: "description must be a string" });
    } else data.description = body.description.trim();
  }

  if (!partial || body.date !== undefined) {
    if (typeof body.date !== "string" || !DATE.test(body.date) || isNaN(Date.parse(body.date))) {
      errors.push({ field: "date", message: "date must be a valid date (YYYY-MM-DD)" });
    } else data.date = body.date;
  }

  if (!partial || body.seats !== undefined) {
    if (!Number.isInteger(body.seats) || body.seats < 0 || body.seats > maxSeats) {
      errors.push({ field: "seats", message: `seats must be an integer from 0 to ${maxSeats}` });
    } else data.seats = body.seats;
  }

  if (partial && !errors.length && !Object.keys(data).length) {
    errors.push({ field: "body", message: "provide at least one of title, description, date, seats" });
  }

  if (errors.length) throw new ValidationFailed(errors);
  return data;
}

module.exports = { Event, validateEvent };
