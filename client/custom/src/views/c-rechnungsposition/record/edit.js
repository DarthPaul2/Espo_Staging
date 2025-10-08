console.log('[LOAD] custom:views/c-rechnungsposition/record/edit');

define('custom:views/c-rechnungsposition/record/edit', ['views/record/edit'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // Включи при необходимости: window.__DBG_CREC_POS = true
            const DBG = (typeof window !== 'undefined' && window.__DBG_CREC_POS === true);
            const L = (tag, data) => { if (DBG) try { console.log('[CRechnungsposition/edit]', tag, data || ''); } catch (e) { } };

            // ===== пересчёт позиции =====
            const recalcPosition = () => {
                try {
                    const menge = parseFloat(this.model.get('menge') || 0);
                    const preis = parseFloat(this.model.get('preis') || 0);
                    const rabatt = parseFloat(this.model.get('rabatt') || 0);

                    const vatZero = !!this.model.get('rechnungOption13b') || !!this.model.get('rechnungOption12');
                    const vatRate = vatZero ? 0 : 19;

                    const nettoBase = menge * preis * (1 - (rabatt || 0) / 100);
                    const netto = Math.round(nettoBase * 100) / 100;
                    const gesamt = Math.round(netto * (1 + vatRate / 100) * 100) / 100;

                    this.model.set({ netto, gesamt }, { silent: true });
                    L('recalcPosition', { menge, preis, rabatt, vatRate, netto, gesamt });
                } catch (err) {
                    L('recalcPosition:ERROR', err);
                }
            };

            this.listenTo(this.model, 'change:menge change:preis change:rabatt', () => {
                L('fields changed -> recalc');
                recalcPosition();
            });

            // ===== налоги от родителя (Rechnung) =====
            this.taxChangeHandler = (event) => {
                const { rc, pv } = (event && event.detail) || { rc: false, pv: false };
                L('taxChangeHandler', { rc, pv });
                this.model.set({ 'rechnungOption13b': rc, 'rechnungOption12': pv }, { silent: true });
                recalcPosition();
            };
            window.addEventListener('rechnung-tax-change', this.taxChangeHandler);

            if (window.__rechnungTax) {
                L('init tax from window.__rechnungTax', window.__rechnungTax);
                this.model.set({
                    'rechnungOption13b': window.__rechnungTax.rc,
                    'rechnungOption12': window.__rechnungTax.pv
                }, { silent: true });
                recalcPosition();
            }

            // ===== fallback к API если foreign-поля пустые =====
            const fetchMaterialFallback = (id) => {
                if (!id || typeof Espo === 'undefined' || !Espo.Ajax || !Espo.Ajax.getRequest) {
                    L('fallback:SKIP', { id, hasEspoAjax: !!(Espo && Espo.Ajax) });
                    return Promise.resolve(null);
                }
                L('fallback:REQUEST', { id });
                return Espo.Ajax.getRequest('CMaterial/' + id)
                    .then(data => {
                        L('fallback:RESPONSE', data);
                        return data || null;
                    })
                    .catch(err => {
                        L('fallback:ERROR', err);
                        return null;
                    });
            };

            // ===== копирование из foreign + fallback =====
            const copyFromForeignOnce = () => {
                const preisForeign = this.model.get('materialPreis');
                const einheitForeign = this.model.get('materialEinheit');

                const patch = {};
                if (einheitForeign != null && this.model.get('einheit') !== einheitForeign) patch.einheit = einheitForeign;
                if (preisForeign != null && this.model.get('preis') !== preisForeign) patch.preis = preisForeign;

                if (Object.keys(patch).length) {
                    this.model.set(patch, { silent: true });
                    L('copyFromForeign:APPLIED', patch);
                    recalcPosition();
                    return true;
                }
                L('copyFromForeign:NOT_READY', { materialPreis: preisForeign, materialEinheit: einheitForeign });
                return false;
            };

            const scheduleCopyFromForeign = () => {
                const matId = this.model.get('materialId');
                L('materialId changed', { materialId: matId });

                // Очистили материал — чистим единицу, цену не трогаем (на случай спеццен)
                if (!matId) {
                    this.model.set({ einheit: null }, { silent: true });
                    L('material cleared -> reset einheit');
                    recalcPosition();
                    return;
                }

                // ждём, пока Espo заполнит foreign-поля, затем fallback
                let tries = 0;
                const maxTries = 20;   // ~2 секунды
                const interval = 100;
                const tick = () => {
                    tries += 1;
                    const ok = copyFromForeignOnce();
                    if (!ok && tries < maxTries) {
                        setTimeout(tick, interval);
                    } else if (!ok) {
                        // foreign-поля так и не пришли — последний шанс: API
                        fetchMaterialFallback(matId).then(data => {
                            if (!data) { L('copyFromForeign:FINISH', { ok: false, tries }); return; }
                            const patch = {};
                            if (data.hasOwnProperty('einheit') && data.einheit != null) patch.einheit = data.einheit;
                            if (data.hasOwnProperty('preis') && data.preis != null) patch.preis = data.preis;
                            if (Object.keys(patch).length) {
                                this.model.set(patch, { silent: true });
                                L('fallback:APPLIED', patch);
                                recalcPosition();
                                L('copyFromForeign:FINISH', { ok: true, tries, via: 'fallback' });
                            } else {
                                L('copyFromForeign:FINISH', { ok: false, tries, via: 'fallback-empty' });
                            }
                        });
                    } else {
                        L('copyFromForeign:FINISH', { ok: true, tries });
                    }
                };
                tick();
            };

            this.listenTo(this.model, 'change:materialId', scheduleCopyFromForeign);
            this.listenTo(this.model, 'change:materialPreis change:materialEinheit', () => {
                L('foreign fields changed -> try copy');
                copyFromForeignOnce();
            });

            // ===== уведомление родителя после сохранения позиции =====
            this.listenTo(this.model, 'sync', () => {
                const rechnungId = this.model.get('rechnungId');
                if (!rechnungId) return;

                const payload = {
                    id: this.model.id,
                    menge: this.model.get('menge') || 0,
                    preis: this.model.get('preis') || 0,
                    rabatt: this.model.get('rabatt') || 0,
                    netto: this.model.get('netto') || 0,
                    gesamt: this.model.get('gesamt') || 0,
                    einheit: this.model.get('einheit') || null,
                    name: this.model.get('name') || null,
                    beschreibung: this.model.get('beschreibung') || null
                };
                L('sync -> dispatch saved', { rechnungId, payload });

                try {
                    window.dispatchEvent(new CustomEvent('c-rechnungsposition:saved', {
                        detail: { rechnungId, position: payload }
                    }));
                } catch (e) {
                    const ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent('c-rechnungsposition:saved', true, true, { rechnungId, position: payload });
                    window.dispatchEvent(ev);
                }
            });
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            const DBG = (typeof window !== 'undefined' && window.__DBG_CREC_POS === true);
            if (DBG) try { console.log('[CRechnungsposition/edit]', 'afterRender -> apply tax & recalc'); } catch (e) { }
            this.taxChangeHandler({ detail: window.__rechnungTax || { rc: false, pv: false } });
        },

        onRemove: function () {
            // диспатчим событие об удалении
            const rechnungId = this.model.get('rechnungId');
            if (rechnungId) {
                try {
                    window.dispatchEvent(new CustomEvent('c-rechnungsposition:removed', {
                        detail: { rechnungId, positionId: this.model.id }
                    }));
                } catch (e) {
                    const ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent('c-rechnungsposition:removed', true, true, { rechnungId, positionId: this.model.id });
                    window.dispatchEvent(ev);
                }
                console.log('[CRechnungsposition/edit] onRemove → removed', { rechnungId, id: this.model.id });
            }

            if (this.taxChangeHandler) {
                window.removeEventListener('rechnung-tax-change', this.taxChangeHandler);
            }

            Dep.prototype.onRemove.call(this);

            const DBG = (typeof window !== 'undefined' && window.__DBG_CREC_POS === true);
            if (DBG) try { console.log('[CRechnungsposition/edit]', 'onRemove done'); } catch (e) { }
        }

    });
});
