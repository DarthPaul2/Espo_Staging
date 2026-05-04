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
            this._renderStornoButton();
            this._renderStornoInfoBox();
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

        // Что это:
        // Добавляет fachliche кнопку Stornieren в стандартный верхний ряд кнопок.
        //
        // Зачем:
        // Для festgeschriebene Zahlung действие должно быть видно,
        // а после erfolgtem Storno кнопка должна стать grau und deaktiviert.
        _renderStornoButton: function () {
            setTimeout(() => {
                const $actionBar = this.$el.find('.detail-button-container, .header-button-container, .record-button-container').first();

                if (!$actionBar.length) {
                    setTimeout(() => this._renderStornoButton(), 300);
                    return;
                }

                const status = String(this.model.get('status') || '').toLowerCase();
                const istFestgeschrieben = !!this.model.get('istFestgeschrieben');
                const istStorniert = !!this.model.get('istStorniert');

                // Показываем кнопку только для festgeschriebene Zahlung.
                // Если уже storniert — оставляем её видимой, но делаем серой и недоступной.
                if (!(status === 'festgeschrieben' && istFestgeschrieben)) {
                    $actionBar.find('button[data-action="stornierenZahlung"]').remove();
                    return;
                }

                let $btn = $actionBar.find('button[data-action="stornierenZahlung"]').first();

                if (!$btn.length) {
                    $btn = $(`
                        <button
                            type="button"
                            class="btn btn-danger"
                            data-action="stornierenZahlung"
                            title="Festgeschriebene Zahlung stornieren">
                            Stornieren
                        </button>
                    `);

                    const $editBtn = $actionBar.find('.action[data-action="edit"]').first();

                    if ($editBtn.length) {
                        $btn.insertAfter($editBtn);
                    } else {
                        $actionBar.append($btn);
                    }

                    $btn.on('click', () => {
                        if ($btn.prop('disabled')) {
                            return;
                        }
                        this.actionStornierenZahlung();
                    });
                }

                if (istStorniert) {
                    $btn
                        .removeClass('btn-danger')
                        .addClass('btn-default')
                        .prop('disabled', true)
                        .css({
                            pointerEvents: 'none',
                            opacity: 0.65
                        })
                        .attr('title', 'Diese Zahlung ist bereits storniert.');
                } else {
                    $btn
                        .removeClass('btn-default')
                        .addClass('btn-danger')
                        .prop('disabled', false)
                        .css({
                            pointerEvents: '',
                            opacity: ''
                        })
                        .attr('title', 'Festgeschriebene Zahlung stornieren');
                }
            }, 300);
        },

        // Что это:
        // Показывает заметный storno-блок в карточке Zahlung.
        //
        // Зачем:
        // Чтобы пользователь сразу видел, что запись уже storniert,
        // когда это произошло и по какой причине.
        _renderStornoInfoBox: function () {
            setTimeout(() => {
                // если блок уже есть — сначала убираем, потом заново строим
                this.$el.find('[data-name="zahlung-storno-info-box"]').remove();

                const istStorniert = !!this.model.get('istStorniert');
                if (!istStorniert) {
                    return;
                }

                const storniertAm = this.model.get('storniertAm') || '—';
                const stornoGrund = this.model.get('stornoGrund') || '—';

                const $actionBar = this.$el.find('.detail-button-container, .header-button-container, .record-button-container').first();

                if (!$actionBar.length) {
                    setTimeout(() => this._renderStornoInfoBox(), 300);
                    return;
                }

                // Что это:
                // Крупный красный Hinweis-Block для stornierten Zahlungen.
                //
                // Зачем:
                // Чтобы Storno у оплаты визуально бросался в глаза так же,
                // как у stornierten Rechnungen.
                const rows = [];

                rows.push(`
                    <div data-name="zahlung-storno-info-box"
                        style="
                            display: flex;
                            align-items: flex-start;
                            gap: 0;
                            margin-top: 10px;
                            margin-bottom: 12px;
                            padding: 18px 20px;
                            border: 1px solid #ebccd1;
                            background: #f2dede;
                            color: #a94442;
                            border-radius: 6px;
                        ">
                `);

                rows.push(`<div style="font-size: 28px; line-height: 1; margin-right: 12px;">⛔</div>`);
                rows.push('<div style="flex: 1;">');
                rows.push('<div style="font-size: 18px; font-weight: 700; color: #a94442; margin-bottom: 10px;">Diese Zahlung wurde storniert.</div>');

                if (storniertAm) {
                    rows.push(`<div style="margin-bottom: 6px; font-size: 14px; color:rgb(51, 51, 51); "><strong>Storniert am:</strong> ${this._escapeHtml(String(storniertAm))}</div>`);
                }

                if (stornoGrund) {
                    rows.push(`<div style="font-size: 14px; color:rgb(52, 52, 52); "><strong>Storno-Grund:</strong> ${this._escapeHtml(String(stornoGrund))}</div>`);
                }

                rows.push('</div>');
                rows.push('</div>');

                const $box = $(rows.join(''));

                $box.insertAfter($actionBar);
            }, 250);
        },

        // Что это:
        // Минимальное HTML-Escaping для пользовательских текстов.
        //
        // Зачем:
        // Чтобы stornoGrund безопасно отображался в Info-Box.
        _escapeHtml: function (value) {
            return String(value)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
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
        },

        // Что это:
        // Запускает fachliches Storno einer festgeschriebenen Zahlung.
        //
        // Зачем:
        // Phase 4: отменяет Zahlungswirkung через server-side Storno-Logik.
        actionStornierenZahlung: function () {
            const id = this.model.id;
            if (!id) {
                this.notify('Zahlung-ID fehlt.', 'error');
                return;
            }

            const status = String(this.model.get('status') || '').toLowerCase();
            const istFestgeschrieben = !!this.model.get('istFestgeschrieben');
            const istStorniert = !!this.model.get('istStorniert');

            if (!(status === 'festgeschrieben' && istFestgeschrieben)) {
                this.notify('Nur festgeschriebene Zahlungen können storniert werden.', 'warning');
                return;
            }

            if (istStorniert) {
                this.notify('Die Zahlung ist bereits storniert.', 'warning');
                return;
            }

            const stornoGrund = window.prompt('Bitte Storno-Grund eingeben:');

            if (stornoGrund === null) {
                return;
            }

            const grund = String(stornoGrund || '').trim();

            if (!grund) {
                this.notify('Storno-Grund fehlt.', 'warning');
                return;
            }

            const confirmed = window.confirm(
                'Möchten Sie diese festgeschriebene Zahlung wirklich stornieren?\n\n' +
                'Storno-Grund: ' + grund
            );

            if (!confirmed) {
                return;
            }

            const notifyId = this.notify('Zahlung wird storniert…', 'loading');

            Espo.Ajax.postRequest('CZahlung/action/stornieren', {
                id: id,
                stornoGrund: grund
            }).then((resp) => {
                this.notify(false, 'loading', notifyId);

                if (!resp || resp.success === false) {
                    this.notify((resp && resp.message) || 'Storno konnte nicht abgeschlossen werden.', 'error');
                    return;
                }

                this.notify(resp.message || 'Zahlung wurde erfolgreich storniert.', 'success');

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
                console.error('[CZahlung/detail] actionStornierenZahlung error', xhr);
            });
        }
    });
});