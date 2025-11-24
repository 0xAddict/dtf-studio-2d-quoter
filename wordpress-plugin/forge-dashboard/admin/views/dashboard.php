<?php
/**
 * Dashboard View
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap forge-dashboard">
    <h1 class="wp-heading-inline"><?php _e('Forge Dashboard', 'forge-dashboard'); ?></h1>

    <hr class="wp-header-end">

    <?php if (!forge_dashboard()->supabase->is_configured()) : ?>
        <div class="notice notice-error">
            <p>
                <strong><?php _e('Supabase Not Configured', 'forge-dashboard'); ?></strong><br>
                <?php
                printf(
                    __('Please configure your Supabase credentials in <a href="%s">Settings</a> to start managing quotes.', 'forge-dashboard'),
                    admin_url('admin.php?page=forge-settings')
                );
                ?>
            </p>
        </div>
    <?php endif; ?>

    <!-- Statistics Grid -->
    <div class="forge-stats-grid" style="margin-top: 20px;">
        <div class="forge-stat-card">
            <div class="forge-stat-icon" style="background: #3498db;">
                <span class="dashicons dashicons-chart-line"></span>
            </div>
            <div class="forge-stat-content">
                <h3><?php echo esc_html($stats['total']); ?></h3>
                <p><?php _e('Total Quotes', 'forge-dashboard'); ?></p>
            </div>
        </div>

        <div class="forge-stat-card">
            <div class="forge-stat-icon" style="background: #f0ad4e;">
                <span class="dashicons dashicons-clock"></span>
            </div>
            <div class="forge-stat-content">
                <h3><?php echo esc_html($stats['pending']); ?></h3>
                <p><?php _e('Pending Review', 'forge-dashboard'); ?></p>
            </div>
        </div>

        <div class="forge-stat-card">
            <div class="forge-stat-icon" style="background: #5bc0de;">
                <span class="dashicons dashicons-admin-generic"></span>
            </div>
            <div class="forge-stat-content">
                <h3><?php echo esc_html($stats['processing']); ?></h3>
                <p><?php _e('Processing', 'forge-dashboard'); ?></p>
            </div>
        </div>

        <div class="forge-stat-card">
            <div class="forge-stat-icon" style="background: #5cb85c;">
                <span class="dashicons dashicons-yes-alt"></span>
            </div>
            <div class="forge-stat-content">
                <h3><?php echo esc_html($stats['completed']); ?></h3>
                <p><?php _e('Completed', 'forge-dashboard'); ?></p>
            </div>
        </div>
    </div>

    <div class="forge-dashboard-row" style="margin-top: 30px;">
        <!-- Recent Activity -->
        <div class="forge-dashboard-col-60">
            <div class="forge-card">
                <div class="forge-card-header">
                    <h2><?php _e('Recent Quotes', 'forge-dashboard'); ?></h2>
                    <a href="<?php echo admin_url('admin.php?page=forge-quotes'); ?>" class="button button-secondary">
                        <?php _e('View All', 'forge-dashboard'); ?>
                    </a>
                </div>
                <div class="forge-card-body">
                    <?php if (!empty($stats['recent'])) : ?>
                        <table class="widefat striped">
                            <thead>
                                <tr>
                                    <th><?php _e('Quote ID', 'forge-dashboard'); ?></th>
                                    <th><?php _e('Customer', 'forge-dashboard'); ?></th>
                                    <th><?php _e('Material', 'forge-dashboard'); ?></th>
                                    <th><?php _e('Status', 'forge-dashboard'); ?></th>
                                    <th><?php _e('Date', 'forge-dashboard'); ?></th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($stats['recent'] as $quote) :
                                    $model_data = isset($quote['model_data']) && is_string($quote['model_data'])
                                        ? json_decode($quote['model_data'], true)
                                        : array();
                                    $quote_id = isset($model_data['quoteId']) ? $model_data['quoteId'] : 'N/A';
                                    $view_url = add_query_arg(array(
                                        'page' => 'forge-view-quote',
                                        'id'   => $quote['id']
                                    ), admin_url('admin.php'));
                                ?>
                                    <tr>
                                        <td>
                                            <a href="<?php echo esc_url($view_url); ?>">
                                                <strong><?php echo esc_html($quote_id); ?></strong>
                                            </a>
                                        </td>
                                        <td><?php echo esc_html($quote['name']); ?></td>
                                        <td><?php echo esc_html($quote['material']); ?></td>
                                        <td>
                                            <?php
                                            $status = $quote['status'];
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
                                            $label = isset(Forge_Quote_Manager::VALID_STATUSES[$status]) ? Forge_Quote_Manager::VALID_STATUSES[$status] : ucfirst($status);
                                            ?>
                                            <span class="forge-status-badge" style="background: <?php echo esc_attr($color); ?>;">
                                                <?php echo esc_html($label); ?>
                                            </span>
                                        </td>
                                        <td><?php echo esc_html(date('M j, Y', strtotime($quote['created_at']))); ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    <?php else : ?>
                        <p><?php _e('No quotes found.', 'forge-dashboard'); ?></p>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <!-- Statistics Sidebar -->
        <div class="forge-dashboard-col-40">
            <!-- Time-based stats -->
            <div class="forge-card">
                <div class="forge-card-header">
                    <h2><?php _e('Activity', 'forge-dashboard'); ?></h2>
                </div>
                <div class="forge-card-body">
                    <div class="forge-stat-row">
                        <span><?php _e('Today', 'forge-dashboard'); ?></span>
                        <strong><?php echo esc_html($stats['today']); ?> <?php _e('quotes', 'forge-dashboard'); ?></strong>
                    </div>
                    <div class="forge-stat-row">
                        <span><?php _e('This Week', 'forge-dashboard'); ?></span>
                        <strong><?php echo esc_html($stats['week']); ?> <?php _e('quotes', 'forge-dashboard'); ?></strong>
                    </div>
                    <div class="forge-stat-row">
                        <span><?php _e('This Month', 'forge-dashboard'); ?></span>
                        <strong><?php echo esc_html($stats['month']); ?> <?php _e('quotes', 'forge-dashboard'); ?></strong>
                    </div>
                    <hr>
                    <div class="forge-stat-row">
                        <span><?php _e('Revenue Estimate', 'forge-dashboard'); ?></span>
                        <strong style="color: #5cb85c;">€<?php echo number_format($stats['revenue_estimate'], 2); ?></strong>
                    </div>
                </div>
            </div>

            <!-- Popular Materials -->
            <div class="forge-card" style="margin-top: 20px;">
                <div class="forge-card-header">
                    <h2><?php _e('Popular Materials', 'forge-dashboard'); ?></h2>
                </div>
                <div class="forge-card-body">
                    <?php if (!empty($stats['materials'])) :
                        arsort($stats['materials']);
                        $total_materials = array_sum($stats['materials']);
                        $count = 0;
                        foreach ($stats['materials'] as $material => $qty) :
                            if ($count++ >= 5) break; // Show top 5
                            $percentage = $total_materials > 0 ? ($qty / $total_materials) * 100 : 0;
                    ?>
                        <div class="forge-material-stat">
                            <div class="forge-material-info">
                                <span class="forge-material-name"><?php echo esc_html($material); ?></span>
                                <span class="forge-material-count"><?php echo esc_html($qty); ?> (<?php echo number_format($percentage, 1); ?>%)</span>
                            </div>
                            <div class="forge-progress-bar">
                                <div class="forge-progress-fill" style="width: <?php echo esc_attr($percentage); ?>%;"></div>
                            </div>
                        </div>
                    <?php
                        endforeach;
                    else : ?>
                        <p><?php _e('No material data available.', 'forge-dashboard'); ?></p>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>
