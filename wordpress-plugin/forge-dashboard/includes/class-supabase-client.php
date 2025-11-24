<?php
/**
 * Supabase Client Class
 *
 * Handles all communication with Supabase REST API and Storage
 */

if (!defined('ABSPATH')) {
    exit;
}

class Forge_Supabase_Client {

    /**
     * Supabase URL
     */
    private $url;

    /**
     * Supabase service role key (use service key for admin operations)
     */
    private $key;

    /**
     * Storage buckets
     */
    const BUCKET_MODELS = 'models';
    const BUCKET_THUMBNAILS = 'thumbnails';
    const BUCKET_ATTACHMENTS = 'attachments';

    /**
     * Constructor
     */
    public function __construct() {
        $this->url = get_option('forge_supabase_url', '');
        $this->key = get_option('forge_supabase_key', '');
    }

    /**
     * Check if Supabase is configured
     */
    public function is_configured() {
        return !empty($this->url) && !empty($this->key);
    }

    /**
     * Make GET request to Supabase
     */
    public function get($endpoint, $params = array()) {
        if (!$this->is_configured()) {
            return array('error' => __('Supabase not configured', 'forge-dashboard'));
        }

        $url = $this->url . '/rest/v1/' . $endpoint;

        if (!empty($params)) {
            $url = add_query_arg($params, $url);
        }

        $response = wp_remote_get($url, array(
            'headers' => array(
                'apikey' => $this->key,
                'Authorization' => 'Bearer ' . $this->key,
                'Content-Type' => 'application/json'
            ),
            'timeout' => 30
        ));

        return $this->handle_response($response);
    }

    /**
     * Make POST request to Supabase
     */
    public function post($endpoint, $data = array()) {
        if (!$this->is_configured()) {
            return array('error' => __('Supabase not configured', 'forge-dashboard'));
        }

        $url = $this->url . '/rest/v1/' . $endpoint;

        $response = wp_remote_post($url, array(
            'headers' => array(
                'apikey' => $this->key,
                'Authorization' => 'Bearer ' . $this->key,
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation'
            ),
            'body' => json_encode($data),
            'timeout' => 30
        ));

        return $this->handle_response($response);
    }

    /**
     * Make PATCH request to Supabase
     */
    public function patch($endpoint, $data = array(), $filters = array()) {
        if (!$this->is_configured()) {
            return array('error' => __('Supabase not configured', 'forge-dashboard'));
        }

        $url = $this->url . '/rest/v1/' . $endpoint;

        if (!empty($filters)) {
            $url = add_query_arg($filters, $url);
        }

        $response = wp_remote_request($url, array(
            'method' => 'PATCH',
            'headers' => array(
                'apikey' => $this->key,
                'Authorization' => 'Bearer ' . $this->key,
                'Content-Type' => 'application/json',
                'Prefer' => 'return=representation'
            ),
            'body' => json_encode($data),
            'timeout' => 30
        ));

        return $this->handle_response($response);
    }

    /**
     * Make DELETE request to Supabase
     */
    public function delete($endpoint, $filters = array()) {
        if (!$this->is_configured()) {
            return array('error' => __('Supabase not configured', 'forge-dashboard'));
        }

        $url = $this->url . '/rest/v1/' . $endpoint;

        if (!empty($filters)) {
            $url = add_query_arg($filters, $url);
        }

        $response = wp_remote_request($url, array(
            'method' => 'DELETE',
            'headers' => array(
                'apikey' => $this->key,
                'Authorization' => 'Bearer ' . $this->key,
                'Content-Type' => 'application/json'
            ),
            'timeout' => 30
        ));

        return $this->handle_response($response);
    }

    /**
     * Get public URL for storage file
     */
    public function get_storage_url($bucket, $path) {
        if (!$this->is_configured()) {
            return '';
        }

        return $this->url . '/storage/v1/object/public/' . $bucket . '/' . $path;
    }

