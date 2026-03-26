// Что это:
// Кастомный list view для CBuchhaltungAuswertung.
// Убирает Löschen у строк и массовое удаление сверху.

define('custom:views/c-buchhaltung-auswertung/record/list', ['views/record/list'], function (Dep) {
    return Dep.extend({

        rowActionsView: 'views/record/row-actions/view-and-edit',

        setup() {
            Dep.prototype.setup.call(this);
        },

        afterRender() {
            Dep.prototype.afterRender.call(this);

            const hide = () => {
                // верхние массовые действия
                this.$el.find('[data-action="removeSelected"]').hide();
                this.$el.find('[data-action="deleteSelected"]').hide();

                this.$el.find('button[data-action="removeSelected"]').hide();
                this.$el.find('button[data-action="deleteSelected"]').hide();

                this.$el.find('a[data-action="removeSelected"]').closest('li').hide();
                this.$el.find('a[data-action="deleteSelected"]').closest('li').hide();

                // если Espo рисует это как пункт в общем dropdown Aktionen
                this.$el.find('[data-action="massRemove"]').hide();
                this.$el.find('[data-action="massDelete"]').hide();
                this.$el.find('a[data-action="massRemove"]').closest('li').hide();
                this.$el.find('a[data-action="massDelete"]').closest('li').hide();

                // дополнительная страховка по тексту пункта меню
                this.$el.find('.dropdown-menu li').each(function () {
                    const text = ($(this).text() || '').trim().toLowerCase();
                    if (text === 'löschen' || text === 'delete' || text === 'remove') {
                        $(this).hide();
                    }
                });
            };

            hide();
            window.requestAnimationFrame(hide);
            setTimeout(hide, 50);
            setTimeout(hide, 200);
        }
    });
});