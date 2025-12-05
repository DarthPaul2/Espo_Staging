define('custom:views/fields/gesamtbetrag', ['views/fields/currency'], function (Dep) {
    return Dep.extend({
        setup: function () {
            Dep.prototype.setup.call(this);
        },
        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            if (this.model.get('gesamtbetrag') > 0) {
                this.$el.css({
                    'font-weight': 'bold',
                    'color': '#000000ff',
                    'background-color': '#ffc7c7ff'
                });
            }
        }
    });
});
