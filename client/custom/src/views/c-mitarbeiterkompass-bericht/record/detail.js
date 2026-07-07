// custom:views/c-mitarbeiterkompass-bericht/record/detail
console.log('[LOAD] custom:views/c-mitarbeiterkompass-bericht/record/detail');

define('custom:views/c-mitarbeiterkompass-bericht/record/detail', [
    'views/record/detail'
], function (Dep) {

    return Dep.extend({

        FLASK_BASE: 'https://klesec.pagekite.me/api',
        MAK_ADMIN_KEY: '695ad0833a216955409f468b136a024b0bfb8a7721988fe4825276d28246c479',

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this.stopListening(this.model, 'change:welleStatus');
            this.listenTo(this.model, 'change:welleStatus', () => this._renderWelleActions());

            this._renderWelleActions();
        },

        _periode: function () {
            const jahr = this.model.get('jahr');
            const halbjahr = this.model.get('halbjahr');
            if (!jahr || !halbjahr) return null;
            return jahr + '-' + halbjahr;
        },

        _renderWelleActions: function () {
            setTimeout(() => {
                const $actionBar = this.$el
                    .find('.detail-button-container, .header-button-container, .record-button-container')
                    .first();

                if (!$actionBar.length) {
                    setTimeout(() => this._renderWelleActions(), 300);
                    return;
                }

                this.$el.find('[data-name="mak-welle-actions"]').remove();

                const status = this.model.get('welleStatus');
                if (status !== 'versendet' && status !== 'geschlossen') {
                    return;
                }

                let buttons = '';
                if (status === 'versendet') {
                    buttons =
                        '<button class="btn btn-default" data-action="makErinnerungen">' +
                        'Erinnerungen an Unbeantwortete senden</button>' +
                        '<button class="btn btn-danger" data-action="makSchliessen">Welle schließen</button>';
                } else if (status === 'geschlossen') {
                    buttons = '<button class="btn btn-primary" data-action="makBericht">Bericht generieren</button>';
                }

                const $bar = $(
                    '<div data-name="mak-welle-actions" style="display: inline-flex; gap: 6px; ' +
                    'padding: 5px 8px; margin-top: 8px; margin-bottom: 8px; background: #fef3c7; ' +
                    'border-radius: 6px; border: 1px solid #fde68a;">' + buttons + '</div>'
                );
                $bar.insertAfter($actionBar);

                $bar.on('click', '[data-action="makErinnerungen"]', () => this._sendErinnerungen());
                $bar.on('click', '[data-action="makSchliessen"]', () => this._welleSchliessen());
                $bar.on('click', '[data-action="makBericht"]', () => this._berichtGenerieren());
            }, 400);
        },

        _sendErinnerungen: function () {
            const periode = this._periode();
            if (!periode) return;

            const notifyId = this.notify('Erinnerungen werden versendet …', 'loading');

            fetch(this.FLASK_BASE + '/mitarbeiterkompass/admin/wellen/' + periode + '/erinnerung-alle', {
                method: 'POST',
                headers: { 'X-Mak-Admin-Key': this.MAK_ADMIN_KEY }
            })
                .then((r) => r.json().then((data) => ({ ok: r.ok, data: data })))
                .then(({ ok, data }) => {
                    this.notify(false, 'loading', notifyId);
                    if (!ok || !data.success) {
                        Espo.Ui.error('Fehler: ' + ((data && data.error) || 'unbekannt'));
                        return;
                    }
                    let text = data.versendet + ' Erinnerung(en) versendet.';
                    if (data.fehler && data.fehler.length) {
                        text += ' Fehler bei: ' + data.fehler.map((f) => f.name).join(', ');
                    }
                    Espo.Ui.success(text);
                })
                .catch(() => {
                    this.notify(false, 'loading', notifyId);
                    Espo.Ui.error('Serverfehler beim Versenden der Erinnerungen.');
                });
        },

        _welleSchliessen: function () {
            const periode = this._periode();
            if (!periode) return;

            if (!confirm('Welle wirklich schließen? Danach können keine Antworten mehr eingereicht werden.')) {
                return;
            }

            const notifyId = this.notify('Welle wird geschlossen …', 'loading');

            fetch(this.FLASK_BASE + '/mitarbeiterkompass/admin/wellen/' + periode + '/schliessen', {
                method: 'POST',
                headers: { 'X-Mak-Admin-Key': this.MAK_ADMIN_KEY }
            })
                .then((r) => r.json().then((data) => ({ ok: r.ok, data: data })))
                .then(({ ok, data }) => {
                    if (!ok || !data.success) {
                        throw new Error((data && data.error) || 'unbekannt');
                    }
                    return Espo.Ajax.patchRequest('CMitarbeiterkompassBericht/' + this.model.id, {
                        welleStatus: 'geschlossen'
                    });
                })
                .then(() => {
                    this.notify(false, 'loading', notifyId);
                    Espo.Ui.success('Welle geschlossen.');
                    this.model.fetch();
                })
                .catch((err) => {
                    this.notify(false, 'loading', notifyId);
                    Espo.Ui.error('Fehler beim Schließen der Welle.');
                    console.error(err);
                });
        },

        _berichtGenerieren: function () {
            const periode = this._periode();
            if (!periode) return;

            const notifyId = this.notify('Bericht wird berechnet und PDF erstellt …', 'loading');

            fetch(this.FLASK_BASE + '/mitarbeiterkompass/admin/wellen/' + periode + '/bericht', {
                method: 'POST',
                headers: { 'X-Mak-Admin-Key': this.MAK_ADMIN_KEY }
            })
                .then((r) => r.json().then((data) => ({ ok: r.ok, data: data })))
                .then(({ ok, data }) => {
                    this.notify(false, 'loading', notifyId);
                    if (!ok || !data.success) {
                        Espo.Ui.error('Fehler: ' + ((data && data.error) || 'unbekannt'));
                        return;
                    }
                    Espo.Ui.success('Bericht erstellt (KGI: ' + Math.round(data.indizes.kgi) + ').');
                    this.model.fetch();
                })
                .catch((err) => {
                    this.notify(false, 'loading', notifyId);
                    Espo.Ui.error('Serverfehler beim Erstellen des Berichts.');
                    console.error(err);
                });
        }

    });
});
