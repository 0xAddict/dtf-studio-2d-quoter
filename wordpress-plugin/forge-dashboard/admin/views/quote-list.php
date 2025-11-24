<?php
/**
 * Quote List View
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap forge-quotes-list">
    <h1 class="wp-heading-inline"><?php _e('All Quotes', 'forge-dashboard'); ?></h1>

    <?php
    // Display bulk action result message
    if (isset($_GET['bulk_action']) && isset($_GET['processed'])) {
        $action = sanitize_text_field($_GET['bulk_action']);
        $count = intval($_GET['processed']);

        $messages = array(
            'delete'          => sprintf(_n('%s quote deleted.', '%s quotes deleted.', $count, 'forge-dashboard'), $count),
            'mark_pending'    => sprintf(_n('%s quote marked as pending.', '%s quotes marked as pending.', $count, 'forge-dashboard'), $count),
            'mark_processing' => sprintf(_n('%s quote marked as processing.', '%s quotes marked as processing.', $count, 'forge-dashboard'), $count),
            'mark_completed'  => sprintf(_n('%s quote marked as completed.', '%s quotes marked as completed.', $count, 'forge-dashboard'), $count),
        );

        if (isset($messages[$action])) {
            echo '<div class="notice notice-success is-dismissible"><p>' . esc_html($messages[$action]) . '</p></div>';
        }
    }
    ?>

    <hr class="wp-header-end">

    <form method="get">
        <input type="hidden" name="page" value="forge-quotes">
        <?php
        $list_table->search_box(__('Search Quotes', 'forge-dashboard'), 'quote');
        $list_table->display();
        ?>
    </form>
</div>
