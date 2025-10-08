define('custom:global/loader', ['jquery'], function ($) {
    return {
        show: function (text) {
            if ($('#global-loader').length) return;
            $('body').append(
                '<div id="global-loader" class="global-loader">' +
                (text || 'Bitte warten...') +
                '</div>'
            );
        },
        hide: function () {
            $('#global-loader').remove();
        }
    };
});
