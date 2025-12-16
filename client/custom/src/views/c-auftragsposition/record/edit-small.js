console.log('[LOAD] custom:views/c-auftragsposition/record/edit-small');

define('custom:views/c-auftragsposition/record/edit-small', ['views/record/edit-small'], function (Dep) {
    return Dep.extend({
        setup: function () {
            Dep.prototype.setup.call(this);

            // один и тот же флаг для отладки, чтобы не путаться
            const DBG = (typeof window !== 'undefined' && (window.__DBG_CAUF_POS === true || window.__DBG_CREC_POS === true));
            const L = (tag, data) => { if (DBG) try { console.log('[CAuftragsposition/edit-small]', tag, data || ''); } catch (e) { } };

            // --- helper: есть ли уже замечание (любое из двух полей) ---
            const hasRemark = () => {
                return !!(this.model.get('beschreibung') || this.model.get('description'));
            };

            // === Пересчёт позиции ===
            const recalc = () => {
                try {
                    const menge = parseFloat(this.model.get('menge') || 0);
                    const preis = parseFloat(this.model.get('preis') || 0);
                    const rabatt = parseFloat(this.model.get('rabatt') || 0);

                    const nettoBase = menge * preis * (1 - (rabatt || 0) / 100);
                    const netto = Math.round(nettoBase * 100) / 100;
                    const gesamt = Math.round(netto * 1.19 * 100) / 100; // 19 % USt

                    this.model.set({ netto, gesamt, steuer: vatRate }, { silent: true });
                    L('recalc', { menge, preis, rabatt, netto, gesamt });
                } catch (e) {
                    L('recalc:ERROR', e);
                }
            };

            this.listenTo(this.model, 'change:menge change:preis change:rabatt', recalc);

            // === fallback к API, как в Rechnung/Angebot ===
            const fetchMaterialFallback = (id) => {
                if (!id || !Espo?.Ajax?.getRequest) {
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

            // === копирование из foreign (materialPreis/materialEinheit/materialDescription) ===
            const copyFromForeignOnce = () => {
                const preisForeign = this.model.get('materialPreis');
                const einheitForeign = this.model.get('materialEinheit');
                const beschrForeign = this.model.get('materialDescription'); // Fremdbezug на CMaterial.description

                const patch = {};

                if (einheitForeign != null && this.model.get('einheit') !== einheitForeign) {
                    patch.einheit = einheitForeign;
                }
                if (preisForeign != null && this.model.get('preis') !== preisForeign) {
                    patch.preis = preisForeign;
                }

                // Bemerkung: только если ещё пусто в ОДНОМ из полей
                if (!hasRemark() && beschrForeign) {
                    patch.beschreibung = beschrForeign;
                    patch.description = beschrForeign;
                }

                if (Object.keys(patch).length) {
                    this.model.set(patch, { silent: true });
                    L('copyFromForeign:APPLIED', patch);
                    recalc();
                    return true;
                }

                L('copyFromForeign:NOT_READY', {
                    materialPreis: preisForeign,
                    materialEinheit: einheitForeign,
                    materialDescription: beschrForeign
                });
                return false;
            };

            const scheduleCopyFromForeign = () => {
                const matId = this.model.get('materialId');
                L('materialId changed', { materialId: matId });

                if (!matId) {
                    this.model.set({ einheit: null }, { silent: true });
                    L('material cleared -> reset einheit');
                    recalc();
                    return;
                }

                let tries = 0;
                const maxTries = 20;

                const tick = () => {
                    tries += 1;
                    const ok = copyFromForeignOnce(); // тянем из foreign-полей

                    if (!ok && tries < maxTries) {
                        // ждём, пока Espo подцепит foreign-значения
                        setTimeout(tick, 100);
                        return;
                    }

                    // Если какое-то замечание уже появилось — дальше ничего не делаем
                    if (hasRemark()) {
                        L('copyFromForeign:FINISH', { ok, tries, via: ok ? 'foreign' : 'timeout-no-besch' });
                        return;
                    }

                    // Bemerkung всё ещё пуст — последний шанс через API
                    fetchMaterialFallback(matId).then(data => {
                        if (!data) {
                            L('copyFromForeign:FINISH', { ok: false, tries, via: 'fallback-null' });
                            return;
                        }

                        const patch = {};

                        // Einheit / Preis (на всякий случай)
                        if (Object.prototype.hasOwnProperty.call(data, 'einheit') && data.einheit != null) {
                            patch.einheit = data.einheit;
                        }
                        if (Object.prototype.hasOwnProperty.call(data, 'preis') && data.preis != null) {
                            patch.preis = data.preis;
                        }

                        // Описание из материала → в оба поля Bemerkung
                        if (
                            !hasRemark() &&
                            Object.prototype.hasOwnProperty.call(data, 'description') &&
                            data.description
                        ) {
                            patch.beschreibung = data.description;
                            patch.description = data.description;
                        }

                        if (Object.keys(patch).length) {
                            this.model.set(patch, { silent: true });
                            L('fallback:APPLIED', patch);
                            recalc();
                            L('copyFromForeign:FINISH', { ok: true, tries, via: 'fallback' });
                        } else {
                            L('copyFromForeign:FINISH', { ok: false, tries, via: 'fallback-empty' });
                        }
                    });
                };

                tick();
            };

            // слушаем изменение материала
            this.listenTo(this.model, 'change:material change:materialId', scheduleCopyFromForeign);
            this.listenTo(this.model, 'change:materialPreis change:materialEinheit', () => {
                L('foreign fields changed -> try copy');
                copyFromForeignOnce();
            });

            // первичная инициализация при открытии существующей позиции
            const initialMatId = this.model.get('materialId');
            if (initialMatId && !hasRemark()) {
                L('init -> remark empty, try fill from material', { materialId: initialMatId });
                scheduleCopyFromForeign();
            }

            // уведомление родителя (если нужно пересчитать Auftrag)
            this.listenTo(this.model, 'sync', () => {
                const auftragId = this.model.get('auftragId');
                if (!auftragId) return;

                L('sync -> dispatch updated', { auftragId });

                try {
                    window.dispatchEvent(new CustomEvent('c-auftragsposition:updated', {
                        detail: { auftragId }
                    }));
                } catch (e) {
                    const ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent('c-auftragsposition:updated', true, true, { auftragId });
                    window.dispatchEvent(ev);
                }
            });
        }
    });
});
