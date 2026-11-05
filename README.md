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

## GitHub Pages

`.github/workflows/pages.yml` builds the client from the `client` folder and publishes it. The API and database stay on your host. In the repository settings, set Pages to deploy from GitHub Actions. Both jobs use the `github-pages` environment, so add these variables on that environment:

- `VITE_SERVER_URL`: the API origin, with no path, such as `https://api.example.com`
- `VITE_LOGIN_CIPHER_SECRET`: the same value as `LOGIN_CIPHER_SECRET` on the server

On the server, add the Pages origin to `CLIENT_ORIGIN`. For this repository that origin is `https://xbvkano.github.io`, with no `/xbvkano` path. Set `SESSION_CROSS_SITE=true` so the dashboard login cookie is sent from that site. The API has to be served over HTTPS for that cookie. Pushing to `main` runs the workflow.

## External API

An outside assistant uses `/api/external` while applying for jobs. During open hour, which is started on the dashboard token page and lasts one hour, those requests do not need a token. Outside open hour, send `Authorization: Bearer <token>`. The token lasts 8 hours. Creating another one revokes the previous token. The token cannot change the profile, projects, experience, or other dashboard records.

`GET /api/health` checks that the server is up and does not need a token. `GET /api/external/health` checks the bearer token and the database. A valid token returns `{"ok":true,"token":"active","database":"ok"}`.

`GET /api/external/portfolio` returns the portfolio used to apply, including `assistantNotes`. `GET /api/external/applications` lists job applications.

Job applications are the only records the assistant can write. `PUT /api/external/applications/:id` replaces one application. `PUT /api/external/applications` upserts by company name: the same company is updated, and a new company is created. The body is `companyName`, `appliedOn` (`YYYY-MM-DD`), and `status`: `applied`, `declined`, `rejected`, or `hired`.

`GET /api/external/notes` and `PUT /api/external/notes` store answers to questions that appear on applications, such as veteran status. A note has `topic`, `question`, and `answer`. The same topic updates the previous note. These notes are not shown on the dashboard. A token can read and save them during and outside open hour. During open hour, no token is required.

The logged-in dashboard can still edit every record. Those dashboard writes use the session cookie, not the token.

`GET /api/external/portfolio` also returns:

- `profile`, including `age` calculated from `birthDate`
- `entries`, grouped by `project`, `certificate`, `experience`, `education`, and `coursework`. Each entry includes its skills
- `skills`
- `references`

Dates are `YYYY-MM-DD`. A missing `endedOn` on an experience entry means the role is current.

`GET /api/coursework` is public and returns the hardcoded course list. Each item includes `shortName`, `fullName`, `description`, `school`, and `term`. The same list is included on `GET /api/showcase` under `coursework` and `entries.coursework`, and on `GET /api/external/portfolio` under `coursework`.

The dashboard uses the session cookie for its own edits:

- `PATCH /profile`
- `POST /entries`, `PATCH /entries/:id`, `DELETE /entries/:id`
- `POST /skills`, `PATCH /skills/:id`, `DELETE /skills/:id`
- `POST /references`, `PATCH /references/:id`, `DELETE /references/:id`
- `POST /applications`, `PATCH /applications/:id`, `DELETE /applications/:id`
- `POST /media` with one multipart field named `file` (`png`, `jpeg`, `webp`, or `gif`, up to 5 MB). The image bytes are stored in the database. The response `imagePath` is served from `GET /media/:id`.

Database settings live in `server/.env`. Copy `server/.env.example` there if you do not already have one. The active `DATABASE_URL` uses the local Postgres database `mydb`, in a `xbvkano` schema so it stays separate from other apps in that database. Comment that line and uncomment the one below it to point at another database.
