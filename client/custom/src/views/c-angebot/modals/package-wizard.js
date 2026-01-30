// /var/www/espocrm-staging/client/custom/src/views/c-angebot/modals/package-wizard.js
console.log('[LOAD] custom:views/c-angebot/modals/package-wizard');

define('custom:views/c-angebot/modals/package-wizard', [
    'views/modal'
], function (Dep) {

    return Dep.extend({

        template: 'custom:c-angebot/modals/package-wizard',
        className: 'dialog dialog-record',

        setup: function () {
            Dep.prototype.setup.call(this);

            this.angebotId = this.options.angebotId;

            // Flask только для packages.json
            this.FLASK_BASE = this.options.flaskBase || 'https://klesec.pagekite.me/api';
            this.BASIC_AUTH = this.options.basicAuth || null;

            this.state = {
                packages: [],
                package: null,
                packageId: null,
                selections: {} // stepId -> { materialId, materialObj, menge, einheit, preis, beschreibung, stepLabel, kategorie }
            };

            this.headerText = 'Paket hinzufügen';
            this.buttonList = [
                { name: 'back', label: 'Zurück', style: 'default' },
                { name: 'cancel', label: 'Abbrechen', style: 'default' }
            ];


            // кэши материалов
            this._cacheByCat = {};     // cat -> array (до 200)
            this._materialById = {};   // id -> material
            // названия категорий для UI (чтобы не показывать "Kategorie 82")
            this._catLabels = {
                '0': 'Brandmeldetechnik',
                '10': 'Brandmeldetechnik',
                '20': 'Einbruchmeldetechnik',
                '30': 'Systemkomponenten',
                '31': 'Netzwerktechnik / IT',
                '32': 'Kabel / Leitungen',
                '33': 'Stromversorgung / Netzgerät',
                '34': 'Montagematerial / Befestigung',
                '40': 'Elektronische Schließsysteme',
                '50': 'Erweiterungen / Zubehör',
                '51': 'Ersatzteile',
                '60': 'Meldertausch- und Prüfgerät',
                '70': 'Signalgeber',
                '80': 'Übertragungseinrichtungen',
                '81': 'Zutrittskontrollsysteme',
                '82': 'Videoüberwachung',
                '88': 'Serviceleistung',
                '99': 'Sonstiges'
            };

        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            // === FIX: скролл только в .modal-body, footer всегда виден ===
            const $modal = this.$el.closest('.modal');
            const $dialog = this.$el.closest('.modal-dialog');
            const $content = $dialog.find('.modal-content');
            const $body = $content.find('.modal-body');

            // запрещаем скролл всему модальному контейнеру
            $modal.css({ 'overflow': 'hidden' });

            // задаём РЕАЛЬНУЮ высоту, иначе flex-скролл не включается
            $dialog.css({ 'height': '90vh', 'max-height': '90vh' });

            $content.css({
                'height': '90vh',
                'max-height': '90vh',
                'display': 'flex',
                'flex-direction': 'column'
            });

            // ключ: min-height:0, иначе overflow у flex-ребёнка часто не работает
            $body.css({
                'flex': '1 1 auto',
                'min-height': '0',
                'overflow-y': 'auto'
            });

            // Дальше твой код как был
            this.$body = this.$el.find('[data-name="pkgBody"]');
            if (!this.$body.length) {
                this.$body = this.$el.find('.modal-body');
            }

            this.$body.html(`
        <div data-name="pkgRoot" style="padding: 10px;">
            <div data-name="pkgTop"></div>
            <div data-name="stepsArea"></div>
            <div data-name="summaryArea" style="margin-top:12px;"></div>
        </div>
    `);

            this._loadPackages();
        },

        actionCancel: function () {
            this.close();
        },

        actionBack: function () {
            const $steps = this.$body ? this.$body.find('[data-name="stepsArea"]') : null;
            const count = $steps ? $steps.find('[data-name="stepBlock"]').length : 0;

            // Если есть шаги — удаляем последний
            if (count > 0) {
                this._removeLastStepBlock();

                // ✅ если это был первый (последний) шаг — вернуться к выбору пакета
                const countAfter = $steps.find('[data-name="stepBlock"]').length;
                if (countAfter === 0) {
                    this.state.packageId = null;
                    this.state.package = null;
                    this.state.selections = {};

                    this.$body.find('[data-name="pkgTop"]').empty();
                    this.$body.find('[data-name="stepsArea"]').empty();
                    this.$body.find('[data-name="summaryArea"]').empty();

                    this._renderPackageSelect();
                }

                return;
            }

            // Если шагов нет, но пакет выбран — вернуться к выбору пакета
            if (this.state && this.state.packageId) {
                this.state.packageId = null;
                this.state.package = null;
                this.state.selections = {};

                this.$body.find('[data-name="pkgTop"]').empty();
                this.$body.find('[data-name="stepsArea"]').empty();
                this.$body.find('[data-name="summaryArea"]').empty();

                this._renderPackageSelect();
                return;
            }

            // Иначе закрыть модалку
            this.close();
        },


        // =========================
        // Flask: packages.json
        // =========================
        _loadPackages: function () {
            const url = `${this.FLASK_BASE}/angebote/packages`;

            return $.ajax({
                url: url,
                method: 'GET',
                headers: this.BASIC_AUTH ? { 'Authorization': this.BASIC_AUTH } : {},
                success: (list) => {
                    this.state.packages = Array.isArray(list) ? list : [];
                    this._renderPackageSelect();
                },
                error: (xhr) => {
                    console.warn('[pkg] packages load failed', xhr?.status, xhr?.responseText);
                    Espo.Ui.error('Pakete konnten nicht geladen werden.');
                    this.close();
                }
            });
        },

        _loadPackageDetail: function (packageId) {
            const url = `${this.FLASK_BASE}/angebote/packages/${encodeURIComponent(packageId)}`;

            $.ajax({
                url: url,
                method: 'GET',
                headers: this.BASIC_AUTH ? { 'Authorization': this.BASIC_AUTH } : {},
                success: (pkg) => {
                    this.state.packageId = packageId;
                    this.state.package = pkg || null;
                    this.state.selections = {};

                    this.$body.find('[data-name="stepsArea"]').empty();
                    this.$body.find('[data-name="summaryArea"]').empty();

                    this._renderPackageHeader();
                    this._appendNextStepBlock();
                },
                error: (xhr) => {
                    console.warn('[pkg] package detail failed', xhr?.status, xhr?.responseText);
                    Espo.Ui.error('Paket-Details konnten nicht geladen werden.');
                }
            });
        },

        // =========================
        // Espo: materials (CMaterial)
        // limit/offset (без maxSize) + лимит ≤ 200
        // =========================
        _loadMaterialsFromEspo: function (cat) {
            const c = String(cat || '').trim();
            if (!c) return Promise.resolve([]);

            if (this._cacheByCat[c]) {
                return Promise.resolve(this._cacheByCat[c]);
            }

            const limit = 200;
            const offset = 0;

            const params = {
                select: ['id', 'name', 'code', 'kategorie', 'einheit', 'preis', 'description', 'aktiv', 'verwendet'],
                limit: limit,
                offset: offset,
                boolFilterList: [],
                where: [
                    { type: 'equals', attribute: 'kategorie', value: c }
                ],
                orderBy: 'name',
                order: 'asc'
            };

            console.log('[pkg] load CMaterial', params);

            return Espo.Ajax.getRequest('CMaterial', params).then((res) => {
                const arr = (res && res.list) ? res.list : [];
                this._cacheByCat[c] = arr;

                arr.forEach(m => {
                    this._materialById[String(m.id)] = m;
                });

                console.log('[pkg] CMaterial loaded', { cat: c, count: arr.length });
                return arr;
            }).catch((err) => {
                console.warn('[pkg] CMaterial load failed', err);
                return [];
            });
        },

        // =========================
        // UI
        // =========================
        _renderPackageSelect: function () {
            const $top = this.$body.find('[data-name="pkgTop"]');

            const opts = (this.state.packages || []).map(p =>
                `<option value="${this._esc(p.id)}">${this._esc(p.name || p.id)}</option>`
            ).join('');

            $top.html(`
                <div style="margin-bottom: 10px;">
                    <label style="display:block; font-weight:600; margin-bottom:6px;">Paket auswählen</label>
                    <select class="form-control" data-name="packageId">
                        <option value="">-- bitte wählen --</option>
                        ${opts}
                    </select>
                </div>
            `);

            this.$body.off('change.pkg');
            this.$body.on('change.pkg', '[data-name="packageId"]', () => {
                const pid = (this.$body.find('[data-name="packageId"]').val() || '').trim();
                if (!pid) return;
                this._loadPackageDetail(pid);
            });
        },

        _refreshPositionsPanel: function () {
            const pv = this.options.parentView;
            if (!pv) return Promise.resolve();

            // 1) обновим сам Angebot (хуки/итоги)
            const p1 = (pv.model && pv.model.fetch) ? pv.model.fetch() : Promise.resolve();

            // 2) найдём relationship-panel "positionen" и обновим её коллекцию
            return p1.then(() => {
                const panel = this._findPositionsPanelView(pv);
                if (!panel) {
                    console.warn('[pkg] positions panel view not found');
                    return;
                }

                const col = panel.collection;
                if (!col || !col.fetch) {
                    console.warn('[pkg] positions panel has no collection.fetch');
                    return;
                }

                console.log('[pkg] refreshing positions panel collection…');
                return col.fetch({ reset: true }).then(() => {
                    // аккуратно перерисуем саму панель
                    if (panel.reRender) panel.reRender();
                    else if (panel.render) panel.render();
                });
            });
        },

        _findPositionsPanelView: function (rootView) {
            // Рекурсивный поиск view, который соответствует панели relationship "positionen"
            const visited = new Set();

            const match = (v) => {
                if (!v) return false;

                // разные варианты, как Espo хранит имя/линк панели
                const name =
                    (v.name) ||
                    (v.options && v.options.name) ||
                    (v.options && v.options.panelName) ||
                    '';

                const link =
                    (v.link) ||
                    (v.options && v.options.link) ||
                    (v.options && v.options.relationship) ||
                    '';

                // чаще всего достаточно link === 'positionen'
                return (String(link) === 'positionen') || (String(name) === 'positionen');
            };

            const walk = (v, depth) => {
                if (!v || depth > 6) return null;
                if (visited.has(v)) return null;
                visited.add(v);

                if (match(v)) return v;

                // в Espo обычно nested views живут в _nestedViews
                const nv = v._nestedViews;
                if (nv && typeof nv === 'object') {
                    for (const k in nv) {
                        const child = nv[k];
                        const found = walk(child, depth + 1);
                        if (found) return found;
                    }
                }

                // иногда есть nestedViews как map/obj
                const nvm = v.nestedViews;
                if (nvm && typeof nvm === 'object') {
                    for (const k in nvm) {
                        const child = v.getView ? v.getView(k) : null;
                        const found = walk(child, depth + 1);
                        if (found) return found;
                    }
                }

                return null;
            };

            return walk(rootView, 0);
        },

        _renderPackageHeader: function () {
            const $top = this.$body.find('[data-name="pkgTop"]');
            const name = this.state.package?.name || this.state.packageId || '';

            $top.html(`
                <div style="margin-bottom: 10px;">
                    <div style="font-weight:700;">Paket: ${this._esc(name)}</div>
                    <div style="color:#666; font-size:12px; margin-top:4px;">
                        Wählen Sie je Schritt ein Material. Jeder Schritt bleibt sichtbar.
                    </div>
                </div>
            `);
        },

        _appendNextStepBlock: function () {
            const pkg = this.state.package;
            const steps = (pkg && Array.isArray(pkg.steps)) ? pkg.steps : [];
            const $steps = this.$body.find('[data-name="stepsArea"]');

            const idx = $steps.find('[data-name="stepBlock"]').length;
            if (idx >= steps.length) {
                this._renderSummaryWithAccept();
                return;
            }

            const step = steps[idx];
            const stepId = step.id || ('step_' + idx);
            const label = step.label || step.title || step.name || stepId;

            const cats = Array.isArray(step.categories) ? step.categories : [];
            const cat = (cats[0] != null) ? String(cats[0]) : '';

            const defaults = step.defaults || {};
            const defMenge = (defaults.menge != null) ? defaults.menge : 1;
            const defEinheit = (defaults.einheit != null) ? defaults.einheit : (step.quantityUnit || 'Stk.');
            const required = (step.required !== false);

            const html = `
                <div data-name="stepBlock"
                     data-step-id="${this._esc(stepId)}"
                     data-cat="${this._esc(cat)}"
                     data-required="${required ? '1' : '0'}"
                     style="border:1px solid #ddd; border-radius:8px; padding:10px; margin-bottom:10px;">

                    <div style="font-weight:700; margin-bottom:8px;">
                        ${this._esc(label)}
                        <span style="font-weight:400; color:#666; font-size:12px;">
                            (Kategorie ${this._esc(this._getCategoryLabel(cat))}${required ? '' : ', optional'})
                        </span>

                    </div>

                    <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
                        <div style="flex:2; min-width:260px;">
                            <label style="display:block; font-weight:600; margin-bottom:6px;">Material</label>
                            <select class="form-control" data-name="materialSelect">
                                <option value="">Lädt…</option>
                            </select>
                        </div>

                        <div style="flex:1; min-width:120px;">
                            <label style="display:block; font-weight:600; margin-bottom:6px;">Menge</label>
                            <input class="form-control" data-name="menge" value="${this._esc(defMenge)}" />
                        </div>

                        <div style="flex:1; min-width:120px;">
                            <label style="display:block; font-weight:600; margin-bottom:6px;">Einheit</label>
                            <input class="form-control" data-name="einheit" value="${this._esc(defEinheit)}" />
                        </div>

                        <div style="flex:1; min-width:140px;">
                            <label style="display:block; font-weight:600; margin-bottom:6px;">Preis</label>
                            <input class="form-control" data-name="preis" value="" placeholder="aus Material oder manuell" />
                        </div>
                    </div>

                    <div style="margin-top:10px;">
                        <label style="display:block; font-weight:600; margin-bottom:6px;">Beschreibung</label>
                        <textarea class="form-control" data-name="beschreibung" rows="3"
                                  placeholder="optional (Standard: Materialbeschreibung)"></textarea>
                    </div>

                    <div data-name="error" style="margin-top:8px; color:#b00; display:none;"></div>
                </div>
            `;

            $steps.append(html);

            const $block = $steps.find('[data-name="stepBlock"][data-step-id="' + stepId + '"]').last();
            this._fillMaterialDropdown($block, step);
        },

        _fillMaterialDropdown: function ($block, step) {
            const stepId = $block.attr('data-step-id');
            const cat = $block.attr('data-cat');
            const required = ($block.attr('data-required') === '1');

            const $sel = $block.find('[data-name="materialSelect"]');
            const $err = $block.find('[data-name="error"]');

            $sel.prop('disabled', true).html(`<option value="">Lädt…</option>`);
            $err.hide().text('');

            this._loadMaterialsFromEspo(cat).then((arr) => {
                let html = `<option value="">-- bitte wählen --</option>`;
                if (!required) html += `<option value="__SKIP__">-- überspringen --</option>`;

                if (!arr.length) {
                    html += `<option value="">(Keine Materialien in Kategorie ${this._esc(cat)})</option>`;
                } else {
                    arr.forEach(m => {
                        const id = String(m.id);
                        const name = m.name || '';
                        const code = m.code || '';
                        const einheit = m.einheit || '';
                        const preis = (m.preis != null && m.preis !== '') ? String(m.preis) : '';
                        html += `<option value="${this._esc(id)}">${this._esc(name)}${code ? ' (' + this._esc(code) + ')' : ''}${einheit ? ' | ' + this._esc(einheit) : ''}${preis ? ' | ' + this._esc(preis) + '€' : ''}</option>`;
                    });
                }

                $sel.html(html).prop('disabled', false);

                $sel.off('change.pkgPick').on('change.pkgPick', () => {
                    const val = ($sel.val() || '').trim();
                    this._onStepPicked($block, step, val);
                });
            });
        },

        _onStepPicked: function ($block, step, pickedId) {
            const stepId = $block.attr('data-step-id');
            const cat = $block.attr('data-cat');
            const required = ($block.attr('data-required') === '1');

            const $err = $block.find('[data-name="error"]');
            const $sel = $block.find('[data-name="materialSelect"]');

            $err.hide().text('');

            if (!pickedId) return;

            // optional skip
            if (pickedId === '__SKIP__') {
                delete this.state.selections[stepId];
                this._truncateAfterStep(stepId);
                this._appendNextStepBlock();
                return;
            }

            const m = this._materialById[String(pickedId)] || null;

            // ===== 1) При смене выбора ПРИНУДИТЕЛЬНО обновляем поля =====

            // Menge: берём дефолт шага (или 1). Если хочешь "не трогать, если пользователь уже менял" — скажи, сделаю.
            const defMenge = (step?.defaults?.menge != null) ? step.defaults.menge : 1;
            $block.find('[data-name="menge"]').val(String(defMenge).replace('.', ','));

            // Einheit: из материала, иначе из defaults, иначе quantityUnit, иначе Stk.
            const defEinheit =
                (m && m.einheit) ? String(m.einheit) :
                    (step?.defaults?.einheit != null) ? String(step.defaults.einheit) :
                        (step?.quantityUnit != null) ? String(step.quantityUnit) :
                            'Stk.';
            $block.find('[data-name="einheit"]').val(defEinheit);

            // Preis: из материала (CMaterial.preis), иначе пусто
            let preis = null;
            if (m && m.preis != null && m.preis !== '') {
                const mp = parseFloat(String(m.preis).replace(',', '.'));
                if (Number.isFinite(mp)) preis = Math.round(mp * 100) / 100;
            }
            $block.find('[data-name="preis"]').val(preis != null ? String(preis).replace('.', ',') : '');

            // Beschreibung (если поле есть в блоке)
            // Если ты добавил textarea data-name="beschreibung" — сюда подтянется material.description
            const desc = (m && m.description) ? String(m.description) : '';
            const $desc = $block.find('[data-name="beschreibung"]');
            if ($desc.length) $desc.val(desc);

            // ===== 2) Валидация уже по обновлённым полям =====

            const mengeRaw = ($block.find('[data-name="menge"]').val() || '').trim();
            const menge = parseFloat(String(mengeRaw).replace(',', '.'));
            if (!Number.isFinite(menge) || menge <= 0) {
                $err.text('Menge ist ungültig.').show();
                return;
            }

            let einheit = ($block.find('[data-name="einheit"]').val() || '').trim();
            if (!einheit) einheit = defEinheit;

            let preisRaw = ($block.find('[data-name="preis"]').val() || '').trim();
            let preisNum = null;
            if (preisRaw) {
                const p = parseFloat(String(preisRaw).replace(',', '.'));
                if (!Number.isFinite(p) || p < 0) {
                    $err.text('Preis ist ungültig.').show();
                    return;
                }
                preisNum = Math.round(p * 100) / 100;
            }

            // человекочитаемое имя (чтобы в Summary красиво)
            const nameText = ($sel.find('option:selected').text() || '').trim();

            // сохраняем выбор
            this.state.selections[stepId] = {
                materialId: String(pickedId),
                materialName: nameText,
                menge: menge,
                einheit: einheit,
                preis: preisNum,
                kategorie: String(cat || ''),
                beschreibung: $desc.length ? ($desc.val() || '') : (desc || '')
            };

            // если поменяли выбор в середине — отрезаем всё после этого шага
            this._truncateAfterStep(stepId);

            // добавляем следующий блок (или summary)
            this._appendNextStepBlock();
        },


        _truncateAfterStep: function (stepId) {
            const $steps = this.$body.find('[data-name="stepsArea"]');
            const $blocks = $steps.find('[data-name="stepBlock"]');

            let found = false;
            const toRemove = [];

            $blocks.each((i, el) => {
                const sid = $(el).attr('data-step-id');
                if (sid === stepId) {
                    found = true;
                    return;
                }
                if (found) toRemove.push(el);
            });

            if (toRemove.length) {
                toRemove.forEach(el => {
                    const sid = $(el).attr('data-step-id');
                    if (sid) delete this.state.selections[sid];
                    $(el).remove();
                });
            }

            this.$body.find('[data-name="summaryArea"]').empty();
        },

        _renderSummaryWithAccept: function () {
            // Берём актуальные значения прямо из DOM
            const sel = this._collectSelectionsFromDom();
            const keys = Object.keys(sel);

            const items = keys.map(stepId => {
                const it = sel[stepId];

                const preisTxt = (it.preis != null)
                    ? (String(it.preis).replace('.', ',') + ' €')
                    : '(ohne Preis)';

                const descTxt = it.beschreibung ? ' | Beschr.: ja' : ' | Beschr.: nein';

                // materialName мы можем показать как id (минимум), но лучше — из select текста.
                // Поэтому дополним collectSelections (ниже в п.3) или пока покажем materialId.
                return `<li>${this._esc(stepId)} — ${this._esc(it.materialId)} | ${this._esc(it.menge)} ${this._esc(it.einheit)} | ${this._esc(preisTxt)}${this._esc(descTxt)}</li>`;
            }).join('');

            const disabled = keys.length ? '' : 'disabled';

            this.$body.find('[data-name="summaryArea"]').html(`
        <div style="border-top:1px solid #eee; padding-top:10px;">
            <div style="font-weight:700; margin-bottom:6px;">Übersicht</div>
            <ul style="margin-left:18px; margin-bottom:10px;">
                ${items || '<li>Keine Auswahl.</li>'}
            </ul>

            <div style="display:flex; gap:8px; justify-content:flex-end;">
                <button class="btn btn-default" data-action="pkgBack">Zurück</button>
                <button class="btn btn-primary" data-action="pkgAccept" ${disabled}>Übernehmen</button>
            </div>

            <div style="margin-top:8px; color:#666; font-size:12px;">
                “Übernehmen” erstellt zuerst einen Header und dann Positionen mit Nummern (z.B. 3 / 3.1 / 3.2).
            </div>
        </div>
    `);

            this.$body.off('click.pkgActions');
            this.$body.on('click.pkgActions', '[data-action="pkgBack"]', () => this._removeLastStepBlock());
            this.$body.on('click.pkgActions', '[data-action="pkgAccept"]', () => this._createHeaderAndPositions());
        },


        _removeLastStepBlock: function () {
            const $steps = this.$body.find('[data-name="stepsArea"]');
            const $blocks = $steps.find('[data-name="stepBlock"]');
            if (!$blocks.length) return;

            const $last = $blocks.last();
            const stepId = $last.attr('data-step-id');
            if (stepId) delete this.state.selections[stepId];
            $last.remove();

            this.$body.find('[data-name="summaryArea"]').empty();

            // если удалили так, что снова есть “следующий шаг” — дорисуем summary позже
        },

        // =========================
        // Numbering helpers
        // =========================
        _parsePosNum: function (str) {
            const s = String(str || '').trim();
            if (!s) return null;
            const parts = s.split('.').map(x => parseInt(x, 10));
            if (parts.some(n => !Number.isFinite(n))) return null;
            return parts; // [major] или [major, minor]
        },

        _getNextMajorFromExisting: function (rows) {
            // rows: existing CAngebotsposition list
            let maxMajor = 0;

            (rows || []).forEach(r => {
                const pn = this._parsePosNum(r.positionsNummer);
                if (!pn) return;
                const major = pn[0] || 0;
                if (major > maxMajor) maxMajor = major;
            });

            return maxMajor + 1;
        },

        _loadExistingPositionsForNumbering: function () {
            // нужно понять последнюю major-группу
            const params = {
                select: ['id', 'positionsNummer', 'positionType', 'sortierung'],
                where: [{ type: 'equals', attribute: 'angebotId', value: this.angebotId }],
                limit: 200,
                offset: 0,
                orderBy: 'sortierung',
                order: 'asc'
            };

            return Espo.Ajax.getRequest('CAngebotsposition', params).then(res => {
                return (res && res.list) ? res.list : [];
            }).catch(err => {
                console.warn('[pkg] load existing positions failed', err);
                return [];
            });
        },

        _parseNumber2: function (v) {
            const s = String(v == null ? '' : v).trim();
            if (!s) return null;
            const n = parseFloat(s.replace(',', '.'));
            if (!Number.isFinite(n)) return null;
            return Math.round(n * 100) / 100;
        },

        _collectSelectionsFromDom: function () {
            const sel = {};
            const $steps = this.$body.find('[data-name="stepsArea"]');

            $steps.find('[data-name="stepBlock"]').each((i, el) => {
                const $block = $(el);
                const stepId = $block.attr('data-step-id');
                const cat = $block.attr('data-cat') || '';
                const required = ($block.attr('data-required') === '1');

                const materialId = String(($block.find('[data-name="materialSelect"]').val() || '')).trim();
                const materialName = String($block.find('[data-name="materialSelect"] option:selected').text() || '').trim();

                // пустой выбор
                if (!materialId) {
                    if (required) {
                        // пометим ошибку прямо в блоке
                        $block.find('[data-name="error"]').text('Bitte Material auswählen.').show();
                    }
                    return;
                }

                // skip
                if (materialId === '__SKIP__') {
                    return;
                }

                const menge = this._parseNumber2($block.find('[data-name="menge"]').val());
                if (!Number.isFinite(menge) || menge <= 0) {
                    $block.find('[data-name="error"]').text('Menge ist ungültig.').show();
                    return;
                }

                const einheit = String(($block.find('[data-name="einheit"]').val() || '')).trim();
                if (!einheit) {
                    $block.find('[data-name="error"]').text('Einheit ist leer.').show();
                    return;
                }

                const preis = this._parseNumber2($block.find('[data-name="preis"]').val()); // может быть null
                const beschreibung = String(($block.find('[data-name="beschreibung"]').val() || '')).trim();

                sel[stepId] = {
                    materialId: materialId,
                    materialName: materialName,
                    menge: menge,
                    einheit: einheit,
                    preis: preis, // null допускается, но ты говорил “все цены ставил” => теперь попадёт
                    kategorie: String(cat),
                    beschreibung: beschreibung
                };
            });

            return sel;
        },

        // =========================
        // Create header + positions
        // =========================
        _createHeaderAndPositions: function () {
            // ✅ всегда берём финальные значения из полей (DOM)
            const sel = this._collectSelectionsFromDom();
            this.state.selections = sel;

            const keys = Object.keys(sel);

            // если есть обязательные блоки без выбора / с ошибками — остановимся
            if (!keys.length) {
                Espo.Ui.error('Keine gültigen Positionen ausgewählt.');
                return;
            }


            Espo.Ui.notify('Positionen werden erstellt…', 'info', 2000);

            const pkgName = this.state.package?.name || this.state.packageId || 'Paket';

            this._loadExistingPositionsForNumbering().then(existing => {
                const major = this._getNextMajorFromExisting(existing);

                // sortierung: просто накидаем по порядку в конце
                // если у тебя другая логика — скажешь, но так будет стабильно.
                let sortBase = 0;
                existing.forEach(r => {
                    const s = parseInt(r.sortierung, 10);
                    if (Number.isFinite(s) && s > sortBase) sortBase = s;
                });
                sortBase = sortBase + 10;

                const headerPayload = {
                    angebotId: this.angebotId,
                    positionType: 'header',
                    titel: pkgName,
                    name: pkgName,
                    positionsNummer: String(major),
                    sortierung: sortBase,
                    menge: null,
                    einheit: null,
                    preis: null,
                    beschreibung: null,
                    materialId: null
                };

                const createHeader = () => Espo.Ajax.postRequest('CAngebotsposition', headerPayload);

                const createLinePayload = (it, idx) => {
                    const pn = `${major}.${idx}`;

                    const _round2 = (v) => {
                        const n = parseFloat(String(v).replace(',', '.'));
                        if (!Number.isFinite(n)) return null;
                        return Math.round(n * 100) / 100;
                    };

                    const preis = (it.preis != null) ? _round2(it.preis) : null;
                    const menge = (it.menge != null) ? _round2(it.menge) : null;

                    const netto =
                        (preis != null && menge != null)
                            ? _round2(preis * menge)
                            : null;

                    const gesamt =
                        (netto != null)
                            ? _round2(netto * 1.19)
                            : null;

                    return {
                        angebotId: this.angebotId,
                        positionType: 'normal',
                        positionsNummer: pn,
                        sortierung: sortBase + idx,

                        materialId: it.materialId,
                        menge: menge,
                        einheit: it.einheit,

                        preis: preis,
                        // ✅ реальные поля вашей сущности:
                        netto: netto,
                        gesamt: gesamt,

                        // beschreibung — именно ваше поле (text):
                        beschreibung: it.beschreibung || null
                    };
                };

                // порядок шагов — как в пакете
                const steps = (this.state.package && Array.isArray(this.state.package.steps)) ? this.state.package.steps : [];
                const ordered = [];
                steps.forEach(st => {
                    const sid = st.id || '';
                    if (sid && sel[sid]) ordered.push(sel[sid]);
                });

                // fallback если что-то не совпало по id
                if (!ordered.length) {
                    keys.forEach(k => ordered.push(sel[k]));
                }

                let chain = Promise.resolve();

                chain = chain.then(() => createHeader());

                ordered.forEach((it, i) => {
                    const idx = i + 1;
                    chain = chain.then(() => Espo.Ajax.postRequest('CAngebotsposition', createLinePayload(it, idx)));
                });

                return chain.then(() => {
                    Espo.Ui.success('Paket-Positionen wurden hinzugefügt.');

                    return this._refreshPositionsPanel()
                        .catch(err => console.warn('[pkg] refreshPositionsPanel failed', err))
                        .then(() => this.close());
                });

            }).catch(err => {
                console.error('[pkg] create header/positions failed', err);
                Espo.Ui.error('Fehler beim Erstellen der Positionen.');
            });
        },

        _getCategoryLabel: function (cat) {
            const key = String(cat || '').trim();
            return this._catLabels[key] || ('Kategorie ' + key);
        },


        _esc: function (s) {
            s = (s == null) ? '' : String(s);
            return s
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

    });
});
