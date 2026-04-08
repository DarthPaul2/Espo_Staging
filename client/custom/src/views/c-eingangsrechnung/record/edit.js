define('custom:views/c-eingangsrechnung/record/edit', ['views/record/edit'], function (Dep) {
    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            console.log('[CEingangsrechnung/edit] custom edit.js loaded');

            if (!this.model.isNew()) {
                return;
            }

            // Что это: только помечаем, что для новой записи надо применить transfer.
            // Зачем: реальную подстановку делаем после рендера, когда field views уже существуют.
            this.shouldApplyImportTransfer_ = true;
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            if (!this.model.isNew()) {
                return;
            }

            if (!this.shouldApplyImportTransfer_) {
                return;
            }

            this.shouldApplyImportTransfer_ = false;
            this.applyImportTransferData_();
        },

        applyImportTransferData_: function () {
            // Что это: читает подготовленные данные из sessionStorage.
            // Зачем: предзаполнить create/edit-форму новой CEingangsrechnung.
            const raw = sessionStorage.getItem('ceingangsrechnungImportTransfer');

            console.log('[CEingangsrechnung/edit] sessionStorage raw =', raw);

            if (!raw) {
                return;
            }

            let payload = null;

            try {
                payload = JSON.parse(raw);
            } catch (e) {
                console.error('[CEingangsrechnung/edit] JSON parse error', e);
                Espo.Ui.error('Transferdaten sind kein gültiges JSON.');
                return;
            }

            if (!payload || !payload.eingangsrechnung) {
                return;
            }

            const data = payload.eingangsrechnung || {};

            const patch = {
                lieferantId: data.lieferantId || null,
                lieferantName: data.lieferantName || null,
                lieferantenRechnungsnummer: data.lieferantenRechnungsnummer || null,
                belegdatum: data.belegdatum || null,
                eingangsdatum: data.eingangsdatum || null,
                faelligAm: data.faelligAm || null,
                steuerfall: data.steuerfall || null,
                betragNetto: data.betragNetto != null ? data.betragNetto : null,
                steuerBetrag: data.steuerBetrag != null ? data.steuerBetrag : null,
                betragBrutto: data.betragBrutto != null ? data.betragBrutto : null,
                bemerkung: data.bemerkung || null,
                status: data.status || 'entwurf'
            };

            this.model.set(patch, { silent: false });

            // Что это: payload держим в view до первого сохранения.
            // Зачем: после сохранения шапки создать позиции.
            this.importTransferPayload_ = payload;

            // Что это: перерисовываем поля новой формы после подстановки.
            // Зачем: чтобы пользователь сразу увидел значения в UI.
            this.reRenderImportedFields_();

            Espo.Ui.success('Transferdaten wurden in die Eingangsrechnung geladen.');
        },

        reRenderImportedFields_: function () {
            // Что это: точечно перерисовывает поля шапки Eingangsrechnung.
            // Зачем: после model.set(...) значения должны сразу стать видны в create/edit-форме.

            const fields = [
                'lieferant',
                'lieferantenRechnungsnummer',
                'belegdatum',
                'eingangsdatum',
                'faelligAm',
                'steuerfall',
                'betragNetto',
                'steuerBetrag',
                'betragBrutto',
                'bemerkung',
                'status'
            ];

            fields.forEach(field => {
                const view = this.getFieldView(field);

                if (view && typeof view.reRender === 'function') {
                    view.reRender();
                }
            });
        },

        actionSave: function () {
            // Что это: перехват обычной кнопки Speichern.
            // Зачем: сначала сохранить шапку, потом создать позиции из import,
            // затем пометить CEingangsrechnungImport как übernommen.

            const parentActionSave = Dep.prototype.actionSave;

            if (!parentActionSave) {
                return;
            }

            return Promise.resolve(parentActionSave.apply(this, arguments))
                .then(() => this.createImportedPositionenIfNeeded_())
                .then(() => this.markImportAsTransferredIfNeeded_())
                .then(() => this.cleanupImportTransferState_())
                .catch(e => {
                    if (e === 'notModified' || (e && e.message === 'notModified')) {
                        return;
                    }
                    throw e;
                });
        },

        createImportedPositionenIfNeeded_: async function () {
            // Что это: создаёт позиции после первого сохранения новой CEingangsrechnung.
            // Зачем: позиции можно привязать только когда уже есть id шапки.
            if (!this.importTransferPayload_) {
                return;
            }

            const eingangsrechnungId = this.model.id;

            if (!eingangsrechnungId) {
                return;
            }

            const positionen = Array.isArray(this.importTransferPayload_.positionen)
                ? this.importTransferPayload_.positionen
                : [];

            if (!positionen.length) {
                sessionStorage.removeItem('ceingangsrechnungImportTransfer');
                this.importTransferPayload_ = null;
                return;
            }

            // Что это: защита от повторного создания строк при повторном сохранении.
            // Зачем: чтобы не дублировать позиции.
            if (this.importPositionenCreated_) {
                sessionStorage.removeItem('ceingangsrechnungImportTransfer');
                this.importTransferPayload_ = null;
                return;
            }

            for (let i = 0; i < positionen.length; i++) {
                const p = positionen[i] || {};

                const payload = {
                    positionsnummer: p.positionsnummer || String(i + 1),
                    name: p.name || null,
                    beschreibung: p.beschreibung || null,
                    menge: p.menge != null ? p.menge : null,
                    einheit: p.einheit || null,
                    einzelpreisNetto: p.einzelpreisNetto != null ? p.einzelpreisNetto : null,
                    rabattProzent: p.rabattProzent != null ? p.rabattProzent : 0,
                    rabattBetrag: p.rabattBetrag != null ? p.rabattBetrag : null,
                    gesamtNetto: p.gesamtNetto != null ? p.gesamtNetto : null,
                    materialId: p.materialId || null,
                    materialName: p.materialName || null,
                    eingangsrechnungId: eingangsrechnungId
                };

                await Espo.Ajax.postRequest('CEingangsrechnungsposition', payload);
            }

            this.importPositionenCreated_ = true;

            Espo.Ui.success('Positionen wurden aus dem Import übernommen.');
        },

        markImportAsTransferredIfNeeded_: async function () {
            // Что это: помечает CEingangsrechnungImport как übernommen.
            // Зачем: один Import должен создавать только один echten CEingangsrechnung.

            if (!this.importTransferPayload_) {
                return;
            }

            const importId = this.importTransferPayload_.importId || null;
            const eingangsrechnungId = this.model.id || null;

            if (!importId || !eingangsrechnungId) {
                return;
            }

            const currentUser =
                (this.getUser && this.getUser()) ? this.getUser() : null;

            const currentUserId =
                (currentUser && typeof currentUser.get === 'function' ? currentUser.get('id') : null) ||
                (currentUser && currentUser.id ? currentUser.id : null) ||
                null;

            await Espo.Ajax.putRequest('CEingangsrechnungImport/' + importId, {
                status: 'uebernommen',
                eingangsrechnungId: eingangsrechnungId,
                uebernommenAm: this.formatCurrentDateTime_(),
                uebernommenVonId: currentUserId
            });
        },

        cleanupImportTransferState_: function () {
            // Что это: очищает временные данные transfer после успешного завершения.
            // Зачем: чтобы повторное сохранение не пыталось снова переносить import-данные.

            sessionStorage.removeItem('ceingangsrechnungImportTransfer');
            this.importTransferPayload_ = null;
        },

        formatCurrentDateTime_: function () {
            // Что это: формирует текущее Datum/Uhrzeit в формате YYYY-MM-DD HH:mm:ss.
            // Зачем: для поля uebernommenAm в CEingangsrechnungImport.

            const d = new Date();

            const pad = function (n) {
                return String(n).padStart(2, '0');
            };

            return [
                d.getFullYear(),
                '-',
                pad(d.getMonth() + 1),
                '-',
                pad(d.getDate()),
                ' ',
                pad(d.getHours()),
                ':',
                pad(d.getMinutes()),
                ':',
                pad(d.getSeconds())
            ].join('');
        },
    });
});