Espo.define('custom:whatsapp-admin', ['controllers/base'], function (Dep) {

    return Dep.extend({

        actionIndex: function () {
            this.main('custom:views/whatsapp/whatsapp-admin');
        }

    });
});
