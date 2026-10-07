# Neon release prerequisite: transaction form and vendor directory

`20261003000000_transaction_form_directory.sql` is an explicit, idempotent PostgreSQL 15+ migration for the live Neon database (it uses the PostgreSQL 15 column-list form of `ON DELETE SET NULL`). It runs in one transaction and requires the existing `User` and `Transaction` tables. Apply it manually to the intended Neon database as a release prerequisite before deploying transaction/vendor routes. For example, with the Neon `DATABASE_URL` in the environment:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/migrations/20261003000000_transaction_form_directory.sql
```

Review the target database and migration contents before running. First inspect orphaned vendor owners with:

```sql
SELECT vendor.id, vendor."userId"
FROM "Vendor" AS vendor
LEFT JOIN "User" AS owner ON owner.id = vendor."userId"
WHERE owner.id IS NULL;
```

Resolve any returned rows deliberately before applying the migration; it checks and aborts atomically if orphaned Vendor owners remain and does not delete vendor records. The type conversion rounds existing floating-point `Transaction.amount` and `Transaction.commercialValue` values to the nearest cent and then stores them as `NUMERIC(12,2)`; inspect existing rows for outliers or non-finite values first. The migration also clears `vendorId` values that do not match a vendor owned by an existing user and the transaction's user, then adds a composite tenant-aware foreign key. This repository change does not run the migration. `prisma/schema.sql` is a fresh-database Neon baseline, not a reconciliation script for existing tables. `prisma/schema.prisma` and `prisma/migrations` are separate local SQLite tooling; SQLite's floating-point fields do not define production money precision, which is enforced by this PostgreSQL migration.

## Authentication prerequisite

Set a unique, high-entropy `JWT_SECRET` (at least 32 random bytes) in each deployment environment before release. The application has no static fallback and fails closed when it is absent; this repository does not verify or alter Vercel environment settings.
