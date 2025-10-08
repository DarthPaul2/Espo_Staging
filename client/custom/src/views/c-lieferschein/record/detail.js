console.log('[LOAD] custom:views/c-lieferschein/record/detail');

define('custom:views/c-lieferschein/record/detail', ['views/record/detail'], function (Dep) {

    const LOG_NS = '[CLieferschein/detail]';
    const L = (tag, payload) => { try { console.log(LOG_NS, tag, payload || ''); } catch (e) { } };

    return Dep.extend({

        // ==== API ====
        FLASK_BASE: 'https://klesec.pagekite.me/api',
        BASIC_AUTH: 'Basic ' + btoa('admin:test123'),

        // ==== helpers ====
        getPanelView() {
            return (this.getView && (this.getView('lieferscheinpositions') || this.getView('positionen'))) || null;
        },

        getPositionsCollection() {
            const pv = this.getPanelView();
            if (!pv || !pv.collection) {
                L('getPositionsCollection: no panel view/collection');
                return null;
            }
            return pv.collection;
        },

        // ==== PDF payload ====
        buildPayload: function (positions) {
            const defaultEinleitung = `Sehr geehrte Damen und Herren,
mit diesem Lieferschein bestätigen wir Ihnen die Lieferung der nachfolgend aufgeführten Positionen.

Bitte prüfen Sie die Angaben sorgfältig. Sollten Sie Rückfragen zu den gelieferten Artikeln oder zur Abwicklung haben, steht Ihnen Ihr persönlicher Ansprechpartner selbstverständlich zur Verfügung:

Ihr Ansprechpartner: Tobias Schiller
E-Mail: schiller@klesec.de
Tel.: 0171 6969930

Wir danken Ihnen für Ihr Vertrauen in die KleSec GmbH und wünschen Ihnen viel Erfolg mit den gelieferten Produkten und Leistungen.`;

            return {
                id: this.model.id,
                titel: 'LIEFERSCHEIN',
                // 🔹 всегда этот текст (как в Angebot)
                einleitung: defaultEinleitung,
                bemerkung: this.model.get('bemerkung') || '',

                betrag_netto: this.model.get('betragNetto') || 0,
                betrag_brutto: this.model.get('betragBrutto') || 0,
                ust_betrag: this.model.get('ustBetrag') || 0,

                kunde: this.model.get('accountName'),
                lieferscheinnummer: this.model.get('lieferscheinnummer'),
                serviceNummer: this.model.get('serviceNummer'),
                kundennummer: this.model.get('accountKundenNr'),

                lieferdatum: this.model.get('lieferdatum'),
                versendetAm: this.model.get('versendetAm'),

                typ: 'lieferschein',
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
                    rabatt: p.rabatt,
                    gesamt: p.gesamt,
                    beschreibung
                };
            });
        },

        // ==== SETUP ====
        setup: function () {
            Dep.prototype.setup.call(this);

            this.once('after:render', () => this._applyPdfLinkLabel(), this);
            this.listenTo(this.model, 'change:pdfUrl', () => setTimeout(() => this._applyPdfLinkLabel(), 0));

            // --- PDF кнопки ---
            this.buttonList = this.buttonList || [];
            this.buttonList.push({
                name: 'pdfPreview',
                label: this.translate ? this.translate('PDF-Vorschau', 'labels', 'CLieferschein') : 'PDF-Vorschau',
                style: 'default',
                title: 'PDF Vorschau anzeigen'
            });
            this.buttonList.push({
                name: 'pdfSave',
                label: this.translate ? this.translate('PDF erzeugen & speichern', 'labels', 'CLieferschein') : 'PDF erzeugen & speichern',
                style: 'primary',
                title: 'PDF erzeugen und speichern'
            });
            this.buttonList.push({
                name: 'sendLieferschein',
                label: this.translate ? this.translate('Lieferschein senden', 'labels', 'CLieferschein') : 'Lieferschein senden',
                style: 'default',
                title: 'Lieferschein per E-Mail senden'
            });
        },

        // ==== PDF Preview ====
        actionPdfPreview: function () {
            const id = this.model.id;
            if (!id) return;

            const notifyId = this.notify('PDF wird erstellt…', 'loading');

            const positions = this.getPositionsCollection()?.toJSON() || [];
            const payload = this.buildPayload(this.buildPositionsForPdf(positions));
            const url = `${this.FLASK_BASE}/lieferschein/${encodeURIComponent(id)}/preview_pdf`;

            $.ajax({
                url,
                method: 'POST',
                contentType: 'application/json',
                xhrFields: { responseType: 'blob' },
                headers: { 'Authorization': this.BASIC_AUTH },
                data: JSON.stringify(payload),
                success: (blob) => {
                    this.notify(false, 'loading', notifyId);
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, '_blank');
                },
                error: (xhr) => {
                    this.notify(false, 'loading', notifyId);
                    this.notify('Fehler bei PDF-Vorschau', 'error');
                    L('pdfPreview:error', xhr);
                }
            });
        },

        // ==== PDF Save ====
        actionPdfSave: function () {
            const id = this.model.id;
            if (!id) return;

            const notifyId = this.notify('PDF wird gespeichert…', 'loading');

            const positions = this.getPositionsCollection()?.toJSON() || [];
            const payload = this.buildPayload(this.buildPositionsForPdf(positions));
            const url = `${this.FLASK_BASE}/lieferschein/${encodeURIComponent(id)}/save_pdf`;

            $.ajax({
                url,
                method: 'POST',
                contentType: 'application/json',
                headers: { 'Authorization': this.BASIC_AUTH },
                data: JSON.stringify(payload),
                success: (resp) => {
                    this.notify(false, 'loading', notifyId);
                    this.notify('PDF gespeichert', 'success');
                    if (resp?.pdfUrl) {
                        this.model.save({ pdfUrl: resp.pdfUrl }, { success: () => this.reRender() });
                    }
                },
                error: (xhr) => {
                    this.notify(false, 'loading', notifyId);
                    this.notify('Fehler beim Speichern der PDF', 'error');
                    L('pdfSave:error', xhr);
                }
            });
        },

        // ==== Send Lieferschein ====
        actionSendLieferschein: function () {
            const pdfUrl = this.model.get('pdfUrl');
            if (!pdfUrl) {
                this.notify('Kein PDF vorhanden.', 'error');
                return;
            }

            const accountId = this.model.get('accountId');
            const accountName = this.model.get('accountName');
            if (!accountId) {
                this.notify('Kein verknüpfter Kunde.', 'error');
                return;
            }

            this.notify('E-Mail-Entwurf wird vorbereitet…', 'loading');
            Espo.Ajax.getRequest(`Account/${encodeURIComponent(accountId)}`).then((acc) => {
                let toEmail = acc?.emailAddress || acc?.emailAddressPrimary || '';
                if (!toEmail && Array.isArray(acc?.emailAddressData)) {
                    const primary = acc.emailAddressData.find(e => e.primary) || acc.emailAddressData[0];
                    toEmail = primary ? primary.emailAddress : '';
                }

                const subject = `Lieferschein ${this.model.get('lieferscheinnummer') || ''} für ${accountName || 'Kunde'}`;
                const bodyHtml =
                    `Sehr geehrte Damen und Herren,<br><br>` +
                    `anbei erhalten Sie den Lieferschein.<br>` +
                    `<a href="${pdfUrl}" target="_blank">${pdfUrl}</a><br><br>` +
                    `Mit freundlichen Grüßen<br>` +
                    `Ihr KleSec Team`;

                this.notify(false, 'loading');

                this.createView('composeEmail', 'views/modals/compose-email', {
                    attributes: {
                        to: toEmail,
                        subject,
                        body: bodyHtml,
                        isHtml: true,
                        parentType: 'CLieferschein',
                        parentId: this.model.id,
                        parentName: this.model.get('name') || ''
                    },
                    focusForCreate: true
                }, view => view.render());
            });
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

            const label = '📄 Gespeicherten Lieferschein anzeigen';
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
