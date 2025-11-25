-- ============================================
-- Hexea Forge - Two-Table Quote System Migration
-- ============================================
-- This migration sets up a clean separation:
-- 1. quote_requests: Public submissions (insert-only for anon)
-- 2. quotes: User's quote history (user-scoped RLS)
-- ============================================

-- ============================================
-- PART 1: Update quote_requests table RLS
-- (Insert-only for public, full access for service_role)
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE quote_requests ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies on quote_requests
DROP POLICY IF EXISTS "Allow anonymous inserts" ON quote_requests;
DROP POLICY IF EXISTS "Service role has full access" ON quote_requests;
DROP POLICY IF EXISTS "Allow read own submissions" ON quote_requests;
DROP POLICY IF EXISTS "Users can view own quotes" ON quote_requests;
DROP POLICY IF EXISTS "Public insert quotes" ON quote_requests;

-- Policy 1: Anyone can INSERT (for quote form submissions)
CREATE POLICY "Public insert quotes" ON quote_requests
    FOR INSERT
    WITH CHECK (true);

-- Policy 2: Service role has full access (for WordPress admin/backend)
CREATE POLICY "Service role has full access" ON quote_requests
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- NOTE: No SELECT policy for regular users on quote_requests
-- Users will read from the 'quotes' table instead

-- ============================================
-- PART 2: Create/Update quotes table
-- (User-scoped RLS for authenticated users)
-- ============================================

