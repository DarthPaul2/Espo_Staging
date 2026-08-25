// custom:c-zahlungsavis/record/detail
define('custom:views/c-zahlungsavis/record/detail', [
    'views/record/detail'
], function (Dep) {

    return Dep.extend({

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
