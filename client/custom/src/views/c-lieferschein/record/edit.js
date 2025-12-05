console.log('[LOAD] custom:views/c-lieferschein/record/edit');

define('custom:views/c-lieferschein/record/edit', ['views/record/edit'], function (Dep) {

    const LOG_NS = '[CLieferschein/edit]';
    const L = (tag, payload) => { try { console.log(LOG_NS, tag, payload || ''); } catch (e) { } };

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            this.once('after:render', () => {
                if (this.isNew) {
                    L('Neuer Lieferschein → prüfe Vorbelegung');
                    this._prefillFromAuftragOrAccount();
                }
            }, this);

            // реагируем, если пользователь выбрал Auftrag вручную
            this.listenTo(this.model, 'change:auftragId', (m, id) => {
                if (!id) return;

                L('Auftrag geändert → lade Auftrag & übernehme Account', id);

                // Запрашиваем данные заказа напрямую
                Espo.Ajax.getRequest(`CAuftrag/${encodeURIComponent(id)}`)
                    .then((auftrag) => {
                        if (!auftrag) {
                            this.notify('Auftrag nicht gefunden.', 'warning');
                            return;
                        }

                        // Устанавливаем Account из заказа
                        this.model.set({
                            accountId: auftrag.accountId || null,
                            accountName: auftrag.accountName || '',
                            lieferadresseStreet: auftrag.lieferadresseStreet || auftrag.accountBillingStreet || '',
                            lieferadresseCity: auftrag.lieferadresseCity || auftrag.accountBillingCity || '',
                            lieferadressePostalCode: auftrag.lieferadressePostalCode || auftrag.accountBillingPostalCode || '',
                            lieferadresseCountry: auftrag.lieferadresseCountry || auftrag.accountBillingCountry || ''
                        });

                        // Принудительно обновляем UI
                        const v = this.getFieldView && (this.getFieldView('account') || this.getFieldView('accountId'));
                        if (v && typeof v.reRender === 'function') v.reRender();

                        L('Account übernommen', {
                            id: auftrag.accountId,
                            name: auftrag.accountName
                        });
                    })
                    .catch((err) => {
                        console.error(LOG_NS, 'Fehler beim Laden des Auftrags:', err);
                        this.notify('Fehler beim Laden des Auftrags.', 'error');
                    });
            });

        },

        /**
         * Prefill-Daten aus Auftrag oder Account übernehmen
         */
        _prefillFromAuftragOrAccount: function () {
            const auftragId = this.model.get('auftragId');
            const accountId = this.model.get('accountId');

            if (auftragId) {
                this._prefillFromAuftrag(auftragId);
                this._importAuftragPositionen(auftragId);
            } else if (accountId) {
                this._prefillFromAccount(accountId);
            } else {
                L('Kein Auftrag/Account zum Prefill gefunden');
            }
        },

        _prefillFromAuftrag: function (auftragId) {
            Espo.Ajax.getRequest(`CAuftrag/${encodeURIComponent(auftragId)}`).then((auftrag) => {
                if (!auftrag) return;
                this.model.set({
                    accountId: auftrag.accountId || null,
                    accountName: auftrag.accountName || null,
                    lieferadresseStreet: auftrag.lieferadresseStreet || auftrag.accountBillingStreet || '',
                    lieferadresseCity: auftrag.lieferadresseCity || auftrag.accountBillingCity || '',
                    lieferadressePostalCode: auftrag.lieferadressePostalCode || auftrag.accountBillingPostalCode || '',
                    lieferadresseCountry: auftrag.lieferadresseCountry || auftrag.accountBillingCountry || ''
                });
            }).catch(err => {
                console.error(LOG_NS, 'Fehler beim Laden des Auftrags:', err);
            });
        },

        _prefillFromAccount: function (accountId) {
            Espo.Ajax.getRequest(`Account/${encodeURIComponent(accountId)}`).then((acc) => {
                if (!acc) return;
                this.model.set({
                    lieferadresseStreet: acc.billingAddressStreet || acc.shippingAddressStreet || '',
                    lieferadresseCity: acc.billingAddressCity || acc.shippingAddressCity || '',
                    lieferadressePostalCode: acc.billingAddressPostalCode || acc.shippingAddressPostalCode || '',
                    lieferadresseCountry: acc.billingAddressCountry || acc.shippingAddressCountry || ''
                });
            }).catch(err => {
                console.error(LOG_NS, 'Fehler beim Laden des Accounts:', err);
            });
        },

        /**
         * Holt Positionen aus Auftrag und erstellt CLieferscheinposition-Einträge
         */
        _ensureSaved: function () {
            // Если запись новая — сначала сохраним, чтобы появился this.model.id
            if (this.model.id) return Promise.resolve(this.model.id);

            return new Promise((resolve, reject) => {
                this.model.save(null, {
                    success: (m) => resolve(m.id),
                    error: (m, xhr) => {
                        this.notify('Speichern fehlgeschlagen.', 'error');
                        reject(xhr);
                    }
                });
            });
        },

        _importAuftragPositionen: function (auftragId) {
            const notifyId = this.notify('Positionen werden übernommen…', 'loading');

            // 1) Убедимся, что есть ID Lieferschein
            this._ensureSaved().then((lieferscheinId) => {
                // 2) Забираем позиции заказа
                const params = {
                    where: [{ type: 'equals', attribute: 'auftragId', value: auftragId }],
                    select: [
                        'id', 'name', 'beschreibung', 'menge', 'einheit', 'preis', 'rabatt', 'gesamt',
                        'sortierung', 'materialId', 'materialName', 'materialDescription'
                    ],
                    orderBy: 'sortierung',
                    order: 'asc',
                    limit: 500
                };

                return Espo.Ajax.getRequest('CAuftragsposition', params).then(res => {
                    const src = (res && res.list) || [];
                    if (!src.length) {
                        this.notify(false, 'loading', notifyId);
                        this.notify('Keine Auftragspositionen gefunden.', 'warning');
                        return [];
                    }

                    // 3) Подготовим payload’ы с обязательным name
                    const payloads = src.map((pos, idx) => {
                        const fallbackName =
                            pos.name ||
                            pos.materialName ||
                            `Position ${String(idx + 1).padStart(2, '0')}`;

                        const descPart = pos.materialDescription || pos.beschreibung || '';
                        // Для печати удобно: "Name\n\nBeschreibung"
                        const beschreibung =
                            fallbackName + (descPart ? `\n\n${descPart}` : '');

                        return {
                            lieferscheinId,
                            name: fallbackName,                   // <-- ОБЯЗАТЕЛЬНО
                            beschreibung: descPart || '',         // в карточке храним «чистое» описание
                            menge: pos.menge,
                            einheit: pos.einheit,
                            preis: pos.preis,
                            rabatt: pos.rabatt,
                            gesamt: pos.gesamt,
                            sortierung: pos.sortierung,
                            materialId: pos.materialId || null
                        };
                    });

                    // 4) Создаём записи
                    const creations = payloads.map(p =>
                        Espo.Ajax.postRequest('CLieferscheinposition', p)
                            .then(() => ({ ok: true }))
                            .catch(err => ({ ok: false, err }))
                    );

                    return Promise.allSettled(creations).then(results => {
                        const okCount = results.filter(r => r.value?.ok).length;
                        const failCount = results.length - okCount;

                        this.notify(false, 'loading', notifyId);
                        if (okCount) this.notify(`${okCount} Position(en) übernommen.`, 'success');
                        if (failCount) this.notify(`${failCount} Position(en) fehlgeschlagen.`, 'warning');

                        // 5) Обновим панель, если она есть (в detail), иначе просто оставим уведомление
                        const pv = this.getView && this.getView('lieferscheinpositions');
                        if (pv && pv.collection && pv.collection.fetch) {
                            setTimeout(() => pv.collection.fetch(), 50);
                        }
                    });
                });
            }).catch(err => {
                this.notify(false, 'loading', notifyId);
                console.error('[CLieferschein/edit] Import-Fehler:', err);
                this.notify('Fehler beim Import der Auftragspositionen.', 'error');
            });
        },

    });
});
