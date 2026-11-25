// In-memory storage. To switch to MongoDB, change only this file
// (same async methods, backed by a collection).
class EventRepository {
  constructor() {
    this._rows = new Map();
    this._nextId = 1;
  }

  async add(event) {
    event.id = this._nextId++;
    this._rows.set(event.id, event);
    return event;
  }

  async list() {
    return [...this._rows.values()];
  }

  async get(id) {
    return this._rows.get(id) || null;
  }

  async save(event) {
    this._rows.set(event.id, event);
    return event;
  }

  async delete(id) {
    return this._rows.delete(id);
  }
}

module.exports = { EventRepository };
