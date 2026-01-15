Espo.define('controllers/whatsapp-admin', 'controller', function (Dep) {

    return Dep.extend({

        actionIndex: function () {
            this.main('custom:views/whatsapp/whatsapp-admin');
        }

    });

});
