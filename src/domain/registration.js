const { ValidationFailed } = require("../errors");

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class Registration {
  constructor({ id = null, eventId, name, email, createdAt = new Date().toISOString() }) {
    this.id = id;
    this.eventId = eventId;
    this.name = name;
    this.email = email;
    this.createdAt = createdAt;
  }
}

function validateRegistration(input) {
  const body = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const errors = [];

  if (typeof body.name !== "string" || !body.name.trim()) {
    errors.push({ field: "name", message: "name is required" });
  }
  if (typeof body.email !== "string" || !EMAIL.test(body.email)) {
    errors.push({ field: "email", message: "email must be a valid email address" });
  }

  if (errors.length) throw new ValidationFailed(errors);
  return { name: body.name.trim(), email: body.email.toLowerCase() };
}

module.exports = { Registration, validateRegistration };
