define('custom:views/c-arbeitszeit/record/edit', ['views/record/edit'], function (Dep) {

    return Dep.extend({
        setup: function () {
            Dep.prototype.setup.call(this);

            // После изменения start или end просто сохраняем — сервер всё сам пересчитает
            this.listenTo(this.model, 'change:startzeit change:endzeit', () => {
                this.model.save(null, { patch: true }); // обновляем запись
            });
        },
    });
});
