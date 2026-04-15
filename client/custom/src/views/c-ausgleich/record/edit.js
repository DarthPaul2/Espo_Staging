define('custom:views/c-ausgleich/record/edit', ['views/record/edit'], function (Dep) {
    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            this._isAutoFilling = false;

            this.listenTo(this.model, 'change:rechnungId', () => {
                if (this._isAutoFilling) return;
                const rechnungId = this.model.get('rechnungId');
                if (!rechnungId) return;

                this._handleSelectedRechnung(rechnungId);
            });

            this.listenTo(this.model, 'change:eingangsrechnungId', () => {
                if (this._isAutoFilling) return;
                const eingangsrechnungId = this.model.get('eingangsrechnungId');
                if (!eingangsrechnungId) return;

                this._handleSelectedEingangsrechnung(eingangsrechnungId);
            });
        },

        _handleSelectedRechnung: function (rechnungId) {
            this._isAutoFilling = true;

            // Что это:
            // при выборе Ausgangsrechnung очищаем Eingangsrechnung и ставим правильное направление.
            this.model.set('eingangsrechnungId', null);
            this.model.set('eingangsrechnungName', null);
            this.model.set('richtung', 'forderungsausgleich');

            this._fillFromZahlungAndDocument('CRechnung', rechnungId)
                .finally(() => {
                    this._isAutoFilling = false;
                });
        },

        _handleSelectedEingangsrechnung: function (eingangsrechnungId) {
            this._isAutoFilling = true;

            // Что это:
            // при выборе Eingangsrechnung очищаем Ausgangsrechnung и ставим правильное направление.
            this.model.set('rechnungId', null);
            this.model.set('rechnungName', null);
            this.model.set('richtung', 'verbindlichkeitsausgleich');

            this._fillFromZahlungAndDocument('CEingangsrechnung', eingangsrechnungId)
                .finally(() => {
                    this._isAutoFilling = false;
                });
        },

        _fillFromZahlungAndDocument: async function (entityType, documentId) {
            const zahlungId = this.model.get('zahlungId');

            if (!zahlungId) {
                this.notify('Zuerst muss eine Zahlung vorhanden sein.', 'warning');
                return;
            }

            try {
                const [zahlung, documentData] = await Promise.all([
                    Espo.Ajax.getRequest('CZahlung/' + zahlungId),
                    Espo.Ajax.getRequest(entityType + '/' + documentId)
                ]);

                const zahlungsdatum = zahlung?.zahlungsdatum || null;
                const zahlungBetrag = parseFloat(zahlung?.betrag || 0);

                // Что это:
                // берем Restbetrag, если он уже есть; иначе fallback на Bruttobetrag.
                let restbetrag = parseFloat(documentData?.restbetragOffen);
                if (isNaN(restbetrag)) {
                    restbetrag = parseFloat(documentData?.betragBrutto || 0);
                }

                if (isNaN(restbetrag) || restbetrag < 0) {
                    restbetrag = 0;
                }

                const ausgleichBetrag = Math.min(zahlungBetrag, restbetrag);
                const ausgleichTyp = (ausgleichBetrag === restbetrag) ? 'voll' : 'teil';

                if (zahlung?.zahlungsdatum) {
                    this.model.set('ausgleichsdatum', zahlungsdatum);
                }

                this.model.set('betrag', ausgleichBetrag);
                this.model.set('ausgleichTyp', ausgleichTyp);
                this.model.set('ausgleichStatus', 'aktiv');
                this.model.set('istAktiv', true);
                this.model.set('restbetragNachAusgleich', Math.max(restbetrag - ausgleichBetrag, 0));

                // Что это:
                // если у Zahlung еще не подставлен контрагент, пробуем его подставить из документа.
                if (entityType === 'CRechnung') {
                    if (!zahlung.accountId && documentData.accountId) {
                        this._updateZahlungPartner(zahlungId, {
                            accountId: documentData.accountId,
                            accountName: documentData.accountName || null
                        });
                    }
                }

                if (entityType === 'CEingangsrechnung') {
                    if (!zahlung.lieferantId && documentData.lieferantId) {
                        this._updateZahlungPartner(zahlungId, {
                            lieferantId: documentData.lieferantId,
                            lieferantName: documentData.lieferantName || null
                        });
                    }
                }

            } catch (e) {
                console.error('[CAusgleich/edit] Autofill error', e);
                this.notify('Autofill für Ausgleich konnte nicht geladen werden.', 'error');
            }
        },

        _updateZahlungPartner: function (zahlungId, data) {
            // Что это:
            // аккуратно обновляем контрагента у Zahlung, если он еще пустой.
            Espo.Ajax.putRequest('CZahlung/' + zahlungId, data).catch((e) => {
                console.warn('[CAusgleich/edit] Zahlung partner update skipped', e);
            });
        }
    });
});