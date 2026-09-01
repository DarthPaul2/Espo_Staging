Espo.define('custom:views/c-zahlung/record/panels/ausgleiche', ['views/record/panels/relationship'], function (Dep) {

    return Dep.extend({

        // Что это:
        // Setzt beim Anlegen eines Ausgleichs aus der Zahlung heraus sofort die passende
        // Richtung (Forderungs-/Verbindlichkeitsausgleich), abgeleitet aus der Zahlungsrichtung
        // dieser Zahlung — noch bevor das Formular überhaupt gerendert wird.
        //
        // Зачем:
        // Ohne das zeigt das Quick-Create-Formular beide Felder (Rechnung/Eingangsrechnung)
        // gleichzeitig, obwohl anhand der Zahlungsrichtung schon klar ist, welches gemeint ist
        // (Zahlung an Lieferant -> nur Eingangsrechnung sinnvoll, Zahlung von Kunde -> nur Rechnung).
        //
        // Wie: views/record/panels/relationship hat in dieser Espo-Version kein
        // "getCreateAttributes"-Hook — der "+"-Button ruft direkt actionCreateRelated auf, das
        // intern createView() für das Quick-Create-Modal aufruft. Deshalb wird hier createView()
        // für genau einen Aufruf abgefangen, um "attributes.richtung" zu ergänzen, statt
        // actionCreateRelated komplett neu zu implementieren (sonst müsste die gesamte
        // Original-Logik — Verlinkung, ACL-Prüfung usw. — riskant nachgebaut werden).
        actionCreateRelated: function () {
            var zahlungsRichtung = this.model.get('zahlungsRichtung');
            var richtung = null;

            if (zahlungsRichtung === 'eingang') {
                richtung = 'forderungsausgleich';
            } else if (zahlungsRichtung === 'ausgang') {
                richtung = 'verbindlichkeitsausgleich';
            }

            if (!richtung) {
                return Dep.prototype.actionCreateRelated.call(this);
            }

            var self = this;
            var originalCreateView = this.createView;

            this.createView = function (key, viewName, options, callback, context) {
                self.createView = originalCreateView;

                options = options || {};
                options.attributes = options.attributes || {};

                if (!('richtung' in options.attributes)) {
                    options.attributes.richtung = richtung;
                }

                return originalCreateView.call(self, key, viewName, options, callback, context);
            };

            return Dep.prototype.actionCreateRelated.call(this);
        }

    });
});
