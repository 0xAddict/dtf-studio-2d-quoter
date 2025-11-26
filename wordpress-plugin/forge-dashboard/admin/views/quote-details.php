<?php
/**
 * Quote Details View
 */

if (!defined('ABSPATH')) {
    exit;
}

$quote_display_id = isset($quote['quote_id']) ? $quote['quote_id'] : 'N/A';
?>

<div class="wrap forge-quote-details">
    <h1 class="wp-heading-inline">
        <?php _e('Quote Details', 'forge-dashboard'); ?>: <?php echo esc_html($quote_display_id); ?>
    </h1>

    <a href="<?php echo admin_url('admin.php?page=forge-quotes'); ?>" class="page-title-action">
        <?php _e('Back to All Quotes', 'forge-dashboard'); ?>
    </a>

    <hr class="wp-header-end">

    <div class="forge-quote-content">
        <!-- Main Quote Information -->
        <div class="forge-quote-main">
            <!-- Customer Information -->
            <div class="forge-card">
                <div class="forge-card-header">
                    <h2><?php _e('Customer Information', 'forge-dashboard'); ?></h2>
                </div>
                <div class="forge-card-body">
                    <table class="forge-detail-table">
                        <tr>
                            <th><?php _e('Name:', 'forge-dashboard'); ?></th>
                            <td><?php echo esc_html($quote['customer_name']); ?></td>
                        </tr>
                        <tr>
                            <th><?php _e('Email:', 'forge-dashboard'); ?></th>
                            <td>
                                <a href="mailto:<?php echo esc_attr($quote['customer_email']); ?>">
                                    <?php echo esc_html($quote['customer_email']); ?>
                                </a>
                            </td>
                        </tr>
                        <?php if (!empty($quote['customer_phone'])) : ?>
                            <tr>
                                <th><?php _e('Phone:', 'forge-dashboard'); ?></th>
                                <td>
                                    <a href="tel:<?php echo esc_attr($quote['customer_phone']); ?>">
                                        <?php echo esc_html($quote['customer_phone']); ?>
                                    </a>
                                </td>
                            </tr>
                        <?php endif; ?>
                        <?php if (!empty($quote['customer_company'])) : ?>
                            <tr>
                                <th><?php _e('Company:', 'forge-dashboard'); ?></th>
                                <td><?php echo esc_html($quote['customer_company']); ?></td>
                            </tr>
                        <?php endif; ?>
                    </table>
                </div>
            </div>

            <!-- Order Details -->
            <div class="forge-card" style="margin-top: 20px;">
                <div class="forge-card-header">
                    <h2><?php _e('Order Details', 'forge-dashboard'); ?></h2>
                </div>
                <div class="forge-card-body">
                    <table class="forge-detail-table">
                        <tr>
                            <th><?php _e('Material:', 'forge-dashboard'); ?></th>
                            <td><strong><?php echo esc_html($quote['material']); ?></strong></td>
                        </tr>
                        <tr>
                            <th><?php _e('Quantity:', 'forge-dashboard'); ?></th>
                            <td><?php echo esc_html($quote['quantity']); ?> pieces</td>
                        </tr>
                        <?php if (!empty($quote['timeline'])) : ?>
                            <tr>
                                <th><?php _e('Timeline:', 'forge-dashboard'); ?></th>
                                <td><?php echo esc_html($quote['timeline']); ?></td>
                            </tr>
                        <?php endif; ?>
                        <?php if (!empty($quote['finishing'])) : ?>
                            <tr>
                                <th><?php _e('Finishing:', 'forge-dashboard'); ?></th>
                                <td><?php echo esc_html($quote['finishing']); ?></td>
                            </tr>
                        <?php endif; ?>
                        <?php if (!empty($quote['message'])) : ?>
                            <tr>
                                <th><?php _e('Notes:', 'forge-dashboard'); ?></th>
                                <td><?php echo nl2br(esc_html($quote['message'])); ?></td>
                            </tr>
                        <?php endif; ?>
                    </table>
                </div>
            </div>

            <!-- Model Information -->
            <?php if (!empty($quote['model_file_name']) || !empty($quote['vertices'])) : ?>
                <div class="forge-card" style="margin-top: 20px;">
                    <div class="forge-card-header">
                        <h2><?php _e('Model Information', 'forge-dashboard'); ?></h2>
                    </div>
                    <div class="forge-card-body">
                        <table class="forge-detail-table">
                            <?php if (!empty($quote['model_file_name'])) : ?>
                                <tr>
                                    <th><?php _e('File Name:', 'forge-dashboard'); ?></th>
                                    <td><?php echo esc_html($quote['model_file_name']); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (!empty($quote['model_file_url'])) : ?>
                                <tr>
                                    <th><?php _e('3D Model File:', 'forge-dashboard'); ?></th>
                                    <td>
                                        <a href="<?php echo esc_url($quote['model_file_url']); ?>" target="_blank" class="button button-primary" style="margin-right: 10px;">
                                            <span class="dashicons dashicons-download" style="margin-top: 3px;"></span>
                                            <?php _e('Download Model', 'forge-dashboard'); ?>
                                        </a>
                                        <a href="<?php echo esc_url($quote['model_file_url']); ?>" target="_blank" class="button button-secondary">
                                            <span class="dashicons dashicons-external" style="margin-top: 3px;"></span>
                                            <?php _e('View in Browser', 'forge-dashboard'); ?>
                                        </a>
                                    </td>
                                </tr>
                            <?php endif; ?>
                            <?php if (!empty($quote['vertices'])) : ?>
                                <tr>
                                    <th><?php _e('Vertices:', 'forge-dashboard'); ?></th>
                                    <td><?php echo number_format($quote['vertices']); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (!empty($quote['triangles'])) : ?>
                                <tr>
                                    <th><?php _e('Triangles:', 'forge-dashboard'); ?></th>
                                    <td><?php echo number_format($quote['triangles']); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (!empty($quote['dimensions'])) : ?>
                                <?php
                                $dimensions = is_string($quote['dimensions']) ? json_decode($quote['dimensions'], true) : $quote['dimensions'];
                                if ($dimensions) :
                                ?>
                                <tr>
                                    <th><?php _e('Dimensions:', 'forge-dashboard'); ?></th>
                                    <td>
                                        X: <?php echo esc_html($dimensions['x']); ?>cm,
                                        Y: <?php echo esc_html($dimensions['y']); ?>cm,
                                        Z: <?php echo esc_html($dimensions['z']); ?>cm
                                    </td>
                                </tr>
                                <?php endif; ?>
                            <?php endif; ?>
                        </table>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Attached Files -->
            <?php if (!empty($files)) : ?>
                <div class="forge-card" style="margin-top: 20px;">
                    <div class="forge-card-header">
                        <h2><?php _e('Attached Files', 'forge-dashboard'); ?></h2>
                    </div>
                    <div class="forge-card-body">
                        <table class="widefat striped">
                            <thead>
                                <tr>
                                    <th><?php _e('File Name', 'forge-dashboard'); ?></th>
                                    <th><?php _e('Size', 'forge-dashboard'); ?></th>
                                    <th><?php _e('Actions', 'forge-dashboard'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($files as $file) :
                                    $file_manager = forge_dashboard()->file_manager;
                                ?>
                                    <tr>
                                        <td>
                                            <strong><?php echo esc_html($file['name']); ?></strong>
                                        </td>
                                        <td>
                                            <?php echo esc_html($file_manager->format_file_size($file['size'])); ?>
                                        </td>
                                        <td>
                                            <a href="<?php echo esc_url($file['url']); ?>" target="_blank" class="button button-small">
                                                <?php _e('Download', 'forge-dashboard'); ?>
                                            </a>
                                            <a href="#" class="button button-small forge-delete-file" data-file-path="<?php echo esc_attr($file['path']); ?>">
                                                <?php _e('Delete', 'forge-dashboard'); ?>
                                            </a>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <!-- Sidebar -->
        <div class="forge-quote-sidebar">
            <!-- Status Card -->
            <div class="forge-card">
                <div class="forge-card-header">
                    <h2><?php _e('Status', 'forge-dashboard'); ?></h2>
                </div>
                <div class="forge-card-body">
                    <form id="forge-status-form">
                        <?php wp_nonce_field('forge-dashboard-nonce', 'forge_nonce'); ?>
                        <input type="hidden" name="quote_id" value="<?php echo esc_attr($quote['id']); ?>">

                        <select name="status" id="forge-status-select" class="widefat">
                            <?php
                            $statuses = Forge_Quote_Manager::VALID_STATUSES;
                            $current_status = $quote['status'];
                            foreach ($statuses as $value => $label) :
                            ?>
                                <option value="<?php echo esc_attr($value); ?>" <?php selected($current_status, $value); ?>>
                                    <?php echo esc_html($label); ?>
                                </option>
                            <?php endforeach; ?>
                        </select>

                        <button type="submit" class="button button-primary" style="margin-top: 10px; width: 100%;">
                            <?php _e('Update Status', 'forge-dashboard'); ?>
                        </button>
                    </form>
                </div>
            </div>

            <!-- Pricing Card -->
            <?php if (!empty($quote['total_cost'])) : ?>
                <div class="forge-card" style="margin-top: 20px;">
                    <div class="forge-card-header">
                        <h2><?php _e('Pricing', 'forge-dashboard'); ?></h2>
                    </div>
                    <div class="forge-card-body">
                        <table class="forge-pricing-table">
                            <?php if (!empty($quote['base_cost'])) : ?>
                                <tr>
                                    <td><?php _e('Base Cost:', 'forge-dashboard'); ?></td>
                                    <td class="forge-price">€<?php echo number_format($quote['base_cost'], 2); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (!empty($quote['material_cost'])) : ?>
                                <tr>
                                    <td><?php _e('Material Cost:', 'forge-dashboard'); ?></td>
                                    <td class="forge-price">€<?php echo number_format($quote['material_cost'], 2); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (!empty($quote['finishing_cost']) && $quote['finishing_cost'] > 0) : ?>
                                <tr>
                                    <td><?php _e('Finishing Cost:', 'forge-dashboard'); ?></td>
                                    <td class="forge-price">€<?php echo number_format($quote['finishing_cost'], 2); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (!empty($quote['quantity_discount']) && $quote['quantity_discount'] > 0) : ?>
                                <tr>
                                    <td><?php _e('Quantity Discount:', 'forge-dashboard'); ?></td>
                                    <td class="forge-price forge-discount">-€<?php echo number_format($quote['quantity_discount'], 2); ?></td>
                                </tr>
                            <?php endif; ?>
                            <tr class="forge-total-row">
                                <td><strong><?php _e('Total:', 'forge-dashboard'); ?></strong></td>
                                <td class="forge-price">
                                    <strong>€<?php echo number_format($quote['total_cost'], 2); ?></strong>
                                </td>
                            </tr>
                        </table>
                    </div>
                </div>
            <?php endif; ?>

            <!-- Meta Information -->
            <div class="forge-card" style="margin-top: 20px;">
                <div class="forge-card-header">
                    <h2><?php _e('Meta', 'forge-dashboard'); ?></h2>
                </div>
                <div class="forge-card-body">
                    <table class="forge-detail-table">
                        <tr>
                            <th><?php _e('Created:', 'forge-dashboard'); ?></th>
                            <td><?php echo esc_html(date('M j, Y H:i', strtotime($quote['created_at']))); ?></td>
                        </tr>
                        <tr>
                            <th><?php _e('Quote ID:', 'forge-dashboard'); ?></th>
                            <td><code><?php echo esc_html($quote_display_id); ?></code></td>
                        </tr>
                        <tr>
                            <th><?php _e('Database ID:', 'forge-dashboard'); ?></th>
                            <td><code><?php echo esc_html($quote['id']); ?></code></td>
                        </tr>
                    </table>
                </div>
            </div>

            <!-- Actions Card -->
            <div class="forge-card" style="margin-top: 20px;">
                <div class="forge-card-header">
                    <h2><?php _e('Actions', 'forge-dashboard'); ?></h2>
                </div>
                <div class="forge-card-body">
                    <a href="mailto:<?php echo esc_attr($quote['customer_email']); ?>?subject=<?php echo esc_attr('Re: Quote Request #' . $quote_display_id); ?>" class="button button-large button-secondary" style="width: 100%; margin-bottom: 10px; text-decoration: none; text-align: center; display: block;">
                        <span class="dashicons dashicons-email" style="margin-top: 3px;"></span>
                        <?php _e('Email Customer', 'forge-dashboard'); ?>
                    </a>

                    <button type="button" class="button button-large forge-delete-quote-btn" data-quote-id="<?php echo esc_attr($quote['id']); ?>" style="width: 100%; background: #d9534f; border-color: #d9534f; color: white;">
                        <span class="dashicons dashicons-trash" style="margin-top: 3px;"></span>
                        <?php _e('Delete Quote', 'forge-dashboard'); ?>
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    // Store original status value
    var originalStatus = $('#forge-status-select').val();
    var originalStatusText = $('#forge-status-select option:selected').text();

    // Status update
    $('#forge-status-form').on('submit', function(e) {
        e.preventDefault();

        var $form = $(this);
        var $button = $form.find('button[type="submit"]');
        var $select = $form.find('select[name="status"]');
        var originalText = $button.text();

        var newStatus = $select.val();
        var newStatusText = $select.find('option:selected').text();

        // Check if status actually changed
        if (newStatus === originalStatus) {
            alert('<?php _e('Status has not been changed.', 'forge-dashboard'); ?>');
            return;
        }

        // Confirmation dialog
        var confirmMessage = '<?php _e('Are you sure you want to change the status?', 'forge-dashboard'); ?>\n\n' +
                           '<?php _e('From:', 'forge-dashboard'); ?> ' + originalStatusText + '\n' +
                           '<?php _e('To:', 'forge-dashboard'); ?> ' + newStatusText;

        if (!confirm(confirmMessage)) {
            // Reset to original status if cancelled
            $select.val(originalStatus);
            return;
        }

        $button.prop('disabled', true).text('<?php _e('Updating...', 'forge-dashboard'); ?>');

        $.ajax({
            url: forgeAjax.ajaxUrl,
            type: 'POST',
            data: {
                action: 'forge_update_status',
                nonce: forgeAjax.nonce,
                quote_id: $form.find('input[name="quote_id"]').val(),
                status: newStatus
            },
            success: function(response) {
                if (response.success) {
                    // Update the original status after successful update
                    originalStatus = newStatus;
                    originalStatusText = newStatusText;
                    location.reload();
                } else {
                    alert(response.data.message);
                    $button.prop('disabled', false).text(originalText);
                    // Reset to original status on error
                    $select.val(originalStatus);
                }
            },
            error: function() {
                alert('<?php _e('An error occurred. Please try again.', 'forge-dashboard'); ?>');
                $button.prop('disabled', false).text(originalText);
                // Reset to original status on error
                $select.val(originalStatus);
            }
        });
    });

    // Delete quote
    $('.forge-delete-quote-btn').on('click', function(e) {
        e.preventDefault();

        if (!confirm(forgeAjax.confirmDelete)) {
            return;
        }

        var quoteId = $(this).data('quote-id');

        $.ajax({
            url: forgeAjax.ajaxUrl,
            type: 'POST',
            data: {
                action: 'forge_delete_quote',
                nonce: forgeAjax.nonce,
                quote_id: quoteId
            },
            success: function(response) {
                if (response.success) {
                    window.location.href = '<?php echo admin_url('admin.php?page=forge-quotes'); ?>';
                } else {
                    alert(response.data.message);
                }
            },
            error: function() {
                alert('<?php _e('An error occurred. Please try again.', 'forge-dashboard'); ?>');
            }
        });
    });

    // Delete file
    $('.forge-delete-file').on('click', function(e) {
        e.preventDefault();

        if (!confirm(forgeAjax.confirmDeleteFile)) {
            return;
        }

        var $button = $(this);
        var filePath = $button.data('file-path');

        $button.prop('disabled', true).text('<?php _e('Deleting...', 'forge-dashboard'); ?>');

        $.ajax({
            url: forgeAjax.ajaxUrl,
            type: 'POST',
            data: {
                action: 'forge_delete_file',
                nonce: forgeAjax.nonce,
                file_path: filePath
            },
            success: function(response) {
                if (response.success) {
                    $button.closest('tr').fadeOut(function() {
                        $(this).remove();
                    });
                } else {
                    alert(response.data.message);
                    $button.prop('disabled', false).text('<?php _e('Delete', 'forge-dashboard'); ?>');
                }
            },
            error: function() {
                alert('<?php _e('An error occurred. Please try again.', 'forge-dashboard'); ?>');
                $button.prop('disabled', false).text('<?php _e('Delete', 'forge-dashboard'); ?>');
            }
        });
    });
});
</script>
