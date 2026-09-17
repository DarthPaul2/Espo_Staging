console.log('[LOAD] custom:views/c-auftragsposition/record/edit-small');

define('custom:views/c-auftragsposition/record/edit-small', ['views/record/edit-small'], function (Dep) {
    return Dep.extend({
        // 17.09.2026, Pavel: beim Speichern mit leerem Pflichtfeld zeigt Espo nur ganz oben
        // ein generisches "Ungültig"-Banner - die eigentliche Meldung existiert bereits als
        // Popover direkt am betroffenen Feld, ist aber unsichtbar, wenn der Nutzer weiter
        // oben im Formular steht. Rein additiv (Dep.prototype.afterNotValid laeuft zuerst
        // unveraendert) - scrollt zusaetzlich zum sichtbar gewordenen Popover.
        afterNotValid: function () {
            Dep.prototype.afterNotValid.call(this);

            setTimeout(() => {
                const popovers = document.querySelectorAll('.popover');
                const popover = popovers.length ? popovers[popovers.length - 1] : null;

                if (popover) {
                    popover.scrollIntoView({behavior: 'smooth', block: 'center'});
                }
            }, 50);
        },

        setup: function () {
            Dep.prototype.setup.call(this);

            const DBG = (typeof window !== 'undefined' && (window.__DBG_CAUF_POS === true || window.__DBG_CREC_POS === true));
            const L = (tag, data) => { if (DBG) try { console.log('[CAuftragsposition/edit-small]', tag, data || ''); } catch (e) { } };

            let _recalcLock = false;

            // --- helpers ---
            const toNum = (v) => {
                if (v === null || v === undefined) return 0;
                if (typeof v === 'number') return isFinite(v) ? v : 0;
                const s = String(v).replace(',', '.').trim();
                const n = parseFloat(s);
                return isFinite(n) ? n : 0;
            };

            const round2 = (n) => Math.round((toNum(n) + Number.EPSILON) * 100) / 100;

            // Bemerkung: только это поле учитываем. description НЕ трогаем и не используем.
            const hasBemerkung = () => {
                return !!(this.model.get('beschreibung') && String(this.model.get('beschreibung')).trim() !== '');
            };

            const readFieldValue = (field) => {
                try {
                    const $wrap = this.$el.find('[data-name="' + field + '"]');
                    const $inp = $wrap.find('input, textarea, select').first();
                    if ($inp.length) {
                        const v = $inp.val();
                        if (v !== null && v !== undefined && String(v).trim() !== '') return v;
                        // 👇 если UI ещё пустой — берём то, что уже в модели
                        return this.model.get(field);
                    }
                } catch (e) { }
                return this.model.get(field);
            };


            const getVatRate = () => {
                // По умолчанию 19, пользователь может поменять вручную
                const steuerRaw = readFieldValue('steuer');
                if (steuerRaw === null || steuerRaw === undefined || String(steuerRaw).trim() === '') return 19;

                const v = toNum(steuerRaw);
                // если ввели 0 -> 0, иначе что ввели (19 / 7 / ...), но не NaN
                return isFinite(v) ? v : 19;
            };

            const recalc = () => {
                if (_recalcLock) return;
                _recalcLock = true;
                try {
                    const menge = toNum(readFieldValue('menge'));
                    const preis = toNum(readFieldValue('preis'));
                    const rabatt = toNum(readFieldValue('rabatt'));
                    const vatRate = getVatRate();

                    const nettoBase = menge * preis * (1 - (rabatt || 0) / 100);
                    const netto = round2(nettoBase);
                    const gesamt = round2(netto * (1 + (vatRate || 0) / 100));

                    // НЕ silent — чтобы UI обновлялся
                    this.model.set({ netto, gesamt, steuer: vatRate });

                    L('recalc', { menge, preis, rabatt, vatRate, netto, gesamt });
                } catch (e) {
                    L('recalc:ERROR', e);
                } finally {
                    _recalcLock = false;
                }
            };

            const ensureDefaultTax = () => {
                const cur = this.model.get('steuer');
                if (cur === null || cur === undefined || String(cur).trim() === '') {
                    this.model.set({ steuer: 19 }); // НЕ silent
                    L('ensureDefaultTax -> 19');
                }
            };

            const bindLiveInputListeners = () => {
                this.$el.off('.klesecCalc');

                const selector = [
                    '[data-name="menge"] input',
                    '[data-name="preis"] input',
                    '[data-name="rabatt"] input',
                    '[data-name="steuer"] input',
                    '[data-name="menge"] select',
                    '[data-name="preis"] select',
                    '[data-name="rabatt"] select',
                    '[data-name="steuer"] select'
                ].join(',');

                this.$el.on('input.klesecCalc change.klesecCalc blur.klesecCalc', selector, () => recalc());
                L('bindLiveInputListeners', { ok: true });
            };

            // model-change тоже оставляем
            this.listenTo(this.model, 'change:menge change:preis change:rabatt change:steuer', recalc);

            // ===== fallback к API =====
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

            // ===== копирование из foreign + fallback =====
            const copyFromForeignOnce = () => {
                const preisForeign = this.model.get('materialPreis');
                const einheitForeign = this.model.get('materialEinheit');
                const matDescForeign = this.model.get('materialDescription'); // CMaterial.description

                const patch = {};

                if (einheitForeign != null && this.model.get('einheit') !== einheitForeign) {
                    patch.einheit = einheitForeign;
                }
                if (preisForeign != null && this.model.get('preis') !== preisForeign) {
                    patch.preis = preisForeign;
                }

                // Bemerkung: только если пусто, и только в beschreibung
                if (!hasBemerkung() && matDescForeign) {
                    patch.beschreibung = matDescForeign;
                }

                // name: только materialName (без описаний/menge/einheit)
                const matName = (this.model.get('materialName') || '').trim();
                if (!this.model.get('name') && matName) {
                    patch.name = matName;
                }

                if (Object.keys(patch).length) {
                    this.model.set(patch); // НЕ silent
                    L('copyFromForeign:APPLIED', patch);
                    recalc();
                    return true;
                }

                return false;
            };

            const scheduleCopyFromForeign = () => {
                const matId = this.model.get('materialId');
                L('materialId changed', { materialId: matId });

                if (!matId) {
                    this.model.set({ einheit: null });
                    recalc();
                    return;
                }

                let tries = 0;
                const maxTries = 20;

                const tick = () => {
                    tries += 1;
                    const ok = copyFromForeignOnce();

                    if (!ok && tries < maxTries) {
                        setTimeout(tick, 100);
                        return;
                    }

                    // Если Bemerkung уже есть — всё, дальше не лезем
                    if (hasBemerkung()) {
                        L('copyFromForeign:FINISH', { ok, tries, via: ok ? 'foreign' : 'timeout' });
                        return;
                    }

                    // Bemerkung пустой → один раз тянем CMaterial/<id>
                    fetchMaterialFallback(matId).then(data => {
                        if (!data) return;

                        const patch = {};

                        if (Object.prototype.hasOwnProperty.call(data, 'einheit') && data.einheit != null) {
                            patch.einheit = data.einheit;
                        }
                        if (Object.prototype.hasOwnProperty.call(data, 'preis') && data.preis != null) {
                            patch.preis = data.preis;
                        }

                        // Bemerkung: только если пусто → берем data.description
                        if (!hasBemerkung() && Object.prototype.hasOwnProperty.call(data, 'description') && data.description) {
                            patch.beschreibung = data.description;
                        }

                        // name: только material.name
                        if (!this.model.get('name') && Object.prototype.hasOwnProperty.call(data, 'name') && data.name) {
                            patch.name = String(data.name).trim();
                        }

                        if (Object.keys(patch).length) {
                            this.model.set(patch);
                            L('fallback:APPLIED', patch);
                            recalc();
                        }
                    });
                };

                tick();
            };

            this.listenTo(this.model, 'change:material change:materialId', scheduleCopyFromForeign);
            this.listenTo(this.model, 'change:materialPreis change:materialEinheit change:materialName', () => {
                copyFromForeignOnce();
            });

            // после рендера: ставим default tax, биндим input-события, считаем
            this.listenTo(this, 'after:render', () => {
                ensureDefaultTax();
                bindLiveInputListeners();
                recalc();
            });

            // init
            const initialMatId = this.model.get('materialId');
            if (initialMatId && !hasBemerkung()) {
                scheduleCopyFromForeign();
            }

            // notify parent
            this.listenTo(this.model, 'sync', () => {
                const auftragId = this.model.get('auftragId');
                if (!auftragId) return;

                try {
                    window.dispatchEvent(new CustomEvent('c-auftragsposition:updated', { detail: { auftragId } }));
                } catch (e) {
                    const ev = document.createEvent('CustomEvent');
                    ev.initCustomEvent('c-auftragsposition:updated', true, true, { auftragId });
                    window.dispatchEvent(ev);
                }
            });
        },

        onRemove: function () {
            try { this.$el.off('.klesecCalc'); } catch (e) { }
            Dep.prototype.onRemove.call(this);
        }
    });
});
