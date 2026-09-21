// client/custom/src/views/call/record/detail.js
// Что это:
// AW-Bianca-Gerd Punkt 7 (19.09.2026): "Wird beispielsweise 'Termin vereinbaren' ausgewählt,
// soll direkt die Möglichkeit zur Terminplanung geöffnet werden." — sobald "Ergebnis" auf
// "Termin vereinbaren" gesetzt wird, öffnet sich automatisch das native Espo-Anlegefenster für
// einen Termin (Meeting), vorbefüllt mit demselben Kunden/Ansprechpartner/Bezug wie der Anruf —
// damit nicht manuell in den Kalender gewechselt und der Zusammenhang neu gesucht werden muss.

define('custom:views/call/record/detail', ['views/record/detail', 'helpers/record-modal'], function (Dep, RecordModalHelper) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            this.listenTo(this.model, 'change:ergebnis', () => this.oeffneTerminplanungFallsGewuenscht_());
        },

        // Gleicher Fix wie in den anderen Entities mit eigenem record/detail.js (17.09.2026) -
        // scrollt zur unsichtbaren Espo-Validierungsmeldung statt nur ein generisches
        // "Ungültig"-Banner zu zeigen.
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

        oeffneTerminplanungFallsGewuenscht_: function () {
            if (this.model.get('ergebnis') !== 'terminVereinbaren') {
                return;
            }

            const attributes = {
                parentType: this.model.get('parentType'),
                parentId: this.model.get('parentId'),
                parentName: this.model.get('parentName'),
                accountId: this.model.get('accountId'),
                accountName: this.model.get('accountName'),
                contactsIds: this.model.get('contactsIds'),
                contactsNames: this.model.get('contactsNames'),
            };

            const helper = new RecordModalHelper();
            helper.showCreate(this, {
                entityType: 'Meeting',
                attributes: attributes,
            });
        }

    });
});
