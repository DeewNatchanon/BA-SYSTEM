# BA System Backend (Express + PostgreSQL)

## 1) Configure environment

Copy `.env.example` to `.env` and set real values:

```bash
cp .env.example .env
```

## 2) Prepare database

Run SQL in `db/init.sql` against your PostgreSQL database to create tables and roles.

Then seed login users:

```bash
npm run seed:users
```

Default seeded users:

- `employee / employee123`
- `manager / manager123`

## 3) Run API

```bash
npm run dev
```

## API endpoints

- `POST /api/auth/login`
- `POST /api/auth/register` (self-register as employee)
- `GET /api/auth/me` (Bearer token required)
- `GET /api/forms/permissions` (Bearer token required)
- `GET /api/users` (manager role only)

## Notes

- Auth uses JWT (`Authorization: Bearer <token>`)
- Role guard supports `employee` and `manager`
- CORS is restricted by `CLIENT_ORIGIN`
