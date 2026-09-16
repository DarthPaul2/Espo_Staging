// client/custom/src/views/c-servicevorgang/modals/techniker-finden.js
// Что это:
// Gleiche minimale Oberfläche für QualifikationsMatchingResolver::finde() wie bei CProjekt
// (14.09.2026), jetzt für CServicevorgang (15.09.2026, auf Pavels Wunsch). Anders als bei
// CProjekt: nur EIN Techniker wird zugewiesen (Feld "techniker"), keine Team-Liste — "Zuweisen"
// setzt das Feld direkt, siehe custom/Espo/Custom/Controllers/CServicevorgang.php.

define('custom:views/c-servicevorgang/modals/techniker-finden', [
    'views/modal'
], function (Dep) {

    const ANLAGETYP_TO_FACHBEREICH = {
        bma: 'BMA',
        ema: 'EMA',
        video: 'Video',
        zutritt: 'Zutritt'
    };

    const FACHBEREICH_OPTIONS = ['', 'BMA', 'EMA', 'Video', 'Zutritt', 'IT'];

    return Dep.extend({

        template: 'custom:c-servicevorgang/modals/techniker-finden',
        className: 'dialog dialog-record',

        setup: function () {
            Dep.prototype.setup.call(this);

            this.servicevorgangId = this.options.servicevorgangId;
            this.geplanterTermin = this.options.geplanterTermin || null;
            this.anlageTyp = this.options.anlageTyp || null;

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
                console.error('[CServicevorgang/techniker-finden] Fehler beim Laden des Rollenkatalogs', e);
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

            const vorausgewaehlterFachbereich = ANLAGETYP_TO_FACHBEREICH[this.anlageTyp] || '';
            if (vorausgewaehlterFachbereich) {
                $fachbereich.val(vorausgewaehlterFachbereich);
            }

            if (this.geplanterTermin) {
                // geplanterTermin ist datetime ("YYYY-MM-DD HH:mm:ss"), Termin-Input braucht nur das Datum
                this.$el.find('[data-name="terminInput"]').val(String(this.geplanterTermin).slice(0, 10));
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

            Espo.Ajax.postRequest('CServicevorgang/action/findeTechniker', {
                servicevorgangId: this.servicevorgangId,
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
                    ? '<button class="btn btn-success btn-sm" data-action="technikerZuweisen" ' +
                        'data-user-id="' + _.escape(r.userId) + '" style="margin-top: 6px;">' +
                            'Als Techniker hinzufügen' +
                        '</button>'
                    : '';

                return (
                    '<div class="techniker-kandidat" style="' +
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
            $ergebnis.off('click', '[data-action="technikerZuweisen"]');
            $ergebnis.on('click', '[data-action="technikerZuweisen"]', (e) => {
                this._technikerZuweisen($(e.currentTarget));
            });
        },

        _technikerZuweisen: function ($button) {
            const userId = $button.data('user-id');

            $button.prop('disabled', true).text('Wird hinzugefügt …');

            Espo.Ajax.postRequest('CServicevorgang/action/technikerZuweisen', {
                servicevorgangId: this.servicevorgangId,
                userId: userId
            }).then((res) => {
                if (res.success) {
                    Espo.Ui.success(res.message);
                    $button.replaceWith('<span class="text-success" style="margin-top: 6px; display: inline-block;">✓ ' + _.escape(res.message) + '</span>');
                    this._technikerGeaendert = true;
                } else {
                    Espo.Ui.warning(res.message || 'Fehler.');
                    $button.prop('disabled', false).text('Als Techniker hinzufügen');
                }
            }).catch(() => {
                Espo.Ui.error('Fehler beim Hinzufügen.');
                $button.prop('disabled', false).text('Als Techniker hinzufügen');
            });
        },

        onRemove: function () {
            if (this._technikerGeaendert) {
                this.trigger('techniker-zugewiesen');
            }
        }

    });
});
