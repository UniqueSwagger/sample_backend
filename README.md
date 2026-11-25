# Volunteer Network – Backend (CSE 3102L, Topic 04)

A small REST backend with two features: **Events** (full CRUD) and **Registrations** (register / read / list / cancel).

**Business rule that can fail:** you can't register for an event with no seats left (**409**). Registering the same email twice for one event also returns 409.

## Framework and why
**Express 5 (Node.js).** It's small, I already know it from my previous project, and it lets me build the layers myself.
Express 5 passes errors thrown in `async` handlers to the error handler automatically, so handlers need no `try/catch`.

## How to run
```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm start                 # http://localhost:5000
```

## How to test
```bash
npm test
```
The integration tests (Jest + Supertest) send real HTTP requests to the app, the same requests you would send by hand in Postman, and check the status codes, headers and bodies automatically. No server or database needs to be started.

## Endpoints
| Method | Path | Success | Failures |
|---|---|---|---|
| POST | `/events` | 201 + `Location` | 422 |
| GET | `/events` | 200 | |
| GET | `/events/:id` | 200 | 404 |
| PATCH | `/events/:id` | 200 | 404, 422 |
| DELETE | `/events/:id` | 204 | 404 |
| POST | `/events/:id/registrations` | 201 + `Location` | 404, 409, 422 |
| GET | `/registrations` | 200 | |
| GET | `/registrations/:id` | 200 | 404 |
| DELETE | `/registrations/:id` (cancel, gives the seat back) | 204 | 404 |

Example body for `POST /events`: `{ "title": "Beach Cleanup", "description": "...", "date": "2026-12-20", "seats": 30 }`
Example body for registering: `{ "name": "Rahim", "email": "rahim@example.com" }`

Every error uses one format (RFC 9457, `application/problem+json`):
```json
{ "type": "/problems/conflict", "title": "Request conflicts with current state", "status": 409,
  "detail": "No seats left for this event", "instance": "/events/1/registrations", "requestId": "6f635ed9a21b" }
```

## Architecture (which file belongs to which layer)
| Layer | Files | Job |
|---|---|---|
| Wiring, middleware, errors | `src/app.js` | creates repositories and services (dependency injection), sets the request ID and request log, sends every error as problem+json |
| Entry point | `src/server.js` | loads `.env` and starts listening |
| Controllers | `src/routes/events.js`, `src/routes/registrations.js` | turn HTTP into a service call and the result back into a response |
| Services | `src/services/eventService.js`, `src/services/registrationService.js` | the use cases, plus service logs; know nothing about HTTP |
| Domain | `src/domain/event.js`, `src/domain/registration.js` | entities, validation, the "no seats left" rule |
| Repositories | `src/repositories/*.js` | the only storage code (in-memory now; changing to MongoDB means editing only these files) |
| Shared | `src/config.js`, `src/errors.js`, `src/logger.js` | settings from env, error classes, leveled logger |
| Tests | `test/*.test.js` | integration tests + service tests that run without a server |

## Configuration
Settings come from environment variables (see `.env.example`): `APP_ENV`, `PORT`, `LOG_LEVEL` (`debug|info|warn|error|silent`), `MAX_SEATS`.
`.env` is git-ignored. The app refuses to start if `PORT` or `MAX_SEATS` is not a positive integer.

## AI-use disclosure
<!-- Edit this honestly before submitting -->
I used Claude (AI assistant) to help scaffold the layered structure and the tests, based on the course slides and my earlier Express code.
I checked every file myself, ran `npm test`, and tested the endpoints by hand.
