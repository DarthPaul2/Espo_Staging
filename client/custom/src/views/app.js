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

            // 🤖 Роль пользователя для KI-Assistent (читается из kb-ai-chat.js)
            var currentUser = this.getUser();
            var userRole = 'mitarbeiter';
            if (currentUser) {
                if (currentUser.get('isAdmin')) {
                    userRole = 'admin';
                } else {
                    var rolesNames = currentUser.get('rolesNames') || {};
                    var roleValues = Object.keys(rolesNames).map(function (k) { return rolesNames[k]; });
                    if (roleValues.indexOf('Buchhaltung') !== -1) {
                        userRole = 'buchhaltung';
                    }
                }
            }
            window._kbUserRole = userRole;
        }
    });
});
