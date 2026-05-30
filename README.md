# Smart Clinic Management System (SCMS)

## Database Provider

The API uses SQLite by default for local development:

```json
"Database": {
  "Provider": "Sqlite",
  "EnsureCreated": true,
  "SeedDemoUsers": true
}
```

SQLite demo logins:

- Admin: `admin@scms.demo` / `password`
- User: `user@scms.demo` / `password`
- Real-world admin: `dr.thandar@scms.demo` / `password`
- Real-world user: `aung.min@example.test` / `password`

To run PostgreSQL instead, set `Database:Provider` to `PostgreSql` and provide `ConnectionStrings:PostgreSqlConnection`. Docker Compose already uses the PostgreSQL provider.

PostgreSQL Database Scaffold Command:

```sh
dotnet ef dbcontext scaffold"Host=localhost;Database=SCMS_db;Username=postgres;Password=admin" Npgsql.EntityFrameworkCore.PostgreSQL -o Models -f
```

---

## Docker Commands

### Run this in the root directory (only run this when running docker for the first time):

```sh
cd /d/SCMS
# Note: Run the following command from the root directory of the project
docker compose up -d --build
```

### To Run Docker:

```sh
docker compose up
```

### To Check Docker Status:

```sh
docker compose ps
```

### Real-world Demo Data:

Fresh Docker database volumes load `db.sql` first, then `seed.realworld.sql`. The seed is organized case by case for family profiles, appointment queues, prescriptions, inventory alerts, payments, and notifications.

To apply the seed to an already-created database:

```sh
docker compose exec scms_db psql -U postgres -d SCMS_db -f /docker-entrypoint-initdb.d/zz-seed.realworld.sql
```

### To Stop Docker:

```sh
docker compose down
```

---
