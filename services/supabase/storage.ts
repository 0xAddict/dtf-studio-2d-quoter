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
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${fileExt}`;

    // Construct the full path
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS[bucket])
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return {
        url: '',
        path: '',
        error: error.message,
      };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKETS[bucket])
      .getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  } catch (err) {
    console.error('Unexpected upload error:', err);
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
  const uploadPromises = files.map(file => uploadFile(file, bucket, folder));
  return Promise.all(uploadPromises);
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
