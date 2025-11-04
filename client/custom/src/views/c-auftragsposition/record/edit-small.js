console.log('[LOAD] custom:views/c-auftragsposition/record/edit-small');

define('custom:views/c-auftragsposition/record/edit-small', ['views/record/edit-small'], function (Dep) {
    return Dep.extend({
        setup: function () {
            Dep.prototype.setup.call(this);

            const L = (t, d) => { try { /* console.log('[CAuftragsposition/edit-small]', t, d||''); */ } catch (_) { } };

            // === Пересчёт позиции (аналогично Angebot) ===
            const recalc = () => {
                const menge = parseFloat(this.model.get('menge') || 0);
                const preis = parseFloat(this.model.get('preis') || 0);
                const rabatt = parseFloat(this.model.get('rabatt') || 0);
                const netto = Math.round(menge * preis * (1 - rabatt / 100) * 100) / 100;
                const gesamt = Math.round(netto * 1.19 * 100) / 100; // если нужен §13b/§12 — добавим позже
                this.model.set({ netto, gesamt }, { silent: true });
                L('recalc', { menge, preis, rabatt, netto, gesamt });
            };

            this.listenTo(this.model, 'change:menge change:preis change:rabatt', recalc);

            // === Копирование из foreign + fallback как в Angebot ===
            const copyFromForeignOnce = () => {
                const preisForeign = this.model.get('materialPreis');
                const einheitForeign = this.model.get('materialEinheit');
                const patch = {};
                if (einheitForeign != null && this.model.get('einheit') !== einheitForeign) patch.einheit = einheitForeign;
                if (preisForeign != null && this.model.get('preis') !== preisForeign) patch.preis = preisForeign;
                if (Object.keys(patch).length) {
                    this.model.set(patch, { silent: true });
                    L('copyFromForeign:APPLIED', patch);
                    recalc();
                    return true;
                }
                L('copyFromForeign:NOT_READY', { materialPreis: preisForeign, materialEinheit: einheitForeign });
                return false;
            };

            const fetchMaterialFallback = (id) => {
                if (!id || !Espo?.Ajax?.getRequest) return Promise.resolve(null);
                L('fallback:REQUEST', { id });
                return Espo.Ajax.getRequest('CMaterial/' + id)
                    .then(data => { L('fallback:RESPONSE'); return data || null; })
                    .catch(() => null);
            };

            const scheduleCopyFromForeign = () => {
                const matId = this.model.get('materialId');
                L('materialId changed', { materialId: matId });

                if (!matId) {
                    this.model.set({ einheit: null }, { silent: true });
                    recalc();
                    return;
                }

                let tries = 0, maxTries = 20;
                const tick = () => {
                    tries++;
                    const ok = copyFromForeignOnce();
                    if (!ok && tries < maxTries) {
                        setTimeout(tick, 100);
                    } else if (!ok) {
                        fetchMaterialFallback(matId).then(data => {
                            if (!data) return;
                            const patch = {};
                            if (data.einheit != null) patch.einheit = data.einheit;
                            if (data.preis != null) patch.preis = data.preis;
                            if (Object.keys(patch).length) {
                                this.model.set(patch, { silent: true });
                                L('fallback:APPLIED', patch);
                                recalc();
                            }
                        });
                    }
                };
                tick();
            };

            // ВАЖНО: слушаем оба — и link, и id (в разных версиях срабатывает по-разному)
            this.listenTo(this.model, 'change:material change:materialId', scheduleCopyFromForeign);
            this.listenTo(this.model, 'change:materialPreis change:materialEinheit', copyFromForeignOnce);

            // Уведомление родителя (если надо триггерить пересчёт заказа)
            this.listenTo(this.model, 'sync', () => {
                const auftragId = this.model.get('auftragId');
                if (auftragId) {
                    try { window.dispatchEvent(new CustomEvent('c-auftragsposition:updated', { detail: { auftragId } })); } catch (_) { }
                }
            });
        }
    });
});
