# Model File Upload Flow - Documentation

## Overview
When a user requests a quote, their 3D model file is automatically uploaded to Supabase storage and the download link is included in the quote email.

## Upload Flow

### 1. **User Uploads Model**
- User uploads STL, FBX, or OBJ file in the ModelViewer
- File is stored in `currentFile` state (components/ModelViewer.tsx:58)
- File metadata is analyzed and stored in `modelStats`

### 2. **User Opens Quote Modal**
- Click "Request Quote" button
- `QuoteRequestModal` receives `modelFile` prop
- User fills out quote form (name, email, material, quantity, etc.)

### 3. **Quote Submission Process**
When user clicks "Send Quote Request":

#### a. Generate Quote ID
```typescript
const quote = generateQuote();
// Example: HF-L9X8K2M4
```

#### b. Upload Model to Supabase
```typescript
const uploadResults = await uploadMultipleFiles(
  [modelFile],
  'ATTACHMENTS',
  `quotes/${quote.quoteId}`
);
```

**Upload Details:**
- **Bucket**: `attachments` (public bucket)
- **Path**: `quotes/{quoteId}/{timestamp}-{random}.{ext}`
- **Example**: `quotes/HF-L9X8K2M4/1234567890-abc123def.stl`
- **Max Size**: 50MB
- **Allowed Types**: STL, FBX, OBJ, images, PDFs, documents

#### c. Generate Public URL
The uploaded file gets a public URL like:
```
https://jqfudagohdkdtnplgtob.supabase.co/storage/v1/object/public/attachments/quotes/HF-L9X8K2M4/1234567890-abc123def.stl
```

#### d. Include in Email
The URL is added to the Web3Forms submission:
```typescript
{
  model_info: "Model Details: ... \n\nModel File:\n{URL}",
  attachments: "{URL}"
}
```

### 4. **Email Received**
The quote email contains:
- Customer information
- Model specifications (vertices, triangles, dimensions)
- Selected material and finishing
- Pricing breakdown
- **Clickable link to download the model file**

## Error Handling

### Upload Failure
- If upload fails, error is logged to console
- Quote submission continues (user still gets quote without file link)
- Console warning shows the error details

### No Model File
- If no file is available, warning is logged
- Quote proceeds without attachment
- Email won't include model file link

## Console Logging

Monitor the upload process:
```javascript
// Success
✓ "Model file uploaded successfully: https://..."

// Failure
⚠ "Model file upload failed: [error details]"

// No file
⚠ "No model file to upload with quote"
```

## Storage Configuration

The `attachments` bucket is configured to accept:
- **MIME Types**:
  - `application/octet-stream` (STL, FBX, OBJ)
  - `model/stl`, `model/obj`
  - Images, PDFs, documents
- **File Size**: 50MB limit
- **Access**: Public (anyone with URL can download)
- **Policies**: Public upload and read

## File Storage Structure

```
attachments/
└── quotes/
    ├── HF-ABC123/
    │   └── 1234567890-xyz789.stl
    ├── HF-DEF456/
    │   └── 1234567891-abc123.fbx
    └── HF-GHI789/
        └── 1234567892-def456.obj
```

## Security Notes

1. **Public Bucket**: Files are publicly accessible via URL
2. **Random Filenames**: Prevents filename conflicts and makes URLs harder to guess
3. **Organized by Quote**: Easy to find files related to specific quotes
4. **No Authentication Required**: Users don't need Supabase accounts to upload

## Troubleshooting

### Upload Not Working?

1. **Check Supabase Configuration**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'attachments';
   ```
   Ensure bucket exists and is public.

2. **Check Console Logs**
   Open browser DevTools → Console tab
   Look for upload success/failure messages

3. **Verify MIME Types**
   Ensure your model file type is in the allowed list

4. **Check File Size**
   Files over 50MB will fail to upload

5. **Verify Storage Policies**
   Bucket must allow public INSERT and SELECT

## Implementation Files

- **Upload Logic**: `services/supabase/storage.ts`
- **Quote Modal**: `components/QuoteRequestModal.tsx:464-495`
- **Model Storage**: `components/ModelViewer.tsx:58`
- **Bucket Config**: `services/supabase/client.ts:27-31`
- **SQL Setup**: `supabase-storage-setup.sql`
