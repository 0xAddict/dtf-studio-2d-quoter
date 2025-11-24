# Forge Dashboard Installation Guide

This guide will walk you through installing and configuring the Forge Dashboard WordPress plugin.

## Prerequisites

Before installing the plugin, ensure you have:

- ✅ WordPress 5.8 or higher
- ✅ PHP 7.4 or higher
- ✅ Active Supabase project
- ✅ Supabase service role key
- ✅ Administrator access to your WordPress site

## Step 1: Install the Plugin

### Option A: Upload via WordPress Admin (Recommended)

1. **Prepare the Plugin**
   - Navigate to `wordpress-plugin/forge-dashboard`
   - Create a ZIP file of the `forge-dashboard` folder
   ```bash
   cd wordpress-plugin
   zip -r forge-dashboard.zip forge-dashboard/
   ```

2. **Upload to WordPress**
   - Log in to your WordPress admin panel
   - Go to **Plugins** → **Add New**
   - Click **Upload Plugin** at the top
   - Click **Choose File** and select `forge-dashboard.zip`
   - Click **Install Now**
   - After installation, click **Activate Plugin**

### Option B: Manual Installation via FTP/SFTP

1. **Upload Files**
   - Connect to your WordPress site via FTP/SFTP
   - Navigate to `/wp-content/plugins/`
   - Upload the entire `forge-dashboard` folder
   - Ensure the folder structure is: `/wp-content/plugins/forge-dashboard/`

2. **Activate Plugin**
   - Log in to your WordPress admin panel
   - Go to **Plugins** → **Installed Plugins**
   - Find "Forge Dashboard" in the list
   - Click **Activate**

### Option C: Command Line (for developers)

```bash
# From your WordPress installation directory
cd wp-content/plugins/

# Copy or symlink the plugin
cp -r /path/to/Hexea---3D-Viewer/wordpress-plugin/forge-dashboard .

# Or use symlink for development
ln -s /path/to/Hexea---3D-Viewer/wordpress-plugin/forge-dashboard .

# Set proper permissions
chmod -R 755 forge-dashboard/
```

Then activate via WordPress admin or WP-CLI:
```bash
wp plugin activate forge-dashboard
```

## Step 2: Get Supabase Credentials

1. **Log in to Supabase**
   - Go to https://supabase.com/dashboard
   - Select your Hexea Forge project

2. **Get Project URL**
   - Go to **Settings** → **API**
   - Copy the **Project URL** (e.g., `https://abcdefgh.supabase.co`)

3. **Get Service Role Key**
   - Still in **Settings** → **API**
   - Scroll down to **Project API keys**
   - Find the `service_role` key
   - Click **Reveal** to show the key
   - Copy the entire key (starts with `eyJ...`)

   ⚠️ **IMPORTANT:**
   - Use the `service_role` key, NOT the `anon` key
   - Keep this key SECRET - never commit it to version control
   - Never expose it in client-side code

## Step 3: Configure the Plugin

1. **Access Settings**
   - In WordPress admin, you'll see a new **Forge** menu item
   - Click **Forge** → **Settings**

2. **Enter Supabase Credentials**
   - **Supabase URL:** Paste your project URL
   - **Supabase Service Key:** Paste your service role key
   - Click **Save Changes**

3. **Test Connection**
   - In the sidebar, click **Test Connection**
   - You should see: "Successfully connected to Supabase"
   - If you get an error, double-check your credentials

4. **Configure Other Settings** (optional)
   - **Items Per Page:** Set how many quotes to show per page (default: 20)
   - **Default Quote Status:** Choose the status for new quotes (default: pending)
   - **Web3Forms API Key:** Usually pre-configured, change only if needed

5. **Save Settings**
   - Click **Save Changes** at the bottom

## Step 4: Verify Database Schema

The plugin expects your Supabase database to have the correct table structure. If you're starting fresh, run this SQL in your Supabase SQL Editor:

