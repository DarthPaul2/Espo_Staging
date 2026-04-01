define('custom:views/c-eingangsrechnungsposition/record/edit', ['views/record/edit'], function (Dep) {
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

            // Что это: при открытии формы тоже сразу считаем.
            this.recalculateGesamtNetto();
        },

        recalculateGesamtNetto() {
            const menge = parseFloat(this.model.get('menge') || 0);
            const einzelpreisNetto = parseFloat(this.model.get('einzelpreisNetto') || 0);

            const gesamtNetto = Math.round(menge * einzelpreisNetto * 100) / 100;

            this.model.set('gesamtNetto', gesamtNetto);
        }

    });
});