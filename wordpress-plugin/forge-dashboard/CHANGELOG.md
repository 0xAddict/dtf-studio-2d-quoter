# Changelog

All notable changes to the Forge Dashboard WordPress Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.1] - 2025-11-26

### Fixed
- TypeScript types file now correctly references `quote_request` (singular) table name
- Fixed inconsistency where `services/supabase/types.ts` used `quote_requests` (plural) but all other code used `quote_request` (singular)
- Updated QuoteRequest and QuoteRequestInsert type exports to match actual table name

### Documentation
- Added SCHEMA_COMPARISON.md to document expected database schema, WordPress plugin expectations, and React app data structure
- Added comprehensive schema verification tools (verify-schema.sql and verify-schema.js)

## [1.1.0] - 2025-11-24

### Changed
- **BREAKING:** Changed database table name from `quote_requests` (plural) to `quote_request` (singular)
  - You must rename your Supabase table or update your database schema
  - SQL migration: `ALTER TABLE quote_requests RENAME TO quote_request;`
- Updated all references throughout the plugin to use `quote_request`

### Added
- Prominent 3D model download links in quote list table
- Download Model and View in Browser buttons in quote details page
- Direct access to model files from row actions in quotes list
- Better visual indication with download icons

### Fixed
- JavaScript error "forgeAjax is not defined" on quote details page
- Email Customer button now opens default email client with pre-filled subject
- Layout width limited to 1400px for better readability on large screens
- Scripts and styles now load on all Forge admin pages

### Improved
- Quote management UX with quick access to model files
- Dashboard layout centered on wide screens
- Model file accessibility throughout admin interface

---

## [1.0.0] - 2025-11-24

### Added
- Initial release of Forge Dashboard plugin
- Comprehensive dashboard with real-time statistics
- Quote management with CRUD operations
- Advanced filtering and search functionality
- Bulk actions (delete, status updates)
- CSV export for reporting
- Supabase integration for database and storage
- File management for 3D model attachments
- Status tracking through 7 workflow stages
- Settings page for Supabase configuration
- Connection testing functionality
- Responsive design for all screen sizes
- Security features (nonces, capability checks, sanitization)

### Security
- Row Level Security (RLS) support
- Admin-only access with manage_options capability
- Nonce verification for all AJAX requests
- Input sanitization and validation
- Service role key for admin operations

---

## Version Guidelines

### Semantic Versioning

We use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., database schema changes, API changes)
- **MINOR**: New features, non-breaking enhancements
- **PATCH**: Bug fixes, minor improvements

### Release Types

- **Breaking Changes**: Require user action (database migration, configuration changes)
- **Features**: New capabilities added
- **Improvements**: Enhancements to existing features
- **Fixes**: Bug fixes and corrections
- **Security**: Security-related updates

---

## Upgrade Notes

### Upgrading to 1.1.0 from 1.0.0

**IMPORTANT:** This version changes the database table name from `quote_requests` to `quote_request`.

#### Step 1: Backup Your Data
```sql
-- Create backup
CREATE TABLE quote_requests_backup AS SELECT * FROM quote_requests;
```

#### Step 2: Rename the Table
```sql
-- Rename table in Supabase
ALTER TABLE quote_requests RENAME TO quote_request;
```

#### Step 3: Update Indexes
```sql
-- Verify indexes are still present
SELECT indexname FROM pg_indexes WHERE tablename = 'quote_request';
```

#### Step 4: Update RLS Policies
```sql
-- Check and update policies
SELECT policyname FROM pg_policies WHERE tablename = 'quote_request';

-- If policies are missing, recreate them:
DROP POLICY IF EXISTS "Allow anonymous inserts" ON quote_request;
DROP POLICY IF EXISTS "Service role has full access" ON quote_request;
DROP POLICY IF EXISTS "Allow public reads" ON quote_request;

CREATE POLICY "Allow anonymous inserts" ON quote_request
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role has full access" ON quote_request
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow public reads" ON quote_request
    FOR SELECT USING (true);
```

#### Step 5: Update React App

If you're using the React 3D viewer app, update the table name in your code:
```typescript
// In services/supabase/hooks.ts or wherever you reference the table
// Change from:
.from('quote_requests')

// To:
.from('quote_request')
```

#### Step 6: Test Everything
1. Test WordPress dashboard connection
2. Submit a test quote from React app
3. Verify quote appears in WordPress dashboard
4. Test status updates
5. Test file downloads

---

## Support

For issues, questions, or feature requests:
- GitHub: https://github.com/0xAddict/Hexea---3D-Viewer/issues
- Documentation: See README.md

---

## License

MIT License - See LICENSE file for details
