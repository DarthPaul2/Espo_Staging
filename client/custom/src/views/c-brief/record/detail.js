// custom:c-brief/record/detail
console.log('[LOAD] custom:views/c-brief/record/detail');

define('custom:views/c-brief/record/detail', [
    'views/record/detail',
    'custom:global/loader'
], function (Dep, Loader) {

    const LOG_NS = '[CBrief/detail]';
    const L = (tag, payload) => { try { console.log(LOG_NS, tag, payload || ''); } catch (e) { } };

    return Dep.extend({

        FLASK_BASE: 'https://klesec.pagekite.me/api',

        showLoader(msg = 'Bitte warten…') {
            Loader.showFor(this, msg);
            return this.notify(msg, 'loading');
        },

        hideLoader(id) {
            Loader.hideFor(this);
            if (id) this.notify(false, 'loading', id);
        },

        setup: function () {
            Dep.prototype.setup.call(this);

            this.buttonList = this.buttonList || [];
            this.buttonList.push({
                name: 'createPdf',
                label: 'PDF erstellen',
                style: 'primary',
                title: 'PDF erzeugen und speichern'
            });
        },

        actionCreatePdf: function () {
            const id = this.model && this.model.id;
            if (!id) {
                Espo.Ui.error('Kein Datensatz-ID.');
                return;
            }

            const url = this.FLASK_BASE + '/brief/' + encodeURIComponent(id) + '/save_pdf';
            const notifyId = this.showLoader('PDF wird erzeugt…');

            fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            })
                .then(async (r) => {
                    const resp = await r.json().catch(() => null);
                    if (!r.ok || !resp) throw new Error('PDF Fehler (HTTP ' + r.status + ')');

                    const pdfUrl = resp.pdfUrl || resp.file;
                    if (!pdfUrl) throw new Error('PDF-URL fehlt in der Antwort.');

                    // ✅ ВАЖНО: обновляем в Espo ТОЛЬКО pdfUrl (PATCH),
                    // чтобы случайно не затереть name пустым значением.
                    return Espo.Ajax.patchRequest(
                        'CBrief/' + encodeURIComponent(id),
                        { pdfUrl: pdfUrl }
                    ).then(() => pdfUrl);
                })
                .then((pdfUrl) => {
                    // подтянуть свежие данные (в т.ч. name, который поставил Flask)
                    this.model.fetch({
                        success: () => {
                            this.hideLoader(notifyId);
                            Espo.Ui.success('PDF erstellt');
                            window.open(pdfUrl, '_blank');
                        },
                        error: () => {
                            this.hideLoader(notifyId);
                            Espo.Ui.success('PDF erstellt');
                            window.open(pdfUrl, '_blank');
                        }
                    });
                })
                .catch((err) => {
                    this.hideLoader(notifyId);
                    Espo.Ui.error('Serverfehler beim PDF-Erzeugen');
                    L('ERROR', err);
                    console.error(err);
                });
        }

    });

});
