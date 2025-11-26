<?php
/**
 * Plugin Name: Forge Dashboard
 * Plugin URI: https://github.com/0xAddict/Hexea---3D-Viewer
 * Description: Professional dashboard for managing 3D printing quotes from Hexea Forge. Integrates with Supabase for quote management, file handling, and customer communications.
 * Version: 1.2.0
 * Author: Hexea Forge
 * Author URI: https://hexea.io
 * License: MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: forge-dashboard
 * Domain Path: /languages
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('FORGE_VERSION', '1.2.0');
define('FORGE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FORGE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('FORGE_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main Forge Dashboard Plugin Class
 */
class Forge_Dashboard {

    /**
     * Single instance of the class
     */
    private static $instance = null;

    /**
     * Supabase client instance
     */
    public $supabase = null;

    /**
     * Quote manager instance
     */
    public $quote_manager = null;

    /**
     * File manager instance
     */
    public $file_manager = null;

    /**
     * Get singleton instance
     */
    public static function instance() {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->includes();
        $this->init_hooks();
    }

    /**
     * Include required files
     */
    private function includes() {
        // Core classes
        require_once FORGE_PLUGIN_DIR . 'includes/class-supabase-client.php';
        require_once FORGE_PLUGIN_DIR . 'includes/class-quote-manager.php';
        require_once FORGE_PLUGIN_DIR . 'includes/class-file-manager.php';
        require_once FORGE_PLUGIN_DIR . 'includes/class-settings.php';

        // Admin classes
        if (is_admin()) {
            require_once FORGE_PLUGIN_DIR . 'admin/class-admin-menu.php';
            require_once FORGE_PLUGIN_DIR . 'admin/class-quote-list-table.php';
        }
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        // Activation and deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));

        // Initialize plugin
        add_action('plugins_loaded', array($this, 'init'));

        // Enqueue scripts and styles
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));

        // AJAX handlers
        add_action('wp_ajax_forge_delete_quote', array($this, 'ajax_delete_quote'));
        add_action('wp_ajax_forge_update_status', array($this, 'ajax_update_status'));
        add_action('wp_ajax_forge_delete_file', array($this, 'ajax_delete_file'));
        add_action('wp_ajax_forge_get_stats', array($this, 'ajax_get_stats'));
    }

    /**
     * Initialize plugin
     */
    public function init() {
        // Load text domain
        load_plugin_textdomain('forge-dashboard', false, dirname(FORGE_PLUGIN_BASENAME) . '/languages');

        // Initialize classes
        $this->supabase = new Forge_Supabase_Client();
        $this->quote_manager = new Forge_Quote_Manager($this->supabase);
        $this->file_manager = new Forge_File_Manager($this->supabase);

        // Initialize admin
        if (is_admin()) {
            new Forge_Admin_Menu($this->quote_manager, $this->file_manager);
        }
    }

    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        // Only load on Forge pages (dashboard, quotes, settings, view-quote)
        if (strpos($hook, 'forge') === false) {
            return;
        }

        // Enqueue styles
        wp_enqueue_style(
            'forge-admin-css',
            FORGE_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            FORGE_VERSION
        );

        // Enqueue scripts
        wp_enqueue_script(
            'forge-admin-js',
            FORGE_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery'),
            FORGE_VERSION,
            true
        );

        // Localize script with AJAX URL and nonce
        wp_localize_script('forge-admin-js', 'forgeAjax', array(
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('forge-dashboard-nonce'),
            'confirmDelete' => __('Are you sure you want to delete this quote? This action cannot be undone.', 'forge-dashboard'),
            'confirmDeleteFile' => __('Are you sure you want to delete this file? This action cannot be undone.', 'forge-dashboard')
        ));
    }

    /**
     * Plugin activation
     */
    public function activate() {
        // Create options with default values
        add_option('forge_supabase_url', '');
        add_option('forge_supabase_key', '');
        add_option('forge_web3forms_key', 'ad897559-e4df-411a-bcb7-086c366bf81f');
        add_option('forge_items_per_page', 20);
        add_option('forge_default_status', 'pending');

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * AJAX: Delete quote
     */
    public function ajax_delete_quote() {
        check_ajax_referer('forge-dashboard-nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'forge-dashboard')));
        }

        $quote_id = isset($_POST['quote_id']) ? sanitize_text_field($_POST['quote_id']) : '';

        if (empty($quote_id)) {
            wp_send_json_error(array('message' => __('Invalid quote ID', 'forge-dashboard')));
        }

        $result = $this->quote_manager->delete_quote($quote_id);

        if ($result['success']) {
            wp_send_json_success(array('message' => __('Quote deleted successfully', 'forge-dashboard')));
        } else {
            wp_send_json_error(array('message' => $result['error']));
        }
    }

    /**
     * AJAX: Update quote status
     */
    public function ajax_update_status() {
        check_ajax_referer('forge-dashboard-nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'forge-dashboard')));
        }

        $quote_id = isset($_POST['quote_id']) ? sanitize_text_field($_POST['quote_id']) : '';
        $status = isset($_POST['status']) ? sanitize_text_field($_POST['status']) : '';

        if (empty($quote_id) || empty($status)) {
            wp_send_json_error(array('message' => __('Invalid parameters', 'forge-dashboard')));
        }

        $result = $this->quote_manager->update_status($quote_id, $status);

        if ($result['success']) {
            wp_send_json_success(array('message' => __('Status updated successfully', 'forge-dashboard')));
        } else {
            wp_send_json_error(array('message' => $result['error']));
        }
    }

    /**
     * AJAX: Delete file
     */
    public function ajax_delete_file() {
        check_ajax_referer('forge-dashboard-nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'forge-dashboard')));
        }

        $file_path = isset($_POST['file_path']) ? sanitize_text_field($_POST['file_path']) : '';

        if (empty($file_path)) {
            wp_send_json_error(array('message' => __('Invalid file path', 'forge-dashboard')));
        }

        $result = $this->file_manager->delete_file($file_path);

        if ($result['success']) {
            wp_send_json_success(array('message' => __('File deleted successfully', 'forge-dashboard')));
        } else {
            wp_send_json_error(array('message' => $result['error']));
        }
    }

    /**
     * AJAX: Get dashboard statistics
     */
    public function ajax_get_stats() {
        check_ajax_referer('forge-dashboard-nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => __('Permission denied', 'forge-dashboard')));
        }

        $stats = $this->quote_manager->get_statistics();
        wp_send_json_success($stats);
    }
}

/**
 * Initialize the plugin
 */
function forge_dashboard() {
    return Forge_Dashboard::instance();
}

// Start the plugin
forge_dashboard();
