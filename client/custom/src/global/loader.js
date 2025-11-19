define('custom:global/loader', ['jquery'], function ($) {

    const LOADER_ID = 'global-loader';

    function createLoaderHtml(text) {
        const safeText = text || 'Bitte warten...';
        return `
            <div id="${LOADER_ID}" class="global-loader">
                <div class="global-loader-text"
                     style="margin-top: 64px; font-size: 15px; color: #2a3f54; font-weight: 500; text-align: center;">
                     ${safeText}
                </div>
            </div>`;
    }

    function getLoaderEl() {
        return $('#' + LOADER_ID);
    }

    function disableButtonsForView(view) {
        if (!view || !view.$el) return;

        view.$el.find('button, .btn').each(function () {
            const $btn = $(this);

            if ($btn.prop('disabled')) {
                return;
            }

            $btn.data('kls-loader-was-enabled', true);
            $btn.prop('disabled', true).addClass('kls-loader-disabled');
        });
    }

    function enableButtonsForView(view) {
        if (!view || !view.$el) return;

        view.$el.find('button, .btn').each(function () {
            const $btn = $(this);

            if ($btn.data('kls-loader-was-enabled')) {
                $btn.prop('disabled', false)
                    .removeClass('kls-loader-disabled')
                    .removeData('kls-loader-was-enabled');
            }
        });
    }

    return {

        show: function (text) {
            const $loader = getLoaderEl();
            if ($loader.length) {
                if (text) {
                    $loader.find('.global-loader-text').text(text);
                }
                return;
            }

            $('body').append(createLoaderHtml(text));
        },

        hide: function () {
            getLoaderEl().remove();
        },

        showFor: function (view, text) {
            disableButtonsForView(view);
            this.show(text || 'Wird geladen…');
        },

        hideFor: function (view) {
            enableButtonsForView(view);
            this.hide();
        }
    };
});
