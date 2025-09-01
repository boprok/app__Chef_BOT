# Database

This folder contains database-related files for the ChefBot API.

## Structure

- `migrations/` - SQL migration files for database setup
- `SUPABASE_SETUP.md` - Instructions for setting up Supabase database

## Migration Files

- `create_user_sessions_table.sql` - Creates the user_sessions table for JWT session management
- `migrate_supabase_sessions.sql` - Migration script for updating existing session data

## Usage

These files are used to set up and maintain the Supabase PostgreSQL database that powers the ChefBot API authentication and session management system.
