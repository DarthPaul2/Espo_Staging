Espo.define('custom:handbuch', ['controllers/base'], function (Dep) {

    return Dep.extend({

        actionIndex: function () {
            this.main('custom:views/handbuch/index');
        }

    });
});
