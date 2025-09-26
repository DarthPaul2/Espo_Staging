// custom:views/c-angebot/record/edit
console.log('[LOAD] custom:views/c-angebot/record/edit');

define('custom:views/c-angebot/record/edit', ['views/record/edit'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // ==== Debug-Logs ====
            const DBG = (typeof window !== 'undefined' && window.__DBG_CAN === true);
            const L = (tag, payload) => {
                if (DBG) try { console.log('[CAngebot/edit]', tag, payload || ''); } catch (e) { }
            };

            // ==== Helpers ====
            const getPanelView = () => this.getView && this.getView('positionen') || null;

            const getPositionsCollection = () => {
                const pv = getPanelView();
                return (pv && pv.collection)
                    ? pv.collection
                    : (this.collections && this.collections.positionen) || null;
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

            // ==== Soft Refresh ====
            const softRefresh = (why) => {
                L('softRefresh:start', { why });

                // 1) локальный пересчёт
                try { quickLocalRecalc('softRefresh'); } catch (e) { }

                // 2) обновить коллекцию/панель
                const pv = getPanelView();
                const col = getPositionsCollection();

                if (col?.fetch) { try { col.fetch(); } catch (e) { } }
                if (pv?.reRender) { try { pv.reRender(); } catch (e) { } }

                // 3) подтянуть модель
                this.model.fetch({
                    success: () => {
                        const n = this.model.get('betragNetto') || 0;
                        const b = this.model.get('betragBrutto') || 0;
                        this.reRender();
                        setTimeout(() => bumpTotalsFields(n, b, 'softRefresh:' + why), 0);
                    }
                });
            };

            // ==== Steuer-Fahnen (Broadcast) ====
            const broadcastTaxFlags = () => {
                const rcRaw = !!this.model.get('gesetzOption13b');
                const pvRaw = !!this.model.get('gesetzOption12');
                if (rcRaw && pvRaw) this.model.set('gesetzOption12', false, { silent: true });

                const flags = { rc: !!this.model.get('gesetzOption13b'), pv: !!this.model.get('gesetzOption12') };
                window.__angebotTax = flags;

                try {
                    window.dispatchEvent(new CustomEvent('angebot-tax-change', { detail: flags }));
                } catch (e) {
                    const ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent('angebot-tax-change', true, true, flags);
                    window.dispatchEvent(ev);
                }

                const em = this.getEventManager() || (this.getApplication() && this.getApplication().getEventManager());
                if (em) em.trigger('cangebot:tax-change', flags);
            };

            // ==== Перехват Удаления (DELETE, unlink…) ====
            (function installDeletionSoftRefreshOnce(self, softRefreshFn) {
                if (window.__CAN_POS_SOFT_HOOK_INSTALLED) return;
                window.__CAN_POS_SOFT_HOOK_INSTALLED = true;

                const shouldReact = (url, method) => {
                    const u = (url || '').toString();
                    const m = (method || 'GET').toUpperCase();
                    return /\/CAngebotsposition(\/|%2F|$)/i.test(u) &&
                        (m === 'DELETE' || /unlink/i.test(m));
                };

                // jQuery ajax*
                if (typeof $ !== 'undefined' && $.on) {
                    $(document).off('.cangebotAjaxSoft');
                    $(document).on('ajaxSuccess.cangebotAjaxSoft', (evt, xhr, settings) => {
                        const u = settings?.url || '';
                        if (shouldReact(u, settings?.type)) {
                            L('ajaxSuccess → softRefresh', { url: u });
                            softRefreshFn.call(self, 'ajaxSuccess');
                        }
                    });
                    $(document).on('ajaxComplete.cangebotAjaxSoft', (evt, xhr, settings) => {
                        const u = settings?.url || '';
                        if (shouldReact(u, settings?.type)) {
                            L('ajaxComplete → softRefresh', { url: u });
                            softRefreshFn.call(self, 'ajaxComplete');
                        }
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
                            .then(res => {
                                if (match && res && (res.ok || res.status === 200 || res.status === 204)) {
                                    setTimeout(() => softRefreshFn.call(self, 'fetch'), 50);
                                }
                                return res;
                            })
                            .catch(err => {
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
                        this.__can_soft__ = { url, method };
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

            // ==== Reaktionen Modell ====
            this.listenTo(this.model, 'change:gesetzOption13b change:gesetzOption12', () => {
                broadcastTaxFlags();
                quickLocalRecalc('tax-change');
            });

            // Event aus Positions-Modal
            this._onPositionSaved = (e) => {
                const { angebotId } = e?.detail || {};
                if (!angebotId || angebotId !== this.model.id) return;
                L('onPositionSaved', { angebotId });
                quickLocalRecalc('event-saved');
                hardRefreshFromServer('event-saved');
            };
            window.addEventListener('c-angebotsposition:saved', this._onPositionSaved);

            // Initialisierung
            this.listenToOnce(this, 'after:setup', () => {
                broadcastTaxFlags();
                quickLocalRecalc('after-setup');
            });
        },

        // ==== After Render ====
        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            const n = this.model.get('betragNetto') || 0;
            const b = this.model.get('betragBrutto') || 0;

            const fvN = this.getFieldView && this.getFieldView('betragNetto');
            const fvB = this.getFieldView && this.getFieldView('betragBrutto');
            if (fvN?.setValue) fvN.setValue(n, { render: true, fromModel: true });
            if (fvB?.setValue) fvB.setValue(b, { render: true, fromModel: true });
        },

        // ==== Cleanup ====
        onRemove: function () {
            window.removeEventListener('c-angebotsposition:saved', this._onPositionSaved);
            $(document).off('.cangebotAjaxSoft');
            Dep.prototype.onRemove.call(this);
        }

    });
});
