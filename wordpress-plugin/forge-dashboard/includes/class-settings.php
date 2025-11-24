<?php
/**
 * Settings Class
 *
 * Handles plugin settings and configuration
 */

if (!defined('ABSPATH')) {
    exit;
}

class Forge_Settings {

    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_init', array($this, 'register_settings'));
    }

    /**
     * Register settings
     */
    public function register_settings() {
        // Supabase Settings Section
        add_settings_section(
            'forge_supabase_section',
            __('Supabase Configuration', 'forge-dashboard'),
            array($this, 'supabase_section_callback'),
            'forge-dashboard-settings'
        );

        // Supabase URL
        register_setting('forge_settings', 'forge_supabase_url', array(
            'type' => 'string',
            'sanitize_callback' => 'esc_url_raw',
            'default' => ''
        ));

        add_settings_field(
            'forge_supabase_url',
            __('Supabase URL', 'forge-dashboard'),
            array($this, 'supabase_url_callback'),
            'forge-dashboard-settings',
            'forge_supabase_section'
        );

        // Supabase Service Key
        register_setting('forge_settings', 'forge_supabase_key', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => ''
        ));

        add_settings_field(
            'forge_supabase_key',
            __('Supabase Service Key', 'forge-dashboard'),
            array($this, 'supabase_key_callback'),
            'forge-dashboard-settings',
            'forge_supabase_section'
        );

        // General Settings Section
        add_settings_section(
            'forge_general_section',
            __('General Settings', 'forge-dashboard'),
            array($this, 'general_section_callback'),
            'forge-dashboard-settings'
        );

        // Items per page
        register_setting('forge_settings', 'forge_items_per_page', array(
            'type' => 'integer',
            'sanitize_callback' => 'absint',
            'default' => 20
        ));

        add_settings_field(
            'forge_items_per_page',
            __('Items Per Page', 'forge-dashboard'),
            array($this, 'items_per_page_callback'),
            'forge-dashboard-settings',
            'forge_general_section'
        );

        // Default status
        register_setting('forge_settings', 'forge_default_status', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => 'pending'
        ));

        add_settings_field(
            'forge_default_status',
            __('Default Quote Status', 'forge-dashboard'),
            array($this, 'default_status_callback'),
            'forge-dashboard-settings',
            'forge_general_section'
        );

        // Web3Forms Settings Section
        add_settings_section(
            'forge_web3forms_section',
            __('Web3Forms Configuration', 'forge-dashboard'),
            array($this, 'web3forms_section_callback'),
            'forge-dashboard-settings'
        );

        // Web3Forms Key
        register_setting('forge_settings', 'forge_web3forms_key', array(
            'type' => 'string',
            'sanitize_callback' => 'sanitize_text_field',
            'default' => 'ad897559-e4df-411a-bcb7-086c366bf81f'
        ));

        add_settings_field(
            'forge_web3forms_key',
            __('Web3Forms API Key', 'forge-dashboard'),
            array($this, 'web3forms_key_callback'),
            'forge-dashboard-settings',
            'forge_web3forms_section'
        );
    }

    /**
     * Section callbacks
     */
    public function supabase_section_callback() {
        echo '<p>' . __('Configure your Supabase project credentials. You can find these in your Supabase project settings.', 'forge-dashboard') . '</p>';
        echo '<p><strong>' . __('Note:', 'forge-dashboard') . '</strong> ' . __('Use the Service Role key (not the anon key) for admin operations.', 'forge-dashboard') . '</p>';
    }

    public function general_section_callback() {
        echo '<p>' . __('Configure general dashboard settings.', 'forge-dashboard') . '</p>';
    }

    public function web3forms_section_callback() {
        echo '<p>' . __('Configure Web3Forms integration for email notifications.', 'forge-dashboard') . '</p>';
    }

    /**
     * Field callbacks
     */
    public function supabase_url_callback() {
        $value = get_option('forge_supabase_url', '');
        echo '<input type="url" id="forge_supabase_url" name="forge_supabase_url" value="' . esc_attr($value) . '" class="regular-text" placeholder="https://your-project.supabase.co" />';
        echo '<p class="description">' . __('Your Supabase project URL', 'forge-dashboard') . '</p>';
    }

    public function supabase_key_callback() {
        $value = get_option('forge_supabase_key', '');
        echo '<input type="password" id="forge_supabase_key" name="forge_supabase_key" value="' . esc_attr($value) . '" class="regular-text" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />';
        echo '<p class="description">' . __('Your Supabase service role key (keep this secret!)', 'forge-dashboard') . '</p>';
    }

    public function items_per_page_callback() {
        $value = get_option('forge_items_per_page', 20);
        echo '<input type="number" id="forge_items_per_page" name="forge_items_per_page" value="' . esc_attr($value) . '" class="small-text" min="5" max="100" />';
        echo '<p class="description">' . __('Number of quotes to display per page', 'forge-dashboard') . '</p>';
    }

    public function default_status_callback() {
        $value = get_option('forge_default_status', 'pending');
        $statuses = Forge_Quote_Manager::VALID_STATUSES;

        echo '<select id="forge_default_status" name="forge_default_status">';
        foreach ($statuses as $key => $label) {
            echo '<option value="' . esc_attr($key) . '" ' . selected($value, $key, false) . '>' . esc_html($label) . '</option>';
        }
        echo '</select>';
        echo '<p class="description">' . __('Default status for new quotes', 'forge-dashboard') . '</p>';
    }

    public function web3forms_key_callback() {
        $value = get_option('forge_web3forms_key', 'ad897559-e4df-411a-bcb7-086c366bf81f');
        echo '<input type="text" id="forge_web3forms_key" name="forge_web3forms_key" value="' . esc_attr($value) . '" class="regular-text" />';
        echo '<p class="description">' . __('Web3Forms API access key for email notifications', 'forge-dashboard') . '</p>';
    }

    /**
     * Render settings page
     */
    public static function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }

        // Handle test connection
        $test_result = null;
        if (isset($_POST['test_connection']) && check_admin_referer('forge-test-connection')) {
            $supabase = new Forge_Supabase_Client();
            $test_result = $supabase->test_connection();
        }

        include FORGE_PLUGIN_DIR . 'admin/views/settings.php';
    }
}

// Initialize settings
new Forge_Settings();
