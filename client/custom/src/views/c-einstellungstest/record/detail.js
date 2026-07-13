// custom:views/c-einstellungstest/record/detail
console.log('[LOAD] custom:views/c-einstellungstest/record/detail');

define('custom:views/c-einstellungstest/record/detail', [
    'views/record/detail'
], function (Dep) {

    return Dep.extend({

        FLASK_BASE: 'https://klesec.pagekite.me/api',
        MAK_ADMIN_KEY: '695ad0833a216955409f468b136a024b0bfb8a7721988fe4825276d28246c479',

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this.stopListening(this.model, 'change:testStatus');
            this.listenTo(this.model, 'change:testStatus', () => this._renderActions());

            this._renderActions();
        },

        _renderActions: function () {
            setTimeout(() => {
                const $actionBar = this.$el
                    .find('.detail-button-container, .header-button-container, .record-button-container')
                    .first();

                if (!$actionBar.length) {
                    setTimeout(() => this._renderActions(), 300);
                    return;
                }

                this.$el.find('[data-name="et-actions"]').remove();

                const status = this.model.get('testStatus');
                let $content = null;

                if (status === 'offen' || status === 'laeuft') {
                    $content = this._buildLinkPanel();
                } else if (status === 'abgeschlossen') {
                    $content = this._buildBerichtPanel();
                }

                if (!$content) return;

                $content.attr('data-name', 'et-actions');
                $content.insertAfter($actionBar);
            }, 400);
        },

        _buildLinkPanel: function () {
            const link = this.model.get('zugangslink') || '';
            const hinweis = this.model.get('testStatus') === 'laeuft'
                ? 'Test wurde bereits gestartet.'
                : 'Test noch nicht gestartet.';

            if (!link) {
                return $(
                    '<div style="display:flex; align-items:center; gap:8px; padding:8px 12px; ' +
                    'margin-top:8px; margin-bottom:8px; background:#fef2f2; border-radius:8px; ' +
                    'border:1px solid #fecaca; max-width:600px; font-size:.88em; color:#991b1b;">' +
                    '<span class="fas fa-triangle-exclamation"></span>' +
                    '<span>Kein Link vorhanden — Synchronisation fehlgeschlagen. Bitte Test neu anlegen.</span>' +
                    '</div>'
                );
            }

            const $bar = $(
                '<div style="display:flex; align-items:center; gap:10px; padding:9px 12px; ' +
                'margin-top:8px; margin-bottom:8px; background:#f8fafc; border-radius:9px; ' +
                'border:1px solid #e2e8f0; max-width:640px;">' +
                '<span style="font-size:.8em; font-weight:600; color:#1e40af; white-space:nowrap;">' +
                hinweis + '</span>' +
                '<span class="fas fa-link" style="color:#94a3b8;"></span>' +
                '<input type="text" readonly value="' + link + '" data-name="etLinkInput" ' +
                'style="flex:1; border:none; background:transparent; font-family:monospace; ' +
                'font-size:.85em; color:#000244; outline:none;">' +
                '<button type="button" data-action="etKopieren" style="white-space:nowrap; border:none; ' +
                'background:#000244; color:#fff; font-weight:600; font-size:.82em; padding:6px 12px; ' +
                'border-radius:6px; cursor:pointer;">Kopieren</button>' +
                '</div>'
            );

            $bar.on('click', '[data-action="etKopieren"]', function () {
                const input = $bar.find('[data-name="etLinkInput"]').get(0);
                input.select();
                document.execCommand('copy');
                const $btn = $(this);
                const original = $btn.text();
                $btn.text('✓ Kopiert').css('background', '#16a34a');
                setTimeout(() => $btn.text(original).css('background', '#000244'), 1600);
            });

            return $bar;
        },

        _buildBerichtPanel: function () {
            const hatBericht = !!this.model.get('pdfBerichtId');
            const label = hatBericht ? 'Bericht neu generieren' : 'Bericht generieren';

            const $bar = $(
                '<div style="display:inline-flex; gap:6px; padding:5px 8px; margin-top:8px; ' +
                'margin-bottom:8px; background:#fef3c7; border-radius:6px; border:1px solid #fde68a;">' +
                '<button class="btn btn-primary btn-sm" data-action="etBericht">' + label + '</button>' +
                '</div>'
            );

            $bar.on('click', '[data-action="etBericht"]', () => this._berichtGenerieren());

            return $bar;
        },

        _berichtGenerieren: function () {
            this._zeigeLadeOverlay('PDF wird erstellt …');

            fetch(this.FLASK_BASE + '/einstellungstest/admin/' + this.model.id + '/bericht', {
                method: 'POST',
                headers: { 'X-Mak-Admin-Key': this.MAK_ADMIN_KEY }
            })
                .then((r) => r.json().then((data) => ({ ok: r.ok, data: data })))
                .then(({ ok, data }) => {
                    this._versteckeLadeOverlay();
                    if (!ok || !data.success) {
                        Espo.Ui.error('Fehler: ' + ((data && data.error) || 'unbekannt'));
                        return;
                    }
                    Espo.Ui.success('Bericht erstellt.');
                    this.model.fetch();
                })
                .catch((err) => {
                    this._versteckeLadeOverlay();
                    Espo.Ui.error('Serverfehler beim Erstellen des Berichts.');
                    console.error(err);
                });
        },

        _zeigeLadeOverlay: function (text) {
            if ($('#etLadeOverlay').length) return;

            if (!$('#etLadeOverlayStyle').length) {
                $('<style id="etLadeOverlayStyle">@keyframes etSpin { to { transform: rotate(360deg); } }</style>')
                    .appendTo('head');
            }

            $(
                '<div id="etLadeOverlay" style="position:fixed; inset:0; z-index:9999; ' +
                'background:rgba(15,23,42,.6); display:flex; align-items:center; justify-content:center; ' +
                'flex-direction:column; gap:16px; cursor:wait;">' +
                '<div style="width:54px; height:54px; border:5px solid rgba(255,255,255,.25); ' +
                'border-top-color:#fff; border-radius:50%; animation:etSpin .8s linear infinite;"></div>' +
                '<div style="color:#fff; font-weight:600; font-size:.95em;">' + text + '</div>' +
                '</div>'
            ).appendTo('body');
        },

        _versteckeLadeOverlay: function () {
            $('#etLadeOverlay').remove();
        }

    });
});
