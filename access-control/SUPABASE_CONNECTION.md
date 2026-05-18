# Supabase Connection Troubleshooting

## "Tenant or user not found" Error

This error typically occurs when:

1. **Using the wrong connection string type** - Supabase requires using the **Connection Pooler URL** for server applications, not the direct connection URL.

2. **Incorrect DATABASE_URL format** - The connection string may be pointing to the wrong project or have incorrect credentials.

## How to Fix

### Step 1: Get the Correct Connection String

1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Database**
3. Under **Connection string**, select **Connection pooling** (not "Direct connection")
4. Choose **Transaction mode** (recommended for Prisma)
5. Copy the connection string - it should look like:
   ```
   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### Step 2: Update Your .env File

Make sure your `DATABASE_URL` in `.env` uses the **pooler URL** (port 6543) with `?pgbouncer=true`:

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**Important Notes:**
- Use port **6543** (pooler), NOT port 5432 (direct connection)
- Include `?pgbouncer=true` at the end
- Replace `[project-ref]`, `[password]`, and `[region]` with your actual values

### Step 3: Regenerate Prisma Client

After updating the connection string:

```bash
npm run db:generate
```

### Step 4: Test the Connection

Restart your server and check the console. You should see:
```
✅ Database connected successfully
```

If you see an error, verify:
- The connection string is correct
- Your Supabase project is active
- The database password hasn't changed
- You're using the pooler URL, not the direct connection URL

## Common Issues

### Issue: Still getting "Tenant or user not found"
**Solution:** Double-check that you're using the pooler URL (port 6543) and not the direct connection URL (port 5432).

### Issue: Connection works but queries fail
**Solution:** Make sure you're using **Transaction mode** in the pooler settings, not Session mode.

### Issue: Connection string looks correct but still fails
**Solution:** 
1. Verify your Supabase project is active and not paused
2. Check that your database password hasn't changed
3. Try regenerating the connection string from Supabase dashboard
4. Ensure there are no extra spaces or characters in your `.env` file
