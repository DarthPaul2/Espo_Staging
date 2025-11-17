// custom:views/c-angebot/record/detail
console.log('[LOAD] custom:views/c-angebot/record/detail');

define('custom:views/c-angebot/record/detail', ['views/record/detail'], function (Dep) {

    const LOG_NS = '[CAngebot/detail]';
    const L = (tag, payload) => {
        try { console.log(LOG_NS, tag, payload || ''); } catch (e) { }
    };

    return Dep.extend({

        // ==== API-Konfiguration ====
        FLASK_BASE: 'https://klesec.pagekite.me/api',
        BASIC_AUTH: 'Basic ' + btoa('admin:test123'),

        // ==== Hilfsfunktion: Angebotsnummer → int-ID ====
        _extractIntIdFromNumber(str) {
            if (!str || typeof str !== 'string') return null;
            const tail = str.split('-').pop() || '';
            const digits = tail.replace(/\D+/g, '');
            if (!digits) return null;
            const n = parseInt(digits, 10);
            return Number.isFinite(n) ? n : null;
        },

        // ==== Payload für Flask ====
        buildPayload: function (positions) {
            const netto = this.model.get('betragNetto') || 0;
            const brutto = this.model.get('betragBrutto') || 0;
            const steuer = Math.round((brutto - netto) * 100) / 100;

            return {
                id: this.model.id,
                titel: 'ANGEBOT',
                einleitung: `Sehr geehrte Damen und Herren,
wir danken Ihnen für Ihr Interesse an den Leistungen der KleSec GmbH.
Nachfolgend erhalten Sie das Angebot für Sie.

Haben Sie Fragen zu dem Angebot oder wünschen Sie detailliertere Informationen zu unseren Ausführungen?
Dann zögern Sie bitte nicht, mit Ihrem persönlichen Ansprechpartner über folgende Kommunikationswege in Verbindung zu treten:

Ihr Ansprechpartner: Tobias Schiller  
E-Mail: schiller@klesec.de  
Tel.: 0171 6969930  

Beauftragungen bitte an: schiller@klesec.de  

Das Angebot setzt sich aus den nachstehenden Positionen und aufgeführten Hinweisen zusammen.`,
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
            return (rows || []).map(p => {
                const namePart = p.materialName || p.name || '';
                const descPart = p.materialDescription || p.beschreibung || '';
                let beschreibung = namePart;
                if (descPart) beschreibung += '\n\n' + descPart;

                return {
                    id: p.id,
                    menge: p.menge,
                    einheit: p.einheit,
                    preis: p.preis,
                    gesamt: p.gesamt,
                    beschreibung
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
                select: ['id', 'name', 'beschreibung', 'menge', 'einheit', 'preis', 'gesamt', 'materialName', 'materialDescription', 'angebotId'],
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

            this.once('after:render', () => this._applyPdfLinkLabel(), this);
            this.listenTo(this.model, 'change:pdfUrl', () => {
                setTimeout(() => this._applyPdfLinkLabel(), 0);
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
                name: 'sendOffer',
                label: 'Angebot senden',
                style: 'default',
                title: 'Angebot per E-Mail versenden'
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
                const url = this.FLASK_BASE + '/angebote/preview_pdf';
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
                    const angebotKey = encodeURIComponent(this.model.get('angebotsnummer') || espoId);
                    const url = `${this.FLASK_BASE}/angebote/${angebotKey}/save_pdf`;

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
                                    success: () => {
                                        L('pdfSave: pdfUrl saved to CRM', resp.pdfUrl);
                                        this.reRender();
                                    },
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

        // ==== PDF-Link anpassen ====
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
