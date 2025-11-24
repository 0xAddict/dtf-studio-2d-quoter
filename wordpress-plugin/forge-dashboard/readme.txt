=== Forge Dashboard ===
Contributors: hexeaforge
Tags: quotes, dashboard, supabase, 3d-printing, crm
Requires at least: 5.8
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: MIT
License URI: https://opensource.org/licenses/MIT

Professional dashboard for managing 3D printing quotes from Hexea Forge. Integrates with Supabase for quote management, file handling, and customer communications.

== Description ==

Forge Dashboard is a powerful WordPress plugin designed to manage 3D printing quote requests from your Hexea Forge application. It provides a professional admin interface for viewing, filtering, and managing quotes stored in Supabase.

= Features =

* **Comprehensive Dashboard** - Overview of all quotes with statistics and insights
* **Quote Management** - View, edit, delete, and update quote statuses
* **Advanced Filtering** - Search and filter quotes by status, material, customer, and date
* **File Management** - Download and delete attached 3D model files from Supabase Storage
* **Status Tracking** - Track quotes through multiple stages (Pending, Processing, Quoted, Approved, In Production, Completed, Cancelled)
* **Bulk Actions** - Perform actions on multiple quotes at once
* **Export to CSV** - Export quote data for analysis and reporting
* **Real-time Statistics** - View key metrics including revenue estimates and popular materials
* **Supabase Integration** - Seamlessly connects to your Supabase project
* **Secure** - Uses service role key for admin operations with proper authentication
* **Responsive Design** - Works beautifully on desktop, tablet, and mobile devices

= Requirements =

* WordPress 5.8 or higher
* PHP 7.4 or higher
* Active Supabase project with quote_requests table
* Supabase service role key (for admin operations)

= Setup Instructions =

1. Upload the plugin folder to `/wp-content/plugins/forge-dashboard/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Navigate to Forge → Settings
4. Enter your Supabase URL and Service Role Key
5. Click "Test Connection" to verify everything works
6. Start managing your quotes!

= Supabase Configuration =

The plugin expects your Supabase project to have the following table structure:

**quote_requests table:**
- id (uuid, primary key)
- user_id (uuid, nullable)
- model_id (uuid, nullable)
- name (text)
- email (text)
- phone (text, nullable)
- company (text, nullable)
- quantity (integer)
- material (text)
- timeline (text, nullable)
- notes (text, nullable)
- model_data (jsonb)
- status (text)
- created_at (timestamp)

**Storage buckets:**
- attachments (for quote files)

= Usage =

**Viewing the Dashboard:**
Navigate to Forge → Dashboard to see an overview of all quotes and statistics.

**Managing Quotes:**
Go to Forge → All Quotes to see a complete list. Use the filters to narrow down results, or use the search box to find specific customers.

**Viewing Quote Details:**
Click on any quote ID to view full details including customer information, pricing breakdown, and attached files.

**Updating Status:**
From the quote details page, select a new status from the dropdown and click "Update Status".

**Deleting Quotes:**
You can delete quotes from either the list view or the details view. This will also delete associated files from Supabase Storage.

**Exporting Data:**
From the All Quotes page, click "Export CSV" to download all quotes (respecting current filters).

== Installation ==

= Automatic Installation =

1. Log in to your WordPress admin panel
2. Go to Plugins → Add New
3. Search for "Forge Dashboard"
4. Click "Install Now" and then "Activate"

= Manual Installation =

1. Download the plugin zip file
2. Extract it to `/wp-content/plugins/forge-dashboard/`
3. Log in to your WordPress admin panel
4. Go to Plugins and activate "Forge Dashboard"

= Configuration =

1. After activation, go to Forge → Settings
2. Enter your Supabase project URL (e.g., https://your-project.supabase.co)
3. Enter your Supabase service role key (found in Supabase Dashboard → Settings → API)
4. Configure other settings as needed
5. Click "Save Changes"
6. Use the "Test Connection" button to verify your credentials

**Important:** Always use your service role key (not the anon key) for admin operations. Keep this key secure and never expose it publicly.

== Frequently Asked Questions ==

= Where do I find my Supabase credentials? =

Log in to your Supabase dashboard, go to Settings → API. You'll find:
- Project URL under "Project URL"
- Service role key under "Project API keys" (click to reveal)

= Can I use the anon key instead of the service role key? =

No. The anon key has limited permissions and won't allow the admin operations this plugin needs. Always use the service role key.

= Will this work with my existing Hexea Forge installation? =

Yes! This plugin is designed to work seamlessly with the Hexea Forge 3D viewer application. It reads from the same Supabase database.

= Can I delete quotes from Web3Forms? =

Web3Forms is an email forwarding service and doesn't store quotes persistently. This plugin deletes quotes from Supabase and associated files from Supabase Storage.

= Is my data secure? =

Yes. The plugin uses WordPress's built-in security features including nonces, capability checks, and sanitization. Your Supabase service key is stored securely in the WordPress database.

= Can I customize the quote statuses? =

Currently, the statuses are predefined. Custom status support may be added in a future version.

= Does this plugin support multisite? =

Not currently. Multisite support may be added in a future version.

== Screenshots ==

1. Dashboard overview with statistics
2. All quotes list with filters
3. Quote details view
4. Settings page
5. Material popularity chart

== Changelog ==

= 1.0.0 =
* Initial release
* Dashboard with statistics
* Quote list with search and filters
* Quote details view
* Status management
* File management
* Bulk actions
* CSV export
* Supabase integration
* Settings page

== Upgrade Notice ==

= 1.0.0 =
Initial release of Forge Dashboard.

== Privacy Policy ==

Forge Dashboard does not collect any user data. All quote information is stored in your Supabase project, which you control. The plugin only facilitates access to this data through the WordPress admin interface.

== Support ==

For support, please visit: https://github.com/0xAddict/Hexea---3D-Viewer/issues

== Credits ==

Developed for Hexea Forge 3D Printing Quote System.
