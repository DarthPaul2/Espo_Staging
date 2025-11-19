define('custom:views/fields/restbetrag-auftrag', ['views/fields/currency'], function (Dep) {
    return Dep.extend({
        setup: function () {
            Dep.prototype.setup.call(this);
        },
        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            var v = this.model.get(this.name);
            if (v == null) return;

            // Стиль для "остатка": цвет по знаку
            // >0 (к оплате) – красный фон; =0 – зелёный; <0 (переплата) – оранжевый.
            var style = {
                'font-weight': '700',
                'color': '#000000',
                'border-radius': '6px',
                'padding': '4px 6px'
            };

            if (v > 0) {
                style['background-color'] = '#ffd6d6'; // красноватый
            } else if (v === 0) {
                style['background-color'] = '#d8f7d8'; // зеленоватый
            } else {
                style['background-color'] = '#ffe6bf'; // оранжевый (переплата)
            }

            this.$el.css(style);
        }
    });
});
