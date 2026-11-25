const express = require("express");

// Controllers: HTTP in, service call, HTTP out. No rules, no storage code.
module.exports = (eventService) => {
  const router = express.Router();

  //post an event, get events, get particular event by id, update particular event by id, delete particular event by id
  router
    .post("/", async (req, res) => {
      const event = await eventService.createEvent(req.body);
      res.status(201).location(`/events/${event.id}`).json(event);
    })
    .get("/", async (req, res) => {
      res.json(await eventService.listEvents());
    })
    .get("/:id", async (req, res) => {
      res.json(await eventService.getEvent(Number(req.params.id)));
    })
    .patch("/:id", async (req, res) => {
      res.json(await eventService.updateEvent(Number(req.params.id), req.body));
    })
    .delete("/:id", async (req, res) => {
      await eventService.deleteEvent(Number(req.params.id));
      res.status(204).end();
    });

  return router;
};
