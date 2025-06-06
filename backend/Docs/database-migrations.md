# Database Migrations: A Mini-Course

## What is a Migration?

A **migration** is a process or script that changes your database structure (schema) or data to match updates in your application. Migrations help keep your database and code in sync as your project evolves.

### Types of Migrations

- **Schema Migration:** Changes the structure of your database (e.g., adding/removing fields, changing data types, creating indexes).
- **Data Migration:** Updates the actual data in your database (e.g., fixing old records, setting new default values, moving data between fields).

---

## Why Are Migrations Important?

- **Consistency:** Ensures all data matches your latest application logic.
- **Reliability:** Prevents errors caused by mismatched data or missing fields.
- **Scalability:** Allows your project to grow and change without losing or corrupting data.
- **Collaboration:** Lets teams safely evolve the database together.

---

## When Do You Need Migrations?

- When you add, remove, or rename fields in your models.
- When you change default values or validation rules.
- When you need to fix or update existing data to match new logic.

### Example: Citizen Activation

Suppose you change your signup logic so that new citizens have `isActive: true` and `status: "active"`. But old citizens in the database still have `isActive: false` and `status: "pending"`. You need a **data migration** to update all old citizens to the new values.

---

## How Are Migrations Done?

### 1. Manual Migration

Run a command or script directly in your database:

```js
// MongoDB shell example:
db.users.updateMany(
  {
    roles: ObjectId("<user role ObjectId>"),
    $or: [{ isActive: false }, { status: "pending" }],
  },
  {
    $set: { isActive: true, status: "active" },
  }
);
```

### 2. Automated Migration

Use migration tools or write scripts that can be run as part of your deployment process. Examples:

- **Mongoose:** [migrate-mongo](https://github.com/seppevs/migrate-mongo)
- **SQL:** Sequelize, TypeORM, Flyway, Liquibase

---

## Best Practices

- **Version Control:** Store migration scripts in your code repository.
- **Idempotency:** Migrations should be safe to run multiple times.
- **Backups:** Always back up your database before running migrations.
- **Testing:** Test migrations on a staging environment first.
- **Documentation:** Document what each migration does and why.

---

## Summary

- Migrations keep your database and code in sync.
- Use them whenever you change your schema or need to update existing data.
- Automate migrations for safety and repeatability.
- Always test and document your migrations.

---

**Further Reading:**

- [Database Migrations: The Essentials (DigitalOcean)](https://www.digitalocean.com/community/tutorials/how-to-use-database-migrations-with-your-application)
- [Mongoose Migrations](https://mongoosejs.com/docs/migrations.html)
- [Flyway (for SQL)](https://flywaydb.org/)
