<?php
/**
 * Admin Menu Class
 *
 * Handles WordPress admin menu and pages
 */

if (!defined('ABSPATH')) {
    exit;
}

class Forge_Admin_Menu {

    /**
     * Quote manager instance
     */
    private $quote_manager;

    /**
     * File manager instance
     */
    private $file_manager;

    /**
     * Constructor
     */
    public function __construct($quote_manager, $file_manager) {
        $this->quote_manager = $quote_manager;
        $this->file_manager = $file_manager;

        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_bar_menu', array($this, 'add_admin_bar_menu'), 100);
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        // Main menu page
        add_menu_page(
            __('Forge Dashboard', 'forge-dashboard'),
            __('Forge', 'forge-dashboard'),
            'manage_options',
            'forge-dashboard',
            array($this, 'render_dashboard_page'),
            'dashicons-admin-tools',
            30
        );

        // Dashboard submenu (default)
        add_submenu_page(
            'forge-dashboard',
            __('Dashboard', 'forge-dashboard'),
            __('Dashboard', 'forge-dashboard'),
            'manage_options',
            'forge-dashboard',
            array($this, 'render_dashboard_page')
        );

        // All Quotes
        add_submenu_page(
            'forge-dashboard',
            __('All Quotes', 'forge-dashboard'),
            __('All Quotes', 'forge-dashboard'),
            'manage_options',
            'forge-quotes',
            array($this, 'render_quotes_page')
        );

        // Settings
        add_submenu_page(
            'forge-dashboard',
            __('Settings', 'forge-dashboard'),
            __('Settings', 'forge-dashboard'),
            'manage_options',
            'forge-settings',
            array($this, 'render_settings_page')
        );

        // Hidden page for single quote view
        add_submenu_page(
            null, // No parent = hidden from menu
            __('View Quote', 'forge-dashboard'),
            __('View Quote', 'forge-dashboard'),
            'manage_options',
            'forge-view-quote',
            array($this, 'render_single_quote_page')
        );
    }

    /**
     * Add admin bar menu
     */
    public function add_admin_bar_menu($admin_bar) {
        if (!current_user_can('manage_options')) {
            return;
        }

        $admin_bar->add_menu(array(
            'id'    => 'forge-dashboard',
            'title' => __('Forge', 'forge-dashboard'),
            'href'  => admin_url('admin.php?page=forge-dashboard'),
            'meta'  => array(
                'title' => __('Forge Dashboard', 'forge-dashboard'),
            ),
        ));

        $admin_bar->add_menu(array(
            'id'     => 'forge-all-quotes',
            'parent' => 'forge-dashboard',
            'title'  => __('All Quotes', 'forge-dashboard'),
            'href'   => admin_url('admin.php?page=forge-quotes'),
        ));

        $admin_bar->add_menu(array(
            'id'     => 'forge-settings',
            'parent' => 'forge-dashboard',
            'title'  => __('Settings', 'forge-dashboard'),
            'href'   => admin_url('admin.php?page=forge-settings'),
        ));
    }

    /**
     * Render dashboard page
     */
    public function render_dashboard_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        $stats = $this->quote_manager->get_statistics();
        include FORGE_PLUGIN_DIR . 'admin/views/dashboard.php';
    }

    /**
     * Render quotes list page
     */
    public function render_quotes_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        // Handle bulk actions
        if (isset($_POST['action']) && $_POST['action'] !== '-1') {
            check_admin_referer('bulk-quotes');
            $this->handle_bulk_actions();
        }

        // Handle export
        if (isset($_GET['action']) && $_GET['action'] === 'export') {
            check_admin_referer('forge-export-quotes');
            $this->quote_manager->export_to_csv();
        }

        // Create list table
        $list_table = new Forge_Quote_List_Table($this->quote_manager);
        $list_table->prepare_items();

        include FORGE_PLUGIN_DIR . 'admin/views/quote-list.php';
    }

    /**
     * Render single quote page
     */
    public function render_single_quote_page() {
        if (!current_user_can('manage_options')) {
            wp_die(__('You do not have sufficient permissions to access this page.'));
        }

        $quote_id = isset($_GET['id']) ? sanitize_text_field($_GET['id']) : '';

        if (empty($quote_id)) {
            wp_die(__('Invalid quote ID.'));
        }

        $result = $this->quote_manager->get_quote($quote_id);

        if (!$result['success']) {
            wp_die($result['error']);
        }

        $quote = $result['quote'];

        // Get model data
        $model_data = isset($quote['model_data']) && is_string($quote['model_data'])
            ? json_decode($quote['model_data'], true)
            : array();

        // Get files
        $files = array();
        if (isset($model_data['quoteId'])) {
            $files_result = $this->file_manager->get_quote_files($model_data['quoteId']);
            if ($files_result['success']) {
                $files = $files_result['files'];
            }
        }

        include FORGE_PLUGIN_DIR . 'admin/views/quote-details.php';
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        Forge_Settings::render_settings_page();
    }

    /**
     * Handle bulk actions
     */
    private function handle_bulk_actions() {
        $action = isset($_POST['action']) ? $_POST['action'] : '';
        $quote_ids = isset($_POST['quote']) ? $_POST['quote'] : array();

        if (empty($action) || empty($quote_ids)) {
            return;
        }

        $processed = 0;

        foreach ($quote_ids as $quote_id) {
            $quote_id = sanitize_text_field($quote_id);

            switch ($action) {
                case 'delete':
                    $result = $this->quote_manager->delete_quote($quote_id);
                    if ($result['success']) {
                        $processed++;
                    }
                    break;

                case 'mark_pending':
                    $result = $this->quote_manager->update_status($quote_id, 'pending');
                    if ($result['success']) {
                        $processed++;
                    }
                    break;

                case 'mark_processing':
                    $result = $this->quote_manager->update_status($quote_id, 'processing');
                    if ($result['success']) {
                        $processed++;
                    }
                    break;

                case 'mark_completed':
                    $result = $this->quote_manager->update_status($quote_id, 'completed');
                    if ($result['success']) {
                        $processed++;
                    }
                    break;
            }
        }

        // Redirect with success message
        $redirect_url = add_query_arg(array(
            'page' => 'forge-quotes',
            'bulk_action' => $action,
            'processed' => $processed
        ), admin_url('admin.php'));

        wp_redirect($redirect_url);
        exit;
    }
}
