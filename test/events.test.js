const request = require("supertest");
const { createApp } = require("../src/app");
const { loadConfig } = require("../src/config");

const newApp = () => createApp({ config: loadConfig({ LOG_LEVEL: "silent" }) });
const beachCleanup = { title: "Beach Cleanup", description: "Clean the beach", date: "2026-12-20", seats: 2 };

describe("Events CRUD (integration)", () => {
  let app;
  beforeEach(() => {
    app = newApp(); // fresh in-memory storage for every test
  });

  test("full lifecycle: create -> read -> list -> update -> delete", async () => {
    // create
    const created = await request(app).post("/events").send(beachCleanup).expect(201);
    expect(created.headers.location).toBe(`/events/${created.body.id}`);
    expect(created.headers["x-request-id"]).toBeDefined();
    expect(created.body).toEqual({ id: 1, ...beachCleanup });

    // read
    const read = await request(app).get("/events/1").expect(200);
    expect(read.body.title).toBe("Beach Cleanup");

    // list
    const list = await request(app).get("/events").expect(200);
    expect(list.body).toHaveLength(1);

    // update
    const updated = await request(app).patch("/events/1").send({ seats: 10 }).expect(200);
    expect(updated.body).toMatchObject({ id: 1, title: "Beach Cleanup", seats: 10 });

    // delete
    await request(app).delete("/events/1").expect(204);
    await request(app).get("/events/1").expect(404);
  });

  test("create with invalid fields -> 422 with field-level messages", async () => {
    const res = await request(app).post("/events").send({ title: "", date: "tomorrow", seats: -1 }).expect(422);

    expect(res.headers["content-type"]).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({ type: "/problems/validation-failed", status: 422 });
    expect(res.body.errors.map((e) => e.field)).toEqual(["title", "date", "seats"]);
  });

  test("update with an empty body -> 422", async () => {
    await request(app).post("/events").send(beachCleanup).expect(201);
    const res = await request(app).patch("/events/1").send({}).expect(422);
    expect(res.body.errors[0].field).toBe("body");
  });

  test("unknown event -> 404 problem+json for read, update and delete", async () => {
    for (const req of [request(app).get("/events/99"), request(app).patch("/events/99").send({ seats: 1 }), request(app).delete("/events/99")]) {
      const res = await req.expect(404);
      expect(res.body).toMatchObject({ type: "/problems/not-found", detail: "Event not found" });
    }
  });

  test("malformed JSON body -> 400 problem+json", async () => {
    const res = await request(app).post("/events").set("Content-Type", "application/json").send('{"title": ').expect(400);
    expect(res.body.type).toBe("/problems/bad-request");
  });

  test("unknown route -> 404 problem+json", async () => {
    const res = await request(app).get("/nope").expect(404);
    expect(res.body.detail).toBe("Route not found");
  });
});

describe("Unexpected errors", () => {
  test("logged in full, hidden from the client (500)", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    const brokenRepository = {
      list: async () => {
        throw new Error("db connection lost: secret-host:27017");
      },
    };
    const app = createApp({ config: loadConfig({ LOG_LEVEL: "error" }), eventRepository: brokenRepository });

    const res = await request(app).get("/events").set("X-Request-ID", "test-req-1").expect(500);

    // client sees a generic message only
    expect(res.body).toMatchObject({ status: 500, detail: "Something went wrong", requestId: "test-req-1" });
    expect(JSON.stringify(res.body)).not.toContain("secret-host");

    // the log has the real error with the same request ID
    const logged = spy.mock.calls.flat();
    expect(logged.some((a) => typeof a === "string" && a.includes("test-req-1"))).toBe(true);
    expect(logged.some((a) => a instanceof Error && a.message.includes("secret-host"))).toBe(true);
    spy.mockRestore();
  });
});
