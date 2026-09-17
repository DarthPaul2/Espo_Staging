// client/custom/src/views/c-projektteamzuordnung/record/edit.js
// Что это:
// Autogeneriert die Felder "Name" (gesperrt) und "Teamrolle" (weiter änderbar) aus
// Mitarbeiter + dessen aktiver(n) Rolle(n) (Rollencode + Rollenname aus CRollenzuordnung) —
// Pavel wollte weniger Handeingabe in der "Projektteamzuordnung erstellen"-Mini-Form
// (14.09.2026). Gilt für Mini-Form UND vollständiges Formular (gleiche View für
// "edit"+"editSmall").

define('custom:views/c-projektteamzuordnung/record/edit', ['views/record/edit'], function (Dep) {

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

        setup: function () {
            Dep.prototype.setup.call(this);

            this.setFieldReadOnly('name');
            this.listenTo(this.model, 'change:mitarbeiterId', () => this._updateFromMitarbeiter());
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this._updateFromMitarbeiter();
        },

        _updateFromMitarbeiter: function () {
            const userId = this.model.get('mitarbeiterId');
            const userName = this.model.get('mitarbeiterName');

            if (!userId) {
                this.model.set('name', '');
                return;
            }

            // Sofort einen Zwischenstand setzen (Pflichtfeld!), falls Speichern vor
            // Antwort des folgenden Requests geklickt wird.
            this.model.set('name', userName || '');

            Espo.Ajax.getRequest('CRollenzuordnung', {
                select: 'rolleName,rolleRollencode',
                where: [
                    {type: 'equals', attribute: 'inhaberId', value: userId},
                    {type: 'equals', attribute: 'status', value: 'aktiv'}
                ],
                maxSize: 5
            }).then((res) => {
                const rollenListe = (res.list || []).filter((r) => r.rolleRollencode);
                const rollen = rollenListe.map((r) => r.rolleRollencode + ' ' + r.rolleName).join(', ');

                this.model.set('name', (userName || '') + ' — ' + (rollen || 'ohne aktive Rolle'));

                const teamrolle = rollenListe.map((r) => r.rolleName).join(', ');
                this.model.set('teamrolle', teamrolle || '');
            }).catch(() => {
                this.model.set('name', userName || '');
            });
        }

    });
});
