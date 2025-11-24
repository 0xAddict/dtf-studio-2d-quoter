<?php
/**
 * Quote Details View
 */

if (!defined('ABSPATH')) {
    exit;
}

$quote_display_id = isset($model_data['quoteId']) ? $model_data['quoteId'] : 'N/A';
$pricing = isset($model_data['pricing']) ? $model_data['pricing'] : array();
$model_info = isset($model_data['model']) ? $model_data['model'] : array();
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
                            <td><?php echo esc_html($quote['name']); ?></td>
                        </tr>
                        <tr>
                            <th><?php _e('Email:', 'forge-dashboard'); ?></th>
                            <td>
                                <a href="mailto:<?php echo esc_attr($quote['email']); ?>">
                                    <?php echo esc_html($quote['email']); ?>
                                </a>
                            </td>
                        </tr>
                        <?php if (!empty($quote['phone'])) : ?>
                            <tr>
                                <th><?php _e('Phone:', 'forge-dashboard'); ?></th>
                                <td>
                                    <a href="tel:<?php echo esc_attr($quote['phone']); ?>">
                                        <?php echo esc_html($quote['phone']); ?>
                                    </a>
                                </td>
                            </tr>
                        <?php endif; ?>
                        <?php if (!empty($quote['company'])) : ?>
                            <tr>
                                <th><?php _e('Company:', 'forge-dashboard'); ?></th>
                                <td><?php echo esc_html($quote['company']); ?></td>
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
                        <?php if (!empty($model_data['finishing'])) : ?>
                            <tr>
                                <th><?php _e('Finishing:', 'forge-dashboard'); ?></th>
                                <td><?php echo esc_html($model_data['finishing']); ?></td>
                            </tr>
                        <?php endif; ?>
                        <?php if (!empty($quote['notes'])) : ?>
                            <tr>
                                <th><?php _e('Notes:', 'forge-dashboard'); ?></th>
                                <td><?php echo nl2br(esc_html($quote['notes'])); ?></td>
                            </tr>
                        <?php endif; ?>
                    </table>
                </div>
            </div>

            <!-- Model Information -->
            <?php if (!empty($model_info)) : ?>
                <div class="forge-card" style="margin-top: 20px;">
                    <div class="forge-card-header">
                        <h2><?php _e('Model Information', 'forge-dashboard'); ?></h2>
                    </div>
                    <div class="forge-card-body">
                        <table class="forge-detail-table">
                            <?php if (isset($model_info['fileName'])) : ?>
                                <tr>
                                    <th><?php _e('File Name:', 'forge-dashboard'); ?></th>
                                    <td><?php echo esc_html($model_info['fileName']); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php
                            // Check for model file URL in model_data
                            $model_url = null;
                            if (isset($model_data['attachmentUrl']) && !empty($model_data['attachmentUrl'])) {
                                $model_url = $model_data['attachmentUrl'];
                            }
                            if ($model_url) :
                            ?>
                                <tr>
                                    <th><?php _e('3D Model File:', 'forge-dashboard'); ?></th>
                                    <td>
                                        <a href="<?php echo esc_url($model_url); ?>" target="_blank" class="button button-primary" style="margin-right: 10px;">
                                            <span class="dashicons dashicons-download" style="margin-top: 3px;"></span>
                                            <?php _e('Download Model', 'forge-dashboard'); ?>
                                        </a>
                                        <a href="<?php echo esc_url($model_url); ?>" target="_blank" class="button button-secondary">
                                            <span class="dashicons dashicons-external" style="margin-top: 3px;"></span>
                                            <?php _e('View in Browser', 'forge-dashboard'); ?>
                                        </a>
                                    </td>
                                </tr>
                            <?php endif; ?>
                            <?php if (isset($model_info['vertices'])) : ?>
                                <tr>
                                    <th><?php _e('Vertices:', 'forge-dashboard'); ?></th>
                                    <td><?php echo number_format($model_info['vertices']); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (isset($model_info['triangles'])) : ?>
                                <tr>
                                    <th><?php _e('Triangles:', 'forge-dashboard'); ?></th>
                                    <td><?php echo number_format($model_info['triangles']); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (isset($model_info['dimensions'])) : ?>
                                <tr>
                                    <th><?php _e('Dimensions:', 'forge-dashboard'); ?></th>
                                    <td>
                                        X: <?php echo esc_html($model_info['dimensions']['x']); ?>cm,
                                        Y: <?php echo esc_html($model_info['dimensions']['y']); ?>cm,
                                        Z: <?php echo esc_html($model_info['dimensions']['z']); ?>cm
                                    </td>
                                </tr>
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
            <?php if (!empty($pricing)) : ?>
                <div class="forge-card" style="margin-top: 20px;">
                    <div class="forge-card-header">
                        <h2><?php _e('Pricing', 'forge-dashboard'); ?></h2>
                    </div>
                    <div class="forge-card-body">
                        <table class="forge-pricing-table">
                            <?php if (isset($pricing['baseCost'])) : ?>
                                <tr>
                                    <td><?php _e('Base Cost:', 'forge-dashboard'); ?></td>
                                    <td class="forge-price">€<?php echo number_format($pricing['baseCost'], 2); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (isset($pricing['materialCost'])) : ?>
                                <tr>
                                    <td><?php _e('Material Cost:', 'forge-dashboard'); ?></td>
                                    <td class="forge-price">€<?php echo number_format($pricing['materialCost'], 2); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (isset($pricing['finishingCost']) && $pricing['finishingCost'] > 0) : ?>
                                <tr>
                                    <td><?php _e('Finishing Cost:', 'forge-dashboard'); ?></td>
                                    <td class="forge-price">€<?php echo number_format($pricing['finishingCost'], 2); ?></td>
                                </tr>
                            <?php endif; ?>
                            <?php if (isset($pricing['quantityDiscount']) && $pricing['quantityDiscount'] > 0) : ?>
                                <tr>
                                    <td><?php _e('Quantity Discount:', 'forge-dashboard'); ?></td>
                                    <td class="forge-price forge-discount">-€<?php echo number_format($pricing['quantityDiscount'], 2); ?></td>
                                </tr>
                            <?php endif; ?>
                            <tr class="forge-total-row">
                                <td><strong><?php _e('Total:', 'forge-dashboard'); ?></strong></td>
                                <td class="forge-price">
                                    <strong>€<?php echo number_format($pricing['total'], 2); ?></strong>
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
                    <a href="mailto:<?php echo esc_attr($quote['email']); ?>?subject=<?php echo esc_attr('Re: Quote Request #' . $quote_display_id); ?>" class="button button-large button-secondary" style="width: 100%; margin-bottom: 10px; text-decoration: none; text-align: center; display: block;">
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
    // Status update
    $('#forge-status-form').on('submit', function(e) {
        e.preventDefault();

        var $form = $(this);
        var $button = $form.find('button[type="submit"]');
        var originalText = $button.text();

        $button.prop('disabled', true).text('<?php _e('Updating...', 'forge-dashboard'); ?>');

        $.ajax({
            url: forgeAjax.ajaxUrl,
            type: 'POST',
            data: {
                action: 'forge_update_status',
                nonce: forgeAjax.nonce,
                quote_id: $form.find('input[name="quote_id"]').val(),
                status: $form.find('select[name="status"]').val()
            },
            success: function(response) {
                if (response.success) {
                    location.reload();
                } else {
                    alert(response.data.message);
                    $button.prop('disabled', false).text(originalText);
                }
            },
            error: function() {
                alert('<?php _e('An error occurred. Please try again.', 'forge-dashboard'); ?>');
                $button.prop('disabled', false).text(originalText);
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
