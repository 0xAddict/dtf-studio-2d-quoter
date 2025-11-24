<?php
/**
 * Settings View
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div class="wrap forge-settings">
    <h1><?php _e('Forge Dashboard Settings', 'forge-dashboard'); ?></h1>

    <?php settings_errors(); ?>

    <?php if ($test_result !== null) : ?>
        <div class="notice <?php echo $test_result['success'] ? 'notice-success' : 'notice-error'; ?> is-dismissible">
            <p><strong><?php echo esc_html($test_result['message']); ?></strong></p>
        </div>
    <?php endif; ?>

    <div class="forge-settings-grid">
        <div class="forge-settings-main">
            <form method="post" action="options.php">
                <?php
                settings_fields('forge_settings');
                do_settings_sections('forge-dashboard-settings');
                submit_button();
                ?>
            </form>
        </div>

        <div class="forge-settings-sidebar">
            <!-- Test Connection -->
            <div class="forge-card">
                <div class="forge-card-header">
                    <h2><?php _e('Test Connection', 'forge-dashboard'); ?></h2>
                </div>
                <div class="forge-card-body">
                    <p><?php _e('Test your Supabase connection to ensure everything is configured correctly.', 'forge-dashboard'); ?></p>

                    <form method="post">
                        <?php wp_nonce_field('forge-test-connection'); ?>
                        <button type="submit" name="test_connection" class="button button-secondary" style="width: 100%;">
                            <?php _e('Test Connection', 'forge-dashboard'); ?>
                        </button>
                    </form>
                </div>
            </div>

            <!-- Help & Documentation -->
            <div class="forge-card" style="margin-top: 20px;">
                <div class="forge-card-header">
                    <h2><?php _e('Help & Documentation', 'forge-dashboard'); ?></h2>
                </div>
                <div class="forge-card-body">
                    <h4><?php _e('Getting Started', 'forge-dashboard'); ?></h4>
                    <ol style="margin-left: 20px;">
                        <li><?php _e('Get your Supabase project URL and service role key from your Supabase dashboard', 'forge-dashboard'); ?></li>
                        <li><?php _e('Enter the credentials in the Supabase Configuration section', 'forge-dashboard'); ?></li>
                        <li><?php _e('Click "Test Connection" to verify everything works', 'forge-dashboard'); ?></li>
                        <li><?php _e('Start managing your quotes!', 'forge-dashboard'); ?></li>
                    </ol>

                    <h4 style="margin-top: 15px;"><?php _e('Where to Find Credentials', 'forge-dashboard'); ?></h4>
                    <ul style="margin-left: 20px;">
                        <li>
                            <strong><?php _e('Supabase URL:', 'forge-dashboard'); ?></strong>
                            <?php _e('Settings → API → Project URL', 'forge-dashboard'); ?>
                        </li>
                        <li>
                            <strong><?php _e('Service Role Key:', 'forge-dashboard'); ?></strong>
                            <?php _e('Settings → API → service_role (secret key)', 'forge-dashboard'); ?>
                        </li>
                    </ul>

                    <p style="margin-top: 15px;">
                        <strong><?php _e('Important:', 'forge-dashboard'); ?></strong>
                        <?php _e('Always use the service_role key (not the anon key) for admin operations. Keep this key secure and never expose it publicly.', 'forge-dashboard'); ?>
                    </p>
                </div>
            </div>

            <!-- Plugin Info -->
            <div class="forge-card" style="margin-top: 20px;">
                <div class="forge-card-header">
                    <h2><?php _e('Plugin Information', 'forge-dashboard'); ?></h2>
                </div>
                <div class="forge-card-body">
                    <table class="forge-detail-table">
                        <tr>
                            <th><?php _e('Version:', 'forge-dashboard'); ?></th>
                            <td><?php echo FORGE_VERSION; ?></td>
                        </tr>
                        <tr>
                            <th><?php _e('PHP Version:', 'forge-dashboard'); ?></th>
                            <td><?php echo PHP_VERSION; ?></td>
                        </tr>
                        <tr>
                            <th><?php _e('WordPress Version:', 'forge-dashboard'); ?></th>
                            <td><?php echo get_bloginfo('version'); ?></td>
                        </tr>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.forge-settings-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    margin-top: 20px;
}

@media (max-width: 1200px) {
    .forge-settings-grid {
        grid-template-columns: 1fr;
    }
}

.forge-detail-table {
    width: 100%;
}

.forge-detail-table th {
    text-align: left;
    padding-right: 10px;
    vertical-align: top;
    width: 40%;
}

.forge-detail-table td {
    padding: 5px 0;
}
</style>
