<?php
/**
 * Quote Manager Class
 *
 * Handles all quote-related operations (CRUD, filtering, statistics)
 */

if (!defined('ABSPATH')) {
    exit;
}

class Forge_Quote_Manager {

    /**
     * Supabase client
     */
    private $supabase;

    /**
     * Valid statuses
     */
    const VALID_STATUSES = array(
        'pending' => 'Pending',
        'processing' => 'Processing',
        'quoted' => 'Quoted',
        'approved' => 'Approved',
        'in_production' => 'In Production',
        'completed' => 'Completed',
        'cancelled' => 'Cancelled'
    );

    /**
     * Material prices (EUR)
     */
    const MATERIAL_PRICES = array(
        'PLA' => 15,
        'PETG' => 20,
        'ASA' => 25,
        'TPU' => 30,
        'Resin Standard' => 35,
        'Resin Clear' => 40,
        'Nylon + Carbon' => 45
    );

    /**
     * Constructor
     */
    public function __construct($supabase) {
        $this->supabase = $supabase;
    }

    /**
     * Get quotes with filtering, sorting, and pagination
     */
    public function get_quotes($args = array()) {
        $defaults = array(
            'limit' => 20,
            'offset' => 0,
            'order' => 'created_at.desc',
            'status' => '',
            'search' => '',
            'date_from' => '',
            'date_to' => '',
            'material' => ''
        );

        $args = wp_parse_args($args, $defaults);

        // Build query parameters
        $params = array(
            'select' => '*',
            'order' => $args['order'],
            'limit' => $args['limit'],
            'offset' => $args['offset']
        );

        // Add status filter
        if (!empty($args['status'])) {
            $params['status'] = 'eq.' . $args['status'];
        }

        // Add material filter
        if (!empty($args['material'])) {
            $params['material'] = 'eq.' . $args['material'];
        }

        // Add date range filter
        if (!empty($args['date_from'])) {
            $params['created_at'] = 'gte.' . $args['date_from'];
        }

        if (!empty($args['date_to'])) {
            $params['created_at'] = 'lte.' . $args['date_to'];
        }

        // Add search filter (search in customer_name, customer_email, customer_company)
        if (!empty($args['search'])) {
            $search = sanitize_text_field($args['search']);
            // Note: Supabase doesn't support OR queries in query params easily
            // We'll fetch all matching records and filter in PHP
            // For production, consider using Supabase RPC function
            $params['or'] = "(customer_name.ilike.*{$search}*,customer_email.ilike.*{$search}*,customer_company.ilike.*{$search}*)";
        }

        $result = $this->supabase->get('quote_request', $params);

        if (!isset($result['success']) || !$result['success']) {
            return array(
                'success' => false,
                'error' => isset($result['error']) ? $result['error'] : __('Failed to fetch quotes', 'forge-dashboard')
            );
        }

        return array(
            'success' => true,
            'quotes' => $result['data']
        );
    }

    /**
     * Get single quote by ID
     */
    public function get_quote($id) {
        $params = array(
            'select' => '*',
            'id' => 'eq.' . $id,
            'limit' => 1
        );

        $result = $this->supabase->get('quote_request', $params);

        if (!isset($result['success']) || !$result['success']) {
            return array(
                'success' => false,
                'error' => isset($result['error']) ? $result['error'] : __('Failed to fetch quote', 'forge-dashboard')
            );
        }

        if (empty($result['data'])) {
            return array(
                'success' => false,
                'error' => __('Quote not found', 'forge-dashboard')
            );
        }

        return array(
            'success' => true,
            'quote' => $result['data'][0]
        );
    }

    /**
     * Update quote status
     */
    public function update_status($id, $status) {
        if (!array_key_exists($status, self::VALID_STATUSES)) {
            return array(
                'success' => false,
                'error' => __('Invalid status', 'forge-dashboard')
            );
        }

        $filters = array('id' => 'eq.' . $id);
        $data = array('status' => $status);

        $result = $this->supabase->patch('quote_request', $data, $filters);

        if (!isset($result['success']) || !$result['success']) {
            return array(
                'success' => false,
                'error' => isset($result['error']) ? $result['error'] : __('Failed to update status', 'forge-dashboard')
            );
        }

        return array('success' => true);
    }

    /**
     * Delete quote and associated files
     */
    public function delete_quote($id) {
        // First, get quote details to find files
        $quote_result = $this->get_quote($id);

        if (!$quote_result['success']) {
            return $quote_result;
        }

        $quote = $quote_result['quote'];

        // Extract quote ID for file deletion
        if (isset($quote['quote_id'])) {
            $quote_id_folder = $quote['quote_id'];

            // Delete files from storage
            $file_manager = new Forge_File_Manager($this->supabase);
            $file_manager->delete_quote_files($quote_id_folder);
        }

        // Delete quote from database
        $filters = array('id' => 'eq.' . $id);
        $result = $this->supabase->delete('quote_request', $filters);

        if (!isset($result['success']) || !$result['success']) {
            return array(
                'success' => false,
                'error' => isset($result['error']) ? $result['error'] : __('Failed to delete quote', 'forge-dashboard')
            );
        }

        return array('success' => true);
    }

    /**
     * Get total count of quotes
     */
    public function get_total_count($filters = array()) {
        $params = array();

        if (isset($filters['status']) && !empty($filters['status'])) {
            $params['status'] = 'eq.' . $filters['status'];
        }

        if (isset($filters['search']) && !empty($filters['search'])) {
            $search = sanitize_text_field($filters['search']);
            $params['or'] = "(customer_name.ilike.*{$search}*,customer_email.ilike.*{$search}*,customer_company.ilike.*{$search}*)";
        }

        return $this->supabase->count('quote_request', $params);
    }

