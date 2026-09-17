// client/custom/src/views/c-servicevorgang/record/detail.js
// Что это:
// Button "Techniker finden" oberhalb der Felder — ruft QualifikationsMatchingResolver::finde()
// über CServicevorgang.php/action/findeTechniker auf (15.09.2026, gleiche Minimalanbindung wie
// CProjekt vom 14.09.2026, auf Pavels Wunsch). DOM-Insert-Muster (bewährt, siehe
// feedback_espo_no_editSmall_layout / Erfahrung mit CProjekt), nicht der fragile
// detailActions/Dropdown-Weg.

define('custom:views/c-servicevorgang/record/detail', ['views/record/detail'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // P-38 "Offene Servicepunkte" (9. Dokument, Zitat 102/118) — Block erscheint
            // auf dem Servicevorgang selbst (nicht im einzelnen Stundenbericht — Pavels
            // Korrektur 15.09.2026), ausgelöst durch den Status "Rückfrage/Material", den
            // der AdvanceServicevorgangStatus-Hook bereits automatisch setzt.
            this.listenTo(this.model, 'change:status', this.toggleOffenePunktBlock_, this);
        },

        // 17.09.2026, Pavel: beim Speichern mit leerem Pflichtfeld zeigt Espo nur ganz oben
        // ein generisches "Ungültig"-Banner — die eigentliche Meldung existiert bereits als
        // Popover direkt am betroffenen Feld, ist aber unsichtbar, wenn der Nutzer weiter
        // oben im Formular steht. Rein additiv (Dep.prototype.afterNotValid läuft zuerst
        // unverändert) — scrollt zusätzlich zum sichtbar gewordenen Popover.
        // Global (views/record/base) NICHT möglich — dieser Kern-Klasse ist bereits fest im
        // kompilierten espo-main.js verdrahtet, ein eigenes client/custom/src/views/record/
        // base.js wird vom Loader nie angefragt (per Server-Log verifiziert). Muss deshalb
        // pro Entity im jeweiligen eigenen record/detail.js wiederholt werden.
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

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            setTimeout(() => {
                const $field = this.$el.find('[data-name="technikers"]').first();

                if ($field.length && !this.$el.find('[data-name="sv-technikerFinden-actions"]').length) {
                    const $actions = $(
                        '<div data-name="sv-technikerFinden-actions" style="margin-top: 4px;">' +
                            '<button class="btn btn-success btn-sm" data-action="findeTechniker">' +
                                'Techniker finden' +
                            '</button>' +
                        '</div>'
                    );

                    $field.append($actions);
                    $actions.on('click', '[data-action="findeTechniker"]', () => this._openTechnikerFindenModal());
                }

                this._renderOffenePunktBlock();
                this.toggleOffenePunktBlock_();
            }, 500);
        },

        _renderOffenePunktBlock: function () {
            if (this.$el.find('[data-name="offener-punkt-block"]').length) {
                return;
            }

            const $statusField = this.$el.find('[data-name="status"]').first();
            if (!$statusField.length) {
                return;
            }

            const vorbelegterName = 'Offener Punkt – ' + (this.model.get('name') || '');
            const vorbelegteBeschreibung = this.model.get('problem') || '';

            const $block = $(
                '<div data-name="offener-punkt-block" style="' +
                    'margin-top: 10px; padding: 10px 14px; border: 1px solid #f0ad4e; ' +
                    'border-radius: 6px; background: #fff8ec;">' +
                    '<div style="font-weight: 600; margin-bottom: 8px;">' +
                        'Rückfrage/Material — es gibt noch offene Punkte. Aufgabe direkt hier anlegen:' +
                    '</div>' +
                    '<div style="margin-bottom: 8px;">' +
                        '<label style="font-weight: normal; font-size: 0.9em;">Titel *</label><br>' +
                        '<input type="text" class="form-control" data-name="opTitel" value="' +
                            _.escape(vorbelegterName) + '">' +
                    '</div>' +
                    '<div style="margin-bottom: 8px;">' +
                        '<label style="font-weight: normal; font-size: 0.9em;">Beschreibung</label><br>' +
                        '<textarea class="form-control" data-name="opBeschreibung" rows="3">' +
                            _.escape(vorbelegteBeschreibung) +
                        '</textarea>' +
                    '</div>' +
                    '<div style="display:flex; gap: 12px; flex-wrap: wrap; margin-bottom: 10px;">' +
                        '<div>' +
                            '<label style="font-weight: normal; font-size: 0.9em;">Verantwortlicher</label><br>' +
                            '<select class="form-control" data-name="opVerantwortlicher" style="width: 200px;"></select>' +
                        '</div>' +
                        '<div>' +
                            '<label style="font-weight: normal; font-size: 0.9em;">Frist</label><br>' +
                            '<input type="date" class="form-control" data-name="opFrist" style="width: 150px;">' +
                        '</div>' +
                    '</div>' +
                    '<button class="btn btn-warning btn-sm" data-action="offenerPunktErstellen">' +
                        'Aufgabe erstellen' +
                    '</button>' +
                    '<div data-name="opErgebnis" style="margin-top: 8px;"></div>' +
                '</div>'
            );

            // Ganzes Panel als Container nehmen (nicht nur die Status-Zelle), damit der
            // Block als eigener voller Abschnitt erscheint statt das 4-Spalten-Raster
            // mittendrin zu sprengen.
            const $panel = $statusField.closest('.panel').first();
            (($panel.length ? $panel : $statusField)).after($block);

            // Titel-Vorschlag nachträglich präzisieren: welcher konkrete Grund hat den
            // letzten Stundenbericht ausgelöst (Restarbeiten und/oder Neuer Termin)?
            // (15.09.26, Pavel wollte "Neuer Termin" auch als solches im Titel sehen.)
            Espo.Ajax.getRequest('CStundenbericht', {
                select: 'id,restarbeiten,neuerTermin',
                where: [
                    { type: 'equals', attribute: 'servicevorgangId', value: this.model.id }
                ],
                orderBy: 'createdAt',
                order: 'desc',
                maxSize: 1
            }).then((res) => {
                const letzter = (res.list || [])[0];
                if (!letzter) {
                    return;
                }

                const gruende = [];
                if (letzter.restarbeiten) gruende.push('Restarbeiten');
                if (letzter.neuerTermin) gruende.push('Neuer Termin');

                if (gruende.length) {
                    const $titelInput = $block.find('[data-name="opTitel"]');
                    $titelInput.val(gruende.join(' & ') + ' – ' + (this.model.get('name') || ''));
                }
            }).catch(() => {});

            const $verantwortlicher = $block.find('[data-name="opVerantwortlicher"]');
            $verantwortlicher.html('<option value="">Bitte wählen …</option>');
            Espo.Ajax.getRequest('User', {
                select: 'id,name,isActive,type,userName',
                orderBy: 'name',
                maxSize: 200
            }).then((res) => {
                // Nur echte Personen — keine System-/API-Konten (z. B. "pythonserver") und
                // keine technischen Platzhalter-Accounts wie "rechnungserinnerungen"
                // (15.09.26, Pavel bemerkte das live im Dropdown).
                const TECHNISCHE_ACCOUNTS = ['rechnungserinnerungen'];

                (res.list || [])
                    .filter((u) => u.isActive !== false)
                    .filter((u) => u.type === 'regular' || u.type === 'admin')
                    .filter((u) => !TECHNISCHE_ACCOUNTS.includes(u.userName))
                    .forEach((u) => {
                        const opt = document.createElement('option');
                        opt.value = u.id;
                        opt.textContent = u.name;
                        $verantwortlicher.append(opt);
                    });
            }).catch(() => {
                Espo.Ui.error('Fehler beim Laden der Benutzerliste.');
            });

            $block.on('click', '[data-action="offenerPunktErstellen"]', () => this._offenerPunktErstellen($block));
        },

        toggleOffenePunktBlock_: function () {
            const $block = this.$el.find('[data-name="offener-punkt-block"]');
            if (!$block.length) {
                return;
            }

            if (this.model.get('status') !== 'rueckfrageMaterial') {
                $block.hide();
                return;
            }

            // Nicht nur auf den Status verlassen (bleibt nach dem Anlegen einer Aufgabe
            // unverändert stehen) — zusätzlich prüfen, ob es bereits eine OFFENE Aufgabe
            // zu diesem Servicevorgang gibt. Gibt es eine, ist der Punkt schon erfasst,
            // Block bleibt zu (auch nach einem Reload).
            Espo.Ajax.getRequest('Task', {
                select: 'id',
                where: [
                    { type: 'equals', attribute: 'cServicevorgangId', value: this.model.id },
                    { type: 'notIn', attribute: 'status', value: ['Completed', 'Canceled', 'Deferred'] }
                ],
                maxSize: 1
            }).then((res) => {
                const hatOffeneAufgabe = res && Array.isArray(res.list) && res.list.length > 0;
                if (hatOffeneAufgabe) {
                    $block.hide();
                } else {
                    $block.show();
                }
            }).catch(() => {
                // im Zweifel lieber zeigen als eine echte offene Restarbeit verstecken
                $block.show();
            });
        },

        _offenerPunktErstellen: function ($block) {
            const name = $block.find('[data-name="opTitel"]').val();
            const description = $block.find('[data-name="opBeschreibung"]').val();
            const assignedUserId = $block.find('[data-name="opVerantwortlicher"]').val();
            const dateEnd = $block.find('[data-name="opFrist"]').val();

            if (!name) {
                Espo.Ui.error('Bitte einen Titel angeben.');
                return;
            }

            const $btn = $block.find('[data-action="offenerPunktErstellen"]');
            const $ergebnis = $block.find('[data-name="opErgebnis"]');
            $btn.prop('disabled', true).text('Wird erstellt …');

            Espo.Ajax.postRequest('CServicevorgang/action/offenerPunktErstellen', {
                servicevorgangId: this.model.id,
                name: name,
                description: description || null,
                assignedUserId: assignedUserId || null,
                dateEnd: dateEnd || null
            }).then(() => {
                Espo.Ui.success('Aufgabe erstellt.');
                $ergebnis.html('<span class="text-success">✓ Aufgabe wurde angelegt.</span>');
                $btn.text('Aufgabe erstellen').prop('disabled', false);

                setTimeout(() => {
                    $block.slideUp(200);
                }, 2000);
            }).catch(() => {
                Espo.Ui.error('Fehler beim Erstellen der Aufgabe.');
                $btn.prop('disabled', false).text('Aufgabe erstellen');
            });
        },

        _openTechnikerFindenModal: function () {
            this.createView('findeTechnikerModal', 'custom:views/c-servicevorgang/modals/techniker-finden', {
                servicevorgangId: this.model.id,
                geplanterTermin: this.model.get('geplanterTermin'),
                anlageTyp: this.model.get('anlageTyp')
            }, (view) => {
                view.render();

                this.listenToOnce(view, 'techniker-zugewiesen', () => {
                    this.model.fetch({
                        success: () => this.reRender()
                    });
                });
            });
        }

    });
});
