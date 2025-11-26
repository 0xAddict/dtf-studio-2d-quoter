import { supabase, STORAGE_BUCKETS } from './client';

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

/**
 * Upload a file to Supabase storage bucket
 * @param file - The file to upload
 * @param bucket - The bucket name (defaults to ATTACHMENTS)
 * @param folder - Optional folder path within the bucket
 * @returns Promise with the public URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: keyof typeof STORAGE_BUCKETS = 'ATTACHMENTS',
  folder?: string
): Promise<UploadResult> {
  const bucketName = STORAGE_BUCKETS[bucket];

  console.log(`📤 [Storage] Starting upload:`, {
    fileName: file.name,
    fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    bucket: bucketName,
    folder: folder || 'root'
  });

  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;

    // Construct the full path
    const filePath = folder ? `${folder}/${fileName}` : fileName;
    console.log(`📂 [Storage] Upload path: ${filePath}`);

    // Upload file directly - no bucket check, no timeout wrapper
    console.log(`⏱️ [Storage] Uploading to '${bucketName}'...`);
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ [Storage] Upload error:', error);
      return {
        url: '',
        path: '',
        error: error.message,
      };
    }

    console.log(`✅ [Storage] File uploaded successfully to: ${data.path}`);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    console.log(`✅ [Storage] Public URL: ${publicUrl}`);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error('❌ [Storage] Unexpected error:', err);
    return {
      url: '',
      path: '',
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

/**
 * Upload multiple files to Supabase storage
 * @param files - Array of files to upload
 * @param bucket - The bucket name (defaults to ATTACHMENTS)
 * @param folder - Optional folder path within the bucket
 * @returns Promise with array of upload results
 */
export async function uploadMultipleFiles(
  files: File[],
  bucket: keyof typeof STORAGE_BUCKETS = 'ATTACHMENTS',
  folder?: string
): Promise<UploadResult[]> {
  console.log(`📤 [Storage] Uploading ${files.length} file(s)...`);

  const uploadPromises = files.map((file, index) => {
    console.log(`📄 [Storage] File ${index + 1}/${files.length}: ${file.name}`);
    return uploadFile(file, bucket, folder);
  });

  const results = await Promise.all(uploadPromises);

  const successCount = results.filter(r => !r.error).length;
  const failCount = results.filter(r => r.error).length;

  console.log(`✅ [Storage] Upload complete: ${successCount} succeeded, ${failCount} failed`);

  return results;
}

/**
 * Delete a file from Supabase storage
 * @param path - The file path in storage
 * @param bucket - The bucket name (defaults to ATTACHMENTS)
 */
export async function deleteFile(
  path: string,
  bucket: keyof typeof STORAGE_BUCKETS = 'ATTACHMENTS'
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS[bucket])
      .remove([path]);

    if (error) {
      console.error('Delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected delete error:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}
