define('custom:views/c-eingangsrechnung/record/detail', [
    'views/record/detail'
], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            this._blockCreateRelatedIfLocked = this._blockCreateRelatedIfLocked.bind(this);
            document.addEventListener('click', this._blockCreateRelatedIfLocked, true);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this._renderWorkflowButtons();
            this._applyActionLocksDeferred();
            this._renderStornoActionButton();
            this._renderStornoInfoBlock();
            this._updateStornoActionButtonState();
        },

        onRemove: function () {
            if (this._blockCreateRelatedIfLocked) {
                document.removeEventListener('click', this._blockCreateRelatedIfLocked, true);
            }

            Dep.prototype.onRemove.call(this);
        },

        _renderWorkflowButtons: function () {
            setTimeout(() => {
                const $actionBar = this.$el.find('.detail-button-container, .header-button-container, .record-button-container').first();

                if (!$actionBar.length) {
                    setTimeout(() => this._renderWorkflowButtons(), 300);
                    return;
                }

                if (this.$el.find('div[data-name="eingangsrechnung-workflow-actions"]').length) {
                    return;
                }

                const $workflow = $(`
                    <div data-name="eingangsrechnung-workflow-actions"
                         style="display: inline-flex; gap: 6px; padding: 5px 8px; margin-top: 8px; margin-bottom: 8px; background: #d9edf7; border-radius: 6px; border: 1px solid #bce8f1;">
                        <button class="btn btn-default" data-action="workflowEntwurf">Entwurf</button>
                        <button class="btn btn-default" data-action="workflowFreigabe">Freigabe</button>
                        <button class="btn btn-default" data-action="workflowFestgeschrieben">Festgeschrieben</button>
                    </div>
                `);

                $workflow.insertAfter($actionBar);

                const status = String(this.model.get('status') || 'entwurf').toLowerCase();

                const $btnEntwurf = $workflow.find('[data-action="workflowEntwurf"]');
                const $btnFreigabe = $workflow.find('[data-action="workflowFreigabe"]');
                const $btnFest = $workflow.find('[data-action="workflowFestgeschrieben"]');

                if (status === 'entwurf') {
                    $btnEntwurf.removeClass('btn-default').addClass('btn-info');
                } else if (status === 'freigabe') {
                    $btnFreigabe.removeClass('btn-default').addClass('btn-success');
                } else if (status === 'festgeschrieben') {
                    $btnEntwurf.prop('disabled', true).css({ opacity: 0.65 });
                    $btnFreigabe.prop('disabled', true).css({ opacity: 0.65 });
                    $btnFest
                        .removeClass('btn-default')
                        .addClass('btn-primary')
                        .prop('disabled', true)
                        .css({
                            opacity: 1,
                            fontWeight: '600'
                        });
                }

                $workflow.on('click', '[data-action="workflowEntwurf"]', () => {
                    this.actionWorkflowEntwurf();
                });

                $workflow.on('click', '[data-action="workflowFreigabe"]', () => {
                    this.actionWorkflowFreigabe();
                });

                $workflow.on('click', '[data-action="workflowFestgeschrieben"]', () => {
                    this.actionWorkflowFestgeschrieben();
                });
            }, 500);
        },

        _applyEditButtonLock: function () {
            const isFestgeschrieben =
                String(this.model.get('status') || '').toLowerCase() === 'festgeschrieben';

            const $editBtn = this.$el.find('.action[data-action="edit"]');

            if (!$editBtn.length) {
                return;
            }

            if (!isFestgeschrieben) {
                $editBtn
                    .prop('disabled', false)
                    .removeClass('disabled')
                    .css({
                        pointerEvents: '',
                        opacity: ''
                    })
                    .attr('title', 'Bearbeiten');
                return;
            }

            $editBtn
                .prop('disabled', true)
                .addClass('disabled')
                .css({
                    pointerEvents: 'none',
                    opacity: 0.5
                })
                .attr('title', 'Festgeschriebene Eingangsrechnungen dürfen nicht mehr bearbeitet werden.');
        },

        _applyDeleteButtonLock: function () {
            const isFestgeschrieben =
                String(this.model.get('status') || '').toLowerCase() === 'festgeschrieben';

            if (!isFestgeschrieben) {
                return;
            }

            const $deleteBtn = this.$el.find('.action[data-action="delete"]');

            if ($deleteBtn.length) {
                $deleteBtn
                    .prop('disabled', true)
                    .addClass('disabled')
                    .css({
                        pointerEvents: 'none',
                        opacity: 0.5
                    })
                    .attr('title', 'Festgeschriebene Eingangsrechnungen dürfen nicht gelöscht werden.');
            }
        },

        _applyPositionsPanelLock: function () {
            const isFestgeschrieben =
                String(this.model.get('status') || '').toLowerCase() === 'festgeschrieben';

            if (!isFestgeschrieben) {
                return;
            }

            const $panel = this.$el.find('[data-panel="eingangsrechnungspositionen"], .panel[data-name="eingangsrechnungspositionen"]').first();
            if (!$panel.length) {
                return;
            }

            $panel.find('button.action[data-action="createRelated"][data-panel="eingangsrechnungspositionen"]').hide();
            $panel.find('button.action[data-action="selectRelated"][data-panel="eingangsrechnungspositionen"]').hide();
            $panel.find('.panel-heading .dropdown-toggle').hide();
            $panel.find('.panel-heading .btn-group').hide();
            $panel.find('.panel-heading .actions').hide();

            $panel.find('.list-row-buttons').hide();
            $panel.find('.row-actions').hide();
            $panel.find('td.cell[data-name="buttons"]').hide();
            $panel.find('.cell[data-name="buttons"]').hide();

            $panel.find('button.action').hide();
            $panel.find('button.dropdown-toggle').hide();
            $panel.find('.dropdown-toggle').hide();
            $panel.find('.dropdown').hide();
            $panel.find('.btn-group').hide();

            $panel.find('a[data-action="editRelated"]').hide();
            $panel.find('a[data-action="removeRelated"]').hide();
            $panel.find('a[data-action="unlinkRelated"]').hide();
            $panel.find('a[data-action="deleteRelated"]').hide();

            $panel.find('tbody tr').each(function () {
                $(this).find('td:last-child .btn, td:last-child .dropdown, td:last-child .dropdown-toggle, td:last-child .btn-group, td:last-child a, td:last-child button').hide();
            });
        },

        _applyActionLocksDeferred: function (attempt = 0) {
            const maxAttempts = 20;

            setTimeout(() => {
                this._applyEditButtonLock();
                this._applyDeleteButtonLock();
                this._applyPositionsPanelLock();

                if (attempt < maxAttempts) {
                    this._applyActionLocksDeferred(attempt + 1);
                }
            }, 250);
        },

        _blockCreateRelatedIfLocked: function (e) {
            const btn = e.target.closest('button.action[data-action="createRelated"][data-panel="eingangsrechnungspositionen"]');
            if (!btn) return;

            const isFestgeschrieben =
                String(this.model.get('status') || '').toLowerCase() === 'festgeschrieben';

            if (!isFestgeschrieben) return;

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            this.notify('Positionen einer festgeschriebenen Eingangsrechnung dürfen nicht mehr bearbeitet werden.', 'warning');
            return false;
        },

        // Что это: кнопка возвращает документ из freigabe обратно в entwurf.
        actionWorkflowEntwurf: function () {
            const id = this.model.id;
            if (!id) {
                this.notify('Eingangsrechnung-ID fehlt.', 'error');
                return;
            }

            const notifyId = this.notify('Eingangsrechnung wird in den Entwurf zurückgesetzt…', 'loading');

            Espo.Ajax.postRequest('CEingangsrechnung/action/zurueckZuEntwurf', {
                id: id
            }).then((resp) => {
                this.notify(false, 'loading', notifyId);

                if (!resp || resp.success === false) {
                    this.notify((resp && resp.message) || 'Status konnte nicht auf Entwurf zurückgesetzt werden.', 'error');
                    return;
                }

                this.notify(resp.message || 'Eingangsrechnung wurde in den Entwurf zurückgesetzt.', 'success');

                this.model.fetch({
                    success: () => this.reRender(),
                    error: () => window.location.reload()
                });
            }).catch((xhr) => {
                this.notify(false, 'loading', notifyId);

                let msg = 'Status konnte nicht auf Entwurf zurückgesetzt werden.';
                try {
                    msg = xhr?.responseJSON?.message || xhr?.responseJSON?.error || msg;
                } catch (e) { }

                this.notify(msg, 'error');
                console.error('[CEingangsrechnung/detail] actionWorkflowEntwurf error', xhr);
            });
        },

        // Что это: кнопка переводит документ в freigabe после server-side проверки.
        actionWorkflowFreigabe: function () {
            const id = this.model.id;
            if (!id) {
                this.notify('Eingangsrechnung-ID fehlt.', 'error');
                return;
            }

            const notifyId = this.notify('Eingangsrechnung wird fachlich freigegeben…', 'loading');

            Espo.Ajax.postRequest('CEingangsrechnung/action/freigeben', {
                id: id
            }).then((resp) => {
                this.notify(false, 'loading', notifyId);

                if (!resp || resp.success === false) {
                    this.notify((resp && resp.message) || 'Freigabe konnte nicht abgeschlossen werden.', 'error');
                    return;
                }

                this.notify(resp.message || 'Eingangsrechnung wurde freigegeben.', 'success');

                this.model.fetch({
                    success: () => this.reRender(),
                    error: () => window.location.reload()
                });
            }).catch((xhr) => {
                this.notify(false, 'loading', notifyId);

                let msg = 'Freigabe konnte nicht abgeschlossen werden.';
                try {
                    msg = xhr?.responseJSON?.message || xhr?.responseJSON?.error || msg;
                } catch (e) { }

                this.notify(msg, 'error');
                console.error('[CEingangsrechnung/detail] actionWorkflowFreigabe error', xhr);
            });
        },

        // Что это: кнопка запускает endgültige Festschreibung с созданием Journal und Buchungen.
        actionWorkflowFestgeschrieben: function () {
            const id = this.model.id;
            if (!id) {
                this.notify('Eingangsrechnung-ID fehlt.', 'error');
                return;
            }

            const notifyId = this.notify('Eingangsrechnung wird festgeschrieben…', 'loading');

            Espo.Ajax.postRequest('CEingangsrechnung/action/festschreiben', {
                id: id
            }).then((resp) => {
                this.notify(false, 'loading', notifyId);

                if (!resp || resp.success === false) {
                    this.notify((resp && resp.message) || 'Festschreibung konnte nicht abgeschlossen werden.', 'error');
                    return;
                }

                this.notify(resp.message || 'Eingangsrechnung wurde festgeschrieben.', 'success');

                this.model.fetch({
                    success: () => this.reRender(),
                    error: () => window.location.reload()
                });
            }).catch((xhr) => {
                this.notify(false, 'loading', notifyId);

                let msg = 'Festschreibung konnte nicht abgeschlossen werden.';
                try {
                    msg = xhr?.responseJSON?.message || xhr?.responseJSON?.error || msg;
                } catch (e) { }

                this.notify(msg, 'error');
                console.error('[CEingangsrechnung/detail] actionWorkflowFestgeschrieben error', xhr);
            });
        },

        _renderStornoActionButton: function () {
            setTimeout(() => {
                const $actionBar = this.$el.find('.detail-button-container, .header-button-container, .record-button-container').first();

                if (!$actionBar.length) {
                    setTimeout(() => this._renderStornoActionButton(), 300);
                    return;
                }

                if (this.$el.find('button[data-action="stornierenEingangsrechnung"]').length) {
                    this._updateStornoActionButtonState();
                    return;
                }

                const $btn = $(`
                    <button
                        type="button"
                        class="btn btn-danger"
                        data-action="stornierenEingangsrechnung"
                        style="margin-left: 6px;"
                        title="Eingangsrechnung stornieren"
                    >
                        Stornieren
                    </button>
                `);

                // Что это:
                // вставляем кнопку сразу после стандартной Bearbeiten.
                //
                // Зачем:
                // чтобы она стояла в одном ряду со стандартными action-кнопками,
                // а не падала ниже в конец контейнера.
                const $editBtn = $actionBar.find('.action[data-action="edit"]').first();

                if ($editBtn.length) {
                    $btn.insertAfter($editBtn);
                } else {
                    $actionBar.append($btn);
                }

                $btn.on('click', () => {
                    this.actionStornierenEingangsrechnung();
                });

                this._updateStornoActionButtonState();
            }, 300);
        },

        _updateStornoActionButtonState: function () {
            const isFestgeschrieben =
                String(this.model.get('status') || '').toLowerCase() === 'festgeschrieben';

            const isStorniert =
                !!this.model.get('istStorniert') ||
                String(this.model.get('zahlungsstatus') || '').toLowerCase() === 'storniert';

            const $btn = this.$el.find('button[data-action="stornierenEingangsrechnung"]');
            if (!$btn.length) {
                return;
            }

            if (!isFestgeschrieben || isStorniert) {
                $btn
                    .prop('disabled', true)
                    .addClass('disabled')
                    .css({
                        pointerEvents: 'none',
                        opacity: 0.5
                    })
                    .attr('title', isStorniert
                        ? 'Die Eingangsrechnung ist bereits storniert.'
                        : 'Nur festgeschriebene Eingangsrechnungen können storniert werden.');
                return;
            }

            $btn
                .prop('disabled', false)
                .removeClass('disabled')
                .css({
                    pointerEvents: '',
                    opacity: ''
                })
                .attr('title', 'Eingangsrechnung stornieren');
        },

        actionStornierenEingangsrechnung: function () {
            const id = this.model.id;
            if (!id) {
                this.notify('Eingangsrechnung-ID fehlt.', 'error');
                return;
            }

            const isStorniert =
                !!this.model.get('istStorniert') ||
                String(this.model.get('zahlungsstatus') || '').toLowerCase() === 'storniert';

            if (isStorniert) {
                this._updateStornoActionButtonState();
                return;
            }

            const stornoGrund = window.prompt('Bitte Storno-Grund eingeben:');
            if (stornoGrund === null) {
                return;
            }

            if (!String(stornoGrund).trim()) {
                this.notify('Storno-Grund fehlt.', 'warning');
                return;
            }

            const notifyId = this.notify('Eingangsrechnung wird storniert…', 'loading');

            Espo.Ajax.postRequest('CEingangsrechnung/action/stornieren', {
                id: id,
                stornoGrund: String(stornoGrund).trim()
            }).then((resp) => {
                this.notify(false, 'loading', notifyId);

                if (!resp || resp.success === false) {
                    this.notify((resp && resp.message) || 'Storno konnte nicht abgeschlossen werden.', 'error');
                    return;
                }

                // Что это:
                // Мгновенно переключаем UI в storniert,
                // ещё до полного fetch/reRender.
                this.model.set({
                    istStorniert: true,
                    storniertAm: resp.storniertAm || this.model.get('storniertAm') || null,
                    stornoGrund: String(stornoGrund).trim(),
                    zahlungsstatus: 'storniert',
                    restbetragOffen: 0
                });

                this._updateStornoActionButtonState();
                this._renderStornoInfoBlock();

                this.notify(resp.message || 'Eingangsrechnung wurde storniert.', 'success');

                this.model.fetch({
                    success: () => this.reRender(),
                    error: () => window.location.reload()
                });
            }).catch((xhr) => {
                this.notify(false, 'loading', notifyId);

                let msg = 'Storno konnte nicht abgeschlossen werden.';
                try {
                    msg = xhr?.responseJSON?.message || xhr?.responseJSON?.error || msg;
                } catch (e) { }

                this.notify(msg, 'error');
                console.error('[CEingangsrechnung/detail] actionStornierenEingangsrechnung error', xhr);
            });
        },

        _renderStornoInfoBlock: function () {
            this.$el.find('[data-name="eingangsrechnung-storno-block"]').remove();

            const isStorniert =
                !!this.model.get('istStorniert') ||
                String(this.model.get('zahlungsstatus') || '').toLowerCase() === 'storniert' ||
                !!this.model.get('storniertAm') ||
                !!this.model.get('stornoGrund');

            if (!isStorniert) {
                return;
            }

            const storniertAm = this.model.get('storniertAm') || '—';
            const stornoGrund = this.model.get('stornoGrund') || '—';
            const storniertVonName =
                this.model.get('storniertVonName') ||
                this.model.get('storniertVonId') ||
                '—';

            const $workflow = this.$el.find('[data-name="eingangsrechnung-workflow-actions"]').first();
            const $target = $workflow.length
                ? $workflow
                : this.$el.find('.detail-button-container, .header-button-container, .record-button-container').first();

            if (!$target.length) {
                return;
            }

            const $block = $(`
                <div data-name="eingangsrechnung-storno-block"
                    style="
                        margin-top: 16px;
                        margin-bottom: 12px;
                        padding: 18px 20px;
                        border: 1px solid #ebccd1;
                        background: #f2dede;
                        color: #a94442;
                        border-radius: 6px;
                        display: flex;
                        align-items: flex-start;
                        gap: 14px;
                    ">
                    <div style="font-size: 28px; line-height: 1;">⛔</div>
                    <div style="flex: 1;">
                        <div style="font-size: 24px; font-weight: 700; margin-bottom: 10px; color: #a94442;">
                            Diese Eingangsrechnung wurde storniert.
                        </div>
                        <div style="margin-bottom: 6px; font-size: 20px; color: rgb(51, 51, 51);">
                            <strong>Storniert am:</strong>
                            ${Espo.Utils?.escapeString ? Espo.Utils.escapeString(String(storniertAm)) : String(storniertAm)}
                        </div>
                        <div style="margin-bottom: 6px; font-size: 20px; color: rgb(51, 51, 51);">
                            <strong>Storniert von:</strong>
                            ${Espo.Utils?.escapeString ? Espo.Utils.escapeString(String(storniertVonName)) : String(storniertVonName)}
                        </div>
                        <div style="font-size: 20px; color: rgb(51, 51, 51);">
                            <strong>Storno-Grund:</strong>
                            ${Espo.Utils?.escapeString ? Espo.Utils.escapeString(String(stornoGrund)) : String(stornoGrund)}
                        </div>
                    </div>
                </div>
            `);

            $block.insertAfter($target);
        },
    });
});