```sql
-- Create quote_requests table if not exists
CREATE TABLE IF NOT EXISTS quote_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    model_id UUID,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,
    quantity INTEGER NOT NULL,
    material TEXT NOT NULL,
    timeline TEXT,
    notes TEXT,
    model_data JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON quote_requests(email);

-- Enable Row Level Security (RLS) - service_role bypasses this
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Create policy for service_role (allows all operations)
CREATE POLICY "Service role has full access" ON quote_requests
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

## Step 5: Configure Supabase Storage

1. **Access Storage**
   - In Supabase Dashboard, go to **Storage**

2. **Create Bucket** (if not exists)
   - Click **New Bucket**
   - Name: `attachments`
   - Public: ✅ Yes (checked)
   - Click **Create Bucket**

3. **Configure Bucket Policies**
   - Click on the `attachments` bucket
   - Go to **Policies**
   - Create a policy that allows public read access:
   ```sql
   CREATE POLICY "Public read access" ON storage.objects
       FOR SELECT
       USING (bucket_id = 'attachments');
   ```

4. **Set File Size Limit**
   - In bucket settings, set max file size to **50MB**

5. **Configure Allowed MIME Types**
   - Allow the following types:
     - `application/octet-stream`
     - `model/stl`
     - `model/obj`
     - `image/jpeg`
     - `image/png`
     - `application/pdf`

## Step 6: Test the Installation

1. **Check Dashboard Access**
   - Click **Forge** in the WordPress admin menu
   - You should see the dashboard with statistics

2. **View Quotes**
   - Go to **Forge** → **All Quotes**
   - If you have existing quotes, they should appear here

3. **Test a Quote**
   - If you have quotes, click on one to view details
   - Try changing the status
   - Try downloading a file (if attached)

4. **Check Permissions**
   - Log out and log in as a non-admin user
   - The Forge menu should NOT be visible (admin-only)

## Troubleshooting

### Problem: "Supabase not configured" error

**Solution:**
- Go to Forge → Settings
- Verify your Supabase URL has no trailing slash
- Ensure you're using the service_role key, not anon key
- Click "Test Connection" to diagnose

### Problem: "Connection failed" when testing

**Solutions:**
1. Check your Supabase URL is correct
2. Verify the service_role key is complete (very long string)
3. Ensure your Supabase project is active (not paused)
4. Check that `quote_requests` table exists
5. Review PHP error logs: `/wp-content/debug.log`

### Problem: No quotes showing

**Solutions:**
1. Verify data exists in Supabase:
   ```sql
   SELECT * FROM quote_requests LIMIT 5;
   ```
2. Check table name is exactly `quote_requests` (lowercase, underscore)
3. Verify RLS policies aren't blocking service_role access
4. Check PHP error logs for database errors

### Problem: Files not downloading

**Solutions:**
1. Verify `attachments` bucket exists in Supabase Storage
2. Check bucket is set to public
3. Verify file paths follow format: `quotes/HF-ABC123/filename.stl`
4. Check storage policies allow public read access

### Problem: Plugin won't activate

**Solutions:**
1. Check PHP version: `php -v` (must be 7.4+)
2. Check WordPress version (must be 5.8+)
3. Review PHP error logs for fatal errors
4. Ensure file permissions are correct (755 for directories, 644 for files)

### Problem: "Headers already sent" error

**Solution:**
- Check for any whitespace before `<?php` tags in plugin files
- Ensure files are saved with UTF-8 encoding without BOM
- Review PHP error logs for the specific file causing the issue

## Security Checklist

After installation, verify:

- [ ] Using service_role key (not anon key)
- [ ] Service key not exposed in client-side code
- [ ] WordPress running over HTTPS
- [ ] WordPress and plugins up to date
- [ ] Strong admin password
- [ ] Limited user access (only admins can see Forge menu)
- [ ] Regular backups enabled
- [ ] PHP error display turned off in production

## Post-Installation

### Recommended Next Steps

1. **Configure Email Notifications**
   - Set up Web3Forms for quote notifications
   - Configure SMTP in WordPress for email customer feature

2. **Set Up Backups**
   - Back up WordPress database regularly
   - Back up Supabase database (Supabase provides automated backups)

3. **Monitor Performance**
   - Install a caching plugin (WP Rocket, W3 Total Cache)
   - Monitor Supabase usage in dashboard
   - Set up uptime monitoring

4. **Customize Settings**
   - Adjust "Items Per Page" based on your volume
   - Set appropriate default status for your workflow
   - Configure material prices in Quote Manager class (if needed)

5. **Train Your Team**
   - Share this documentation with team members
   - Create a workflow document for quote management
   - Set up status definitions that match your process

## Updating the Plugin

When a new version is released:

1. **Backup First**
   - Back up your WordPress database
   - Back up the plugin files

2. **Update Files**
   - Download the new version
   - Deactivate the old version
   - Replace the plugin folder
   - Reactivate the plugin

3. **Check for Breaking Changes**
   - Review the changelog
   - Test on a staging site first if possible

4. **Verify Settings**
   - Check that all settings are still correct
   - Test connection to Supabase

## Uninstallation

If you need to remove the plugin:

1. **Export Data First** (if needed)
   - Go to Forge → All Quotes
   - Click "Export CSV" to save all quotes

2. **Deactivate Plugin**
   - Go to Plugins → Installed Plugins
   - Find "Forge Dashboard"
   - Click **Deactivate**

3. **Delete Plugin**
   - After deactivation, click **Delete**
   - Confirm deletion

**Note:** Deleting the plugin does NOT delete your Supabase data. All quotes remain in your Supabase database.

## Support

Need help? Here's where to get support:

- **Documentation:** See README.md and readme.txt
- **GitHub Issues:** https://github.com/0xAddict/Hexea---3D-Viewer/issues
- **Supabase Docs:** https://supabase.com/docs
- **WordPress Support:** https://wordpress.org/support/

## Additional Resources

- [WordPress Plugin Developer Handbook](https://developer.wordpress.org/plugins/)
- [Supabase Documentation](https://supabase.com/docs)
- [Hexea Forge GitHub Repository](https://github.com/0xAddict/Hexea---3D-Viewer)

---

**Congratulations!** You've successfully installed Forge Dashboard. Start managing your 3D printing quotes efficiently! 🎉
