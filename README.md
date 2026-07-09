# music-shop-be

NestJS backend bootstrap for the Music Shop frontend contract in [BACKEND_CONTRACT.md](/home/aziz/WebstormProjects/music-shop-be/BACKEND_CONTRACT.md).

## Stack

- NestJS
- Prisma
- PostgreSQL
- Cookie-based server sessions

## Implemented in the initial phase

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/session`
- `POST /api/v1/auth/logout`
- `GET /api/v1/settings`
- `PUT /api/v1/settings`
- `GET /api/v1/categories`
- `POST /api/v1/categories`
- `PUT /api/v1/categories/:id`
- `DELETE /api/v1/categories/:id`
- `GET /api/v1/brands`
- `POST /api/v1/brands`
- `PUT /api/v1/brands/:id`
- `DELETE /api/v1/brands/:id`

## Setup

1. Copy `.env.example` to `.env`.
2. Ensure PostgreSQL is running and `DATABASE_URL` points to a writable database.
3. Install dependencies with `npm install`.
4. Generate Prisma client with `npx prisma generate`.
5. Apply the initial migration with `npx prisma migrate dev`.
6. Seed demo data with `npx prisma db seed`.
7. Start the app with `npm run start:dev`.

## Demo accounts

- Staff login: `admin` / `Secret!1`
- Client login: `amina@example.com` / `amina@example.com`

## Notes

- `GET /api/v1/auth/session` returns `200` with `{ "session": null }` when no valid session exists.
- Categories use backend-generated unique slugs.
- Category delete currently blocks only child-category relations. Product-level delete restrictions belong to the next phase when products are added.
- Brand delete currently has no product-level relation checks for the same reason.

## Tests

- Unit and e2e scaffolding is included.
- In this environment `node`/`npm` are not installed, so dependencies and tests could not be executed here.
