<?php
/**
 * File Manager Class
 *
 * Handles Supabase Storage operations for quote attachments
 */

if (!defined('ABSPATH')) {
    exit;
}

class Forge_File_Manager {

    /**
     * Supabase client
     */
    private $supabase;

    /**
     * Constructor
     */
    public function __construct($supabase) {
        $this->supabase = $supabase;
    }

    /**
     * Get files for a quote
     */
    public function get_quote_files($quote_id) {
        $folder = 'quotes/' . $quote_id;

        $result = $this->supabase->list_storage_files(
            Forge_Supabase_Client::BUCKET_ATTACHMENTS,
            $folder
        );

        if (!isset($result['success']) || !$result['success']) {
            return array(
                'success' => false,
                'error' => isset($result['error']) ? $result['error'] : __('Failed to list files', 'forge-dashboard')
            );
        }

        $files = array();

        if (isset($result['data']) && is_array($result['data'])) {
            foreach ($result['data'] as $file) {
                if (isset($file['name']) && !empty($file['name'])) {
                    $path = $folder . '/' . $file['name'];

                    $files[] = array(
                        'name' => $file['name'],
                        'path' => $path,
                        'size' => isset($file['metadata']['size']) ? $file['metadata']['size'] : 0,
                        'created_at' => isset($file['created_at']) ? $file['created_at'] : '',
                        'url' => $this->supabase->get_storage_url(
                            Forge_Supabase_Client::BUCKET_ATTACHMENTS,
                            $path
                        )
                    );
                }
            }
        }

        return array(
            'success' => true,
            'files' => $files
        );
    }

    /**
     * Delete a single file
     */
    public function delete_file($path) {
        $result = $this->supabase->delete_storage_file(
            Forge_Supabase_Client::BUCKET_ATTACHMENTS,
            $path
        );

        if (!isset($result['success']) || !$result['success']) {
            return array(
                'success' => false,
                'error' => isset($result['error']) ? $result['error'] : __('Failed to delete file', 'forge-dashboard')
            );
        }

        return array('success' => true);
    }

    /**
     * Delete all files for a quote
     */
    public function delete_quote_files($quote_id) {
        $files_result = $this->get_quote_files($quote_id);

        if (!$files_result['success']) {
            return $files_result;
        }

        $deleted = 0;
        $errors = array();

        foreach ($files_result['files'] as $file) {
            $result = $this->delete_file($file['path']);

            if ($result['success']) {
                $deleted++;
            } else {
                $errors[] = $file['name'] . ': ' . $result['error'];
            }
        }

        if (!empty($errors)) {
            return array(
                'success' => false,
                'error' => implode(', ', $errors),
                'deleted' => $deleted
            );
        }

        return array(
            'success' => true,
            'deleted' => $deleted
        );
    }

    /**
     * Get file info
     */
    public function get_file_info($path) {
        $url = $this->supabase->get_storage_url(
            Forge_Supabase_Client::BUCKET_ATTACHMENTS,
            $path
        );

        // Get file extension
        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        // Determine file type
        $type = 'unknown';
        $mime = 'application/octet-stream';

        if (in_array($ext, array('stl', 'obj', 'fbx', '3ds', 'ply'))) {
            $type = '3d-model';
            $mime = 'application/octet-stream';
        } elseif (in_array($ext, array('jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'))) {
            $type = 'image';
            $mime = 'image/' . $ext;
        } elseif ($ext === 'pdf') {
            $type = 'document';
            $mime = 'application/pdf';
        }

        return array(
            'path' => $path,
            'url' => $url,
            'extension' => $ext,
            'type' => $type,
            'mime' => $mime,
            'name' => basename($path)
        );
    }

    /**
     * Format file size
     */
    public function format_file_size($bytes) {
        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        } elseif ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        } elseif ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        } elseif ($bytes > 1) {
            return $bytes . ' bytes';
        } elseif ($bytes == 1) {
            return $bytes . ' byte';
        } else {
            return '0 bytes';
        }
    }

    /**
     * Get all quote folders
     */
    public function get_all_quote_folders() {
        $result = $this->supabase->list_storage_files(
            Forge_Supabase_Client::BUCKET_ATTACHMENTS,
            'quotes/'
        );

        if (!isset($result['success']) || !$result['success']) {
            return array();
        }

        $folders = array();

        if (isset($result['data']) && is_array($result['data'])) {
            foreach ($result['data'] as $item) {
                if (isset($item['name']) && strpos($item['name'], '/') !== false) {
                    $parts = explode('/', $item['name']);
                    $folder = $parts[0];

                    if (!in_array($folder, $folders)) {
                        $folders[] = $folder;
                    }
                }
            }
        }

        return $folders;
    }

    /**
     * Download file from Supabase
     */
    public function download_file($path, $filename = '') {
        $url = $this->supabase->get_storage_url(
            Forge_Supabase_Client::BUCKET_ATTACHMENTS,
            $path
        );

        if (empty($filename)) {
            $filename = basename($path);
        }

        // Fetch file content
        $response = wp_remote_get($url, array('timeout' => 60));

        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'error' => $response->get_error_message()
            );
        }

        $content = wp_remote_retrieve_body($response);
        $content_type = wp_remote_retrieve_header($response, 'content-type');

        // Set headers for download
        header('Content-Type: ' . $content_type);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen($content));

        echo $content;
        exit;
    }
}
