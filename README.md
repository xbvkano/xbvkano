# xbvkano

TypeScript portfolio. The React client is a responsive shell. Profile, project, and certification copy is seeded from `archive/content`. The original pages and images stay in `archive/`. Files for later showcase pages live in `client/public/showcase`.

## Setup

```bash
npm install
npm run db:migrate -w server
npm run db:seed -w server
npm run dev
```

From `server`, `npx prisma migrate dev` and `npx prisma db seed` use `server/.env`.

- Client: http://localhost:5173
- API: http://localhost:3001

`npm run dev` starts both. The client sends API and uploaded-image requests to `VITE_SERVER_URL` in `client/.env`. That value is the server root, with no path on the end, such as `http://localhost:3001` or your deployed API origin. `CLIENT_ORIGIN` in `server/.env` is the browser origin allowed to call that API with the login cookie, such as `http://localhost:5173`. Separate several origins with commas. Restart both processes after changing either value. The Vite proxy for `/api` and `/media` remains only for a client built without `VITE_SERVER_URL`.

## External API

An outside assistant reads and updates portfolio data at `/api/external`. Send `Authorization: Bearer <token>`, or call the same routes from the logged-in dashboard, which uses the session cookie. Create the token on the dashboard. It lasts 8 hours, and creating another one revokes the previous token.

`GET /api/external/portfolio` returns:

- `profile`, including `age` calculated from `birthDate`
- `entries`, grouped by `project`, `certificate`, `experience`, `education`, and `coursework`. Each entry includes its skills
- `skills`
- `references`

Dates are `YYYY-MM-DD`. A missing `endedOn` on an experience entry means the role is current.

Writes use the same prefix:

- `PATCH /profile`
- `POST /entries`, `PATCH /entries/:id`, `DELETE /entries/:id`
- `POST /skills`, `PATCH /skills/:id`, `DELETE /skills/:id`
- `POST /references`, `PATCH /references/:id`, `DELETE /references/:id`
- `GET /applications`, `POST /applications`, `PATCH /applications/:id`, `DELETE /applications/:id`
- `POST /media` with one multipart field named `file` (`png`, `jpeg`, `webp`, or `gif`, up to 5 MB). The response `imagePath` is served from `/media`.

A job application has `companyName`, `appliedOn`, and `status`: `applied`, `declined`, `rejected`, or `hired`. `GET /api/external/ping` still checks that a token is valid.

Database settings live in `server/.env`. Copy `server/.env.example` there if you do not already have one. The active `DATABASE_URL` uses the local Postgres database `mydb`, in a `xbvkano` schema so it stays separate from other apps in that database. Comment that line and uncomment the one below it to point at another database.
