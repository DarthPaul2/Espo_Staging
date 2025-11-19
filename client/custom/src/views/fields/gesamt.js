define('custom:views/fields/gesamt', ['views/fields/float'], function (Dep) {
    return Dep.extend({

        // полностью запрещаем любые попытки редактировать
        setup: function () {
            Dep.prototype.setup.call(this);
            this.readOnly = true;
            this.disabled = true;
            this.mode = 'detail';
        },

        // Espo иногда насильно включает inline-edit в списках.
        // Жёстко возвращаем false на любые проверки.
        isEditable: function () { return false; },
        isReadOnly: function () { return true; },
        isInlineEditEnabled: function () { return false; },

        // Гарантируем, что рендер всегда как detail (текст, без инпута)
        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.setMode('detail');
            // вырубаем любые клики внутри ячейки
            this.$el.css('pointer-events', 'none');
        }
    });
});
