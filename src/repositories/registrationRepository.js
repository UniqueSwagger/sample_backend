// In-memory storage. To switch to MongoDB, change only this file.
class RegistrationRepository {
  constructor() {
    this._rows = new Map();
    this._nextId = 1;
  }

  async add(registration) {
    registration.id = this._nextId++;
    this._rows.set(registration.id, registration);
    return registration;
  }

  async list() {
    return [...this._rows.values()];
  }

  async get(id) {
    return this._rows.get(id) || null;
  }

  async findByEventAndEmail(eventId, email) {
    const rows = await this.list();
    return rows.find((r) => r.eventId === eventId && r.email === email) || null;
  }

  async delete(id) {
    return this._rows.delete(id);
  }
}

module.exports = { RegistrationRepository };
