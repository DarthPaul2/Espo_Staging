console.log('[LOAD] custom:views/c-angebot/record/edit');

define('custom:views/c-angebot/record/edit', ['views/record/edit'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // Включи при необходимости: window.__DBG_CAN = true
            const DBG = (typeof window !== 'undefined' && window.__DBG_CAN === true);
            const L = (tag, payload) => { if (DBG) try { console.log('[CAngebot/edit]', tag, payload || ''); } catch (e) { } };

            // ===== helpers =====
            const getPanelView = () => this.getView && this.getView('positionen') || null;
            const getPositionsCollection = () => {
                const pv = getPanelView();
                return (pv && pv.collection) ? pv.collection : (this.collections && this.collections.positionen) || null;
            };

            const bumpTotalsFields = (netto, brutto, src) => {
                L('bumpTotalsFields', { netto, brutto, src });
                this.model.set({ betragNetto: netto, betragBrutto: brutto }, { silent: true });
                const fvN = this.getFieldView && this.getFieldView('betragNetto');
                const fvB = this.getFieldView && this.getFieldView('betragBrutto');
                if (fvN && fvN.setValue) fvN.setValue(netto, { render: true, fromModel: true });
                if (fvB && fvB.setValue) fvB.setValue(brutto, { render: true, fromModel: true });
            };

            const quickLocalRecalc = (reason) => {
                const col = getPositionsCollection();
                if (!col) { L('quickLocalRecalc:no-collection', { reason }); return; }

                const flags = { rc: !!this.model.get('gesetzOption13b'), pv: !!this.model.get('gesetzOption12') };
                const vatRate = (flags.rc || flags.pv) ? 0 : 19;

                let totalNetto = 0, totalBrutto = 0;
                col.forEach(m => {
                    const menge = parseFloat(m.get('menge') || 0);
                    const preis = parseFloat(m.get('preis') || 0);
                    const rabatt = parseFloat(m.get('rabatt') || 0);
                    const netto = Math.round((menge * preis * (1 - rabatt / 100)) * 100) / 100;
                    const brutto = Math.round((netto * (1 + vatRate / 100)) * 100) / 100;
                    totalNetto += netto;
                    totalBrutto += brutto;
                });

                totalNetto = Math.round(totalNetto * 100) / 100;
                totalBrutto = Math.round(totalBrutto * 100) / 100;
                bumpTotalsFields(totalNetto, totalBrutto, 'local:' + reason);
            };

            const hardRefreshFromServer = (src) => {
                this.model.fetch({
                    success: () => {
                        const n = this.model.get('betragNetto') || 0;
                        const b = this.model.get('betragBrutto') || 0;
                        this.reRender();
                        setTimeout(() => bumpTotalsFields(n, b, 'server:' + src), 0);
                    }
                });
            };

            // ЕДИНЫЙ мягкий рефреш после удаления/отвязки
            const softRefresh = (why) => {
                L('softRefresh:start', { why });

                // 1) быстрый локальный пересчёт
                try { quickLocalRecalc('softRefresh'); } catch (e) { }

                // 2) обновить коллекцию/панель (если есть)
                const pv = getPanelView();
                const col = getPositionsCollection();
                if (col && typeof col.fetch === 'function') {
                    try { col.fetch(); } catch (e) { }
                }
                if (pv && typeof pv.reRender === 'function') {
                    try { pv.reRender(); } catch (e) { }
                }

                // 3) подтянуть родителя и добить поля
                this.model.fetch({
                    success: () => {
                        const n = this.model.get('betragNetto') || 0;
                        const b = this.model.get('betragBrutto') || 0;
                        this.reRender();
                        setTimeout(() => bumpTotalsFields(n, b, 'softRefresh:' + why), 0);
                    }
                });
            };

            // ===== налоги вниз =====
            const broadcastTaxFlags = () => {
                const rcRaw = !!this.model.get('gesetzOption13b');
                const pvRaw = !!this.model.get('gesetzOption12');
                if (rcRaw && pvRaw) this.model.set('gesetzOption12', false, { silent: true });

                const flags = { rc: !!this.model.get('gesetzOption13b'), pv: !!this.model.get('gesetzOption12') };
                window.__angebotTax = flags;

                try { window.dispatchEvent(new CustomEvent('angebot-tax-change', { detail: flags })); }
                catch (e) { const ev = document.createEvent('CustomEvent'); ev.initCustomEvent('angebot-tax-change', true, true, flags); window.dispatchEvent(ev); }

                const em = this.getEventManager() || (this.getApplication() && this.getApplication().getEventManager());
                if (em) em.trigger('cangebot:tax-change', flags);
            };

            // ===== перехват УДАЛЕНИЯ (все варианты) → softRefresh =====
            (function installDeletionSoftRefreshOnce(self, softRefreshFn) {
                if (window.__CAN_POS_SOFT_HOOK_INSTALLED) return;
                window.__CAN_POS_SOFT_HOOK_INSTALLED = true;

                const shouldReact = (url, method) => {
                    const u = (url || '').toString();
                    const m = (method || 'GET').toUpperCase();
                    return /\/CAngebotsposition(\/|%2F|$)/i.test(u) &&
                        (m === 'DELETE' || /unlink|unlinkRelated/i.test(u));
                };

                // jQuery ajax*
                if (typeof $ !== 'undefined' && $.on) {
                    $(document).off('.cangebotAjaxSoft');
                    $(document).on('ajaxSuccess.cangebotAjaxSoft', (evt, xhr, settings) => {
                        const u = (settings && settings.url) || '';
                        if (shouldReact(u, settings && settings.type)) {
                            L('ajaxSuccess → softRefresh', { url: u });
                            softRefreshFn.call(self, 'ajaxSuccess');
                        }
                    });
                    $(document).on('ajaxComplete.cangebotAjaxSoft', (evt, xhr, settings) => {
                        const u = (settings && settings.url) || '';
                        if (shouldReact(u, settings && settings.type)) {
                            L('ajaxComplete → softRefresh', { url: u });
                            softRefreshFn.call(self, 'ajaxComplete');
                        }
                    });
                }

                // fetch
                if (typeof window.fetch === 'function') {
                    const _fetch = window.fetch;
                    window.fetch = function (input, init) {
                        const url = typeof input === 'string' ? input : (input && input.url) || '';
                        const method = (init && init.method) || (typeof input === 'object' && input && input.method) || 'GET';
                        const match = shouldReact(url, method);
                        return _fetch.apply(this, arguments).then(res => {
                            if (match && res && (res.ok || res.status === 204 || res.status === 200)) {
                                setTimeout(() => softRefreshFn.call(self, 'fetch'), 50);
                            }
                            return res;
                        }).catch(err => {
                            if (match) setTimeout(() => softRefreshFn.call(self, 'fetch-error'), 50);
                            throw err;
                        });
                    };
                    L('delete-soft hook: fetch patched');
                }

                // XHR
                if (typeof window.XMLHttpRequest === 'function') {
                    const XHR = window.XMLHttpRequest;
                    const openOrig = XHR.prototype.open;
                    const sendOrig = XHR.prototype.send;

                    XHR.prototype.open = function (method, url) {
                        this.__can_soft__ = { url: url, method: method };
                        return openOrig.apply(this, arguments);
                    };
                    XHR.prototype.send = function () {
                        try {
                            this.addEventListener('load', () => {
                                const h = this.__can_soft__ || {};
                                if (shouldReact(h.url, h.method) && this.status >= 200 && this.status < 300) {
                                    setTimeout(() => softRefreshFn.call(self, 'xhr-load'), 50);
                                }
                            });
                            this.addEventListener('error', () => {
                                const h = this.__can_soft__ || {};
                                if (shouldReact(h.url, h.method)) {
                                    setTimeout(() => softRefreshFn.call(self, 'xhr-error'), 50);
                                }
                            });
                        } catch (e) { }
                        return sendOrig.apply(this, arguments);
                    };
                    L('delete-soft hook: XHR patched');
                }
            })(this, softRefresh);

            // ===== реакции модели =====
            this.listenTo(this.model, 'change:gesetzOption13b change:gesetzOption12', () => {
                // Без reRender, чтобы «Обработка» не исчезала
                broadcastTaxFlags();
                quickLocalRecalc('tax-change');
            });

            // ===== автоподстановка Kontakt (Contact) из Account.cFirmenHauptkontakt при выборе клиента =====
            const syncContactFromAccount = () => {
                const accountId = this.model.get('accountId');
                if (!accountId) return;

                // если контакт уже выбран вручную — не перетирать
                if (this.model.get('contactId')) return;

                Espo.Ajax.getRequest('Account/' + accountId, { _t: Date.now() })  // анти-кэш
                    .then((acc) => {
                        const cid = acc && acc.cFirmenHauptkontaktId;
                        const cname = acc && acc.cFirmenHauptkontaktName;

                        if (cid) {
                            this.model.set({
                                contactId: cid,
                                contactName: cname || ''
                            });
                        }
                    })
                    .catch((e) => {
                        if (e === 'notModified' || e?.message === 'notModified') return;
                        try { console.warn('[CAngebot/edit] syncContactFromAccount failed', e); } catch (x) { }
                    });
            };

            // при смене клиента
            this.listenTo(this.model, 'change:accountId', () => {
                syncContactFromAccount();
            });

            // при открытии формы, если клиент уже выбран
            setTimeout(() => syncContactFromAccount(), 0);


            // Из модалок позиций
            this._onPositionSaved = (e) => {
                const { angebotId } = (e && e.detail) || {};
                if (!angebotId || angebotId !== this.model.id) return;
                L('onPositionSaved', { angebotId });
                // добавление/редактирование — мягко, без F5
                quickLocalRecalc('event-saved');
                hardRefreshFromServer('event-saved');
            };
            window.addEventListener('c-angebotsposition:saved', this._onPositionSaved);

            // старт
            this.listenToOnce(this, 'after:setup', () => {
                broadcastTaxFlags();
                quickLocalRecalc('after-setup');
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            // выровнять UI полей
            const n = this.model.get('betragNetto') || 0;
            const b = this.model.get('betragBrutto') || 0;
            const fvN = this.getFieldView && this.getFieldView('betragNetto');
            const fvB = this.getFieldView && this.getFieldView('betragBrutto');
            if (fvN && fvN.setValue) fvN.setValue(n, { render: true, fromModel: true });
            if (fvB && fvB.setValue) fvB.setValue(b, { render: true, fromModel: true });
        },

        onRemove: function () {
            window.removeEventListener('c-angebotsposition:saved', this._onPositionSaved);
            $(document).off('.cangebotAjaxSoft');
            Dep.prototype.onRemove.call(this);
        }
    });
});
