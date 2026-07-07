// custom:views/c-mitarbeiterkompass-bericht/modals/neue-welle
console.log('[LOAD] custom:views/c-mitarbeiterkompass-bericht/modals/neue-welle');

define('custom:views/c-mitarbeiterkompass-bericht/modals/neue-welle', [
    'views/modal'
], function (Dep) {

    const HALBJAHR_LABELS = { H1: '1. Halbjahr (Jan–Jun)', H2: '2. Halbjahr (Jul–Dez)' };

    return Dep.extend({

        template: 'custom:c-mitarbeiterkompass-bericht/modals/neue-welle',
        className: 'dialog dialog-record',

        FLASK_BASE: 'https://klesec.pagekite.me/api',
        MAK_ADMIN_KEY: '695ad0833a216955409f468b136a024b0bfb8a7721988fe4825276d28246c479',

        setup: function () {
            Dep.prototype.setup.call(this);

            this.headerText = 'Neue Mitarbeiterkompass-Welle anlegen';
            this.buttonList = [
                { name: 'erstellen', label: 'Erstellen & einladen', style: 'primary' },
                { name: 'cancel', label: 'Abbrechen' }
            ];
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this.$el.find('[data-name="jahrInput"]').val(new Date().getFullYear());

            const selectEl = this.$el.find('[data-name="halbjahrInput"]').get(0);
            if (selectEl) {
                selectEl.innerHTML = '';
                Object.keys(HALBJAHR_LABELS).forEach((k) => {
                    const opt = document.createElement('option');
                    opt.value = k;
                    opt.textContent = HALBJAHR_LABELS[k];
                    selectEl.appendChild(opt);
                });
            } else {
                console.error('[Mitarbeiterkompass] halbjahrInput-Select nicht im DOM gefunden');
            }

            this._loadMitarbeiter();
        },

        _loadMitarbeiter: function () {
            const $list = this.$el.find('[data-name="mitarbeiterList"]');
            $list.html('Lade Mitarbeiter …');

            fetch(this.FLASK_BASE + '/mitarbeiterkompass/admin/mitarbeiter', {
                headers: { 'X-Mak-Admin-Key': this.MAK_ADMIN_KEY }
            })
                .then((r) => r.json())
                .then((data) => {
                    const mitarbeiter = data.mitarbeiter || [];
                    $list.html(mitarbeiter.map((m) => {
                        const hasEmail = !!m.email;
                        return (
                            '<div style="padding:3px 0;' + (hasEmail ? '' : 'opacity:.5;') + '">' +
                            '<label style="font-weight:normal;">' +
                            '<input type="checkbox" data-role="empfaenger" data-id="' + m.id + '" ' +
                            'data-name="' + m.name + '" data-email="' + (m.email || '') + '" ' +
                            (hasEmail ? 'checked' : 'disabled') + '> ' +
                            m.name + ' <span style="color:#888;font-size:.85em;">(' +
                            (m.roles || []).join(', ') + (hasEmail ? '' : ' · keine E-Mail hinterlegt') +
                            ')</span></label></div>'
                        );
                    }).join(''));
                })
                .catch(() => { $list.html('Fehler beim Laden der Mitarbeiter.'); });
        },

        actionCancel: function () {
            this.close();
        },

        actionErstellen: function () {
            const jahr = parseInt(this.$el.find('[data-name="jahrInput"]').val(), 10);
            const halbjahr = this.$el.find('[data-name="halbjahrInput"]').val();
            const empfaenger = this.$el.find('[data-role="empfaenger"]:checked').toArray().map((el) => ({
                id: el.dataset.id,
                name: el.dataset.name,
                email: el.dataset.email
            }));

            if (!jahr) {
                Espo.Ui.error('Bitte ein gültiges Jahr angeben.');
                return;
            }
            if (!halbjahr) {
                Espo.Ui.error('Bitte ein Halbjahr auswählen.');
                return;
            }
            if (!empfaenger.length) {
                Espo.Ui.error('Bitte mindestens einen Empfänger auswählen.');
                return;
            }

            this.disableButton('erstellen');
            const notifyId = this.notify('Prüfe, ob diese Welle schon existiert …', 'loading');

            Espo.Ajax.getRequest('CMitarbeiterkompassBericht', {
                select: 'id',
                where: [
                    { type: 'equals', attribute: 'jahr', value: jahr },
                    { type: 'equals', attribute: 'halbjahr', value: halbjahr }
                ],
                maxSize: 1
            }).then((res) => {
                if (res.total > 0) {
                    this.notify(false, 'loading', notifyId);
                    this.enableButton('erstellen');
                    Espo.Ui.error('Für ' + HALBJAHR_LABELS[halbjahr] + ' ' + jahr + ' existiert bereits eine Welle.');
                    return;
                }
                this._welleAnlegen(jahr, halbjahr, empfaenger, notifyId);
            });
        },

        _welleAnlegen: function (jahr, halbjahr, empfaenger, notifyId) {
            this.notify('Welle wird angelegt und Einladungen werden versendet …', 'loading');

            const nr = halbjahr === 'H1' ? '1.' : '2.';
            Espo.Ajax.postRequest('CMitarbeiterkompassBericht', {
                name: 'Mitarbeiterkompass ' + nr + ' Halbjahr ' + jahr,
                jahr: jahr,
                halbjahr: halbjahr,
                empfaengerIds: empfaenger.map((e) => e.id),
                welleStatus: 'neu'
            }).then((espoRecord) => {
                fetch(this.FLASK_BASE + '/mitarbeiterkompass/admin/wellen', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Mak-Admin-Key': this.MAK_ADMIN_KEY },
                    body: JSON.stringify({ jahr: jahr, halbjahr: halbjahr, empfaenger: empfaenger })
                })
                    .then((r) => r.json().then((data) => ({ ok: r.ok, data: data })))
                    .then(({ ok, data }) => {
                        if (!ok || !data.success) {
                            // Race Condition (parallel angelegt) oder anderer Fehler — verwaisten
                            // Espo-Datensatz wieder entfernen, statt eine leere Welle stehen zu lassen.
                            Espo.Ajax.deleteRequest('CMitarbeiterkompassBericht/' + espoRecord.id);
                            throw new Error((data && data.error) || 'unbekannt');
                        }
                        return Espo.Ajax.patchRequest('CMitarbeiterkompassBericht/' + espoRecord.id, {
                            welleStatus: 'versendet'
                        }).then(() => data);
                    })
                    .then((data) => {
                        this.notify(false, 'loading', notifyId);
                        let text = data.versendet + ' Einladung(en) versendet.';
                        if (data.fehler && data.fehler.length) {
                            text += ' Fehler bei: ' + data.fehler.map((f) => f.name).join(', ');
                        }
                        Espo.Ui.success(text);
                        this.trigger('welle-angelegt');
                        this.close();
                        this.getRouter().navigate('#CMitarbeiterkompassBericht/view/' + espoRecord.id, { trigger: true });
                    })
                    .catch((err) => {
                        this.notify(false, 'loading', notifyId);
                        this.enableButton('erstellen');
                        Espo.Ui.error('Fehler beim Versenden: ' + err.message);
                    });
            }).catch((err) => {
                this.notify(false, 'loading', notifyId);
                this.enableButton('erstellen');
                Espo.Ui.error('Fehler beim Anlegen des Datensatzes.');
                console.error(err);
            });
        }

    });
});
