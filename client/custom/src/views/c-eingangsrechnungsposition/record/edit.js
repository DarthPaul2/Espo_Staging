define('custom:views/c-eingangsrechnungsposition/record/edit', ['views/record/edit'], function (Dep) {
    return Dep.extend({

        // 17.09.2026, Pavel: beim Speichern mit leerem Pflichtfeld zeigt Espo nur ganz oben
        // ein generisches "Ungültig"-Banner - die eigentliche Meldung existiert bereits als
        // Popover direkt am betroffenen Feld, ist aber unsichtbar, wenn der Nutzer weiter
        // oben im Formular steht. Rein additiv (Dep.prototype.afterNotValid laeuft zuerst
        // unveraendert) - scrollt zusaetzlich zum sichtbar gewordenen Popover.
        afterNotValid: function () {
            Dep.prototype.afterNotValid.call(this);

            setTimeout(() => {
                const popovers = document.querySelectorAll('.popover');
                const popover = popovers.length ? popovers[popovers.length - 1] : null;

                if (popover) {
                    popover.scrollIntoView({behavior: 'smooth', block: 'center'});
                }
            }, 50);
        },

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