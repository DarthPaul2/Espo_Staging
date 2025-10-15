// custom:views/c-rechnung/record/detail
console.log('[LOAD] custom:views/c-rechnung/record/detail');

define('custom:views/c-rechnung/record/detail', ['views/record/detail'], function (Dep) {

    const LOG_NS = '[CRechnung/detail]';
    const L = (tag, payload) => { try { console.log(LOG_NS, tag, payload || ''); } catch (e) { } };

    return Dep.extend({

        // ==== API ====
        FLASK_BASE: 'https://klesec.pagekite.me/api',
        BASIC_AUTH: 'Basic ' + btoa('admin:test123'),

        // ==== helpers ====
        getPanelView() {
            // панель позиций может называться rechnungspositions или positionen
            return (this.getView && (this.getView('rechnungspositions') || this.getView('positionen'))) || null;
        },

        getPositionsCollection() {
            const pv = this.getPanelView();
            if (!pv || !pv.collection) {
                return null;
            }
            return pv.collection;
        },

        // ==== PDF payload ====
        buildPayload: function (positions) {
            const netto = this.model.get('betragNetto') || 0;
            const brutto = this.model.get('betragBrutto') || 0;
            const steuer = Math.round((brutto - netto) * 100) / 100;

            return {
                id: this.model.id,
                titel: this.model.get('titel') || 'RECHNUNG',
                einleitung: this.model.get('einleitung') || '',
                bemerkung: this.model.get('bemerkung') || '',
                betrag_netto: netto,
                betrag_brutto: brutto,
                ust_betrag: steuer,

                kunde: this.model.get('accountName'),
                strasse: this.model.get('strasse'),
                hausnummer: this.model.get('hausnummer'),
                plz: this.model.get('plz'),
                ort: this.model.get('ort'),

                rechnungsnummer: this.model.get('rechnungsnummer'),
                servicenummer: this.model.get('serviceNummer'),
                kundennummer: this.model.get('accountKundenNr'),

                faellig_am: this.model.get('faelligAm'),
                datum: this.model.get('createdAt'),
                leistungsdatum_von: this.model.get('leistungsdatumVon'),
                leistungsdatum_bis: this.model.get('leistungsdatumBis'),

                status: this.model.get('status'),
                sachbearbeiter: this.model.get('sachbearbeiter'),

                typ: 'rechnung',
                positionen: positions || []
            };
        },

        buildPositionsForPdf(rows) {
            return (rows || []).map(p => {
                const namePart = p.materialName || p.name || '';
                const descPart = p.materialDescription || p.beschreibung || '';
                let beschreibung = namePart || '';
                if (descPart) beschreibung += '\n\n' + descPart;
                return {
                    id: p.id,
                    menge: p.menge,
                    einheit: p.einheit,
                    preis: p.preis,
                    einkaufspreis: p.einkaufspreis,
                    steuer: p.steuer,
                    rabatt: p.rabatt,
                    gesamt: p.gesamt,
                    beschreibung
                };
            });
        },

        loadPositionsFromPanel() {
            const col = this.getPositionsCollection();
            if (!col) return Promise.reject(new Error('Panel collection not found'));
            return new Promise((resolve, reject) => {
                col.fetch({
                    success: (c) => {
                        const data = c.toJSON();
                        resolve(data);
                    },
                    error: (xhr) => {
                        reject(new Error('Panel fetch failed'));
                    }
                });
            });
        },

        loadPositionsViaRest(rechnungId) {
            const url = 'CRechnungsposition';
            const params = {
                limit: 200,
                offset: 0,
                select: [
                    'id', 'name', 'beschreibung', 'menge', 'einheit', 'preis', 'einkaufspreis', 'steuer',
                    'rabatt', 'gesamt', 'materialName', 'materialDescription', 'rechnungId'
                ],
                where: [{ type: 'equals', attribute: 'rechnungId', value: rechnungId }],
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

        // ==== SETUP ====
        setup: function () {
            Dep.prototype.setup.call(this);

            this.once('after:render', () => this._applyPdfLinkLabel(), this);
            this.listenTo(this.model, 'change:pdfUrl', () => setTimeout(() => this._applyPdfLinkLabel(), 0));

            // --- локальный пересчёт и подстановка в поля ---
            const bumpTotalsFields = (netto, brutto, src) => {
                // обновляем модель без silent, чтобы биндинги поля дернулись
                this.model.set({ betragNetto: netto, betragBrutto: brutto });

                const fvN = this.getFieldView && this.getFieldView('betragNetto');
                const fvB = this.getFieldView && this.getFieldView('betragBrutto');
                if (fvN?.setValue) fvN.setValue(netto, { render: true, fromModel: true });
                if (fvB?.setValue) fvB.setValue(brutto, { render: true, fromModel: true });
            };

            const quickLocalRecalc = (reason) => {
                const col = this.getPositionsCollection();
                if (!col) { L('quickLocalRecalc: no collection', { reason }); return; }

                // идентичная логика Angebot: 13b/12 = НДС 0, иначе 19
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

                bumpTotalsFields(totalNetto, totalBrutto, 'local:' + reason);
            };

            const hardRefreshFromServer = (src) => {
                this.model.fetch({
                    success: () => {
                        const n = this.model.get('betragNetto') || 0;
                        const b = this.model.get('betragBrutto') || 0;
                        this.reRender();
                        setTimeout(() => bumpTotalsFields(n, b, 'server:' + src), 0);
                    },
                    error: xhr => L('hardRefreshFromServer:error', xhr)
                });
            };

            // --- перехваты удалений/отвязок (jQuery + fetch + XHR) как в Angebot ---
            (function installDeletionSoftRefreshOnce(self, softRefreshFn) {
                if (window.__CREC_POS_SOFT_HOOK_INSTALLED) return;
                window.__CREC_POS_SOFT_HOOK_INSTALLED = true;

                const shouldReact = (url, method) => {
                    const u = String(url || '');
                    const m = String(method || 'GET').toUpperCase();

                    // DELETE /CRechnungsposition/<id>
                    if (m === 'DELETE' && /\/CRechnungsposition\/[^/?#]+/i.test(u)) return true;

                    // unlinkRelated|massUnlinkRelated для CRechnung (любой unlink считаем релевантным)
                    if (/\/CRechnung\/action\/(unlinkRelated|massUnlinkRelated|unlink|massUnlink)/i.test(u)) return true;

                    // generic
                    if (/\/CRechnung\/action\/.*unlink/i.test(u)) return true;

                    return false;
                };

                // jQuery
                if (typeof $ !== 'undefined' && $.on) {
                    $(document).off('.crechnungAjaxSoft');
                    $(document).on('ajaxSuccess.crechnungAjaxSoft', (evt, xhr, settings = {}) => {
                        const u = settings.url || '';
                        const m = settings.type || '';
                        if (shouldReact(u, m)) {
                            L('ajaxSuccess → softRefresh', { u, m });
                            softRefreshFn.call(self, 'ajaxSuccess');
                        }
                    });
                    $(document).on('ajaxComplete.crechnungAjaxSoft', (evt, xhr, settings = {}) => {
                        const u = (xhr && xhr.responseURL) || settings.url || '';
                        const m = settings.type || '';
                        if (shouldReact(u, m)) {
                            L('ajaxComplete → softRefresh', { u, m, status: xhr?.status });
                            softRefreshFn.call(self, 'ajaxComplete');
                        }
                    });
                }

                // fetch
                const _fetch = window.fetch;
                if (_fetch) {
                    window.fetch = function (input, init = {}) {
                        const method = (init && init.method) || 'GET';
                        const url = (typeof input === 'string') ? input : (input && input.url);
                        const match = shouldReact(url, method);
                        return _fetch.apply(this, arguments).then(resp => {
                            if (match && resp && (resp.ok || resp.status === 200 || resp.status === 204)) {
                                setTimeout(() => softRefreshFn.call(self, 'fetch'), 50);
                            }
                            return resp;
                        }).catch(err => {
                            if (match) setTimeout(() => softRefreshFn.call(self, 'fetch-error'), 50);
                            throw err;
                        });
                    };
                    L('delete-soft hook: fetch patched');
                }

                // XHR
                if (typeof XMLHttpRequest !== 'undefined') {
                    const _open = XMLHttpRequest.prototype.open;
                    const _send = XMLHttpRequest.prototype.send;

                    XMLHttpRequest.prototype.open = function (method, url) {
                        this.__crecInfo = { method, url };
                        return _open.apply(this, arguments);
                    };
                    XMLHttpRequest.prototype.send = function (body) {
                        const info = this.__crecInfo || {};
                        this.addEventListener('loadend', () => {
                            if (shouldReact(info.url, info.method)) {
                                setTimeout(() => softRefreshFn.call(self, 'xhr'), 50);
                            }
                        });
                        return _send.apply(this, arguments);
                    };
                    L('delete-soft hook: XHR patched');
                }
            })(this, hardRefreshFromServer.bind(this));

            // --- init & подписки как в Angebot ---
            this.once('after:render', () => {
                window.__rechnungTax = {
                    rc: !!this.model.get('gesetzOption13b'),
                    pv: !!this.model.get('gesetzOption12')
                };
                L('after:render', window.__rechnungTax);
                quickLocalRecalc('initial');
            }, this);

            this.listenTo(this.model, 'change:gesetzOption13b change:gesetzOption12', () => {
                window.__rechnungTax = {
                    rc: !!this.model.get('gesetzOption13b'),
                    pv: !!this.model.get('gesetzOption12')
                };
                L('tax-change', window.__rechnungTax);
                quickLocalRecalc('tax-change');
            });

            this._onPositionSaved = (e) => {
                const { rechnungId } = e?.detail || {};
                if (!rechnungId || rechnungId !== this.model.id) return;
                L('position-saved:event', { rechnungId });
                quickLocalRecalc('event-saved');
                hardRefreshFromServer('event-saved');
            };
            window.addEventListener('c-rechnungsposition:saved', this._onPositionSaved);

            // --- PDF кнопки ---
            this.buttonList = this.buttonList || [];
            this.buttonList.push({
                name: 'pdfPreview',
                label: this.translate ? this.translate('PDF-Vorschau', 'labels', 'CRechnung') : 'PDF-Vorschau',
                style: 'default',
                title: 'PDF Vorschau anzeigen'
            });
            this.buttonList.push({
                name: 'pdfSave',
                label: this.translate ? this.translate('PDF erzeugen & speichern', 'labels', 'CRechnung') : 'PDF erzeugen & speichern',
                style: 'primary',
                title: 'PDF erzeugen und speichern'
            });
            this.buttonList.push({
                name: 'sendInvoice',
                label: this.translate ? this.translate('Rechnung senden', 'labels', 'CRechnung') : 'Rechnung senden',
                style: 'default',
                title: 'Rechnung per E-Mail senden'
            });
            this.buttonList.push({
                name: 'createMahnung',
                label: this.translate ? this.translate('Mahnung erzeugen', 'labels', 'CRechnung') : 'Mahnung erzeugen',
                style: 'danger',
                title: 'Mahnung als PDF erzeugen'
            });

            this.listenTo(this.model, 'change:angebotId', () => {
                const angebotId = this.model.get('angebotId');
                if (!angebotId) return;

                const notifyId = this.notify('Angebot gewählt – Positionen werden importiert…', 'loading');

                this.listenToOnce(this.model, 'sync', () => {
                    this.notify(false, 'loading', notifyId);

                    // ждём чуть-чуть, чтобы Espo успел снять флаг dirty
                    setTimeout(() => {
                        try {
                            // сбрасываем dirty-флаг вручную
                            this.model.changed = {};
                            this.model._previousAttributes = { ...this.model.attributes };
                            this.model.trigger('change:clear');
                        } catch (e) {
                            console.warn('[CRechnung/detail] clear dirty failed', e);
                        }

                        // теперь можно перезагружать без предупреждения
                        window.location.reload();
                    }, 500);
                });
            });

        },

        // ==== PDF Preview ====
        actionPdfPreview: function () {
            const id = this.model.id;
            const notifyId = this.notify('PDF wird erstellt…', 'loading');

            const proceed = (rows) => {
                const pos = this.buildPositionsForPdf(rows);
                L('pdfPreview: positions prepared', pos);
                const payload = this.buildPayload(pos);
                const url = this.FLASK_BASE + '/rechnungen/preview_pdf';
                L('pdfPreview: POST', { url });
                $.ajax({
                    url,
                    method: 'POST',
                    contentType: 'application/json',
                    xhrFields: { responseType: 'blob' },
                    headers: { 'Authorization': this.BASIC_AUTH },
                    data: JSON.stringify(payload),
                    success: (blob) => {
                        L('pdfPreview: success (blob size)', blob?.size);
                        this.notify(false, 'loading', notifyId);
                        const blobUrl = URL.createObjectURL(blob);
                        window.open(blobUrl, '_blank');
                    },
                    error: (xhr) => {
                        this.notify(false, 'loading', notifyId);
                        L('pdfPreview: AJAX error', { status: xhr?.status, statusText: xhr?.statusText, responseText: xhr?.responseText });
                        let msg = xhr?.responseJSON?.error || 'Fehler beim Erzeugen der PDF-Vorschau.';
                        this.notify(msg, 'error');
                    }
                });
            };

            this.loadPositionsFromPanel()
                .catch(() => this.loadPositionsViaRest(id))
                .then(proceed)
                .catch(err => {
                    this.notify(false, 'loading', notifyId);
                    L('pdfPreview: positions load failed', err?.message || err);
                    this.notify('Keine Positionen gefunden.', 'error');
                });
        },

        // ==== PDF Save ====
        actionPdfSave: function () {
            const espoId = this.model.id;
            if (!espoId) return;

            const notifyId = this.notify('PDF wird erzeugt und gespeichert…', 'loading');

            this.loadPositionsFromPanel()
                .catch(() => this.loadPositionsViaRest(espoId))
                .then(rows => {
                    const pos = this.buildPositionsForPdf(rows);
                    if (!pos.length) {
                        this.notify(false, 'loading', notifyId);
                        this.notify('Keine Positionen gefunden.', 'error');
                        return;
                    }

                    const payload = this.buildPayload(pos);
                    const key = encodeURIComponent(this.model.get('rechnungsnummer') || espoId);
                    const url = `${this.FLASK_BASE}/rechnungen/${key}/save_pdf`;

                    L('pdfSave: POST', { url });

                    $.ajax({
                        url,
                        method: 'POST',
                        contentType: 'application/json',
                        headers: { 'Authorization': this.BASIC_AUTH },
                        data: JSON.stringify(payload),
                        success: (resp) => {
                            L('pdfSave: success', resp);
                            this.notify(false, 'loading', notifyId);
                            this.notify(resp?.message || 'PDF gespeichert.', 'success');

                            if (resp?.pdfUrl) {
                                this.model.save({ pdfUrl: resp.pdfUrl }, {
                                    success: () => { L('pdfSave: pdfUrl saved to CRM', resp.pdfUrl); this.reRender(); },
                                    error: (xhr) => L('pdfSave: failed to save pdfUrl in CRM', xhr)
                                });
                            }
                        },
                        error: (xhr) => {
                            this.notify(false, 'loading', notifyId);
                            L('pdfSave: AJAX error', { status: xhr?.status, statusText: xhr?.statusText, responseText: xhr?.responseText });
                            let msg = xhr?.responseJSON?.error || 'Fehler beim Speichern der PDF.';
                            this.notify(msg, 'error');
                        }
                    });
                })
                .catch(err => {
                    this.notify(false, 'loading', notifyId);
                    L('pdfSave: positions load failed', err?.message || err);
                    this.notify('Keine Positionen gefunden.', 'error');
                });
        },

        // --- helpers: открываем штатный композер с предзаполнением ---
        _openEspoEmailCompose: function (attrs) {
            const viewName = this.getMetadata().get(['clientDefs', 'Email', 'modalViews', 'compose'])
                || 'views/modals/compose-email';

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
                console.log('[CRechnung/detail] ✉️ Compose geöffnet für:', attributes);
                view.render();
            });
        },

        // --- action: Rechnung senden ---
        actionSendInvoice: function () {
            const pdfUrl = this.model.get('pdfUrl');
            if (!pdfUrl) {
                this.notify('Kein PDF vorhanden.', 'error');
                return;
            }

            const accountId = this.model.get('accountId');
            const accountName = this.model.get('accountName');
            if (!accountId) {
                this.notify('Kein verknüpfter Kunde/Firma in der Rechnung.', 'error');
                return;
            }

            this.notify('E-Mail-Entwurf wird vorbereitet…', 'loading');
            const notifyId = this.lastNotifyId;

            Espo.Ajax.getRequest(`Account/${encodeURIComponent(accountId)}`).then((acc) => {
                let toEmail = acc && (acc.emailAddress || acc.emailAddressPrimary || '');
                if (!toEmail && Array.isArray(acc?.emailAddressData)) {
                    const primary = acc.emailAddressData.find(e => e.primary) || acc.emailAddressData[0];
                    toEmail = primary ? primary.emailAddress : '';
                }

                if (!toEmail) {
                    this.notify(false, 'loading', notifyId);
                    this.notify('Beim Kunden ist keine E-Mail-Adresse hinterlegt.', 'error');
                    console.warn('[CRechnung/detail] ⚠️ Kunde ohne E-Mail:', acc);
                    return;
                }

                const subject = `Rechnung für ${accountName || 'Kunde'}`;
                const bodyHtml =
                    `Sehr geehrte Damen und Herren,<br><br>` +
                    `anbei erhalten Sie unsere aktuelle Rechnung.<br>` +
                    `Das Dokument können Sie hier einsehen: ` +
                    `<a href="${pdfUrl}" target="_blank" rel="noopener">${pdfUrl}</a><br><br>` +
                    `Mit freundlichen Grüßen<br>` +
                    `Ihr KleSec Team`;

                this.notify(false, 'loading', notifyId);

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
                this.notify(false, 'loading', notifyId);
                this.notify('Kundendaten konnten nicht geladen werden.', 'error');
                console.error('[CRechnung/detail] Fehler beim Laden der Firma:', err);
            });
        },
        // ==== Mahnung erzeugen ====
        actionCreateMahnung: function () {
            const id = this.model && this.model.id;
            if (!id) return;

            const notifyId = this.notify('Mahnung wird erzeugt…', 'loading');

            const url = `${this.FLASK_BASE}/mahnung/${encodeURIComponent(id)}/create_pdf`;

            $.ajax({
                url,
                method: 'POST',
                contentType: 'application/json',
                headers: { 'Authorization': this.BASIC_AUTH },
                success: (resp) => {
                    this.notify(false, 'loading', notifyId);
                    if (resp?.pdfUrl) {
                        this.notify('Mahnung-PDF erzeugt', 'success');

                        // 👉 больше не сохраняем pdfUrl в Rechnung!
                        // Просто откроем ссылку сразу в новой вкладке
                        window.open(resp.pdfUrl, '_blank');
                    } else {
                        this.notify('PDF erstellt, aber keine URL erhalten', 'warning');
                    }

                },
                error: (xhr) => {
                    this.notify(false, 'loading', notifyId);
                    this.notify('Fehler bei Mahnung-PDF', 'error');
                    console.error('[CRechnung/detail] createMahnung:error', xhr);
                }
            });
        },

        // ==== cleanup ====
        onRemove: function () {
            window.removeEventListener('c-rechnungsposition:saved', this._onPositionSaved);

            Dep.prototype.onRemove.call(this);
        },

        // ==== PDF link label ====
        _applyPdfLinkLabel: function () {
            const url = this.model.get('pdfUrl');
            const $field = this.$el.find('[data-name="pdfUrl"]');
            if (!$field.length) return;

            const $value = $field.find('.value, .link-container').first().length
                ? $field.find('.value, .link-container').first()
                : $field;

            if (!url) {
                $value.text('Keine PDF gespeichert');
                return;
            }

            const label = '📄 Gespeicherte Datei anzeigen';
            let $a = $value.find('a[href]');
            if ($a.length) {
                $a.attr({ href: url, target: '_blank', rel: 'noopener' }).text(label);
            } else {
                $value.empty().append(
                    $('<a>').attr({ href: url, target: '_blank', rel: 'noopener' }).text(label)
                );
            }
        }

    });
});
