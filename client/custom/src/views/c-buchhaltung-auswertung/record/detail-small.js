// Что это:
// Кастомный detail-small / header view для CBuchhaltungAuswertung.
// Убирает Löschen из стандартной карточки и верхних действий.

define('custom:views/c-buchhaltung-auswertung/record/detail-small', ['views/record/detail-small'], function (Dep) {
    return Dep.extend({

        setup() {
            Dep.prototype.setup.call(this);
        },

        afterRender() {
            Dep.prototype.afterRender.call(this);

            const hide = () => {
                this.$el.find('[data-action="remove"]').hide();
                this.$el.find('[data-action="delete"]').hide();
                this.$el.find('.action[data-action="remove"]').hide();
                this.$el.find('.action[data-action="delete"]').hide();
            };

            hide();
            window.requestAnimationFrame(hide);
            setTimeout(hide, 50);
            setTimeout(hide, 200);
        }
    });
});