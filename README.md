# Smart Clinic Management System (SCMS)

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

### To Stop Docker:

```sh
docker compose down
```

---
