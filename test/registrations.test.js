const request = require("supertest");
const { createApp } = require("../src/app");
const { loadConfig } = require("../src/config");

const oneSeatEvent = { title: "Tree Plantation", date: "2026-12-25", seats: 1 };
const rahim = { name: "Rahim", email: "rahim@example.com" };

describe("Registrations (integration)", () => {
  let app;
  beforeEach(async () => {
    app = createApp({ config: loadConfig({ LOG_LEVEL: "silent" }) });
    await request(app).post("/events").send(oneSeatEvent).expect(201);
  });

  test("full lifecycle: register -> read -> list -> cancel (seat is given back)", async () => {
    const created = await request(app).post("/events/1/registrations").send(rahim).expect(201);
    expect(created.headers.location).toBe(`/registrations/${created.body.id}`);
    expect(created.body).toMatchObject({ id: 1, eventId: 1, ...rahim });

    // seat was taken
    expect((await request(app).get("/events/1")).body.seats).toBe(0);

    await request(app).get("/registrations/1").expect(200);
    expect((await request(app).get("/registrations").expect(200)).body).toHaveLength(1);

    // cancel gives the seat back
    await request(app).delete("/registrations/1").expect(204);
    expect((await request(app).get("/events/1")).body.seats).toBe(1);
    await request(app).get("/registrations/1").expect(404);
  });

  test("no seats left -> 409 conflict", async () => {
    await request(app).post("/events/1/registrations").send(rahim).expect(201);

    const res = await request(app)
      .post("/events/1/registrations")
      .send({ name: "Karim", email: "karim@example.com" })
      .expect(409);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({
      type: "/problems/conflict",
      status: 409,
      detail: "No seats left for this event",
    });
    expect(res.body.requestId).toBe(res.headers["x-request-id"]);
  });

  test("same email twice -> 409 conflict", async () => {
    await request(app).patch("/events/1").send({ seats: 5 }).expect(200);
    await request(app).post("/events/1/registrations").send(rahim).expect(201);

    const res = await request(app).post("/events/1/registrations").send(rahim).expect(409);
    expect(res.body.detail).toBe("This email is already registered for the event");
  });

  test("invalid registration -> 422 with field errors", async () => {
    const res = await request(app).post("/events/1/registrations").send({ email: "not-an-email" }).expect(422);
    expect(res.body.errors.map((e) => e.field)).toEqual(["name", "email"]);
  });

  test("register for an unknown event -> 404", async () => {
    const res = await request(app).post("/events/99/registrations").send(rahim).expect(404);
    expect(res.body.detail).toBe("Event not found");
  });
});
