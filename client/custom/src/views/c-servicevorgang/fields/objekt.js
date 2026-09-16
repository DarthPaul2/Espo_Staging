// client/custom/src/views/c-servicevorgang/fields/objekt.js
// Что это:
// Filtert die Objekt-Auswahl nach dem bereits gesetzten Kunden (falls vorhanden) — analog
// zu c-wartung/c-rechnung/c-angebot/fields/objekt.js. Anders als dort wird das Feld NIE
// versteckt und die Auswahl NIE eingeschränkt, solange kein Kunde gesetzt ist (zeigt dann
// alle Objekte). Zusätzlich (15.09.2026, auf Pavels Wunsch): umgekehrte Richtung — wird ein
// Objekt gewählt, das einen Kunden hat, UND ist "Kunde" noch leer, wird der Kunde automatisch
// übernommen. Hat das Objekt keinen Kunden, passiert nichts.
//
// Technische Lektion (15.09.26): erster Versuch nutzte einen separaten Espo.Ajax-Request
// NACH der Auswahl (change:objektId) — das lief in eine Race Condition mit der
// "Kunde ist Pflichtfeld"-Validierung, die schneller feuerte als der Request zurückkam
// (Speichern wurde blockiert, obwohl der Kunde eine Sekunde später korrekt gesetzt worden
// wäre). Espo hat für genau diesen Fall einen synchronen, eingebauten Mechanismus:
// getDependantForeignMap() kopiert Attribute aus dem GEWÄHLTEN Datensatz direkt beim Select,
// ganz ohne Netzwerk-Zwischenschritt — dafür braucht getMandatorySelectAttributeList()
// die Kunde-Felder, damit sie im Such-Ergebnis überhaupt mitkommen.

define('custom:views/c-servicevorgang/fields/objekt', 'views/fields/link', function (Dep) {

    return Dep.extend({

        // Kunde gesetzt -> nur dessen Objekte zeigen. Kunde leer -> alle Objekte (kein Filter).
        getSelectFilters: function () {
            const accountId = this.model.get('accountId');
            const accountName = this.model.get('accountName');

            if (!accountId) {
                return null;
            }

            return {
                byAccount: {
                    type: 'equals',
                    attribute: 'accountId',
                    value: accountId,
                    data: {
                        type: 'equals',
                        nameValue: accountName || ''
                    }
                }
            };
        },

        getMandatorySelectAttributeList: function () {
            return ['accountId', 'accountName'];
        },

        getDependantForeignMap: function () {
            if (this.model.get('accountId')) {
                return {};
            }

            return {
                accountId: 'accountId',
                accountName: 'accountName'
            };
        }

    });
});
