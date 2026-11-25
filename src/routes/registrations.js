const express = require("express");

module.exports = (registrationService) => {
  const router = express.Router();

  //register to an event, get all registrations, get particular registration by id, cancel registration by id
  router
    .post("/events/:eventId/registrations", async (req, res) => {
      const registration = await registrationService.register(Number(req.params.eventId), req.body);
      res.status(201).location(`/registrations/${registration.id}`).json(registration);
    })
    .get("/registrations", async (req, res) => {
      res.json(await registrationService.listRegistrations());
    })
    .get("/registrations/:id", async (req, res) => {
      res.json(await registrationService.getRegistration(Number(req.params.id)));
    })
    .delete("/registrations/:id", async (req, res) => {
      await registrationService.cancelRegistration(Number(req.params.id));
      res.status(204).end();
    });

  return router;
};
