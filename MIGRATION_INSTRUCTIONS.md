# Database Migration Required

## ⚠️ IMPORTANT: You must run this migration before using the courses feature

The 406 errors you're seeing are because the `courses` column doesn't exist in your database yet.

## Quick Fix (2 minutes)

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your project: `opqaevuxooubkgrlwwjh`

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste this SQL:**
   ```sql
   -- Add the courses column to cvs table
   ALTER TABLE cvs 
   ADD COLUMN IF NOT EXISTS courses JSONB DEFAULT '[]'::jsonb;

   -- Update existing rows to have an empty array if courses is null
   UPDATE cvs 
   SET courses = '[]'::jsonb 
   WHERE courses IS NULL;

   -- Add the courses column to cv_history table (for version history)
   ALTER TABLE cv_history 
   ADD COLUMN IF NOT EXISTS courses JSONB DEFAULT '[]'::jsonb;

   -- Update existing history rows to have an empty array if courses is null
   UPDATE cv_history 
   SET courses = '[]'::jsonb 
   WHERE courses IS NULL;
   ```

4. **Run the migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - You should see "Success. No rows returned"

5. **Refresh your app**
   - The 406 errors should disappear
   - You can now use the courses feature

## What this migration does

- Adds a `courses` JSONB column to the `cvs` table
- Adds a `courses` JSONB column to the `cv_history` table (for version history)
- Sets default value to empty array `[]` for all existing CVs and history records
- Allows the app to save and retrieve course data with credit hours

## Verification

After running the migration, you can verify it worked by:

1. In Supabase Dashboard, go to "Table Editor"
2. Select the `cvs` table - you should see a `courses` column with type `jsonb`
3. Select the `cv_history` table - you should also see a `courses` column with type `jsonb`

## Need Help?

If you still see errors after running the migration:
- Check that the migration ran successfully (no errors in SQL Editor)
- Verify the column exists in Table Editor
- Try refreshing your browser
- Check the browser console for any new error messages

