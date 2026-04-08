define('custom:views/c-eingangsrechnung-import-position/record/edit-small', ['views/record/edit-small'], function (Dep) {
    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // Что это: слушаем изменение количества и цены в klein-форме.
            // Зачем: пользователь должен сразу видеть пересчитанный Gesamtbetrag.
            this.listenTo(this.model, 'change:menge change:einzelpreisNetto change:rabattProzent', this.recalculateGesamtNetto_);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.recalculateGesamtNetto_();
        },

        recalculateGesamtNetto_: function () {
            const mengeRaw = this.model.get('menge');
            const einzelpreisRaw = this.model.get('einzelpreisNetto');
            const rabattRaw = this.model.get('rabattProzent');

            const menge = mengeRaw !== null && mengeRaw !== '' ? parseFloat(mengeRaw) : null;
            const einzelpreis = einzelpreisRaw !== null && einzelpreisRaw !== '' ? parseFloat(einzelpreisRaw) : null;
            let rabattProzent = rabattRaw !== null && rabattRaw !== '' ? parseFloat(rabattRaw) : 0;

            if (menge === null || einzelpreis === null || isNaN(menge) || isNaN(einzelpreis)) {
                return;
            }

            if (isNaN(rabattProzent) || rabattProzent < 0) {
                rabattProzent = 0;
            }

            const bruttoZeileNetto = menge * einzelpreis;
            const rabattBetrag = this.round2_(bruttoZeileNetto * rabattProzent / 100);
            const gesamt = this.round2_(bruttoZeileNetto - rabattBetrag);

            this.model.set('rabattBetrag', rabattBetrag, { silent: false });
            this.model.set('gesamtNetto', gesamt, { silent: false });

            const rabattFieldView = this.getFieldView('rabattBetrag');
            if (rabattFieldView && typeof rabattFieldView.reRender === 'function') {
                rabattFieldView.reRender();
            }

            const gesamtFieldView = this.getFieldView('gesamtNetto');
            if (gesamtFieldView && typeof gesamtFieldView.reRender === 'function') {
                gesamtFieldView.reRender();
            }
        },

        round2_: function (value) {
            return Math.round((value + Number.EPSILON) * 100) / 100;
        }
    });
});