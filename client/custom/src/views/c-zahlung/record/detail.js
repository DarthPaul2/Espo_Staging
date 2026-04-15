define('custom:views/c-zahlung/record/detail', [
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

                if (this.$el.find('div[data-name="zahlung-workflow-actions"]').length) {
                    return;
                }

                const $workflow = $(`
                    <div data-name="zahlung-workflow-actions"
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
                .attr('title', 'Festgeschriebene Zahlungen dürfen nicht mehr bearbeitet werden.');
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
                    .attr('title', 'Festgeschriebene Zahlungen dürfen nicht gelöscht werden.');
            }
        },

        _applyAusgleichePanelLock: function () {
            const isFestgeschrieben =
                String(this.model.get('status') || '').toLowerCase() === 'festgeschrieben';

            if (!isFestgeschrieben) {
                return;
            }

            const $panel = this.$el.find('[data-panel="ausgleiche"], .panel[data-name="ausgleiche"]').first();
            if (!$panel.length) {
                return;
            }

            $panel.find('button.action[data-action="createRelated"][data-panel="ausgleiche"]').hide();
            $panel.find('button.action[data-action="selectRelated"][data-panel="ausgleiche"]').hide();
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
                this._applyAusgleichePanelLock();

                if (attempt < maxAttempts) {
                    this._applyActionLocksDeferred(attempt + 1);
                }
            }, 250);
        },

        _blockCreateRelatedIfLocked: function (e) {
            const btn = e.target.closest('button.action[data-action="createRelated"][data-panel="ausgleiche"]');
            if (!btn) return;

            const isFestgeschrieben =
                String(this.model.get('status') || '').toLowerCase() === 'festgeschrieben';

            if (!isFestgeschrieben) return;

            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();

            this.notify('Ausgleiche einer festgeschriebenen Zahlung dürfen nicht mehr bearbeitet werden.', 'warning');
            return false;
        },

        // Что это:
        // возвращает Zahlung из freigabe обратно в entwurf.
        actionWorkflowEntwurf: function () {
            const id = this.model.id;
            if (!id) {
                this.notify('Zahlung-ID fehlt.', 'error');
                return;
            }

            const notifyId = this.notify('Zahlung wird in den Entwurf zurückgesetzt…', 'loading');

            Espo.Ajax.postRequest('CZahlung/action/zurueckZuEntwurf', {
                id: id
            }).then((resp) => {
                this.notify(false, 'loading', notifyId);

                if (!resp || resp.success === false) {
                    this.notify((resp && resp.message) || 'Status konnte nicht auf Entwurf zurückgesetzt werden.', 'error');
                    return;
                }

                this.notify(resp.message || 'Zahlung wurde in den Entwurf zurückgesetzt.', 'success');

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
                console.error('[CZahlung/detail] actionWorkflowEntwurf error', xhr);
            });
        },

        // Что это:
        // переводит Zahlung в freigabe после server-side проверки.
        actionWorkflowFreigabe: function () {
            const id = this.model.id;
            if (!id) {
                this.notify('Zahlung-ID fehlt.', 'error');
                return;
            }

            const notifyId = this.notify('Zahlung wird fachlich freigegeben…', 'loading');

            Espo.Ajax.postRequest('CZahlung/action/freigeben', {
                id: id
            }).then((resp) => {
                this.notify(false, 'loading', notifyId);

                if (!resp || resp.success === false) {
                    this.notify((resp && resp.message) || 'Freigabe konnte nicht abgeschlossen werden.', 'error');
                    return;
                }

                this.notify(resp.message || 'Zahlung wurde freigegeben.', 'success');

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
                console.error('[CZahlung/detail] actionWorkflowFreigabe error', xhr);
            });
        },

        // Что это:
        // запускает окончательную Festschreibung Zahlung.
        actionWorkflowFestgeschrieben: function () {
            const id = this.model.id;
            if (!id) {
                this.notify('Zahlung-ID fehlt.', 'error');
                return;
            }

            const notifyId = this.notify('Zahlung wird festgeschrieben…', 'loading');

            Espo.Ajax.postRequest('CZahlung/action/festschreiben', {
                id: id
            }).then((resp) => {
                this.notify(false, 'loading', notifyId);

                if (!resp || resp.success === false) {
                    this.notify((resp && resp.message) || 'Festschreibung konnte nicht abgeschlossen werden.', 'error');
                    return;
                }

                this.notify(resp.message || 'Zahlung wurde festgeschrieben.', 'success');

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
                console.error('[CZahlung/detail] actionWorkflowFestgeschrieben error', xhr);
            });
        }
    });
});