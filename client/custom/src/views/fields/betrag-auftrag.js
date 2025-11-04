define('custom:views/fields/betrag-auftrag', ['views/fields/currency'], function (Dep) {
    return Dep.extend({
        setup: function () {
            Dep.prototype.setup.call(this);
        },
        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            var v = this.model.get(this.name); // универсально: сработает и для Netto, и для Brutto
            if (v == null) return;

            // Стиль для "суммы по заказу"
            // Аккуратный акцент: жирный + светло-жёлтый фон
            this.$el.css({
                'font-weight': '600',
                'color': '#000000',
                'background-color': '#fff7cc', // мягкий жёлтый
                'border-radius': '6px',
                'padding': '4px 6px'
            });
        }
    });
});
