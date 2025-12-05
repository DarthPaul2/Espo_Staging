define('custom:views/fields/verrechnet-auftrag', ['views/fields/currency'], function (Dep) {

    return Dep.extend({

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            // Открываем модельное значение (не важно, какое оно)
            var v = this.model.get(this.name);

            // Базовый стиль – ОДИН постоянный цвет
            this.$el.css({
                'background-color': '#d8f7d8',   // Нежно-зелёный (как restbetrag)
                'color': '#000000',
                'font-weight': '600',
                'border-radius': '6px',
                'padding': '4px 6px',
            });
        }
    });
});

