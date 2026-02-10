// custom:views/c-angebot/record/detail
console.log('[LOAD] custom:views/c-angebot/record/detail');

define('custom:views/c-angebot/record/detail', [
    'views/record/detail',
    'custom:global/loader'
], function (Dep, Loader) {


    const LOG_NS = '[CAngebot/detail]';
    const DEFAULT_EINLEITUNG = `Sehr geehrte Damen und Herren,
wir danken Ihnen für Ihr Interesse an den Leistungen der KleSec GmbH.
Nachfolgend erhalten Sie das Angebot für Sie.

Haben Sie Fragen zu dem Angebot oder wünschen Sie detailliertere Informationen zu unseren Ausführungen?
Dann zögern Sie bitte nicht, mit Ihrem persönlichen Ansprechpartner über folgende Kommunikationswege in Verbindung zu treten:

Ihr Ansprechpartner: Tobias Schiller  
E-Mail: schiller@klesec.de  
Tel.: 0171 6969930  

Beauftragungen bitte an: schiller@klesec.de  

Das Angebot setzt sich aus den nachstehenden Positionen und aufgeführten Hinweisen zusammen.`;

    const L = (tag, payload) => {
        try { console.log(LOG_NS, tag, payload || ''); } catch (e) { }
    };

    return Dep.extend({

        // ==== API-Konfiguration ====
        FLASK_BASE: 'https://klesec.pagekite.me/api',
        BASIC_AUTH: 'Basic ' + btoa('admin:test123'),
        USE_PDF_V2: true,

        // ==== Hilfsfunktion: Angebotsnummer → int-ID ====
        _extractIntIdFromNumber(str) {
            if (!str || typeof str !== 'string') return null;
            const tail = str.split('-').pop() || '';
            const digits = tail.replace(/\D+/g, '');
            if (!digits) return null;
            const n = parseInt(digits, 10);
            return Number.isFinite(n) ? n : null;
        },
        _parsePosNum: function (str) {
            const s = String(str || '').trim();
            if (!s) return [];
            return s.split('.').map(part => {
                const n = parseInt(part, 10);
                return Number.isFinite(n) ? n : part;
            });
        },

        _comparePosNum: function (a, b) {
            const aa = this._parsePosNum(a);
            const bb = this._parsePosNum(b);
            const len = Math.max(aa.length, bb.length);

            for (let i = 0; i < len; i++) {
                const va = aa[i];
                const vb = bb[i];

                if (va === undefined) return -1;
                if (vb === undefined) return 1;

                if (va === vb) continue;

                if (typeof va === 'number' && typeof vb === 'number') {
                    return va - vb;
                }
                return String(va).localeCompare(String(vb), 'de-DE', { numeric: true });
            }
            return 0;
        },


        // ==== Payload für Flask ====
        buildPayload: function (positions) {
            const netto = this.model.get('betragNetto') || 0;
            const brutto = this.model.get('betragBrutto') || 0;
            const steuer = Math.round((brutto - netto) * 100) / 100;

            // Берём то, что пользователь ввёл в поле "einleitung".
            // Если поле пустое – используем старый дефолтный текст.
            const einleitung =
                (this.model.get('einleitung') || '').trim() || DEFAULT_EINLEITUNG;

            // имя ответственного пользователя (assignedUser)
            const assignedUserName = this.model.get('assignedUserName') || '';

            return {
                id: this.model.id,
                titel: 'ANGEBOT',
                einleitung: einleitung,
                bemerkung: this.model.get('bemerkung'),

                betrag_netto: netto,
                betrag_brutto: brutto,
                steuer: steuer,

                kunde: this.model.get('accountName'),
                strasse: this.model.get('accountBillingAddressStreet'),
                hausnummer: this.model.get('accountHausnummer'),
                plz: this.model.get('accountBillingAddressPostalCode'),
                ort: this.model.get('accountBillingAddressCity'),

                angebotsnummer: this.model.get('angebotsnummer'),
                servicenummer: this.model.get('serviceNummer'),
                kundennummer: this.model.get('accountKundenNr'),

                gueltig_bis: this.model.get('gueltigBis'),
                datum: this.model.get('createdAt'),
                leistungsdatum_von: this.model.get('leistungsdatumVon'),
                leistungsdatum_bis: this.model.get('leistungsdatumBis'),
                assigned_user_name: assignedUserName,

                typ: 'angebot',
                positionen: positions || []
            };
        },


        // ==== Collection Helpers ====
        getPanelView() {
            return this.getView && this.getView('positionen') || null;
        },

        getPositionsCollection() {
            const pv = this.getPanelView();
            if (!pv || !pv.collection) {
                L('getPositionsCollection: no panel view/collection');
                return null;
            }
            return pv.collection;
        },

        buildPositionsForPdf(rows) {
            const getSortKey = (p) => {
                let key = p.positionsNummer || p.name || '';
                const t = (p.positionType || 'normal').toLowerCase();

                if (key) {
                    if (t === 'header') {
                        // заголовок чуть выше своих под-позиций
                        key = key + '.0';
                    } else if (t === 'summary') {
                        // Zwischensumme всегда после всех подпунктов
                        key = key + '.999';
                    }
                }
                return key;
            };
            const sorted = (rows || []).slice().sort((a, b) => {
                const aKey = getSortKey(a);
                const bKey = getSortKey(b);
                return this._comparePosNum(aKey, bKey);
            });

            return sorted.map(p => {
                const type = (p.positionType || 'normal').toLowerCase();
                let beschreibung = '';

                if (type === 'header' || type === 'summary') {
                    // Для подзаголовков и Zwischensummen описание не нужно.
                    // Заодно вычищаем бессмысленное "Position".
                    const raw = (p.beschreibung || '').trim();
                    beschreibung = (raw.toLowerCase() === 'position') ? '' : raw;
                } else {
                    const namePart = p.name || p.materialName || '';
                    const descPart = (p.beschreibung || p.materialDescription || '');

                    beschreibung = namePart;
                    if (descPart) beschreibung += '\n\n' + descPart;
                }

                return {
                    id: p.id,

                    menge: p.menge,
                    einheit: p.einheit,
                    preis: p.preis,
                    gesamt: p.gesamt,
                    beschreibung,

                    positionType: p.positionType || 'normal',
                    titel: p.titel || '',
                    positionsNummer: p.positionsNummer || ''
                };
            });
        },


        loadPositionsFromPanel() {
            const col = this.getPositionsCollection();
            if (!col) return Promise.reject(new Error('Panel collection not found'));

            L('positions: fetch panel collection', { url: col.url });
            return new Promise((resolve, reject) => {
                col.fetch({
                    success: c => {
                        const data = c.toJSON();
                        L('positions: panel fetched', { count: data.length });
                        resolve(data);
                    },
                    error: xhr => {
                        L('positions: panel fetch error', { status: xhr?.status, response: xhr?.responseText });
                        reject(new Error('Panel fetch failed'));
                    }
                });
            });
        },

        loadPositionsViaRest(angebotId) {
            const url = 'CAngebotsposition';
            const params = {
                limit: 200,
                offset: 0,
                select: ['id', 'name', 'beschreibung', 'menge', 'einheit', 'preis', 'gesamt', 'materialName', 'materialDescription', 'angebotId', 'positionType', 'titel', 'positionsNummer'],
                where: [{ type: 'equals', attribute: 'angebotId', value: angebotId }],
                orderBy: 'sortierung',
                order: 'asc'
            };
            L('positions: REST fetch (list)', { url, params });
            return Espo.Ajax.getRequest(url, params).then(res => {
                const rows = (res && res.list) || [];
                L('positions: REST fetched (list)', { count: rows.length });
                return rows;
            });
        },

        // ==== Setup ====
        setup: function () {
            Dep.prototype.setup.call(this);

            // --- PDF-Modus persistent merken (über Page-Reload) ---
            const storageKey = 'cangebot_pdf_mode'; // общий для пользователя/браузера
            const savedMode = localStorage.getItem(storageKey) || 'v2';
            this.USE_PDF_V2 = (savedMode !== 'v1');


            this.once('after:render', () => this._applyPdfLinkLabel(), this);
            this.listenTo(this.model, 'change:pdfUrl', () => {
                setTimeout(() => this._applyPdfLinkLabel(), 0);
            });
            this.once('after:render', () => this._applyGaebLinkLabel(), this);
            this.listenTo(this.model, 'change:gaebUrl', () => {
                setTimeout(() => this._applyGaebLinkLabel(), 0);
            });


            // --- Lokaler Recalc ---
            const bumpTotalsFields = (netto, brutto, src) => {
                L('bumpTotalsFields', { netto, brutto, src });
                this.model.set({ betragNetto: netto, betragBrutto: brutto }, { silent: true });

                const fvN = this.getFieldView && this.getFieldView('betragNetto');
                const fvB = this.getFieldView && this.getFieldView('betragBrutto');
                if (fvN?.setValue) fvN.setValue(netto, { render: true, fromModel: true });
                if (fvB?.setValue) fvB.setValue(brutto, { render: true, fromModel: true });
            };

            const quickLocalRecalc = (reason) => {
                const col = this.getPositionsCollection();
                if (!col) { L('quickLocalRecalc: no collection', { reason }); return; }

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

                L('quickLocalRecalc: sums', { totalNetto, totalBrutto });
                bumpTotalsFields(totalNetto, totalBrutto, 'local:' + reason);
            };

            const hardRefreshFromServer = (src) => {
                L('hardRefreshFromServer:start', { src });
                this.model.fetch({
                    success: () => {
                        const n = this.model.get('betragNetto') || 0;
                        const b = this.model.get('betragBrutto') || 0;
                        L('hardRefreshFromServer:done', { n, b });
                        this.reRender();
                        setTimeout(() => bumpTotalsFields(n, b, 'server:' + src), 0);
                    },
                    error: xhr => { L('hardRefreshFromServer:error', xhr); }
                });
            };

            // --- Hook: Position löschen → Refresh ---
            (function installDeletionSoftRefreshOnce(self, softRefreshFn) {
                if (window.__CAN_POS_SOFT_HOOK_INSTALLED) return;
                window.__CAN_POS_SOFT_HOOK_INSTALLED = true;

                const shouldReact = (url, method) =>
                    /CAngebotsposition/i.test(url || '') &&
                    ((method || 'GET').toUpperCase() === 'DELETE' || /unlink/i.test(method || ''));

                if (typeof $ !== 'undefined' && $.on) {
                    $(document).off('.cangebotAjaxSoft');
                    $(document).on('ajaxSuccess.cangebotAjaxSoft', (evt, xhr, settings) => {
                        const u = settings?.url || '';
                        L('ajaxSuccess event', { u, status: xhr?.status });
                        if (shouldReact(u, settings?.type)) softRefreshFn.call(self, 'ajaxSuccess');
                    });
                    $(document).on('ajaxComplete.cangebotAjaxSoft', (evt, xhr, settings) => {
                        const u = settings?.url || xhr?.responseURL || '';
                        L('ajaxComplete event', { u, status: xhr?.status });
                        if (shouldReact(u, settings?.type)) softRefreshFn.call(self, 'ajaxComplete');
                    });
                }
            })(this, hardRefreshFromServer.bind(this));

            // --- Initial-Events ---
            this.once('after:render', () => {
                window.__angebotTax = {
                    rc: !!this.model.get('gesetzOption13b'),
                    pv: !!this.model.get('gesetzOption12')
                };
                L('after:render', window.__angebotTax);
                quickLocalRecalc('initial');
            }, this);

            this.listenTo(this.model, 'change:gesetzOption13b change:gesetzOption12', () => {
                window.__angebotTax = {
                    rc: !!this.model.get('gesetzOption13b'),
                    pv: !!this.model.get('gesetzOption12')
                };
                L('tax-change', window.__angebotTax);
                quickLocalRecalc('tax-change');
            });

            // --- Event: Position gespeichert ---
            this._onPositionSaved = (e) => {
                const { angebotId } = e?.detail || {};
                if (!angebotId || angebotId !== this.model.id) return;
                L('position-saved:event', { angebotId });
                quickLocalRecalc('event-saved');
                hardRefreshFromServer('event-saved');
            };
            window.addEventListener('c-angebotsposition:saved', this._onPositionSaved);

            // --- Buttons PDF ---
            this.buttonList = this.buttonList || [];
            this.buttonList.push({
                name: 'pdfPreview',
                label: this.translate ? this.translate('PDF-Vorschau', 'labels', 'CAngebot') : 'PDF-Vorschau',
                style: 'default',
                title: 'PDF Vorschau anzeigen'
            });
            this.buttonList.push({
                name: 'pdfSave',
                label: this.translate ? this.translate('PDF erzeugen & speichern', 'labels', 'CAngebot') : 'PDF erzeugen & speichern',
                style: 'primary',
                title: 'PDF erzeugen und speichern'
            });
            this.buttonList.push({
                name: 'pdfSaveWithPrice',
                label: 'PDF erzeugen mit Preis',
                style: 'info',
                title: 'PDF nach altem Schema (mit Einzelpreisen) erzeugen und speichern'
            });

            this.buttonList.push({
                name: 'sendOffer',
                label: 'Angebot senden',
                style: 'default',
                title: 'Angebot per E-Mail versenden'
            });
        },

        // ==== PDF Preview ====
        actionPdfPreview: function () {
            const id = this.model.id;
            if (!id) return;

            // глобальный лоадер + блокировка кнопок
            Loader.showFor(this, 'PDF-Vorschau wird erstellt…');

            // уведомление Espo (оставляем как текстовое)
            const notifyId = this.notify('PDF wird erstellt…', 'loading');

            const proceed = (rows) => {
                const pos = this.buildPositionsForPdf(rows);
                L('pdfPreview: positions prepared', pos);

                const payload = this.buildPayload(pos);
                const urlV2 = this.FLASK_BASE + '/angebote_v2/preview_pdf';

                // ⚠️ ALTER PDF-WEG (V1)
                // Dieser Endpunkt nutzt die bestehende Logik aus
                // routes_angebote_rechnung.py und erzeugt Angebote
                // MIT Einzelpreisen und Summen pro Position.
                // Wird nur als Fallback verwendet, falls V2 fehlschlägt.
                const urlV1 = this.FLASK_BASE + '/angebote/preview_pdf';

                L('pdfPreview: POST', { url: this.USE_PDF_V2 ? urlV2 : urlV1 });


                $.ajax({
                    url: this.USE_PDF_V2 ? urlV2 : urlV1,
                    method: 'POST',
                    contentType: 'application/json',
                    xhrFields: { responseType: 'blob' },
                    headers: { 'Authorization': this.BASIC_AUTH },
                    data: JSON.stringify(payload),
                    success: (blob) => {
                        L('pdfPreview: success (blob size)', blob?.size);
                        const blobUrl = URL.createObjectURL(blob);
                        window.open(blobUrl, '_blank');
                    },
                    error: (xhr) => {
                        L('pdfPreview: AJAX error', {
                            status: xhr?.status,
                            statusText: xhr?.statusText,
                            responseText: xhr?.responseText
                        });
                        const msg = xhr?.responseJSON?.error || 'Fehler beim Erzeugen der PDF-Vorschau.';
                        this.notify(msg, 'error');
                        if (this.USE_PDF_V2) {
                            L('pdfPreview: retry v1 after v2 fail');
                            $.ajax({
                                url: urlV1,
                                method: 'POST',
                                contentType: 'application/json',
                                xhrFields: { responseType: 'blob' },
                                headers: { 'Authorization': this.BASIC_AUTH },
                                data: JSON.stringify(payload),
                                success: (blob) => {
                                    const blobUrl = URL.createObjectURL(blob);
                                    window.open(blobUrl, '_blank');
                                }
                            });
                        }

                    },
                    complete: () => {
                        // всегда убираем лоадер и loading-уведомление
                        Loader.hideFor(this);
                        if (notifyId) {
                            this.notify(false, 'loading', notifyId);
                        }
                    }
                });
            };

            this.loadPositionsFromPanel()
                .catch(() => this.loadPositionsViaRest(id))
                .then(proceed)
                .catch(err => {
                    // ошибка ещё до AJAX (позиции не загрузились)
                    L('pdfPreview: positions load failed', err?.message || err);
                    this.notify('Keine Positionen gefunden.', 'error');

                    Loader.hideFor(this);
                    if (notifyId) {
                        this.notify(false, 'loading', notifyId);
                    }
                });
        },


        // ==== PDF Save ====
        actionPdfSave: function () {
            const espoId = this.model.id;
            if (!espoId) return;

            // глобальный лоадер + блокировка кнопок
            Loader.showFor(this, 'PDF wird erzeugt und gespeichert…');

            const notifyId = this.notify('PDF wird erzeugt und gespeichert…', 'loading');

            this.loadPositionsFromPanel()
                .catch(() => this.loadPositionsViaRest(espoId))
                .then(rows => {
                    const pos = this.buildPositionsForPdf(rows);
                    if (!pos.length) {
                        this.notify('Keine Positionen gefunden.', 'error');

                        Loader.hideFor(this);
                        if (notifyId) {
                            this.notify(false, 'loading', notifyId);
                        }
                        return;
                    }

                    const payload = this.buildPayload(pos);
                    const angebotKey = encodeURIComponent(this.model.get('angebotsnummer') || espoId);
                    const urlV2 = `${this.FLASK_BASE}/angebote_v2/${angebotKey}/save_pdf`;

                    // ⚠️ ALTER SPEICHER-WEG (V1)
                    // Erzeugt und speichert das Angebots-PDF nach dem alten Schema
                    // (Preise je Position sichtbar).
                    // Implementiert in routes_angebote_rechnung.py.
                    const urlV1 = `${this.FLASK_BASE}/angebote/${angebotKey}/save_pdf`;
                    const url = this.USE_PDF_V2 ? urlV2 : urlV1;

                    L('pdfSave: POST', { url });

                    $.ajax({
                        url,
                        method: 'POST',
                        contentType: 'application/json',
                        headers: { 'Authorization': this.BASIC_AUTH },
                        data: JSON.stringify(payload),
                        success: (resp) => {
                            localStorage.setItem('cangebot_pdf_mode', 'v2');
                            this.USE_PDF_V2 = true;
                            setTimeout(() => this._applyPdfLinkLabel(), 0);

                            L('pdfSave: success', resp);
                            this.notify(resp?.message || 'PDF gespeichert.', 'success');

                            const saveData = {};

                            if (resp?.pdfUrl) {
                                saveData.pdfUrl = resp.pdfUrl;
                            }

                            if (resp?.gaebUrl) {
                                saveData.gaebUrl = resp.gaebUrl;
                            }

                            if (Object.keys(saveData).length) {
                                this.model.save(saveData, {
                                    success: () => {
                                        L('pdfSave: URLs saved to CRM', saveData);

                                        // Контроль: читаем запись обратно с сервера
                                        this.model.fetch({
                                            success: () => {
                                                L('after fetch urls', {
                                                    pdfUrl: this.model.get('pdfUrl'),
                                                    gaebUrl: this.model.get('gaebUrl')
                                                });
                                                this.reRender();
                                            },
                                            error: (xhr) => {
                                                L('pdfSave: fetch after save failed', xhr);
                                                this.reRender();
                                            }
                                        });
                                    },
                                    error: (xhr) => {
                                        L('pdfSave: failed to save URLs in CRM', xhr);
                                    }
                                });
                            }


                        },
                        error: (xhr) => {
                            L('pdfSave: AJAX error', {
                                status: xhr?.status,
                                statusText: xhr?.statusText,
                                responseText: xhr?.responseText
                            });
                            const msg = xhr?.responseJSON?.error || 'Fehler beim Speichern der PDF.';
                            this.notify(msg, 'error');
                            if (this.USE_PDF_V2) {
                                L('pdfSave: retry v1 after v2 fail');
                                $.ajax({
                                    url: urlV1,
                                    method: 'POST',
                                    contentType: 'application/json',
                                    headers: { 'Authorization': this.BASIC_AUTH },
                                    data: JSON.stringify(payload),
                                    success: (resp) => {
                                        this.notify(resp?.message || 'PDF gespeichert.', 'success');
                                        const saveData = {};
                                        if (resp?.pdfUrl) saveData.pdfUrl = resp.pdfUrl;
                                        if (resp?.gaebUrl) saveData.gaebUrl = resp.gaebUrl;
                                        if (Object.keys(saveData).length) this.model.save(saveData);
                                    }
                                });
                            }

                        },
                        complete: () => {
                            // всегда снимаем лоадер и loading-уведомление
                            Loader.hideFor(this);
                            if (notifyId) {
                                this.notify(false, 'loading', notifyId);
                            }
                        }
                    });
                })
                .catch(err => {
                    L('pdfSave: positions load failed', err?.message || err);
                    this.notify('Keine Positionen gefunden.', 'error');

                    Loader.hideFor(this);
                    if (notifyId) {
                        this.notify(false, 'loading', notifyId);
                    }
                });
        },


        // ==== PDF Save (V1 mit Preis) ====
        actionPdfSaveWithPrice: function () {
            const espoId = this.model.id;
            if (!espoId) return;

            Loader.showFor(this, 'PDF (mit Preis) wird erzeugt und gespeichert…');
            const notifyId = this.notify('PDF (mit Preis) wird erzeugt und gespeichert…', 'loading');

            this.loadPositionsFromPanel()
                .catch(() => this.loadPositionsViaRest(espoId))
                .then(rows => {
                    const pos = this.buildPositionsForPdf(rows);
                    if (!pos.length) {
                        this.notify('Keine Positionen gefunden.', 'error');

                        Loader.hideFor(this);
                        if (notifyId) this.notify(false, 'loading', notifyId);
                        return;
                    }

                    const payload = this.buildPayload(pos);
                    const angebotKey = encodeURIComponent(this.model.get('angebotsnummer') || espoId);

                    // ✅ ВАЖНО: тут ЖЁСТКО V1
                    const urlV1 = `${this.FLASK_BASE}/angebote/${angebotKey}/save_pdf`;

                    L('pdfSaveWithPrice: POST', { url: urlV1 });

                    $.ajax({
                        url: urlV1,
                        method: 'POST',
                        contentType: 'application/json',
                        headers: { 'Authorization': this.BASIC_AUTH },
                        data: JSON.stringify(payload),
                        success: (resp) => {
                            localStorage.setItem('cangebot_pdf_mode', 'v1');
                            this.USE_PDF_V2 = false;
                            setTimeout(() => this._applyPdfLinkLabel(), 0);

                            L('pdfSaveWithPrice: success', resp);
                            this.notify(resp?.message || 'PDF gespeichert (mit Preis).', 'success');

                            // ✅ Вы просили: перетирать ссылку — делаем так же как в actionPdfSave
                            const saveData = {};
                            if (resp?.pdfUrl) saveData.pdfUrl = resp.pdfUrl;
                            if (resp?.gaebUrl) saveData.gaebUrl = resp.gaebUrl;

                            if (Object.keys(saveData).length) {
                                this.model.save(saveData, {
                                    success: () => {
                                        L('pdfSaveWithPrice: URLs saved to CRM', saveData);

                                        this.model.fetch({
                                            success: () => {
                                                L('pdfSaveWithPrice: after fetch urls', {
                                                    pdfUrl: this.model.get('pdfUrl'),
                                                    gaebUrl: this.model.get('gaebUrl')
                                                });
                                                this.reRender();
                                            },
                                            error: (xhr) => {
                                                L('pdfSaveWithPrice: fetch after save failed', xhr);
                                                this.reRender();
                                            }
                                        });
                                    },
                                    error: (xhr) => {
                                        L('pdfSaveWithPrice: failed to save URLs in CRM', xhr);
                                    }
                                });
                            }
                        },
                        error: (xhr) => {
                            L('pdfSaveWithPrice: AJAX error', {
                                status: xhr?.status,
                                statusText: xhr?.statusText,
                                responseText: xhr?.responseText
                            });
                            const msg = xhr?.responseJSON?.error || 'Fehler beim Speichern der PDF (mit Preis).';
                            this.notify(msg, 'error');
                        },
                        complete: () => {
                            Loader.hideFor(this);
                            if (notifyId) this.notify(false, 'loading', notifyId);
                        }
                    });
                })
                .catch(err => {
                    L('pdfSaveWithPrice: positions load failed', err?.message || err);
                    this.notify('Keine Positionen gefunden.', 'error');

                    Loader.hideFor(this);
                    if (notifyId) this.notify(false, 'loading', notifyId);
                });
        },


        // --- helpers: открываем штатный композер с предзаполнением ---
        _openEspoEmailCompose: function (attrs) {
            // attrs: {to, cc, bcc, subject, body, isHtml, parentType, parentId, parentName}
            const viewName = this.getMetadata().get(['clientDefs', 'Email', 'modalViews', 'compose']) || 'views/modals/compose-email';

            const attributes = {
                to: attrs.to || '',
                cc: attrs.cc || '',
                bcc: attrs.bcc || '',
                name: attrs.subject || '',
                subject: attrs.subject || '',
                body: attrs.body || '',
                isHtml: attrs.isHtml !== false,
                parentType: attrs.parentType || null,
                parentId: attrs.parentId || null,
                parentName: attrs.parentName || null
            };

            this.createView('composeEmail', viewName, {
                attributes,
                focusForCreate: true
            }, view => {
                console.log('[CAngebot/detail] ✉️ Compose geöffnet für:', attributes);
                view.render();
            });
        },

        // ==== Angebot senden ====
        actionSendOffer: function () {
            const pdfUrl = this.model.get('pdfUrl');
            if (!pdfUrl) {
                this.notify('Kein PDF vorhanden.', 'error');
                return;
            }

            const accountId = this.model.get('accountId');
            const accountName = this.model.get('accountName');
            if (!accountId) {
                this.notify('Kein verknüpfter Kunde/Firma im Angebot.', 'error');
                return;
            }

            this.notify('E-Mail-Entwurf wird vorbereitet…', 'loading');

            Espo.Ajax.getRequest(`Account/${encodeURIComponent(accountId)}`).then((acc) => {
                let toEmail = acc && (acc.emailAddress || acc.emailAddressPrimary || '');
                if (!toEmail && Array.isArray(acc?.emailAddressData)) {
                    const primary = acc.emailAddressData.find(e => e.primary) || acc.emailAddressData[0];
                    toEmail = primary ? primary.emailAddress : '';
                }

                if (!toEmail) {
                    this.notify(false, 'loading');
                    this.notify('Beim Kunden ist keine E-Mail-Adresse hinterlegt.', 'error');
                    console.warn('[CAngebot/detail] ⚠️ Kunde ohne E-Mail:', acc);
                    return;
                }

                const subject = `Angebot für ${accountName || 'Kunde'}`;
                const bodyHtml =
                    `Sehr geehrte Damen und Herren,<br><br>` +
                    `anbei erhalten Sie unser Angebot.<br>` +
                    `Das Dokument können Sie hier einsehen: ` +
                    `<a href="${pdfUrl}" target="_blank" rel="noopener">${pdfUrl}</a><br><br>` +
                    `Mit freundlichen Grüßen<br>` +
                    `Ihr KleSec Team`;

                this.notify(false, 'loading');

                this._openEspoEmailCompose({
                    to: toEmail || '',
                    subject,
                    body: bodyHtml,
                    isHtml: true,
                    parentType: 'Account',
                    parentId: accountId,
                    parentName: accountName
                });
            }).catch(err => {
                this.notify(false, 'loading');
                this.notify('Kundendaten konnten nicht geladen werden.', 'error');
                console.error('[CAngebot/detail] Fehler beim Laden der Firma:', err);
            });
        },

        // ==== Cleanup ====
        onRemove: function () {
            window.removeEventListener('c-angebotsposition:saved', this._onPositionSaved);

            Dep.prototype.onRemove.call(this);
        },


        // ==== Два следующих метода для создания и функционирования кнопки "Paket hinzufügen" ====
        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            setTimeout(() => {
                const $panel = this.$el.find('div.panel[data-name="positionen"], div.panel[data-link="positionen"]').first();
                console.log('[CAngebot/detail] positions panel found?', $panel.length);

                if (!$panel.length) {
                    setTimeout(() => this.afterRender(), 300);
                    return;
                }

                if (this.$el.find('div[data-name="angebotspaket-actions"]').length) return;

                const $actions = $(`
            <div data-name="angebotspaket-actions"
                 style="display: inline-flex; gap: 6px; padding: 5px 8px; margin-bottom: 6px; margin-top: -5px; background: #efda97; border-radius: 6px; border: 1px solid #e5e5e5;">
                <button class="btn btn-default" data-action="addPackage">
                    Paket hinzufügen
                </button>
            </div>
        `);

                $actions.insertBefore($panel);
                $actions.on('click', '[data-action="addPackage"]', () => this._openPackageWizard());

            }, 500);
        },

        _openPackageWizard: function () {
            const angebotId = this.model && this.model.id;
            if (!angebotId) {
                this.notify('Angebot ist nicht gespeichert.', 'error');
                return;
            }

            // Диагностика — один раз посмотри в консоль
            console.log('[CAngebot/detail] open package wizard', {
                angebotId,
                flaskBase: this.FLASK_BASE,
                basicAuth: this.BASIC_AUTH
            });

            this.createView('packageWizard', 'custom:views/c-angebot/modals/package-wizard', {
                angebotId: angebotId,
                flaskBase: this.FLASK_BASE,
                basicAuth: this.BASIC_AUTH,
                parentView: this
            }, (view) => view.render());
        },


        // ==== PDF-Link anpassen ====
        _applyPdfLinkLabel: function () {
            const nr = this.model.get('angebotsnummer');
            const $field = this.$el.find('[data-name="pdfUrl"]');
            if (!$field.length) return;

            const $value = $field.find('.value, .link-container').first().length
                ? $field.find('.value, .link-container').first()
                : $field;

            if (!nr) {
                $value.text('Keine PDF gespeichert');
                return;
            }

            const downloadUrl = this.USE_PDF_V2
                ? `${this.FLASK_BASE}/angebote_v2/download_pdf/${encodeURIComponent(nr)}`

                // ℹ️ Download erfolgt weiterhin über den alten Endpunkt.
                // Das PDF liegt unabhängig vom Erzeugungsweg (V1/V2)
                // im gleichen Zielverzeichnis.
                // Der Download-Endpunkt stammt aus routes_angebote_rechnung.py.
                : `${this.FLASK_BASE}/angebote/download_pdf/${encodeURIComponent(nr)}`;

            const label = '📄 PDF herunterladen';

            let $a = $value.find('a[href]');
            if ($a.length) {
                $a.attr({ href: downloadUrl, target: '_self', rel: 'noopener' }).text(label);
            } else {
                $value.empty().append($('<a>').attr({ href: downloadUrl, target: '_self', rel: 'noopener' }).text(label));
            }
        },


        _applyGaebLinkLabel: function () {
            const nr = this.model.get('angebotsnummer');
            const $field = this.$el.find('[data-name="gaebUrl"]');
            if (!$field.length) return;

            const $value = $field.find('.value, .link-container').first().length
                ? $field.find('.value, .link-container').first()
                : $field;

            if (!nr) {
                $value.text('Keine GAEB gespeichert');
                return;
            }

            const downloadGaebUrl = this.USE_PDF_V2
                ? `${this.FLASK_BASE}/angebote_v2/download_gaeb/${encodeURIComponent(nr)}`

                // ℹ️ GAEB-Download nutzt weiterhin den bestehenden V1-Endpunkt.
                // Einheitliche GAEB-Logik aus routes_angebote_rechnung.py.
                : `${this.FLASK_BASE}/angebote/download_gaeb/${encodeURIComponent(nr)}`;

            const label = '🧾 GAEB X84 herunterladen';

            let $a = $value.find('a[href]');
            if ($a.length) {
                $a.attr({ href: downloadGaebUrl, target: '_self', rel: 'noopener' }).text(label);
            } else {
                $value.empty().append($('<a>').attr({ href: downloadGaebUrl, target: '_self', rel: 'noopener' }).text(label));
            }
        }

    });
});
