<?php
/**
 * Quote List Table Class
 *
 * Extends WP_List_Table for displaying quotes
 */

if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('WP_List_Table')) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

class Forge_Quote_List_Table extends WP_List_Table {

    /**
     * Quote manager instance
     */
    private $quote_manager;

    /**
     * Constructor
     */
    public function __construct($quote_manager) {
        $this->quote_manager = $quote_manager;

        parent::__construct(array(
            'singular' => 'quote',
            'plural'   => 'quotes',
            'ajax'     => false
        ));
    }

    /**
     * Get table columns
     */
    public function get_columns() {
        return array(
            'cb'           => '<input type="checkbox" />',
            'quote_id'     => __('Quote ID', 'forge-dashboard'),
            'date'         => __('Date', 'forge-dashboard'),
            'customer'     => __('Customer', 'forge-dashboard'),
            'email'        => __('Email', 'forge-dashboard'),
            'material'     => __('Material', 'forge-dashboard'),
            'quantity'     => __('Qty', 'forge-dashboard'),
            'total'        => __('Total', 'forge-dashboard'),
            'status'       => __('Status', 'forge-dashboard')
        );
    }

    /**
     * Get sortable columns
     */
    public function get_sortable_columns() {
        return array(
            'date'     => array('created_at', true),
            'customer' => array('name', false),
            'quantity' => array('quantity', false),
            'status'   => array('status', false)
        );
    }

    /**
     * Get bulk actions
     */
    public function get_bulk_actions() {
        return array(
            'delete'          => __('Delete', 'forge-dashboard'),
            'mark_pending'    => __('Mark as Pending', 'forge-dashboard'),
            'mark_processing' => __('Mark as Processing', 'forge-dashboard'),
            'mark_completed'  => __('Mark as Completed', 'forge-dashboard')
        );
    }

    /**
     * Prepare table items
     */
    public function prepare_items() {
        // Get current page number
        $current_page = $this->get_pagenum();
        $per_page = get_option('forge_items_per_page', 20);

        // Get filters
        $status = isset($_GET['status']) ? sanitize_text_field($_GET['status']) : '';
        $material = isset($_GET['material']) ? sanitize_text_field($_GET['material']) : '';
        $search = isset($_GET['s']) ? sanitize_text_field($_GET['s']) : '';

        // Get sorting
        $orderby = isset($_GET['orderby']) ? sanitize_text_field($_GET['orderby']) : 'created_at';
        $order = isset($_GET['order']) && $_GET['order'] === 'asc' ? 'asc' : 'desc';

        // Build query args
        $args = array(
            'limit'    => $per_page,
            'offset'   => ($current_page - 1) * $per_page,
            'order'    => $orderby . '.' . $order,
            'status'   => $status,
            'material' => $material,
            'search'   => $search
        );

        // Get quotes
        $result = $this->quote_manager->get_quotes($args);

        if ($result['success']) {
            $this->items = $result['quotes'];
        } else {
            $this->items = array();
        }

        // Get total count
        $total_items = $this->quote_manager->get_total_count(array(
            'status' => $status,
            'search' => $search
        ));

        // Set pagination
        $this->set_pagination_args(array(
            'total_items' => $total_items,
            'per_page'    => $per_page,
            'total_pages' => ceil($total_items / $per_page)
        ));

        // Set columns
        $this->_column_headers = array(
            $this->get_columns(),
            array(), // Hidden columns
            $this->get_sortable_columns()
        );
    }

    /**
     * Checkbox column
     */
    public function column_cb($item) {
        return sprintf(
            '<input type="checkbox" name="quote[]" value="%s" />',
            esc_attr($item['id'])
        );
    }

    /**
     * Quote ID column
     */
    public function column_quote_id($item) {
        $model_data = isset($item['model_data']) && is_string($item['model_data'])
            ? json_decode($item['model_data'], true)
            : array();

        $quote_id = isset($model_data['quoteId']) ? $model_data['quoteId'] : 'N/A';

        // Build view URL
        $view_url = add_query_arg(array(
            'page' => 'forge-view-quote',
            'id'   => $item['id']
        ), admin_url('admin.php'));

        // Build actions
        $actions = array(
            'view'   => sprintf('<a href="%s">%s</a>', esc_url($view_url), __('View', 'forge-dashboard')),
            'delete' => sprintf(
                '<a href="#" class="forge-delete-quote" data-quote-id="%s">%s</a>',
                esc_attr($item['id']),
                __('Delete', 'forge-dashboard')
            )
        );

        return sprintf(
            '<strong><a href="%s">%s</a></strong> %s',
            esc_url($view_url),
            esc_html($quote_id),
            $this->row_actions($actions)
        );
    }

