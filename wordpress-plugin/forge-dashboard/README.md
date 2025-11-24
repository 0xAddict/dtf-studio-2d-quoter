# Forge Dashboard - WordPress Plugin

Professional dashboard plugin for managing 3D printing quotes from Hexea Forge. Seamlessly integrates with Supabase for quote management, file handling, and customer communications.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![WordPress](https://img.shields.io/badge/wordpress-5.8%2B-blue.svg)
![PHP](https://img.shields.io/badge/php-7.4%2B-purple.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

### 📊 Comprehensive Dashboard
- Real-time statistics and metrics
- Quote status overview
- Revenue estimates
- Material popularity charts
- Recent activity feed

### 📝 Quote Management
- View all quotes in a sortable, filterable table
- Detailed quote view with customer info, pricing, and files
- Status tracking through multiple stages
- Bulk actions for efficient management
- Search functionality across names, emails, and companies

### 🗂️ File Management
- Download 3D model files directly from Supabase Storage
- Delete files individually or with quotes
- View file metadata (size, type, upload date)
- Support for multiple file formats (STL, OBJ, FBX, etc.)

### 📈 Advanced Features
- Export quotes to CSV for reporting
- Filter by status, material, and date range
- Real-time status updates via AJAX
- Responsive design for all devices
- Keyboard shortcuts for power users

### 🔒 Security
- Uses WordPress nonces for all AJAX requests
- Capability checks on all admin actions
- Secure storage of Supabase credentials
- Service role key authentication

## Requirements

- **WordPress:** 5.8 or higher
- **PHP:** 7.4 or higher
- **Supabase Project:** Active project with configured database and storage
- **Supabase Access:** Service role key (for admin operations)

## Installation

### Method 1: Manual Installation

1. Download or clone this repository
2. Copy the `forge-dashboard` folder to your WordPress plugins directory:
   ```bash
   cp -r forge-dashboard /path/to/wordpress/wp-content/plugins/
   ```
3. Log in to your WordPress admin panel
4. Go to **Plugins** → **Installed Plugins**
5. Find "Forge Dashboard" and click **Activate**

### Method 2: Upload via WordPress

1. Download the plugin as a ZIP file
2. Log in to your WordPress admin panel
3. Go to **Plugins** → **Add New** → **Upload Plugin**
4. Choose the ZIP file and click **Install Now**
5. After installation, click **Activate Plugin**

## Configuration

### Step 1: Get Supabase Credentials

1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following:
   - **Project URL** (e.g., `https://your-project.supabase.co`)
   - **service_role key** (click "Reveal" to see the secret key)

⚠️ **Important:** Use the `service_role` key, NOT the `anon` key. The service role key has elevated permissions needed for admin operations.

### Step 2: Configure Plugin

1. In WordPress admin, go to **Forge** → **Settings**
2. Enter your **Supabase URL**
3. Enter your **Supabase Service Key**
4. Configure other settings:
   - **Items Per Page:** Number of quotes to show per page (default: 20)
   - **Default Status:** Status for new quotes (default: pending)
   - **Web3Forms Key:** Email notification service key
5. Click **Save Changes**
6. Click **Test Connection** to verify everything works

### Step 3: Verify Database Schema

Ensure your Supabase project has the required table structure:

```sql
-- Quote Requests Table
CREATE TABLE quote_requests (
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
CREATE INDEX idx_quote_requests_status ON quote_requests(status);
CREATE INDEX idx_quote_requests_created_at ON quote_requests(created_at DESC);
CREATE INDEX idx_quote_requests_email ON quote_requests(email);
```

### Step 4: Configure Storage

Ensure you have the `attachments` storage bucket configured:

1. In Supabase Dashboard, go to **Storage**
2. Create a bucket named `attachments` (if not exists)
3. Make it public
4. Set file size limit to 50MB
5. Allow the following MIME types:
   - `application/octet-stream`
   - `model/stl`, `model/obj`
   - `image/*`
   - `application/pdf`

## Usage

### Accessing the Dashboard

After activation, you'll see a new **Forge** menu item in your WordPress admin sidebar.

#### Main Dashboard
Go to **Forge** → **Dashboard** to see:
- Total quotes
- Pending quotes requiring attention
- Quotes in processing
- Completed quotes
- Today/Week/Month statistics
- Revenue estimates
- Popular materials chart
- Recent quotes list

#### All Quotes
Go to **Forge** → **All Quotes** to:
- View all quotes in a table
- Search by customer name, email, or company
- Filter by status (Pending, Processing, etc.)
- Filter by material (PLA, PETG, etc.)
- Sort by date, customer, quantity, or status
- Perform bulk actions (delete, update status)
- Export to CSV

#### Quote Details
Click any quote ID to view:
- Customer information (name, email, phone, company)
- Order details (material, quantity, timeline, notes)
- Model information (file name, vertices, triangles, dimensions)
- Attached files with download/delete options
- Pricing breakdown
- Status management
- Actions (email customer, delete quote)

#### Settings
Go to **Forge** → **Settings** to:
- Configure Supabase credentials
- Set display preferences
- Test connection
- View plugin information

### Managing Quotes

#### Changing Quote Status

1. Open a quote from the list
2. In the sidebar, select a new status from the dropdown
3. Click **Update Status**
4. The page will reload with the updated status

Available statuses:
- **Pending** - New quote requiring review
- **Processing** - Currently being worked on
- **Quoted** - Quote sent to customer
- **Approved** - Customer approved the quote
- **In Production** - Being manufactured
- **Completed** - Finished and delivered
- **Cancelled** - Cancelled by customer or admin

#### Deleting Quotes

**From List View:**
1. Hover over a quote
2. Click **Delete** in the row actions
3. Confirm the deletion

**From Details View:**
1. Open the quote
2. Scroll to the Actions card
3. Click **Delete Quote**
4. Confirm the deletion

**Bulk Delete:**
1. Check multiple quotes in the list
2. Select "Delete" from the Bulk Actions dropdown
3. Click **Apply**
4. Confirm the deletion

⚠️ **Warning:** Deleting a quote also deletes associated files from Supabase Storage. This action cannot be undone.

#### Exporting Quotes

1. Go to **Forge** → **All Quotes**
2. Apply any filters you want (optional)
3. Click **Export CSV**
4. A CSV file will download with all quotes matching your filters

The CSV includes:
- Quote ID
- Date
- Customer Name
- Email
- Phone
- Company
- Material
- Quantity
- Timeline
- Status
- Total (EUR)

### Keyboard Shortcuts

- **Ctrl/Cmd + K** - Focus search box
- **Escape** - Clear search (when focused)

## Architecture

### Plugin Structure

```
forge-dashboard/
├── forge-dashboard.php          # Main plugin file
├── readme.txt                   # WordPress.org readme
├── README.md                    # This file
├── includes/                    # Core classes
│   ├── class-supabase-client.php
│   ├── class-quote-manager.php
│   ├── class-file-manager.php
│   └── class-settings.php
├── admin/                       # Admin interface
│   ├── class-admin-menu.php
│   ├── class-quote-list-table.php
│   └── views/
│       ├── dashboard.php
│       ├── quote-list.php
│       ├── quote-details.php
│       └── settings.php
└── assets/                      # Frontend assets
    ├── css/
    │   └── admin.css
    └── js/
        └── admin.js
```

### Key Classes

#### Forge_Supabase_Client
Handles all communication with Supabase REST API and Storage:
- GET, POST, PATCH, DELETE requests
- Storage file operations
- Response handling
- Error management

#### Forge_Quote_Manager
Manages quote-related operations:
- CRUD operations for quotes
- Filtering and searching
- Status updates
- Statistics calculation
- CSV export

#### Forge_File_Manager
Handles file operations:
- List files for quotes
- Download files
- Delete files
- File metadata

#### Forge_Admin_Menu
WordPress admin interface:
- Menu registration
- Page rendering
- Bulk actions
- AJAX handlers

#### Forge_Quote_List_Table
Extends WP_List_Table for quote display:
- Column definitions
- Sorting
- Filtering
- Pagination
- Bulk actions

## API Reference

### AJAX Endpoints

The plugin exposes the following AJAX endpoints:

#### Delete Quote
```javascript
jQuery.ajax({
    url: forgeAjax.ajaxUrl,
    type: 'POST',
    data: {
        action: 'forge_delete_quote',
        nonce: forgeAjax.nonce,
        quote_id: 'uuid-here'
    }
});
```

#### Update Status
```javascript
jQuery.ajax({
    url: forgeAjax.ajaxUrl,
    type: 'POST',
    data: {
        action: 'forge_update_status',
        nonce: forgeAjax.nonce,
        quote_id: 'uuid-here',
        status: 'processing'
    }
});
```

#### Delete File
```javascript
jQuery.ajax({
    url: forgeAjax.ajaxUrl,
    type: 'POST',
    data: {
        action: 'forge_delete_file',
        nonce: forgeAjax.nonce,
        file_path: 'quotes/HF-ABC123/file.stl'
    }
});
```

#### Get Statistics
```javascript
jQuery.ajax({
    url: forgeAjax.ajaxUrl,
    type: 'POST',
    data: {
        action: 'forge_get_stats',
        nonce: forgeAjax.nonce
    }
});
```

## Security

### Best Practices

1. **Use Service Role Key:** Never use the anon key for this plugin
2. **Keep Keys Secret:** Never commit your Supabase keys to version control
3. **Use HTTPS:** Always run WordPress over HTTPS
4. **Regular Backups:** Back up your WordPress database regularly
5. **Update Regularly:** Keep WordPress, PHP, and this plugin updated

### Permissions

The plugin requires the `manage_options` capability, which is only available to administrators by default.

## Troubleshooting

### Connection Failed

**Problem:** "Connection failed" error when testing Supabase connection.

**Solutions:**
1. Verify your Supabase URL is correct (no trailing slash)
2. Ensure you're using the service_role key, not anon key
3. Check that your Supabase project is active
4. Verify the `quote_requests` table exists
5. Check PHP error logs for detailed error messages

### No Quotes Showing

**Problem:** Dashboard shows 0 quotes even though data exists in Supabase.

**Solutions:**
1. Test your Supabase connection in Settings
2. Verify the table name is `quote_requests` (lowercase, underscore)
3. Check Supabase Row Level Security (RLS) policies
4. Ensure service role key has proper permissions

### Files Not Downloading

**Problem:** File download button doesn't work.

**Solutions:**
1. Verify the `attachments` bucket exists in Supabase Storage
2. Check that the bucket is public
3. Verify file paths are correct (format: `quotes/HF-ABC123/file.stl`)
4. Check file permissions in Supabase Storage

### Performance Issues

**Problem:** Dashboard or quote list loads slowly.

**Solutions:**
1. Increase PHP memory limit (256MB recommended)
2. Add database indexes (see Configuration section)
3. Reduce "Items Per Page" setting
4. Enable WordPress object caching
5. Consider upgrading your Supabase plan

## Development

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/0xAddict/Hexea---3D-Viewer.git
   cd Hexea---3D-Viewer/wordpress-plugin/forge-dashboard
   ```

2. Create a local WordPress installation
3. Symlink the plugin to your WordPress plugins directory:
   ```bash
   ln -s /path/to/forge-dashboard /path/to/wordpress/wp-content/plugins/
   ```

4. Set up a local Supabase project or use a development instance
5. Configure the plugin with your development credentials

### Coding Standards

This plugin follows [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/):
- PHP: WordPress PHP Coding Standards
- JavaScript: WordPress JavaScript Coding Standards
- CSS: WordPress CSS Coding Standards

### Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Changelog

### Version 1.0.0 (2025-11-24)

Initial release with the following features:
- Dashboard with statistics and insights
- Quote list with advanced filtering
- Quote details view
- Status management
- File management
- Bulk actions
- CSV export
- Supabase integration
- Settings page
- Responsive design
- Security features

## Support

For support, bug reports, or feature requests:
- GitHub Issues: https://github.com/0xAddict/Hexea---3D-Viewer/issues
- Documentation: See readme.txt

## License

This plugin is licensed under the MIT License. See LICENSE file for details.

## Credits

**Developed by:** Hexea Forge Team
**Repository:** https://github.com/0xAddict/Hexea---3D-Viewer
**Built for:** Hexea Forge 3D Printing Quote System

---

Made with ❤️ for the 3D printing community
