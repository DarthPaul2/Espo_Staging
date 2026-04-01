define('custom:views/c-eingangsrechnungsposition/record/edit-small', ['views/record/edit-small'], function (Dep) {
    return Dep.extend({

        setup() {
            Dep.prototype.setup.call(this);

            // Что это: пересчитываем сумму строки при изменении количества.
            this.listenTo(this.model, 'change:menge', () => {
                this.recalculateGesamtNetto();
            });

            // Что это: пересчитываем сумму строки при изменении цены.
            this.listenTo(this.model, 'change:einzelpreisNetto', () => {
                this.recalculateGesamtNetto();
            });

            // Что это: при открытии маленькой формы тоже сразу считаем.
            this.recalculateGesamtNetto();
        },

        recalculateGesamtNetto() {
            const menge = parseFloat(this.model.get('menge') || 0);
            const einzelpreisNetto = parseFloat(this.model.get('einzelpreisNetto') || 0);

            const gesamtNetto = Math.round(menge * einzelpreisNetto * 100) / 100;

            this.model.set('gesamtNetto', gesamtNetto);
        },

        afterSave() {
            // Что это: сначала даём Espo выполнить стандартное поведение после сохранения.
            Dep.prototype.afterSave.call(this);

            // Что это: после сохранения позиции перезагружаем страницу входящего счёта,
            // чтобы в шапке сразу появились уже пересчитанные сервером суммы.
            setTimeout(() => {
                window.location.reload();
            }, 300);
        }

    });
});