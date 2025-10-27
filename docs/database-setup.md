# Errandsite Database Documentation

## Overview

The Errandsite application uses Supabase (PostgreSQL) as its database backend. This document outlines the database architecture, initialization process, and migration system.

## Database Schema

The application uses the following tables:

| Table | Description | Key Fields |
|-------|-------------|------------|
| `users` | User accounts and profiles | `id`, `email`, `full_name`, `role`, `created_at` |
| `service_categories` | Categories of services offered | `id`, `name`, `description` |
| `services` | Specific services within categories | `id`, `category_id`, `name`, `description`, `price` |
| `errand_requests` | Customer errand requests | `id`, `user_id`, `service_id`, `status`, `created_at` |
| `tasks` | Internal tasks assigned to employees | `id`, `title`, `description`, `assigned_to`, `status` |
| `attendance_records` | Employee attendance tracking | `id`, `user_id`, `check_in`, `check_out`, `status` |
| `projects` | Project management data | `id`, `name`, `description`, `status`, `manager_id` |

## Row-Level Security (RLS)

All tables implement Row-Level Security policies to ensure data access is properly controlled:

- **Users**: Users can read their own profile, admins can read/write all profiles
- **Service Categories**: Public read, admin write
- **Services**: Public read, admin write
- **Errand Requests**: Users can read their own requests, admins can read/write all requests
- **Tasks**: Users can read tasks assigned to them, admins can read/write all tasks
- **Attendance Records**: Users can read their own records, admins can read/write all records
- **Projects**: Team members can read their projects, managers can read/write their projects, admins can read/write all projects

## Database Initialization

The database is automatically initialized on application startup through the following process:

1. The `AuthProvider` component calls `initDb()` from `db-init.ts`
2. `initDb()` checks if initialization is already in progress or completed
3. If not initialized, it runs the migration system from `db-migrations.ts`
4. Migrations create tables, set up RLS policies, and seed initial data if needed
5. Status flags track initialization progress and any errors

## Migration System

The migration system in `db-migrations.ts` provides:

1. **Idempotent Migrations**: Each migration checks if it needs to run before executing
2. **Timeout Handling**: All database operations have timeouts (5-10 seconds)
3. **Error Handling**: Structured error logging and fallback mechanisms
4. **Transaction Support**: Critical migrations use transactions for atomicity

## Environment Configuration

Database connection parameters are configured through environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Testing and Monitoring

The application includes:

1. **Database Status Component**: Real-time connection status in the admin panel
2. **Table Testing**: Verification of all critical tables
3. **Connection Testing**: Database connectivity checks

## Error Handling

All database operations include:

- Timeout handling with configurable timeouts
- Automatic retries with exponential backoff for critical operations
- Fallback to development data when in development mode
- Structured error logging

## Best Practices

When extending the database:

1. Add new migrations to `db-migrations.ts`
2. Always implement appropriate RLS policies
3. Include foreign key constraints for data integrity
4. Add indexes for frequently queried columns
5. Test migrations on development before deploying to production