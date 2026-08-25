// custom:views/c-zahlungsavis/modals/erstellen
define('custom:views/c-zahlungsavis/modals/erstellen', [
    'views/modal'
], function (Dep) {

    return Dep.extend({

        template: 'custom:c-zahlungsavis/modals/erstellen',
        className: 'dialog dialog-record',

        FLASK_BASE: 'https://klesec.pagekite.me/api',

        setup: function () {
            Dep.prototype.setup.call(this);

            this.headerText = 'Zahlungsavis erstellen';
            this.buttonList = [
                {name: 'erstellen', label: 'Erstellen', style: 'primary', disabled: true},
                {name: 'cancel', label: 'Abbrechen'}
            ];
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            const today = new Date().toISOString().slice(0, 10);
            this.$el.find('[data-name="datumInput"]').val(today);

            const $lieferant = this.$el.find('[data-name="lieferantSelect"]');
            Espo.Ajax.getRequest('CLieferant', {select: 'id,name', orderBy: 'name', maxSize: 200})
                .then((result) => {
                    const list = (result && result.list) || [];
                    list.forEach((i) => {
                        $lieferant.append('<option value="' + i.id + '">' + i.name + '</option>');
                    });
                })
                .catch(() => Espo.Ui.error('Lieferanten konnten nicht geladen werden.'));

            $lieferant.on('change', () => this._onLieferantChange($lieferant.val()));
        },

        _onLieferantChange: function (lieferantId) {
            const $block = this.$el.find('[data-name="positionenBlock"]');
            const $list = this.$el.find('[data-name="positionenList"]');

            this.disableButton('erstellen');

            if (!lieferantId) {
                $block.hide();
                return;
            }

            $block.show();
            $list.html('<div style="color:#94a3b8;">Lädt…</div>');

            Espo.Ajax.getRequest('CEingangsrechnung', {
                select: 'id,lieferantenRechnungsnummer,belegdatum,betragBrutto,zahlungsstatus',
                orderBy: 'belegdatum',
                order: 'desc',
                maxSize: 200,
                where: [
                    {type: 'equals', attribute: 'lieferantId', value: lieferantId}
                ]
            }).then((result) => {
                const list = (result && result.list) || [];

                if (!list.length) {
                    $list.html('<div style="color:#94a3b8;">Keine Rechnungen für diesen Lieferanten gefunden.</div>');
                    return;
                }

                $list.html(list.map((er) => (
                    '<label style="display:flex; align-items:center; gap:8px; padding:4px 0; cursor:pointer;">' +
                    '<input type="checkbox" data-id="' + er.id + '">' +
                    '<span style="flex:1;"><b>' + (er.lieferantenRechnungsnummer || er.id) + '</b> · ' +
                    (er.belegdatum || '') + ' · ' + Number(er.betragBrutto || 0).toLocaleString('de-DE', {minimumFractionDigits: 2}) + ' EUR' +
                    (er.zahlungsstatus ? ' · <span style="color:#94a3b8;">' + er.zahlungsstatus + '</span>' : '') +
                    '</span></label>'
                )).join(''));

                $list.find('input[type="checkbox"]').on('change', () => this._updateErstellenButton());
            }).catch(() => {
                $list.html('<div style="color:#dc2626;">Fehler beim Laden der Rechnungen.</div>');
            });
        },

        _updateErstellenButton: function () {
            const anyChecked = this.$el.find('[data-name="positionenList"] input[type="checkbox"]:checked').length > 0;
            if (anyChecked) {
                this.enableButton('erstellen');
            } else {
                this.disableButton('erstellen');
            }
        },

        actionCancel: function () {
            this.close();
        },

        actionErstellen: function () {
            const lieferantId = this.$el.find('[data-name="lieferantSelect"]').val();
            const datum = this.$el.find('[data-name="datumInput"]').val();
            const ids = this.$el.find('[data-name="positionenList"] input[type="checkbox"]:checked')
                .map(function () { return $(this).data('id'); }).get();

            if (!lieferantId) {
                Espo.Ui.error('Bitte einen Lieferanten auswählen.');
                return;
            }
            if (!ids.length) {
                Espo.Ui.error('Bitte mindestens eine Rechnung auswählen.');
                return;
            }

            this.disableButton('erstellen');
            const notifyId = this.notify('Zahlungsavis wird erstellt …', 'loading');

            const positionen = ids.map((id) => ({eingangsrechnungId: id}));

            fetch(this.FLASK_BASE + '/zahlungsavis/erstellen', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({lieferantId: lieferantId, datum: datum, positionen: positionen})
            })
                .then((r) => r.json().then((data) => ({ok: r.ok, data: data})))
                .then(({ok, data}) => {
                    if (!ok) {
                        throw new Error((data && data.error) || 'Unbekannter Fehler');
                    }
                    this.notify(false, 'loading', notifyId);
                    this._zeigeErfolg(data);
                })
                .catch((err) => {
                    this.notify(false, 'loading', notifyId);
                    this.enableButton('erstellen');
                    Espo.Ui.error('Fehler beim Erstellen: ' + err.message);
                });
        },

        _zeigeErfolg: function (data) {
            const saveUrl = this.FLASK_BASE + '/zahlungsavis/' + encodeURIComponent(data.id) + '/save_pdf';

            const fmtEur = (v) => Number(v || 0).toLocaleString('de-DE', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            const fmtDatum = (v) => {
                if (!v) return '';
                const parts = String(v).split('-');
                return parts.length === 3 ? (parts[2] + '.' + parts[1] + '.' + parts[0]) : v;
            };

            const positionenRows = (data.positionen || []).map((p) => (
                '<tr>' +
                '<td>' + (p.reNummer || '') + '</td>' +
                '<td>' + fmtDatum(p.reDatum) + '</td>' +
                '<td style="text-align:right;">' + fmtEur(p.betrag) + '</td>' +
                '<td style="text-align:right;">' + fmtEur(p.zahlung) + '</td>' +
                '<td style="text-align:right;">' + fmtEur(p.skonto) + '</td>' +
                '</tr>'
            )).join('');

            this.$el.find('.modal-body').html(
                '<div style="text-align:center; padding: 6px 4px 14px;">' +
                '<div style="width:52px; height:52px; margin:0 auto 12px; border-radius:50%; ' +
                'background:#dcfce7; display:flex; align-items:center; justify-content:center;">' +
                '<span class="fas fa-check" style="color:#16a34a; font-size:22px;"></span>' +
                '</div>' +
                '<div style="font-size:1.1em; font-weight:700; color:#000244; margin-bottom:4px;">' +
                'Zahlungsavis Nr. ' + data.avisNummer + ' erstellt</div>' +
                '</div>' +
                '<div style="margin-bottom:14px; font-size:.9em;">' +
                '<div><span style="color:#667;">Lieferant:</span> <b>' + (data.lieferantName || '') + '</b></div>' +
                '<div><span style="color:#667;">Konto (aus Lieferantenstamm):</span> ' +
                (data.lieferantBankName || '') + (data.lieferantBic ? ' · BIC ' + data.lieferantBic : '') +
                (data.lieferantIban ? ' · IBAN ' + data.lieferantIban : '') +
                '</div>' +
                '</div>' +
                '<table class="table table-condensed" style="font-size:.88em;">' +
                '<thead><tr>' +
                '<th>RE-Nummer</th><th>RE-Datum</th>' +
                '<th style="text-align:right;">Betrag EUR</th>' +
                '<th style="text-align:right;">Zahlung EUR</th>' +
                '<th style="text-align:right;">Skonto EUR</th>' +
                '</tr></thead><tbody>' + positionenRows + '</tbody>' +
                '<tfoot><tr style="font-weight:700;">' +
                '<td colspan="2">Summe</td>' +
                '<td style="text-align:right;">' + fmtEur(data.betragGesamt) + '</td>' +
                '<td style="text-align:right;">' + fmtEur(data.betragGesamt) + '</td>' +
                '<td></td>' +
                '</tr></tfoot>' +
                '</table>'
            );

            this.$el.find('.modal-footer').html(
                '<button type="button" class="btn btn-default" id="zaCloseBtn">Schließen</button>' +
                '<button type="button" class="btn btn-primary" id="zaPdfBtn">PDF speichern &amp; ansehen</button>'
            );

            this.$el.find('#zaPdfBtn').on('click', () => {
                const $btn = this.$el.find('#zaPdfBtn').prop('disabled', true).text('Wird gespeichert…');
                fetch(saveUrl, {method: 'POST'})
                    .then((r) => r.json().then((resp) => ({ok: r.ok, resp: resp})))
                    .then(({ok, resp}) => {
                        if (!ok || !resp.pdfUrl) {
                            throw new Error((resp && resp.error) || 'PDF konnte nicht gespeichert werden');
                        }
                        window.open(resp.pdfUrl, '_blank');
                        $btn.text('PDF gespeichert ✓');
                    })
                    .catch((err) => {
                        $btn.prop('disabled', false).text('PDF speichern & ansehen');
                        Espo.Ui.error(err.message);
                    });
            });

            this.$el.find('#zaCloseBtn').on('click', () => {
                this.close();
                this.trigger('zahlungsavis-erstellt');
            });
        }

    });
});
