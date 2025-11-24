/**
 * Forge Dashboard Admin JavaScript
 */

(function($) {
    'use strict';

    /**
     * Delete Quote Handler (for list view)
     */
    $(document).on('click', '.forge-delete-quote', function(e) {
        e.preventDefault();

        if (!confirm(forgeAjax.confirmDelete)) {
            return;
        }

        var $link = $(this);
        var quoteId = $link.data('quote-id');
        var $row = $link.closest('tr');

        // Show loading state
        $link.text('Deleting...');

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
                    // Fade out and remove row
                    $row.fadeOut(400, function() {
                        $(this).remove();

                        // Check if table is now empty
                        if ($('.wp-list-table tbody tr').length === 0) {
                            location.reload();
                        }
                    });
                } else {
                    alert(response.data.message || 'An error occurred');
                    $link.text('Delete');
                }
            },
            error: function() {
                alert('An error occurred. Please try again.');
                $link.text('Delete');
            }
        });
    });

    /**
     * Auto-refresh Dashboard Stats (every 30 seconds)
     */
    if ($('.forge-dashboard').length) {
        setInterval(function() {
            refreshDashboardStats();
        }, 30000);
    }

    function refreshDashboardStats() {
        $.ajax({
            url: forgeAjax.ajaxUrl,
            type: 'POST',
            data: {
                action: 'forge_get_stats',
                nonce: forgeAjax.nonce
            },
            success: function(response) {
                if (response.success && response.data) {
                    updateStatsDisplay(response.data);
                }
            }
        });
    }

    function updateStatsDisplay(stats) {
        // Update stat cards
        $('.forge-stat-card').each(function() {
            var $card = $(this);
            var $value = $card.find('h3');
            var text = $value.text();

            // Determine which stat this is
            if ($card.find('p').text().includes('Total')) {
                $value.text(stats.total || 0);
            } else if ($card.find('p').text().includes('Pending')) {
                $value.text(stats.pending || 0);
            } else if ($card.find('p').text().includes('Processing')) {
                $value.text(stats.processing || 0);
            } else if ($card.find('p').text().includes('Completed')) {
                $value.text(stats.completed || 0);
            }
        });
    }

    /**
     * Confirmation for Bulk Delete
     */
    $('#doaction, #doaction2').on('click', function(e) {
        var action = $(this).siblings('select').val();

        if (action === 'delete') {
            if (!confirm('Are you sure you want to delete the selected quotes? This action cannot be undone.')) {
                e.preventDefault();
                return false;
            }
        }
    });

    /**
     * Filter Form Enhancement
     */
    $('#filter-status, #filter-material').on('change', function() {
        $(this).closest('form').submit();
    });

    /**
     * Real-time Search Enhancement
     */
    var searchTimeout;
    var $searchInput = $('input[name="s"]');

    if ($searchInput.length) {
        $searchInput.on('input', function() {
            clearTimeout(searchTimeout);
            var $form = $(this).closest('form');

            searchTimeout = setTimeout(function() {
                if ($searchInput.val().length >= 3 || $searchInput.val().length === 0) {
                    $form.submit();
                }
            }, 500);
        });
    }

    /**
     * Copy to Clipboard
     */
    $(document).on('click', '.forge-copy-to-clipboard', function(e) {
        e.preventDefault();

        var $btn = $(this);
        var text = $btn.data('text');

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function() {
                showCopySuccess($btn);
            }).catch(function() {
                fallbackCopyToClipboard(text, $btn);
            });
        } else {
            fallbackCopyToClipboard(text, $btn);
        }
    });

    function fallbackCopyToClipboard(text, $btn) {
        var $temp = $('<textarea>');
        $('body').append($temp);
        $temp.val(text).select();
        document.execCommand('copy');
        $temp.remove();
        showCopySuccess($btn);
    }

    function showCopySuccess($btn) {
        var originalText = $btn.text();
        $btn.text('Copied!');

        setTimeout(function() {
            $btn.text(originalText);
        }, 2000);
    }

    /**
     * Sortable Columns Animation
     */
    $('.wp-list-table th.sortable a, .wp-list-table th.sorted a').on('click', function() {
        var $table = $(this).closest('table');
        $table.css('opacity', '0.5');
    });

    /**
     * Row Actions Enhancement
     */
    $('.wp-list-table tbody tr').hover(
        function() {
            $(this).find('.row-actions').css('visibility', 'visible');
        },
        function() {
            $(this).find('.row-actions').css('visibility', 'hidden');
        }
    );

    /**
     * Export Confirmation
     */
    $('.forge-export-btn').on('click', function(e) {
        var count = $('.wp-list-table tbody tr').length;

        if (count === 0) {
            e.preventDefault();
            alert('No quotes to export.');
            return false;
        }

        return confirm('Export ' + count + ' quote(s) to CSV?');
    });

    /**
     * Status Color Picker (if needed in future)
     */
    if (typeof $.fn.wpColorPicker !== 'undefined') {
        $('.forge-color-picker').wpColorPicker();
    }

    /**
     * Tooltip Enhancement
     */
    $(document).on('mouseenter', '[data-tooltip]', function() {
        var $elem = $(this);
        var tooltipText = $elem.data('tooltip');

        if (!tooltipText) return;

        var $tooltip = $('<div class="forge-tooltip-popup">' + tooltipText + '</div>');
        $('body').append($tooltip);

        var offset = $elem.offset();
        var elemWidth = $elem.outerWidth();
        var elemHeight = $elem.outerHeight();
        var tooltipWidth = $tooltip.outerWidth();
        var tooltipHeight = $tooltip.outerHeight();

        $tooltip.css({
            top: offset.top - tooltipHeight - 10 + 'px',
            left: offset.left + (elemWidth / 2) - (tooltipWidth / 2) + 'px',
            opacity: 1
        });

        $elem.data('tooltip-element', $tooltip);
    }).on('mouseleave', '[data-tooltip]', function() {
        var $elem = $(this);
        var $tooltip = $elem.data('tooltip-element');

        if ($tooltip) {
            $tooltip.fadeOut(200, function() {
                $(this).remove();
            });
        }
    });

    /**
     * Responsive Table Enhancement
     */
    function makeTablesResponsive() {
        if ($(window).width() < 782) {
            $('.wp-list-table').addClass('forge-responsive-table');
        } else {
            $('.wp-list-table').removeClass('forge-responsive-table');
        }
    }

    makeTablesResponsive();
    $(window).on('resize', makeTablesResponsive);

    /**
     * Keyboard Shortcuts
     */
    $(document).on('keydown', function(e) {
        // Ctrl/Cmd + K: Focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            $('input[name="s"]').focus();
        }

        // Escape: Clear search
        if (e.key === 'Escape' && $('input[name="s"]').is(':focus')) {
            $('input[name="s"]').val('').blur();
        }
    });

    /**
     * Loading Spinner Utility
     */
    window.forgeShowLoading = function(selector) {
        $(selector).append('<span class="forge-loading"></span>');
    };

    window.forgeHideLoading = function(selector) {
        $(selector).find('.forge-loading').remove();
    };

    /**
     * Notice Dismissal
     */
    $(document).on('click', '.notice-dismiss', function() {
        $(this).closest('.notice').fadeOut();
    });

    /**
     * Smooth Scroll
     */
    $('a[href^="#"]').on('click', function(e) {
        var target = $(this.hash);

        if (target.length) {
            e.preventDefault();
            $('html, body').animate({
                scrollTop: target.offset().top - 32
            }, 500);
        }
    });

    /**
     * Auto-save Settings (debounced)
     */
    var settingsSaveTimeout;
    $('.forge-settings input, .forge-settings select').on('change', function() {
        clearTimeout(settingsSaveTimeout);

        var $form = $(this).closest('form');
        var $saveButton = $form.find('input[type="submit"]');

        // Highlight save button
        $saveButton.addClass('button-primary-highlight');

        settingsSaveTimeout = setTimeout(function() {
            $saveButton.removeClass('button-primary-highlight');
        }, 2000);
    });

    /**
     * Dashboard Welcome Message (first time)
     */
    if ($('.forge-dashboard').length && !localStorage.getItem('forge_welcome_dismissed')) {
        // Could show a welcome message here if needed
    }

    /**
     * Print Functionality
     */
    $('.forge-print-quote').on('click', function(e) {
        e.preventDefault();
        window.print();
    });

    /**
     * Initialize
     */
    $(document).ready(function() {
        // Add current page class to body
        if ($('.forge-dashboard').length) {
            $('body').addClass('forge-page-dashboard');
        } else if ($('.forge-quotes-list').length) {
            $('body').addClass('forge-page-quotes');
        } else if ($('.forge-quote-details').length) {
            $('body').addClass('forge-page-quote-details');
        } else if ($('.forge-settings').length) {
            $('body').addClass('forge-page-settings');
        }

        // Add loading class to form submits
        $('form').on('submit', function() {
            $(this).find('input[type="submit"]').prop('disabled', true).addClass('forge-loading');
        });
    });

})(jQuery);