-- Create quotes table if it doesn't exist
CREATE TABLE IF NOT EXISTS quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    quote_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Customer info (copied from quote_requests)
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    company TEXT,

    -- Model info
    model_id UUID,
    model_file_name TEXT,
    model_file_url TEXT,
    model_data JSONB,

    -- Quote details
    material TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    timeline TEXT,
    finishing TEXT,
    scale INTEGER DEFAULT 100,
    notes TEXT,

    -- Model stats
    vertices INTEGER,
    triangles INTEGER,
    dimensions JSONB,

    -- Pricing breakdown
    base_cost DECIMAL(10,2),
    material_cost DECIMAL(10,2),
    finishing_cost DECIMAL(10,2),
    quantity_discount DECIMAL(10,2),
    total_cost DECIMAL(10,2),

    -- Status
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected', 'cancelled')),
    admin_notes TEXT,

    -- Reference back to original request
    quote_request_id UUID REFERENCES quote_requests(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_id ON quotes(quote_id);
CREATE INDEX IF NOT EXISTS idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_request_id ON quotes(quote_request_id);

-- Enable RLS on quotes
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON quotes;
DROP POLICY IF EXISTS "Service role full access quotes" ON quotes;

-- Policy 1: Users can view their own quotes only
CREATE POLICY "Users can view own quotes" ON quotes
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own quotes (user_id must match)
CREATE POLICY "Users can insert own quotes" ON quotes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own quotes (for cancellations)
CREATE POLICY "Users can update own quotes" ON quotes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy 4: Service role has full access (for admin/sync operations)
CREATE POLICY "Service role full access quotes" ON quotes
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- PART 3: Create sync function and trigger
-- (Automatically copy quote_requests to quotes when user_id is set)
-- ============================================

-- Function to sync quote_request to quotes table
CREATE OR REPLACE FUNCTION sync_quote_request_to_quotes()
RETURNS TRIGGER AS $$
BEGIN
    -- Only sync if user_id is set (authenticated submission)
    IF NEW.user_id IS NOT NULL THEN
        -- Check if quote already exists in quotes table
        IF NOT EXISTS (SELECT 1 FROM quotes WHERE quote_request_id = NEW.id) THEN
            INSERT INTO quotes (
                user_id,
                quote_id,
                created_at,
                name,
                email,
                phone,
                company,
                model_id,
                model_file_name,
                model_file_url,
                model_data,
                material,
                quantity,
                timeline,
                finishing,
                scale,
                notes,
                vertices,
                triangles,
                dimensions,
                base_cost,
                material_cost,
                finishing_cost,
                quantity_discount,
                total_cost,
                status,
                admin_notes,
                quote_request_id
            ) VALUES (
                NEW.user_id,
                NEW.quote_id,
                NEW.created_at,
                NEW.name,
                NEW.email,
                NEW.phone,
                NEW.company,
                NEW.model_id,
                NEW.model_file_name,
                NEW.model_file_url,
                NEW.model_data,
                NEW.material,
                NEW.quantity,
                NEW.timeline,
                NEW.finishing,
                NEW.scale,
                NEW.notes,
                NEW.vertices,
                NEW.triangles,
                NEW.dimensions,
                NEW.base_cost,
                NEW.material_cost,
                NEW.finishing_cost,
                NEW.quantity_discount,
                NEW.total_cost,
                NEW.status,
                NEW.admin_notes,
                NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to sync status updates from quote_requests to quotes
CREATE OR REPLACE FUNCTION sync_quote_status_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync status and admin_notes changes to quotes table
    IF NEW.status IS DISTINCT FROM OLD.status OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
        UPDATE quotes
        SET
            status = NEW.status,
            admin_notes = NEW.admin_notes
        WHERE quote_request_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_sync_quote_request_insert ON quote_requests;
DROP TRIGGER IF EXISTS trigger_sync_quote_request_update ON quote_requests;
DROP TRIGGER IF EXISTS trigger_sync_quote_status ON quote_requests;

-- Trigger: Sync on INSERT (when a new quote_request is created with user_id)
CREATE TRIGGER trigger_sync_quote_request_insert
    AFTER INSERT ON quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION sync_quote_request_to_quotes();

-- Trigger: Sync on UPDATE (when user_id is added to existing request)
CREATE TRIGGER trigger_sync_quote_request_update
    AFTER UPDATE OF user_id ON quote_requests
    FOR EACH ROW
    WHEN (OLD.user_id IS NULL AND NEW.user_id IS NOT NULL)
    EXECUTE FUNCTION sync_quote_request_to_quotes();

-- Trigger: Sync status updates
CREATE TRIGGER trigger_sync_quote_status
    AFTER UPDATE OF status, admin_notes ON quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION sync_quote_status_update();

-- ============================================
-- PART 4: Migrate existing data
-- (Copy existing quote_requests with user_id to quotes)
-- ============================================

-- Insert existing quote_requests that have user_id into quotes
INSERT INTO quotes (
    user_id,
    quote_id,
    created_at,
    name,
    email,
    phone,
    company,
    model_id,
    model_file_name,
    model_file_url,
    model_data,
    material,
    quantity,
    timeline,
    finishing,
    scale,
    notes,
    vertices,
    triangles,
    dimensions,
    base_cost,
    material_cost,
    finishing_cost,
    quantity_discount,
    total_cost,
    status,
    admin_notes,
    quote_request_id
)
SELECT
    qr.user_id,
    qr.quote_id,
    qr.created_at,
    qr.name,
    qr.email,
    qr.phone,
    qr.company,
    qr.model_id,
    qr.model_file_name,
    qr.model_file_url,
    qr.model_data,
    qr.material,
    qr.quantity,
    qr.timeline,
    qr.finishing,
    qr.scale,
    qr.notes,
    qr.vertices,
    qr.triangles,
    qr.dimensions,
    qr.base_cost,
    qr.material_cost,
    qr.finishing_cost,
    qr.quantity_discount,
    qr.total_cost,
    qr.status,
    qr.admin_notes,
    qr.id
FROM quote_requests qr
WHERE qr.user_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM quotes q WHERE q.quote_request_id = qr.id
)
ON CONFLICT (quote_id) DO NOTHING;

-- ============================================
-- PART 5: Verification queries
-- ============================================

-- Check quote_requests policies
SELECT 'quote_requests policies:' as info;
SELECT policyname, cmd, permissive, roles
FROM pg_policies
WHERE tablename = 'quote_requests';

-- Check quotes policies
SELECT 'quotes policies:' as info;
SELECT policyname, cmd, permissive, roles
FROM pg_policies
WHERE tablename = 'quotes';

-- Check triggers
SELECT 'triggers on quote_requests:' as info;
SELECT trigger_name, event_manipulation, action_timing
FROM information_schema.triggers
WHERE event_object_table = 'quote_requests';

-- Count migrated data
SELECT 'data migration summary:' as info;
SELECT
    (SELECT COUNT(*) FROM quote_requests) as total_requests,
    (SELECT COUNT(*) FROM quote_requests WHERE user_id IS NOT NULL) as requests_with_user,
    (SELECT COUNT(*) FROM quotes) as quotes_synced;

-- ============================================
-- Setup Complete!
-- ============================================
--
-- Summary:
-- - quote_requests: INSERT only for public, full access for service_role
-- - quotes: User-scoped (SELECT/INSERT/UPDATE own records only)
-- - Auto-sync: Triggers copy data when user_id is present
-- - Status sync: Admin status updates propagate to quotes table
--
-- Data flow:
-- 1. User submits quote -> quote_requests (public insert)
-- 2. If user_id set -> trigger copies to quotes
-- 3. User dashboard reads from quotes (their own only)
-- 4. Admin updates status in quote_requests -> syncs to quotes
--
