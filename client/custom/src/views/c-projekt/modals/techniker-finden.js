// client/custom/src/views/c-projekt/modals/techniker-finden.js
// Что это:
// Minimale Oberfläche für QualifikationsMatchingResolver::finde() (T4-21) — Rollencode
// (Pflicht) + optional Fachbereich/Termin/Region eingeben, Ergebnis ist eine reine
// Laufzeit-Liste (keine Persistierung), siehe custom/Espo/Custom/Controllers/CProjekt.php.

define('custom:views/c-projekt/modals/techniker-finden', [
    'views/modal'
], function (Dep) {

    const FACHBEREICH_OPTIONS = ['', 'BMA', 'EMA', 'Video', 'Zutritt', 'IT'];

    return Dep.extend({

        template: 'custom:c-projekt/modals/techniker-finden',
        className: 'dialog dialog-record',

        setup: function () {
            Dep.prototype.setup.call(this);

            this.projektId = this.options.projektId;
            this.einsatzTermin = this.options.einsatzTermin || null;

            this.headerText = 'Passenden Techniker finden';
            this.buttonList = [
                { name: 'suchen', label: 'Suchen', style: 'primary' },
                { name: 'cancel', label: 'Abbrechen' }
            ];
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            const $rollencode = this.$el.find('[data-name="rollencodeInput"]');
            $rollencode.html('<option value="">Bitte wählen …</option>');

            Espo.Ajax.getRequest('CRollenkatalog', {
                select: 'id,name,rollencode,aktiv',
                orderBy: 'rollencode',
                maxSize: 200
            }).then((res) => {
                (res.list || [])
                    .filter((r) => r.rollencode && r.aktiv !== false)
                    .forEach((r) => {
                        const opt = document.createElement('option');
                        opt.value = r.rollencode;
                        opt.textContent = r.rollencode + ' — ' + r.name;
                        $rollencode.append(opt);
                    });
            }).catch((e) => {
                console.error('[CProjekt/techniker-finden] Fehler beim Laden des Rollenkatalogs', e);
                Espo.Ui.error('Fehler beim Laden des Rollenkatalogs.');
            });

            const $fachbereich = this.$el.find('[data-name="fachbereichInput"]');
            $fachbereich.html('');
            FACHBEREICH_OPTIONS.forEach((f) => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f || '(egal)';
                $fachbereich.append(opt);
            });

            if (this.einsatzTermin) {
                this.$el.find('[data-name="terminInput"]').val(this.einsatzTermin);
            }

            this.$el.find('[data-name="ergebnisListe"]').html(
                '<div class="text-muted">Rollencode wählen und auf "Suchen" klicken.</div>'
            );
        },

        actionCancel: function () {
            this.close();
        },

        actionSuchen: function () {
            const rollencode = this.$el.find('[data-name="rollencodeInput"]').val();
            const fachbereich = this.$el.find('[data-name="fachbereichInput"]').val();
            const terminDatum = this.$el.find('[data-name="terminInput"]').val();
            const regionFilter = this.$el.find('[data-name="regionInput"]').val();

            if (!rollencode) {
                Espo.Ui.error('Bitte einen Rollencode wählen.');
                return;
            }

            const $ergebnis = this.$el.find('[data-name="ergebnisListe"]');
            $ergebnis.html('<div class="text-muted">Suche läuft …</div>');
            this.disableButton('suchen');

            this._lastRollencode = rollencode;

            Espo.Ajax.postRequest('CProjekt/action/findeTechniker', {
                projektId: this.projektId,
                rollencode: rollencode,
                fachbereich: fachbereich || null,
                terminDatum: terminDatum || null,
                regionFilter: regionFilter || null
            }).then((res) => {
                this.enableButton('suchen');
                this._renderErgebnis(res.results || []);
            }).catch(() => {
                this.enableButton('suchen');
                $ergebnis.html('<div class="text-danger">Fehler bei der Suche.</div>');
            });
        },

        _renderErgebnis: function (results) {
            const $ergebnis = this.$el.find('[data-name="ergebnisListe"]');

            if (!results.length) {
                $ergebnis.html('<div class="text-muted">Keine Kandidaten mit dieser Rolle gefunden.</div>');
                return;
            }

            const html = results.map((r) => {
                const farbe = r.zulaessig ? '#2e8b57' : '#c0392b';
                const status = r.zulaessig ? 'zulässig' : 'nicht zulässig';
                const begruendung = (r.begruendung || []).map((b) => '<li>' + _.escape(b) + '</li>').join('');

                const addButton = r.zulaessig
                    ? '<button class="btn btn-success btn-sm" data-action="zumProjektHinzufuegen" ' +
                        'data-user-id="' + _.escape(r.userId) + '" style="margin-top: 6px;">' +
                            'Zum Projekt hinzufügen' +
                        '</button>'
                    : '';

                return (
                    '<div class="techniker-kandidat" data-user-id="' + _.escape(r.userId) + '" style="' +
                    'border: 1px solid #ddd; border-left: 4px solid ' + farbe + '; ' +
                    'border-radius: 4px; padding: 8px 12px; margin-bottom: 8px;">' +
                        '<div style="font-weight: 600;">' +
                            _.escape(r.name) +
                            ' — <span style="color: ' + farbe + ';">' + status + '</span>' +
                        '</div>' +
                        '<ul style="margin: 4px 0 0 0; padding-left: 18px; font-size: 0.9em; color: #555;">' +
                            begruendung +
                        '</ul>' +
                        addButton +
                    '</div>'
                );
            }).join('');

            $ergebnis.html(html);
            $ergebnis.off('click', '[data-action="zumProjektHinzufuegen"]');
            $ergebnis.on('click', '[data-action="zumProjektHinzufuegen"]', (e) => {
                this._zumProjektHinzufuegen($(e.currentTarget));
            });
        },

        _zumProjektHinzufuegen: function ($button) {
            const userId = $button.data('user-id');

            $button.prop('disabled', true).text('Wird hinzugefügt …');

            Espo.Ajax.postRequest('CProjekt/action/zumProjektHinzufuegen', {
                projektId: this.projektId,
                userId: userId,
                rollencode: this._lastRollencode || null
            }).then((res) => {
                if (res.success) {
                    Espo.Ui.success(res.message);
                    $button.replaceWith('<span class="text-success" style="margin-top: 6px; display: inline-block;">✓ ' + _.escape(res.message) + '</span>');
                    this._teamGeaendert = true;
                } else {
                    Espo.Ui.warning(res.message);
                    $button.prop('disabled', false).text('Zum Projekt hinzufügen');
                }
            }).catch(() => {
                Espo.Ui.error('Fehler beim Hinzufügen zum Projektteam.');
                $button.prop('disabled', false).text('Zum Projekt hinzufügen');
            });
        },

        onRemove: function () {
            if (this._teamGeaendert) {
                this.trigger('team-updated');
            }
        }

    });
});
