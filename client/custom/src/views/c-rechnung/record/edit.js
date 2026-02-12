// custom:views/c-rechnung/record/edit
console.log('[LOAD] custom:views/c-rechnung/record/edit');

define('custom:views/c-rechnung/record/edit', ['views/record/edit'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            const DBG = (typeof window !== 'undefined' && window.__DBG_CREC === true);
            const L = (tag, payload) => { if (DBG) try { console.log('[CRechnung/edit]', tag, payload || ''); } catch (e) { } };

            // — helpers —
            const POS_LINKS = ['rechnungspositions', 'positionen']; // на всякий случай оба
            const getPanelView = () => {
                if (!this.getView) return null;
                for (const k of POS_LINKS) { const v = this.getView(k); if (v) return v; }
                return null;
            };
            const getPositionsCollection = () => {
                const pv = getPanelView();
                return (pv && pv.collection) ? pv.collection :
                    (this.collections && (this.collections.rechnungspositions || this.collections.positionen)) || null;
            };

            const bumpTotalsFields = (netto, brutto, src) => {
                L('bumpTotalsFields', { netto, brutto, src });
                this.model.set({ betragNetto: netto, betragBrutto: brutto }, { silent: true });
                const fvN = this.getFieldView && this.getFieldView('betragNetto');
                const fvB = this.getFieldView && this.getFieldView('betragBrutto');
                if (fvN?.setValue) fvN.setValue(netto, { render: true, fromModel: true });
                if (fvB?.setValue) fvB.setValue(brutto, { render: true, fromModel: true });
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
                    const brutto = Math.round(netto * (1 + vatRate / 100) * 100) / 100;
                    totalNetto += netto; totalBrutto += brutto;
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

            // — единый «мягкий» рефреш после удаления/отвязки —
            const softRefresh = (why) => {
                L('softRefresh:start', { why });
                try { quickLocalRecalc('softRefresh'); } catch (e) { }
                const pv = getPanelView();
                const col = getPositionsCollection();
                if (col?.fetch) { try { col.fetch(); } catch (e) { } }
                if (pv?.reRender) { try { pv.reRender(); } catch (e) { } }
                this.model.fetch({
                    success: () => {
                        const n = this.model.get('betragNetto') || 0;
                        const b = this.model.get('betragBrutto') || 0;
                        this.reRender();
                        setTimeout(() => bumpTotalsFields(n, b, 'softRefresh:' + why), 0);
                    }
                });
            };

            // — налоги вниз (если нужны) —
            const broadcastTaxFlags = () => {
                const rcRaw = !!this.model.get('gesetzOption13b');
                const pvRaw = !!this.model.get('gesetzOption12');
                if (rcRaw && pvRaw) this.model.set('gesetzOption12', false, { silent: true });
                const flags = { rc: !!this.model.get('gesetzOption13b'), pv: !!this.model.get('gesetzOption12') };
                window.__rechnungTax = flags;
                try { window.dispatchEvent(new CustomEvent('rechnung-tax-change', { detail: flags })); }
                catch (e) { const ev = document.createEvent('CustomEvent'); ev.initCustomEvent('rechnung-tax-change', true, true, flags); window.dispatchEvent(ev); }
                const em = this.getEventManager && this.getEventManager();
                if (em) em.trigger('crechnung:tax-change', flags);
            };

            // — перехват УДАЛЕНИЯ (jQuery ajax*, fetch, XHR) → softRefresh —
            (function installDeletionSoftRefreshOnce(self, softRefreshFn) {
                if (window.__CRECHNUNG_POS_SOFT_HOOK_INSTALLED) return;
                window.__CRECHNUNG_POS_SOFT_HOOK_INSTALLED = true;

                const shouldReact = (url, method) => {
                    const u = (url || '').toString();
                    const m = (method || 'GET').toUpperCase();
                    return /\/CRechnungsposition(\/|%2F|$)/i.test(u) &&
                        (m === 'DELETE' || /unlink/i.test(u));
                };

                // jQuery
                if (typeof $ !== 'undefined' && $.on) {
                    $(document).off('.crechnungAjaxSoft');
                    $(document).on('ajaxSuccess.crechnungAjaxSoft', (evt, xhr, settings) => {
                        const u = settings?.url || '';
                        if (shouldReact(u, settings?.type)) { L('ajaxSuccess → softRefresh', { url: u }); softRefreshFn.call(self, 'ajaxSuccess'); }
                    });
                    $(document).on('ajaxComplete.crechnungAjaxSoft', (evt, xhr, settings) => {
                        const u = settings?.url || '';
                        if (shouldReact(u, settings?.type)) { L('ajaxComplete → softRefresh', { url: u }); softRefreshFn.call(self, 'ajaxComplete'); }
                    });
                }

                // fetch
                if (typeof window.fetch === 'function') {
                    const _fetch = window.fetch;
                    window.fetch = function (input, init) {
                        const url = typeof input === 'string' ? input : input?.url || '';
                        const method = init?.method || (typeof input === 'object' && input?.method) || 'GET';
                        const match = shouldReact(url, method);
                        return _fetch.apply(this, arguments)
                            .then(res => { if (match && (res?.ok || res?.status === 200 || res?.status === 204)) setTimeout(() => softRefreshFn.call(self, 'fetch'), 50); return res; })
                            .catch(err => { if (match) setTimeout(() => softRefreshFn.call(self, 'fetch-error'), 50); throw err; });
                    };
                    L('delete-soft hook: fetch patched');
                }

                // XHR
                if (typeof window.XMLHttpRequest === 'function') {
                    const XHR = window.XMLHttpRequest;
                    const openOrig = XHR.prototype.open;
                    const sendOrig = XHR.prototype.send;

                    XHR.prototype.open = function (method, url) { this.__crec_soft__ = { url, method }; return openOrig.apply(this, arguments); };
                    XHR.prototype.send = function () {
                        try {
                            this.addEventListener('load', () => {
                                const h = this.__crec_soft__ || {};
                                if (shouldReact(h.url, h.method) && this.status >= 200 && this.status < 300) setTimeout(() => softRefreshFn.call(self, 'xhr-load'), 50);
                            });
                            this.addEventListener('error', () => {
                                const h = this.__crec_soft__ || {};
                                if (shouldReact(h.url, h.method)) setTimeout(() => softRefreshFn.call(self, 'xhr-error'), 50);
                            });
                        } catch (e) { }
                        return sendOrig.apply(this, arguments);
                    };
                    L('delete-soft hook: XHR patched');
                }
            })(this, softRefresh);

            // — реакции модели —
            this.listenTo(this.model, 'change:gesetzOption13b change:gesetzOption12', () => {
                broadcastTaxFlags();
                quickLocalRecalc('tax-change');
            });

            // — автоподстановка Contact из Account.cFirmenHauptkontakt при выборе клиента —
            const syncContactFromAccount = () => {
                const accountId = this.model.get('accountId');
                if (!accountId) return;

                // если контакт уже выбран вручную — не перетирать
                if (this.model.get('contactId')) return;

                Espo.Ajax.getRequest('Account/' + accountId, { _t: Date.now() })   // анти-кэш
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
                        // не даём падать из-за notModified/кэша
                        if (e === 'notModified' || e?.message === 'notModified') return;
                        try { console.warn('[CRechnung/edit] syncContactFromAccount failed', e); } catch (x) { }
                    });
            };

            // при смене клиента
            this.listenTo(this.model, 'change:accountId', () => {
                // если клиент поменяли — и контакт пустой, подтянем
                // (контакт не очищаем, чтобы не убить ручной выбор; если хотите — скажете)
                syncContactFromAccount();
            });

            // на первом рендере, если клиент уже выбран
            setTimeout(() => syncContactFromAccount(), 0);


            // — из модалки позиции (если она эмитит событие) —
            this._onPositionSaved = (e) => {
                const { rechnungId } = (e && e.detail) || {};
                if (!rechnungId || rechnungId !== this.model.id) return;
                L('onPositionSaved', { rechnungId });
                quickLocalRecalc('event-saved');
                hardRefreshFromServer('event-saved');
            };
            window.addEventListener('c-rechnungsposition:saved', this._onPositionSaved);

            // старт
            this.listenToOnce(this, 'after:setup', () => {
                broadcastTaxFlags();
                quickLocalRecalc('after-setup');
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            // синхронизируем значение в UI
            const n = this.model.get('betragNetto') || 0;
            const b = this.model.get('betragBrutto') || 0;
            const fvN = this.getFieldView && this.getFieldView('betragNetto');
            const fvB = this.getFieldView && this.getFieldView('betragBrutto');
            if (fvN?.setValue) fvN.setValue(n, { render: true, fromModel: true });
            if (fvB?.setValue) fvB.setValue(b, { render: true, fromModel: true });
        },

        onRemove: function () {
            window.removeEventListener('c-rechnungsposition:saved', this._onPositionSaved);
            $(document).off('.crechnungAjaxSoft');
            Dep.prototype.onRemove.call(this);
        }
    });
});
