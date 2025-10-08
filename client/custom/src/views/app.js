define('custom:views/app', ['views/app', 'custom:global/loader'], function (Dep, Loader) {
    return Dep.extend({

        afterLogin: function () {
            console.log('[custom:views/app] afterLogin override работает ✅');

            Dep.prototype.afterLogin.call(this);

            // отключаем проверку количества уведомлений
            if (this.getView('navbar')) {
                this.getView('navbar').runCheckUpdates = function () { };
            }

            // отключаем popup-уведомления
            this.checkGroupedPopupNotifications = function () { };

            // 🔹 Делаем Loader доступным глобально
            window.GlobalLoader = Loader;
        }
    });
});
