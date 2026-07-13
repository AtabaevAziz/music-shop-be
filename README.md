# music-shop-be

NestJS backend for the Music Shop frontend contract.

## Stack

- NestJS
- Prisma
- PostgreSQL
- Cookie-based server sessions

## Implemented in the initial phase

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/session`
- `POST /api/v1/auth/logout`
- `GET /api/v1/config/app`
- `GET /api/v1/config/auth`
- `GET /api/v1/config/navigation`
- `GET /api/v1/config/permissions`
- `GET /api/v1/config/workflows`
- `GET /api/v1/config/dictionaries`
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
- `GET /api/v1/customers`
- `POST /api/v1/customers`
- `PUT /api/v1/customers/:id`
- `DELETE /api/v1/customers/:id`
- `GET /api/v1/employees`
- `POST /api/v1/employees`
- `PUT /api/v1/employees/:id`
- `DELETE /api/v1/employees/:id`
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `POST /api/v1/products`
- `PUT /api/v1/products/:id`
- `DELETE /api/v1/products/:id`
- `POST /api/v1/products/:id/images`
- `POST /api/v1/products/:id/primary-image`
- `GET /api/v1/inventory`
- `POST /api/v1/inventory/adjustments`
- `GET /api/v1/orders`
- `POST /api/v1/orders/:id/status`
- `GET /api/v1/repairs`
- `POST /api/v1/repairs`
- `GET /api/v1/activity`
- `GET /api/v1/finance/summary`
- `GET /api/v1/client/me`
- `GET /api/v1/client/products`
- `GET /api/v1/client/orders`
- `POST /api/v1/client/orders`
- `GET /api/v1/client/repairs`
- `POST /api/v1/client/repairs`

## Setup

1. Copy `.env.example` to `.env`.
2. Ensure PostgreSQL is running and `DATABASE_URL` points to a writable database.
3. Install dependencies with `npm install`.
4. Generate Prisma client with `npx prisma generate`.
5. Apply the initial migration with `npx prisma migrate dev`.
6. Seed demo data with `npx prisma db seed`.
7. Start the app with `npm run start:dev`.

Local PostgreSQL options:

- Standard TCP setup: keep `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/music_shop`.
- Ubuntu Core 24 / snap setup:
  `sudo snap install postgresql`
  `sudo snap restart postgresql`
  `postgresql.psql -U postgres -h /tmp`
  inside `psql`, run `ALTER USER postgres WITH PASSWORD 'postgres';` and `CREATE DATABASE music_shop;`
  use `DATABASE_URL=postgresql://postgres:postgres@localhost/music_shop?socket=/tmp`
  then run `npx prisma migrate dev`, `npx prisma db seed`, and `npm run start:dev`

Default local setup:

- backend: `http://localhost:8080`
- frontend origin for cookies/CORS: `http://localhost:3000`

## Demo accounts

- Staff login: `admin` / `Secret!1`
- Client login: `amina@example.com` / `amina@example.com`

## Notes

- `GET /api/v1/auth/session` returns `200` with `{ "session": null }` when no valid session exists.
- CORS is restricted by `CLIENT_ORIGIN`; multiple origins can be provided as a comma-separated list.
- Categories use backend-generated unique slugs.
- Finance summary is calculated from orders, order items, product costs, and business settings without extra tables.

## Tests

- Unit and e2e scaffolding is included.
- In this environment `node`/`npm` are not installed, so dependencies and tests could not be executed here.