    /**
     * Delete file from storage
     */
    public function delete_storage_file($bucket, $path) {
        if (!$this->is_configured()) {
            return array('error' => __('Supabase not configured', 'forge-dashboard'));
        }

        $url = $this->url . '/storage/v1/object/' . $bucket . '/' . $path;

        $response = wp_remote_request($url, array(
            'method' => 'DELETE',
            'headers' => array(
                'apikey' => $this->key,
                'Authorization' => 'Bearer ' . $this->key
            ),
            'timeout' => 30
        ));

        return $this->handle_response($response);
    }

    /**
     * List files in storage bucket
     */
    public function list_storage_files($bucket, $folder = '') {
        if (!$this->is_configured()) {
            return array('error' => __('Supabase not configured', 'forge-dashboard'));
        }

        $url = $this->url . '/storage/v1/object/list/' . $bucket;

        if (!empty($folder)) {
            $url = add_query_arg(array('prefix' => $folder), $url);
        }

        $response = wp_remote_post($url, array(
            'headers' => array(
                'apikey' => $this->key,
                'Authorization' => 'Bearer ' . $this->key,
                'Content-Type' => 'application/json'
            ),
            'body' => json_encode(array()),
            'timeout' => 30
        ));

        return $this->handle_response($response);
    }

    /**
     * Get count of rows matching query
     */
    public function count($endpoint, $filters = array()) {
        if (!$this->is_configured()) {
            return 0;
        }

        $url = $this->url . '/rest/v1/' . $endpoint;

        if (!empty($filters)) {
            $url = add_query_arg($filters, $url);
        }

        $response = wp_remote_head($url, array(
            'headers' => array(
                'apikey' => $this->key,
                'Authorization' => 'Bearer ' . $this->key,
                'Prefer' => 'count=exact'
            ),
            'timeout' => 30
        ));

        if (is_wp_error($response)) {
            return 0;
        }

        $headers = wp_remote_retrieve_headers($response);
        $count_range = isset($headers['content-range']) ? $headers['content-range'] : '';

        if (empty($count_range)) {
            return 0;
        }

        // Parse content-range header: "0-9/100"
        preg_match('/\/(\d+)/', $count_range, $matches);
        return isset($matches[1]) ? intval($matches[1]) : 0;
    }

    /**
     * Handle API response
     */
    private function handle_response($response) {
        if (is_wp_error($response)) {
            return array(
                'success' => false,
                'error' => $response->get_error_message()
            );
        }

        $code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);

        // Success codes: 200, 201, 204
        if ($code >= 200 && $code < 300) {
            $data = json_decode($body, true);

            return array(
                'success' => true,
                'data' => $data !== null ? $data : array(),
                'code' => $code
            );
        }

        // Error response
        $error_data = json_decode($body, true);
        $error_message = isset($error_data['message']) ? $error_data['message'] : __('Unknown error', 'forge-dashboard');

        return array(
            'success' => false,
            'error' => $error_message,
            'code' => $code
        );
    }

    /**
     * Build filter string for Supabase query
     *
     * @param string $field Field name
     * @param string $operator Operator (eq, neq, gt, gte, lt, lte, like, ilike, is, in)
     * @param mixed $value Value
     * @return array
     */
    public function build_filter($field, $operator, $value) {
        if (is_array($value)) {
            $value = '(' . implode(',', $value) . ')';
        }

        return array($field => $operator . '.' . $value);
    }

    /**
     * Test connection to Supabase
     */
    public function test_connection() {
        if (!$this->is_configured()) {
            return array(
                'success' => false,
                'message' => __('Supabase credentials not configured', 'forge-dashboard')
            );
        }

        $result = $this->get('quote_requests', array('limit' => 1));

        if (isset($result['success']) && $result['success']) {
            return array(
                'success' => true,
                'message' => __('Successfully connected to Supabase', 'forge-dashboard')
            );
        }

        return array(
            'success' => false,
            'message' => isset($result['error']) ? $result['error'] : __('Connection failed', 'forge-dashboard')
        );
    }
}
