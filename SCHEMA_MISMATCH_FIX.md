# 🚨 CRITICAL: Schema Mismatch - Complete Fix Required

## The Problem

The code was written expecting a **compressed schema** with a JSONB `model_data` column, but the actual database uses a **flattened schema** with individual columns for each field.

---

## Actual Database Schema

```sql
CREATE TABLE quote_request (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id TEXT NOT NULL UNIQUE,

  -- Customer info (prefixed with customer_)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_company TEXT,

  -- Model info (individual columns, not JSON)
  model_file_name TEXT NOT NULL,
  model_file_url TEXT,

  -- Quote details (top-level, not in JSON)
  material TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  timeline TEXT NOT NULL,
  finishing TEXT NOT NULL,
  scale INTEGER DEFAULT 100,
  message TEXT,

  -- Model geometry
  vertices INTEGER,
  triangles INTEGER,
  dimensions JSONB,

  -- Pricing (individual columns, not JSON)
  base_cost NUMERIC,
  material_cost NUMERIC,
  finishing_cost NUMERIC,
  quantity_discount NUMERIC,
  total_cost NUMERIC,

  -- Status
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID,
  admin_notes TEXT
);
```

---

## What Code Currently Sends

```javascript
{
  name: "John Doe",              // ❌ Should be: customer_name
  email: "john@example.com",     // ❌ Should be: customer_email
  phone: "+1234567890",          // ❌ Should be: customer_phone
  company: "Acme Inc",           // ❌ Should be: customer_company
  quantity: 5,                   // ✅ Correct
  material: "PLA - Affordable",  // ✅ Correct
  timeline: "Normal",            // ✅ Correct
  notes: "Message here",         // ❌ Should be: message
  model_data: JSON.stringify({   // ❌ Column doesn't exist!
    quoteId: "HF-123",           // ❌ Should be: quote_id (top-level)
    fileName: "model.stl",       // ❌ Should be: model_file_name (top-level)
    finishing: "Smooth",         // ❌ Should be: finishing (top-level)
    scale: 100,                  // ❌ Should be: scale (top-level)
    vertices: 1234,              // ❌ Should be: vertices (top-level)
    triangles: 5678,             // ❌ Should be: triangles (top-level)
    dimensions: {...},           // ❌ Should be: dimensions (top-level JSONB)
    pricing: {                   // ❌ Should be flattened:
      baseCost: 50,              //    -> base_cost
      materialCost: 75,          //    -> material_cost
      finishingCost: 15,         //    -> finishing_cost
      quantityDiscount: 10,      //    -> quantity_discount
      total: 130                 //    -> total_cost
    },
    attachmentUrl: "https://..." // ❌ Should be: model_file_url
  })
}
```

---

## Required Changes

### 1. React App (components/QuoteRequestModal.tsx)

**Current code around line 552:**
```typescript
const quoteData = {
  name: formData.name,
  email: formData.email,
  phone: formData.phone || null,
  company: formData.company || null,
  quantity: parseInt(formData.quantity),
  material: modelData?.material ? materialNames[modelData.material] || modelData.material : 'Not specified',
  timeline: formData.timeline || null,
  notes: formData.message || null,
  model_data: JSON.stringify({ ... })
};
```

**Should be:**
```typescript
const quoteData = {
  quote_id: quote.quoteId,
  customer_name: formData.name,
  customer_email: formData.email,
  customer_phone: formData.phone || null,
  customer_company: formData.company || null,
  quantity: parseInt(formData.quantity),
  material: modelData?.material ? materialNames[modelData.material] || modelData.material : 'Not specified',
  timeline: formData.timeline || 'Normal (1-2 weeks)',
  finishing: formData.finishing || 'Standard',
  scale: modelData?.scale || 100,
  message: formData.message || null,
  model_file_name: modelData?.fileName || 'unknown',
  model_file_url: attachmentUrls[0] || null,
  vertices: modelData?.vertices || null,
  triangles: modelData?.triangles || null,
  dimensions: modelData?.dimensions || null,
  base_cost: quote.pricing?.baseCost || null,
  material_cost: quote.pricing?.materialCost || null,
  finishing_cost: quote.pricing?.finishingCost || null,
  quantity_discount: quote.pricing?.quantityDiscount || null,
  total_cost: quote.pricing?.total || null,
};
```

