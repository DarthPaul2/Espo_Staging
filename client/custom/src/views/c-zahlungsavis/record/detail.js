// custom:c-zahlungsavis/record/detail
define('custom:views/c-zahlungsavis/record/detail', [
    'views/record/detail'
], function (Dep) {

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

        FLASK_BASE: 'https://klesec.pagekite.me/api',

        setup: function () {
            Dep.prototype.setup.call(this);

            this.buttonList = this.buttonList || [];
            this.buttonList.push({
                name: 'pdfNeuErstellen',
                label: 'PDF neu erstellen',
                style: 'primary',
                title: 'PDF anhand der aktuellen Positionen neu erzeugen und speichern'
            });

            // Что это: Gesamt wird server-seitig per Hook neu berechnet, sobald eine
            // Position entfernt/hinzugefügt wird — das Model hier weiß davon aber nichts,
            // bis wir es neu laden. Espo feuert nach Remove/Link diese Events selbst.
            this.listenTo(this.model, 'after:unrelate:zahlungsavisPosition after:relate:zahlungsavisPosition', () => {
                this.model.fetch();
            });
        },

        actionPdfNeuErstellen: function () {
            const id = this.model && this.model.id;
            if (!id) {
                Espo.Ui.error('Kein Datensatz-ID.');
                return;
            }

            const url = this.FLASK_BASE + '/zahlungsavis/' + encodeURIComponent(id) + '/save_pdf';
            const notifyId = this.notify('PDF wird neu erzeugt…', 'loading');

            fetch(url, {method: 'POST'})
                .then((r) => r.json().then((resp) => ({ok: r.ok, resp: resp})))
                .then(({ok, resp}) => {
                    if (!ok || !resp.pdfUrl) {
                        throw new Error((resp && resp.error) || 'PDF konnte nicht erzeugt werden');
                    }

                    this.model.fetch().then(() => {
                        this.notify(false, 'loading', notifyId);
                        Espo.Ui.success('PDF neu erstellt');
                        window.open(resp.pdfUrl, '_blank');
                    });
                })
                .catch((err) => {
                    this.notify(false, 'loading', notifyId);
                    Espo.Ui.error(err.message);
                });
        }

    });
});
