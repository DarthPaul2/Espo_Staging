console.log('[LOAD] custom:views/c-angebotsposition/record/edit-small');
define('custom:views/c-angebotsposition/record/edit-small', ['views/record/edit-small'], function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            const DBG = (typeof window !== 'undefined' && window.__DBG_CANPOS === true);
            const L = (tag, data) => { if (DBG) try { console.log('[CAngebotsposition/edit-small]', tag, data || ''); } catch (e) { } };

            // ===== пересчёт позиции =====
            const recalcPosition = () => {
                try {
                    const menge = parseFloat(this.model.get('menge') || 0);
                    const preis = parseFloat(this.model.get('preis') || 0);
                    const rabatt = parseFloat(this.model.get('rabatt') || 0);

                    const vatZero = !!this.model.get('angebotOption13b') || !!this.model.get('angebotOption12');
                    const vatRate = vatZero ? 0 : 19;

                    const nettoBase = menge * preis * (1 - rabatt / 100);
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

            // ===== налоги от родителя =====
            this.taxChangeHandler = (event) => {
                const { rc, pv } = (event && event.detail) || { rc: false, pv: false };
                L('taxChangeHandler', { rc, pv });
                this.model.set({ 'angebotOption13b': rc, 'angebotOption12': pv }, { silent: true });
                recalcPosition();
            };
            window.addEventListener('angebot-tax-change', this.taxChangeHandler);

            if (window.__angebotTax) {
                L('init tax from window.__angebotTax', window.__angebotTax);
                this.model.set({
                    'angebotOption13b': window.__angebotTax.rc,
                    'angebotOption12': window.__angebotTax.pv
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

                if (!matId) {
                    this.model.set({ einheit: null }, { silent: true });
                    L('material cleared -> reset einheit');
                    recalcPosition();
                    return;
                }

                let tries = 0;
                const maxTries = 20;
                const interval = 100;
                const tick = () => {
                    tries += 1;
                    const ok = copyFromForeignOnce();
                    if (!ok && tries < maxTries) {
                        setTimeout(tick, interval);
                    } else if (!ok) {
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
                const angebotId = this.model.get('angebotId');
                if (!angebotId) return;

                const payload = {
                    id: this.model.id,
                    menge: this.model.get('menge') || 0,
                    preis: this.model.get('preis') || 0,
                    rabatt: this.model.get('rabatt') || 0,
                    netto: this.model.get('netto') || 0,
                    gesamt: this.model.get('gesamt') || 0,
                    einheit: this.model.get('einheit') || null,
                    name: this.model.get('name') || null,
                    description: this.model.get('description') || null
                };
                L('sync -> dispatch saved', { angebotId, payload });

                try {
                    window.dispatchEvent(new CustomEvent('c-angebotsposition:saved', {
                        detail: { angebotId, position: payload }
                    }));
                } catch (e) {
                    const ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent('c-angebotsposition:saved', true, true, { angebotId, position: payload });
                    window.dispatchEvent(ev);
                }
            });
        },

        onRemove: function () {
            // диспатчим событие об удалении
            const angebotId = this.model.get('angebotId');
            if (angebotId) {
                try {
                    window.dispatchEvent(new CustomEvent('c-angebotsposition:removed', {
                        detail: { angebotId, positionId: this.model.id }
                    }));
                } catch (e) {
                    const ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent('c-angebotsposition:removed', true, true, { angebotId, positionId: this.model.id });
                    window.dispatchEvent(ev);
                }
                console.log('[CAngebotsposition/edit] onRemove → removed', { angebotId, id: this.model.id });
            }

            if (this.taxChangeHandler) {
                window.removeEventListener('angebot-tax-change', this.taxChangeHandler);
            }

            Dep.prototype.onRemove.call(this);

            const DBG = (typeof window !== 'undefined' && window.__DBG_CANPOS === true);
            if (DBG) try { console.log('[CAngebotsposition/edit]', 'onRemove done'); } catch (e) { }
        }


    });
});
