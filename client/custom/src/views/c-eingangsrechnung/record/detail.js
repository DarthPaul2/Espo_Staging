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
            this._renderKorrekturNachfolgeActionButton();
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
                this._applyStorniertGlobalButtonLock();
                this._updateKorrekturNachfolgeActionButtonState();

                if (attempt < maxAttempts) {
                    this._applyActionLocksDeferred(attempt + 1);
                }
            }, 250);
        },

        // Что это: блокирует действия у stornierten Eingangsrechnung.
        // Зачем: после Storno документ нельзя менять; разрешён только Nachfolgebeleg.
        _applyStorniertGlobalButtonLock: function () {
            const isStorniert =
                !!this.model.get('istStorniert') ||
                String(this.model.get('zahlungsstatus') || '').toLowerCase() === 'storniert';

            if (!isStorniert) {
                return;
            }

            const allowedActions = [
                'createKorrekturNachfolgeEingangsrechnung'
            ];

            const lockButton = ($btn, title) => {
                $btn
                    .prop('disabled', true)
                    .addClass('disabled')
                    .css({
                        pointerEvents: 'none',
                        opacity: 0.45
                    })
                    .attr('title', title || 'Diese Aktion ist bei einer stornierten Eingangsrechnung nicht zulässig.');
            };

            const unlockButton = ($btn, title) => {
                $btn
                    .prop('disabled', false)
                    .removeClass('disabled')
                    .css({
                        pointerEvents: '',
                        opacity: ''
                    });

                if (title) {
                    $btn.attr('title', title);
                }
            };

            this.$el.find('button.action, a.action, button[data-action], a[data-action]').each((i, el) => {
                const $btn = $(el);
                const action = String($btn.attr('data-action') || '');

                if (!action) {
                    return;
                }

                if (allowedActions.includes(action)) {
                    unlockButton($btn, 'Erstellt einen neuen korrigierten Nachfolgebeleg zu dieser stornierten Eingangsrechnung.');
                    return;
                }

                lockButton($btn);
            });

            this.$el
                .find('div[data-name="eingangsrechnung-workflow-actions"] button')
                .each((i, el) => {
                    lockButton($(el), 'Der Workflow ist bei einer stornierten Eingangsrechnung abgeschlossen.');
                });

            this._applyPositionsPanelLock();
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

        // Что это: рисует кнопку для создания korrigierten Nachfolgebeleg по stornierten Eingangsrechnung.
        // Зачем: Phase 5 требует создавать новый самостоятельный Beleg после Storno, а не править старый.
        _renderKorrekturNachfolgeActionButton: function () {
            setTimeout(() => {
                const $actionBar = this.$el.find('.detail-button-container, .header-button-container, .record-button-container').first();

                if (!$actionBar.length) {
                    setTimeout(() => this._renderKorrekturNachfolgeActionButton(), 300);
                    return;
                }

                if (this.$el.find('button[data-action="createKorrekturNachfolgeEingangsrechnung"]').length) {
                    this._updateKorrekturNachfolgeActionButtonState();
                    return;
                }

                const isStorniert =
                    !!this.model.get('istStorniert') ||
                    String(this.model.get('zahlungsstatus') || '').toLowerCase() === 'storniert';

                const hasNachfolger = !!this.model.get('nachfolgeBelegId');

                if (!isStorniert || hasNachfolger) {
                    return;
                }

                const $btn = $(`
                    <button
                        type="button"
                        class="btn btn-default"
                        data-action="createKorrekturNachfolgeEingangsrechnung"
                        style="margin-left: 6px;"
                        title="Erstellt einen neuen korrigierten Nachfolgebeleg zu dieser stornierten Eingangsrechnung."
                    >
                        Korrigierten Nachfolgebeleg anlegen
                    </button>
                `);

                const $stornoBtn = $actionBar.find('button[data-action="stornierenEingangsrechnung"]').first();
                const $editBtn = $actionBar.find('.action[data-action="edit"]').first();

                if ($stornoBtn.length) {
                    $btn.insertAfter($stornoBtn);
                } else if ($editBtn.length) {
                    $btn.insertAfter($editBtn);
                } else {
                    $actionBar.append($btn);
                }

                $btn.on('click', () => {
                    this.actionCreateKorrekturNachfolgeEingangsrechnung();
                });

                this._updateKorrekturNachfolgeActionButtonState();
            }, 350);
        },

        // Что это: открывает модальное окно для выбора Korrekturtyp и ввода Korrekturgrund.
        // Зачем: нормальный UI вместо window.prompt().
        _openKorrekturNachfolgeModal: function (callback) {
            const modalId = 'eingangsrechnung-korrektur-nachfolge-modal-' + Date.now();

            const options = [
                { value: 'inhaltliche_korrektur', label: 'Inhaltliche Korrektur' },
                { value: 'betragskorrektur', label: 'Betragskorrektur' },
                { value: 'positionskorrektur', label: 'Positionskorrektur' },
                { value: 'steuerkorrektur', label: 'Steuerkorrektur' },
                { value: 'adresskorrektur', label: 'Adresskorrektur' },
                { value: 'formelle_korrektur', label: 'Formelle Korrektur' },
                { value: 'sonstige_korrektur', label: 'Sonstige Korrektur' }
            ];

            const optionHtml = options.map(o => {
                return `<option value="${_.escape(o.value)}">${_.escape(o.label)}</option>`;
            }).join('');

            const html = `
                <div class="modal fade" id="${modalId}" tabindex="-1" role="dialog" aria-hidden="true">
                    <div class="modal-dialog" style="max-width: 620px;">
                        <div class="modal-content">
                            <div class="modal-header" style="border-bottom: 1px solid #ddd;">
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 class="modal-title">Korrigierten Nachfolgebeleg anlegen</h4>
                            </div>

                            <div class="modal-body">
                                <div class="alert alert-warning" style="margin-bottom: 16px;">
                                    Für diese stornierte Eingangsrechnung wird ein neuer korrigierter Nachfolgebeleg als Entwurf erstellt.
                                </div>

                                <div class="form-group">
                                    <label for="${modalId}-typ">Korrekturtyp</label>
                                    <select id="${modalId}-typ" class="form-control">
                                        ${optionHtml}
                                    </select>
                                </div>

                                <div class="form-group">
                                    <label for="${modalId}-grund">Korrekturgrund</label>
                                    <textarea id="${modalId}-grund"
                                            class="form-control"
                                            rows="4"
                                            placeholder="Bitte Korrekturgrund eingeben..."></textarea>
                                </div>

                                <div style="font-size: 12px; color: #777;">
                                    Die alte Eingangsrechnung bleibt storniert. Der neue Nachfolgebeleg wird als eigenständiger Entwurf erstellt.
                                </div>
                            </div>

                            <div class="modal-footer">
                                <button type="button" class="btn btn-default" data-action="cancel">
                                    Abbrechen
                                </button>
                                <button type="button" class="btn btn-warning" data-action="confirm">
                                    Nachfolgebeleg erstellen
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            const $modal = $(html);
            $('body').append($modal);

            const cleanup = () => {
                $modal.off();
                $modal.remove();
            };

            $modal.on('click', '[data-action="cancel"]', function () {
                $modal.modal('hide');
            });

            $modal.on('click', '[data-action="confirm"]', () => {
                const korrekturTyp = String($modal.find(`#${modalId}-typ`).val() || '').trim();
                const korrekturGrund = String($modal.find(`#${modalId}-grund`).val() || '').trim();

                if (!korrekturTyp) {
                    this.notify('Korrekturtyp fehlt.', 'warning');
                    return;
                }

                if (!korrekturGrund) {
                    this.notify('Korrekturgrund fehlt.', 'warning');
                    $modal.find(`#${modalId}-grund`).focus();
                    return;
                }

                $modal.modal('hide');

                if (typeof callback === 'function') {
                    callback({
                        korrekturTyp: korrekturTyp,
                        korrekturGrund: korrekturGrund
                    });
                }
            });

            $modal.on('hidden.bs.modal', cleanup);

            $modal.modal({
                backdrop: 'static',
                keyboard: true
            });

            setTimeout(() => {
                $modal.find(`#${modalId}-grund`).focus();
            }, 300);
        },

        // Что это: запускает создание korrigierten Nachfolgebeleg для stornierten Eingangsrechnung.
        // Зачем: Phase 5 требует создавать новый самостоятельный Beleg после Storno, связанный с Ursprungsbeleg.
        actionCreateKorrekturNachfolgeEingangsrechnung: function () {
            const id = this.model.id;

            if (!id) {
                this.notify('Eingangsrechnung-ID fehlt.', 'error');
                return;
            }

            const isStorniert =
                !!this.model.get('istStorniert') ||
                String(this.model.get('zahlungsstatus') || '').toLowerCase() === 'storniert';

            if (!isStorniert) {
                this.notify('Ein Nachfolgebeleg kann nur für eine stornierte Eingangsrechnung erstellt werden.', 'warning');
                return;
            }

            if (this.model.get('nachfolgeBelegId')) {
                this.notify('Für diese Eingangsrechnung existiert bereits ein Nachfolgebeleg.', 'warning');
                return;
            }

            this._openKorrekturNachfolgeModal((result) => {
                const korrekturTyp = result.korrekturTyp;
                const korrekturGrund = result.korrekturGrund;

                const notifyId = this.notify('Korrigierter Nachfolgebeleg wird erstellt…', 'loading');

                Espo.Ajax.postRequest('CEingangsrechnung/action/createKorrekturNachfolgebeleg', {
                    id: id,
                    korrekturTyp: korrekturTyp,
                    korrekturGrund: korrekturGrund
                }).then((resp) => {
                    this.notify(false, 'loading', notifyId);

                    if (!resp || resp.success === false) {
                        this.notify((resp && resp.message) || 'Nachfolgebeleg konnte nicht erstellt werden.', 'error');
                        return;
                    }

                    const copiedPositions = resp.copiedPositions || 0;

                    this.notify(
                        (resp.message || 'Nachfolgebeleg wurde erstellt.') +
                        ' Kopierte Positionen: ' + copiedPositions,
                        'success'
                    );

                    if (resp.nachfolgeBelegId) {
                        window.location.hash = '#CEingangsrechnung/view/' + resp.nachfolgeBelegId;
                        window.location.reload();
                        return;
                    }

                    this.model.fetch({
                        success: () => this.reRender(),
                        error: () => window.location.reload()
                    });
                }).catch((xhr) => {
                    this.notify(false, 'loading', notifyId);

                    let msg = 'Nachfolgebeleg konnte nicht erstellt werden.';
                    try {
                        msg = xhr?.responseJSON?.message || xhr?.responseJSON?.error || msg;
                    } catch (e) { }

                    this.notify(msg, 'error');
                    console.error('[CEingangsrechnung/detail] createKorrekturNachfolgebeleg error', xhr);
                });
            });
        },

        // Что это: управляет доступностью кнопки Nachfolgebeleg.
        // Зачем: кнопку можно использовать только один раз и только после Storno.
        _updateKorrekturNachfolgeActionButtonState: function () {
            const isStorniert =
                !!this.model.get('istStorniert') ||
                String(this.model.get('zahlungsstatus') || '').toLowerCase() === 'storniert';

            const hasNachfolger = !!this.model.get('nachfolgeBelegId');

            const $btn = this.$el.find('button[data-action="createKorrekturNachfolgeEingangsrechnung"]');

            if (!$btn.length) {
                return;
            }

            if (!isStorniert || hasNachfolger) {
                $btn
                    .prop('disabled', true)
                    .addClass('disabled')
                    .css({
                        pointerEvents: 'none',
                        opacity: 0.5
                    })
                    .attr('title', hasNachfolger
                        ? 'Für diese Eingangsrechnung existiert bereits ein Nachfolgebeleg.'
                        : 'Ein Nachfolgebeleg kann nur nach Storno erstellt werden.');
                return;
            }

            $btn
                .prop('disabled', false)
                .removeClass('disabled')
                .css({
                    pointerEvents: '',
                    opacity: ''
                })
                .attr('title', 'Erstellt einen neuen korrigierten Nachfolgebeleg zu dieser stornierten Eingangsrechnung.');
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

        // Что это:
        // Открывает нормальное модальное окно для ввода Storno-Grund.
        //
        // Зачем:
        // Заменяет window.prompt() на аккуратный UI в стиле Espo/Bootstrap.
        _openStornoGrundModal: function (callback) {
            this.$el.find('[data-name="eingangsrechnung-storno-modal"]').remove();

            const modalHtml = `
        <div class="modal fade" data-name="eingangsrechnung-storno-modal" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document" style="max-width: 620px;">
                <div class="modal-content">
                    <div class="modal-header" style="background: #f2dede; color: #a94442;">
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 class="modal-title">
                            Eingangsrechnung stornieren
                        </h4>
                    </div>

                    <div class="modal-body">
                        <div class="alert alert-warning" style="margin-bottom: 15px;">
                            Diese Aktion erstellt Storno-Buchungen und setzt die Eingangsrechnung fachlich auf storniert.
                            Die ursprüngliche Eingangsrechnung wird nicht gelöscht.
                        </div>

                        <div class="form-group">
                            <label class="control-label">
                                Storno-Grund <span style="color: #a94442;">*</span>
                            </label>

                            <textarea
                                class="form-control"
                                data-name="stornoGrund"
                                rows="4"
                                placeholder="Bitte Storno-Grund eingeben..."
                                style="resize: vertical;"
                            ></textarea>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-default" data-action="cancelStornoModal">
                            Abbrechen
                        </button>

                        <button type="button" class="btn btn-danger" data-action="confirmStornoModal">
                            Stornieren
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

            const $modal = $(modalHtml);
            this.$el.append($modal);

            const closeModal = () => {
                $modal.modal('hide');

                setTimeout(() => {
                    $modal.remove();
                }, 300);
            };

            $modal.on('shown.bs.modal', () => {
                $modal.find('[data-name="stornoGrund"]').focus();
            });

            $modal.on('click', '[data-action="cancelStornoModal"]', () => {
                closeModal();
            });

            $modal.on('click', '[data-action="confirmStornoModal"]', () => {
                const stornoGrund = String($modal.find('[data-name="stornoGrund"]').val() || '').trim();

                if (!stornoGrund) {
                    this.notify('Storno-Grund fehlt.', 'warning');
                    $modal.find('[data-name="stornoGrund"]').focus();
                    return;
                }

                closeModal();

                if (typeof callback === 'function') {
                    callback(stornoGrund);
                }
            });

            $modal.modal({
                backdrop: 'static',
                keyboard: true
            });
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

            // Что это:
            // Открывает модальное окно для Storno-Grund вместо window.prompt.
            //
            // Зачем:
            // Storno выполняется через нормальный UI, без системного prompt.
            this._openStornoGrundModal((stornoGrund) => {
                const grund = String(stornoGrund || '').trim();

                const notifyId = this.notify('Eingangsrechnung wird storniert…', 'loading');

                Espo.Ajax.postRequest('CEingangsrechnung/action/stornieren', {
                    id: id,
                    stornoGrund: grund
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
                        stornoGrund: grund,
                        zahlungsstatus: 'storniert',
                        restbetragOffen: 0
                    });

                    this._updateStornoActionButtonState();
                    this._renderStornoInfoBlock();
                    this._applyStorniertGlobalButtonLock();

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

            // Что это: берёт Storno-Daten с fallback.
            // Зачем: Espo не всегда сразу отдаёт Name-поля в model при первом render.
            const storniertAm =
                this.model.get('storniertAm') ||
                this.model.get('storniert_am') ||
                '—';

            const stornoGrund =
                this.model.get('stornoGrund') ||
                this.model.get('storno_grund') ||
                '—';

            const storniertVonName =
                this.model.get('storniertVonName') ||
                this.model.get('storniertVonBenutzerName') ||
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
                        <div style="font-size: 18px; font-weight: 700; margin-bottom: 10px; color: #a94442;">
                            Diese Eingangsrechnung wurde storniert.
                        </div>
                        <div style="margin-bottom: 6px; font-size: 14px; color: rgb(51, 51, 51);">
                            <strong>Storniert am:</strong>
                            ${Espo.Utils?.escapeString ? Espo.Utils.escapeString(String(storniertAm)) : String(storniertAm)}
                        </div>
                        <div style="margin-bottom: 6px; font-size: 14px; color: rgb(51, 51, 51);">
                            <strong>Storniert von:</strong>
                            ${Espo.Utils?.escapeString ? Espo.Utils.escapeString(String(storniertVonName)) : String(storniertVonName)}
                        </div>
                        <div style="font-size: 14px; color: rgb(51, 51, 51);">
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