    /**
     * Date column
     */
    public function column_date($item) {
        if (empty($item['created_at'])) {
            return 'N/A';
        }

        $date = strtotime($item['created_at']);
        $diff = time() - $date;

        if ($diff < DAY_IN_SECONDS) {
            $relative = human_time_diff($date, time()) . ' ' . __('ago', 'forge-dashboard');
        } else {
            $relative = date('Y-m-d', $date);
        }

        return sprintf(
            '<abbr title="%s">%s</abbr><br>%s',
            esc_attr(date('Y-m-d H:i:s', $date)),
            esc_html(date('M j, Y', $date)),
            esc_html($relative)
        );
    }

    /**
     * Customer column
     */
    public function column_customer($item) {
        $name = isset($item['name']) ? $item['name'] : 'N/A';
        $company = isset($item['company']) && !empty($item['company']) ? $item['company'] : '';

        if ($company) {
            return sprintf(
                '<strong>%s</strong><br><small>%s</small>',
                esc_html($name),
                esc_html($company)
            );
        }

        return esc_html($name);
    }

    /**
     * Email column
     */
    public function column_email($item) {
        if (empty($item['email'])) {
            return 'N/A';
        }

        return sprintf(
            '<a href="mailto:%s">%s</a>',
            esc_attr($item['email']),
            esc_html($item['email'])
        );
    }

    /**
     * Material column
     */
    public function column_material($item) {
        return isset($item['material']) ? esc_html($item['material']) : 'N/A';
    }

    /**
     * Quantity column
     */
    public function column_quantity($item) {
        return isset($item['quantity']) ? intval($item['quantity']) : 0;
    }

    /**
     * Total column
     */
    public function column_total($item) {
        $model_data = isset($item['model_data']) && is_string($item['model_data'])
            ? json_decode($item['model_data'], true)
            : array();

        $total = isset($model_data['pricing']['total']) ? floatval($model_data['pricing']['total']) : 0;

        return sprintf(
            '<strong>€%s</strong>',
            number_format($total, 2)
        );
    }

    /**
     * Status column
     */
    public function column_status($item) {
        $status = isset($item['status']) ? $item['status'] : 'pending';
        $statuses = Forge_Quote_Manager::VALID_STATUSES;
        $label = isset($statuses[$status]) ? $statuses[$status] : ucfirst($status);

        // Status color mapping
        $colors = array(
            'pending'       => '#f0ad4e',
            'processing'    => '#5bc0de',
            'quoted'        => '#428bca',
            'approved'      => '#9b59b6',
            'in_production' => '#3498db',
            'completed'     => '#5cb85c',
            'cancelled'     => '#d9534f'
        );

        $color = isset($colors[$status]) ? $colors[$status] : '#999';

        return sprintf(
            '<span class="forge-status" style="background: %s; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px; font-weight: 600; display: inline-block;">%s</span>',
            esc_attr($color),
            esc_html($label)
        );
    }

    /**
     * Display extra filters
     */
    protected function extra_tablenav($which) {
        if ($which !== 'top') {
            return;
        }

        $current_status = isset($_GET['status']) ? $_GET['status'] : '';
        $current_material = isset($_GET['material']) ? $_GET['material'] : '';
        ?>
        <div class="alignleft actions">
            <?php
            // Status filter
            $statuses = Forge_Quote_Manager::VALID_STATUSES;
            if (!empty($statuses)) {
                echo '<select name="status" id="filter-status">';
                echo '<option value="">' . __('All Statuses', 'forge-dashboard') . '</option>';
                foreach ($statuses as $value => $label) {
                    printf(
                        '<option value="%s" %s>%s</option>',
                        esc_attr($value),
                        selected($current_status, $value, false),
                        esc_html($label)
                    );
                }
                echo '</select>';
            }

            // Material filter
            $materials = $this->quote_manager->get_materials();
            if (!empty($materials)) {
                echo '<select name="material" id="filter-material">';
                echo '<option value="">' . __('All Materials', 'forge-dashboard') . '</option>';
                foreach ($materials as $material) {
                    printf(
                        '<option value="%s" %s>%s</option>',
                        esc_attr($material),
                        selected($current_material, $material, false),
                        esc_html($material)
                    );
                }
                echo '</select>';
            }

            submit_button(__('Filter', 'forge-dashboard'), '', 'filter_action', false);

            // Export button
            $export_url = wp_nonce_url(
                add_query_arg(array('page' => 'forge-quotes', 'action' => 'export'), admin_url('admin.php')),
                'forge-export-quotes'
            );
            printf(
                '<a href="%s" class="button button-secondary" style="margin-left: 10px;">%s</a>',
                esc_url($export_url),
                __('Export CSV', 'forge-dashboard')
            );
            ?>
        </div>
        <?php
    }

    /**
     * Message when no items found
     */
    public function no_items() {
        _e('No quotes found.', 'forge-dashboard');
    }
}
