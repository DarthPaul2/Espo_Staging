Espo.define('custom:ai-chat-full', ['controllers/base'], function (Dep) {
    return Dep.extend({
        actionIndex: function () {
            this.main('custom:views/ai-chat/index');
        },
    });
});
