Espo.define('custom:views/whatsapp/whatsapp-admin', ['view'], function (Dep) {

    return Dep.extend({

        template: 'custom:whatsapp/whatsapp-admin',

        setup: function () {
            console.log('WHATSAPP ADMIN VIEW WORKS');
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            // ВАЖНО: запускать page.init() только после того, как template уже в DOM
            Espo.require('custom:whatsapp-admin-page', function (page) {
                try {
                    if (page && typeof page.init === 'function') {
                        page.init();
                        console.log('WHATSAPP ADMIN PAGE: init called from afterRender');
                    } else {
                        console.error('WHATSAPP ADMIN PAGE: module loaded, but no init()');
                    }
                } catch (e) {
                    console.error('WHATSAPP ADMIN PAGE: init failed', e);
                }
            }, function (err) {
                console.error('WHATSAPP ADMIN PAGE: require failed', err);
            });
        }

    });
});