    /**
     * Get dashboard statistics
     */
    public function get_statistics() {
        $today = date('Y-m-d');
        $week_ago = date('Y-m-d', strtotime('-7 days'));
        $month_ago = date('Y-m-d', strtotime('-30 days'));

        // Get all quotes for calculations
        $all_quotes = $this->get_quotes(array('limit' => 10000, 'offset' => 0));

        if (!$all_quotes['success']) {
            return array(
                'total' => 0,
                'pending' => 0,
                'today' => 0,
                'week' => 0,
                'month' => 0,
                'revenue_estimate' => 0,
                'materials' => array(),
                'recent' => array()
            );
        }

        $quotes = $all_quotes['quotes'];

        // Initialize stats
        $stats = array(
            'total' => count($quotes),
            'pending' => 0,
            'processing' => 0,
            'completed' => 0,
            'today' => 0,
            'week' => 0,
            'month' => 0,
            'revenue_estimate' => 0,
            'materials' => array(),
            'recent' => array()
        );

        // Calculate stats
        foreach ($quotes as $quote) {
            // Count by status
            if (isset($quote['status'])) {
                $status = $quote['status'];
                if (isset($stats[$status])) {
                    $stats[$status]++;
                }
            }

            // Count by date
            if (isset($quote['created_at'])) {
                $created = substr($quote['created_at'], 0, 10);

                if ($created >= $today) {
                    $stats['today']++;
                }
                if ($created >= $week_ago) {
                    $stats['week']++;
                }
                if ($created >= $month_ago) {
                    $stats['month']++;
                }
            }

            // Calculate revenue estimate
            if (isset($quote['total_cost']) && $quote['total_cost'] !== null) {
                $stats['revenue_estimate'] += floatval($quote['total_cost']);
            }

            // Count materials
            if (isset($quote['material'])) {
                $material = $quote['material'];
                if (!isset($stats['materials'][$material])) {
                    $stats['materials'][$material] = 0;
                }
                $stats['materials'][$material]++;
            }
        }

        // Get recent quotes (last 5)
        $recent = array_slice($quotes, 0, 5);
        $stats['recent'] = $recent;

        return $stats;
    }

    /**
     * Get available materials
     */
    public function get_materials() {
        return array_keys(self::MATERIAL_PRICES);
    }

    /**
     * Get valid statuses
     */
    public function get_statuses() {
        return self::VALID_STATUSES;
    }

    /**
     * Calculate quote pricing
     */
    public function calculate_pricing($material, $quantity, $finishing = 'Standard') {
        $base_cost = 50;
        $material_price = isset(self::MATERIAL_PRICES[$material]) ? self::MATERIAL_PRICES[$material] : 20;

        $finishing_prices = array(
            'Standard' => 0,
            'Smooth' => 15,
            'Painted' => 30,
            'Premium' => 50
        );

        $finishing_price = isset($finishing_prices[$finishing]) ? $finishing_prices[$finishing] : 0;

        $material_cost = $material_price * $quantity;
        $finishing_cost = $finishing_price * $quantity;

        // Calculate quantity discount
        $quantity_discount = 0;
        if ($quantity >= 10) {
            $quantity_discount = $material_cost * 0.15;
        } elseif ($quantity >= 5) {
            $quantity_discount = $material_cost * 0.10;
        }

        $total = $base_cost + $material_cost + $finishing_cost - $quantity_discount;

        return array(
            'base_cost' => $base_cost,
            'material_cost' => $material_cost,
            'finishing_cost' => $finishing_cost,
            'quantity_discount' => $quantity_discount,
            'total' => $total,
            'currency' => 'EUR'
        );
    }

    /**
     * Export quotes to CSV
     */
    public function export_to_csv($args = array()) {
        $quotes_result = $this->get_quotes(array_merge($args, array('limit' => 10000)));

        if (!$quotes_result['success']) {
            return false;
        }

        $quotes = $quotes_result['quotes'];

        // Set headers for CSV download
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=quotes-' . date('Y-m-d') . '.csv');

        $output = fopen('php://output', 'w');

        // CSV headers
        fputcsv($output, array(
            'Quote ID',
            'Date',
            'Customer Name',
            'Email',
            'Phone',
            'Company',
            'Material',
            'Quantity',
            'Timeline',
            'Status',
            'Total (EUR)'
        ));

        // CSV rows
        foreach ($quotes as $quote) {
            $row = array(
                isset($quote['quote_id']) ? $quote['quote_id'] : '',
                isset($quote['created_at']) ? date('Y-m-d H:i', strtotime($quote['created_at'])) : '',
                isset($quote['customer_name']) ? $quote['customer_name'] : '',
                isset($quote['customer_email']) ? $quote['customer_email'] : '',
                isset($quote['customer_phone']) ? $quote['customer_phone'] : '',
                isset($quote['customer_company']) ? $quote['customer_company'] : '',
                isset($quote['material']) ? $quote['material'] : '',
                isset($quote['quantity']) ? $quote['quantity'] : '',
                isset($quote['timeline']) ? $quote['timeline'] : '',
                isset($quote['status']) ? $quote['status'] : '',
                isset($quote['total_cost']) ? $quote['total_cost'] : ''
            );

            fputcsv($output, $row);
        }

        fclose($output);
        exit;
    }
}
