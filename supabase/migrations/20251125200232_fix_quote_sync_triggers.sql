/*
  # Fix Quote Sync Triggers

  This migration fixes the missing triggers that sync quote_requests to quotes table.
  
  ## Problem
  - Triggers were defined in SQL file but never applied to database
  - Quote submissions were stuck because sync wasn't happening
  
  ## Changes
  1. Creates sync function to copy quote_requests to quotes (for authenticated users)
  2. Creates trigger on INSERT for immediate sync
  3. Creates trigger on UPDATE for delayed user_id assignment
  4. Creates trigger for status updates sync
  
  ## Security
  - Functions use SECURITY DEFINER to bypass RLS during sync
  - Only syncs when user_id is NOT NULL (authenticated users)
  - Maintains RLS policies on both tables
*/

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_sync_quote_request_insert ON quote_requests;
DROP TRIGGER IF EXISTS trigger_sync_quote_request_update ON quote_requests;
DROP TRIGGER IF EXISTS trigger_sync_quote_status ON quote_requests;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS sync_quote_request_to_quotes();
DROP FUNCTION IF EXISTS sync_quote_status_update();

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
                customer_name,
                customer_email,
                customer_phone,
                customer_company,
                model_file_name,
                model_file_url,
                material,
                quantity,
                timeline,
                finishing,
                scale,
                message,
                vertices,
                triangles,
                dimensions,
                base_cost,
                material_cost,
                finishing_cost,
                quantity_discount,
                total_cost,
                status,
                admin_notes
            ) VALUES (
                NEW.user_id,
                NEW.quote_id,
                NEW.created_at,
                NEW.name,
                NEW.email,
                NEW.phone,
                NEW.company,
                NEW.model_file_name,
                NEW.model_file_url,
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
                NEW.admin_notes
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
        WHERE quote_id = NEW.quote_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Migrate any existing quote_requests with user_id that aren't in quotes yet
INSERT INTO quotes (
    user_id,
    quote_id,
    created_at,
    customer_name,
    customer_email,
    customer_phone,
    customer_company,
    model_file_name,
    model_file_url,
    material,
    quantity,
    timeline,
    finishing,
    scale,
    message,
    vertices,
    triangles,
    dimensions,
    base_cost,
    material_cost,
    finishing_cost,
    quantity_discount,
    total_cost,
    status,
    admin_notes
)
SELECT
    qr.user_id,
    qr.quote_id,
    qr.created_at,
    qr.name,
    qr.email,
    qr.phone,
    qr.company,
    qr.model_file_name,
    qr.model_file_url,
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
    qr.admin_notes
FROM quote_requests qr
WHERE qr.user_id IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM quotes q WHERE q.quote_id = qr.quote_id
)
ON CONFLICT (quote_id) DO NOTHING;