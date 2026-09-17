// client/custom/src/views/c-servicevorgang/fields/mangel-festgestellt.js
// Что это:
// "Mangel festgestellt" ist ab 16.09.2026 (Pavels Entscheidung) kein manuell zu setzendes
// Feld mehr — ein Servicevorgang mit vorgangsart=wartung existiert per Definition NUR wegen
// eines gefundenen Mangels (siehe Panel-Hinweis "wartungshinweis"), daher wird die Checkbox
// automatisch gesetzt, sobald "Vorgangsart" auf "Wartung" steht, und ist read-only
// (entityDefs "readOnly": true) — Nutzer können sie nicht mehr abwählen. Serverseitig wird
// derselbe Wert zusätzlich in ValidateVorgangsart::beforeSave() erzwungen, damit das auch bei
// Speicherung über die API (nicht nur über dieses Formular) korrekt bleibt.

define('custom:views/c-servicevorgang/fields/mangel-festgestellt', 'views/fields/bool', function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            this.syncMitVorgangsart();
            this.listenTo(this.model, 'change:vorgangsart', () => this.syncMitVorgangsart());
        },

        syncMitVorgangsart: function () {
            this.model.set('mangelFestgestellt', this.model.get('vorgangsart') === 'wartung');
        }

    });
});