---

### 2. TypeScript Types (services/supabase/types.ts)

**Replace entire `quote_request` definition:**
```typescript
quote_request: {
  Row: {
    id: string;
    quote_id: string;
    created_at: string | null;
    user_id: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone: string | null;
    customer_company: string | null;
    model_file_name: string;
    model_file_url: string | null;
    material: string;
    quantity: number;
    timeline: string;
    finishing: string;
    scale: number | null;
    message: string | null;
    vertices: number | null;
    triangles: number | null;
    dimensions: Json | null;
    base_cost: number | null;
    material_cost: number | null;
    finishing_cost: number | null;
    quantity_discount: number | null;
    total_cost: number | null;
    status: string | null;
    admin_notes: string | null;
  };
  Insert: {
    id?: string;
    quote_id: string;
    created_at?: string | null;
    user_id?: string | null;
    customer_name: string;
    customer_email: string;
    customer_phone?: string | null;
    customer_company?: string | null;
    model_file_name: string;
    model_file_url?: string | null;
    material: string;
    quantity: number;
    timeline: string;
    finishing: string;
    scale?: number | null;
    message?: string | null;
    vertices?: number | null;
    triangles?: number | null;
    dimensions?: Json | null;
    base_cost?: number | null;
    material_cost?: number | null;
    finishing_cost?: number | null;
    quantity_discount?: number | null;
    total_cost?: number | null;
    status?: string | null;
    admin_notes?: string | null;
  };
  Update: {
    status?: string;
    admin_notes?: string | null;
    // Allow updating any field for admin
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string | null;
    customer_company?: string | null;
    message?: string | null;
    total_cost?: number | null;
  };
};
```

---

### 3. WordPress Plugin (class-quote-manager.php)

**Update all references:**
- Change `name` → `customer_name`
- Change `email` → `customer_email`
- Change `phone` → `customer_phone`
- Change `company` → `customer_company`
- Change `notes` → `message`
- Remove `model_data` parsing
- Read pricing from individual columns
- Read file info from `model_file_name` and `model_file_url`
- Add `quote_id` handling
- Add `finishing` and `scale` handling

**Update query filters:**
```php
// Search in customer name/email instead of name/email
$params['or'] = "(customer_name.ilike.*{$search}*,customer_email.ilike.*{$search}*,customer_company.ilike.*{$search}*)";
```

**Update dashboard views to read from correct columns**

---

### 4. Update Supabase Setup SQL

The existing supabase-setup.sql is completely wrong. Need to either:
- **Option A**: Update it to match actual database (recommended for new installs)
- **Option B**: Keep actual database as-is and just update code (recommended for existing data)

**Option B is recommended** since you already have this schema in production.

---

## Migration Steps

### Step 1: Update TypeScript Types ✅
```bash
# Edit services/supabase/types.ts with new schema
```

### Step 2: Update React App
```bash
# Edit components/QuoteRequestModal.tsx
# Update the quoteData object structure
```

### Step 3: Update WordPress Plugin
```bash
# Edit wordpress-plugin/forge-dashboard/includes/class-quote-manager.php
# Edit wordpress-plugin/forge-dashboard/admin/views/quote-details.php
# Edit wordpress-plugin/forge-dashboard/admin/class-quote-list-table.php
```

### Step 4: Update Documentation
```bash
# Update SCHEMA_COMPARISON.md
# Update supabase-setup.sql to match actual schema
```

### Step 5: Test End-to-End
```bash
# Submit quote from React app
# Verify it appears in Supabase
# Verify it appears in WordPress dashboard
```

---

## Priority Tasks

1. ✅ Document the mismatch (this file)
2. ⏳ Update TypeScript types to match actual schema
3. ⏳ Update React app to send correct column names
4. ⏳ Update WordPress plugin to read correct columns
5. ⏳ Test quote submission
6. ⏳ Update all documentation

---

## Notes

- The database schema makes sense - it's normalized and queryable
- The flattened structure is actually better for WordPress queries
- The code was written for a different schema design
- This is why quotes weren't saving - column names didn't match!

