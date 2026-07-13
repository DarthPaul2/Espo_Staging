// custom:views/c-einstellungstest/modals/neuer-test
console.log('[LOAD] custom:views/c-einstellungstest/modals/neuer-test');

define('custom:views/c-einstellungstest/modals/neuer-test', [
    'views/modal'
], function (Dep) {

    return Dep.extend({

        template: 'custom:c-einstellungstest/modals/neuer-test',
        className: 'dialog dialog-record',

        FLASK_BASE: 'https://klesec.pagekite.me/api',
        MAK_ADMIN_KEY: '695ad0833a216955409f468b136a024b0bfb8a7721988fe4825276d28246c479',

        setup: function () {
            Dep.prototype.setup.call(this);
            this.headerText = 'Neuen Einstellungstest erstellen';
            this.buttonList = [
                { name: 'erstellen', label: 'Erstellen', style: 'primary' },
                { name: 'cancel', label: 'Abbrechen' }
            ];
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.$el.find('[data-name="dauerInput"]').val(90);
        },

        actionCancel: function () {
            this.close();
        },

        actionErstellen: function () {
            const name = this.$el.find('[data-name="nameInput"]').val().trim();
            const position = this.$el.find('[data-name="positionInput"]').val().trim();
            const dauer = parseInt(this.$el.find('[data-name="dauerInput"]').val(), 10) || 90;

            if (!name) {
                Espo.Ui.error('Bitte eine Bezeichnung angeben (z. B. Name des Bewerbers).');
                return;
            }

            this.disableButton('erstellen');
            const notifyId = this.notify('Test wird angelegt …', 'loading');

            Espo.Ajax.postRequest('CEinstellungstest', {
                name: name,
                position: position || null,
                testStatus: 'offen'
            }).then((espoRecord) => {
                fetch(this.FLASK_BASE + '/einstellungstest/admin/erstellen', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Mak-Admin-Key': this.MAK_ADMIN_KEY },
                    body: JSON.stringify({ espo_id: espoRecord.id, dauer_minuten: dauer })
                })
                    .then((r) => r.json().then((data) => ({ ok: r.ok, data: data })))
                    .then(({ ok, data }) => {
                        if (!ok || !data.success) {
                            Espo.Ajax.deleteRequest('CEinstellungstest/' + espoRecord.id);
                            throw new Error((data && data.error) || 'unbekannt');
                        }
                        this.notify(false, 'loading', notifyId);
                        this.trigger('test-angelegt');
                        this._zeigeLink(data.link, espoRecord.id);
                    })
                    .catch((err) => {
                        this.notify(false, 'loading', notifyId);
                        this.enableButton('erstellen');
                        Espo.Ui.error('Fehler beim Erstellen: ' + err.message);
                    });
            }).catch((err) => {
                this.notify(false, 'loading', notifyId);
                this.enableButton('erstellen');
                Espo.Ui.error('Fehler beim Anlegen des Datensatzes.');
                console.error(err);
            });
        },

        _zeigeLink: function (link, espoId) {
            this.$el.find('.modal-body').html(
                '<div style="text-align:center; padding: 6px 4px 2px;">' +
                '<div style="width:52px; height:52px; margin:0 auto 12px; border-radius:50%; ' +
                'background:#dcfce7; display:flex; align-items:center; justify-content:center;">' +
                '<span class="fas fa-check" style="color:#16a34a; font-size:22px;"></span>' +
                '</div>' +
                '<div style="font-size:1.1em; font-weight:700; color:#000244; margin-bottom:4px;">' +
                'Test wurde angelegt</div>' +
                '<div style="color:#667; font-size:.9em; margin-bottom:18px;">' +
                'Diesen Link an den Bewerber weitergeben — z. B. persönlich, per WhatsApp oder E-Mail.</div>' +
                '</div>' +
                '<div style="display:flex; gap:8px; align-items:center; background:#f8fafc; ' +
                'border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px;">' +
                '<span class="fas fa-link" style="color:#94a3b8;"></span>' +
                '<input type="text" readonly value="' + link + '" data-name="linkOutput" ' +
                'style="flex:1; border:none; background:transparent; font-family:monospace; ' +
                'font-size:.88em; color:#000244; outline:none;">' +
                '<button type="button" id="etCopyBtn" style="white-space:nowrap; border:none; ' +
                'background:#000244; color:#fff; font-weight:600; font-size:.85em; padding:7px 14px; ' +
                'border-radius:7px; cursor:pointer;">Kopieren</button>' +
                '</div>'
            );

            this.$el.find('.modal-footer').html(
                '<button type="button" class="btn btn-primary" id="etFertigBtn">Fertig</button>'
            );

            this.$el.find('#etCopyBtn').on('click', function () {
                const input = $(this).closest('.modal-body').find('[data-name="linkOutput"]').get(0);
                input.select();
                document.execCommand('copy');
                const $btn = $(this);
                const original = $btn.text();
                $btn.text('✓ Kopiert').css('background', '#16a34a');
                setTimeout(() => $btn.text(original).css('background', '#000244'), 1600);
            });

            this.$el.find('#etFertigBtn').on('click', () => {
                this.close();
                this.getRouter().navigate('#CEinstellungstest/view/' + espoId, { trigger: true });
            });
        }

    });
});
