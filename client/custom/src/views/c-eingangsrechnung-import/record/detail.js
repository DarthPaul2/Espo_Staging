define('custom:views/c-eingangsrechnung-import/record/detail', ['views/record/detail'], function (Dep) {
    return Dep.extend({

        // Что это: кастомный detail view для CEingangsrechnungImport.
        // Зачем: раскладывает экран на левую форму и правый viewer документа.
        setup: function () {
            Dep.prototype.setup.call(this);

            // Что это: список верхних кнопок карточки.
            // Зачем: добавляем наши действия сразу после стандартной кнопки Bearbeiten.
            this.buttonList = this.buttonList || [];

            const erkennenButton = {
                name: 'dokumentErkennen',
                label: 'Dokument erkennen',
                style: 'primary',
                action: 'dokumentErkennen'
            };

            const uebernehmenButton = {
                name: 'alsEingangsrechnungUebernehmen',
                label: 'Als Eingangsrechnung übernehmen',
                style: 'success',
                action: 'alsEingangsrechnungUebernehmen'
            };

            const editIndex = this.buttonList.findIndex(item => item.name === 'edit');

            if (!this.isAlreadyTransferred_()) {
                if (editIndex !== -1) {
                    this.buttonList.splice(editIndex + 1, 0, erkennenButton, uebernehmenButton);
                } else {
                    this.buttonList.push(erkennenButton, uebernehmenButton);
                }
            }

            // Что это: реакция на выбор поставщика в поле matchedLieferant.
            // Зачем: после выбора нужно автоматически подтянуть адрес и банковские данные из CLieferant.
            this.listenTo(this.model, 'change:matchedLieferantId', this.onMatchedLieferantChange_);

            // Что это: делегированный обработчик кнопки "+" в панели импорт-позиций.
            // Зачем: после кастомного split-layout штатный createRelated не срабатывает как надо.
            this.events = _.extend({}, this.events || {}, {
                'click button.action[data-action="createRelated"][data-link="eingangsrechnungImportPositions"]': function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    this.openImportPositionQuickCreate_(e);
                },

                'click [data-panel="eingangsrechnungImportPositions"] .action[data-action="editRelated"]': function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    this.openImportPositionQuickEdit_(e);
                },

                'click [data-panel="eingangsrechnungImportPositions"] .action[data-action="quickEditRelated"]': function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    this.openImportPositionQuickEdit_(e);
                },

                'click .action[data-action="removeRelated"][data-id]': function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    this.removeImportPosition_(e);
                },

                'click .action[data-action="unlinkRelated"][data-id]': function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    this.removeImportPosition_(e);
                },

                'click .action[data-action="deleteRelated"][data-id]': function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    this.removeImportPosition_(e);
                },

                'click .action[data-action="edit"]': function (e) {
                    if (!this.isAlreadyTransferred_()) {
                        return;
                    }

                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    Espo.Ui.warning('Dieser Import wurde bereits übernommen und kann nicht mehr bearbeitet werden.');
                },
            });
        },

        isAlreadyTransferred_: function () {
            // Что это: проверка, был ли Import уже перенесён в echten CEingangsrechnung.
            // Зачем: после первого erfolgreichen Transfer повторное Übernehmen запрещаем.

            return !!(
                this.model.get('eingangsrechnungId') ||
                this.model.get('status') === 'uebernommen'
            );
        },

        disableEditButtonIfTransferred_: function () {
            // Что это: делает кнопку Bearbeiten визуально и функционально недоступной.
            // Зачем: после Übernahme Import больше нельзя редактировать.

            if (!this.isAlreadyTransferred_()) {
                return;
            }

            const $editButtons = this.$el.find('.action[data-action="edit"]');

            $editButtons.each(function () {
                const $btn = $(this);

                $btn.addClass('disabled');
                $btn.attr('disabled', 'disabled');
                $btn.attr('aria-disabled', 'true');
                $btn.css({
                    'pointer-events': 'none',
                    'opacity': '0.5',
                    'cursor': 'not-allowed'
                });

                if ($btn.is('a')) {
                    $btn.attr('tabindex', '-1');
                }
            });
        },

        // Что это: выполняется после стандартного рендера карточки.
        // Зачем: здесь безопасно перестраивать DOM и вставлять viewer.
        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this.expandPageWidth_();
            this.injectCustomStyle_();
            this.buildSplitLayout_();
            this.hideCreatedBlock_();
            this.normalizeLeftLayout_();
            this.normalizeInnerRecordGrid_();
            this.renderDocumentPreview_();
            this.disableEditButtonIfTransferred_();
        },

        actionSave: function () {
            // Что это: перехват стандартной кнопки Speichern.
            // Зачем: если Espo возвращает "notModified", не показывать это как Uncaught Promise.

            let parentActionSave = null;

            if (Dep.prototype && typeof Dep.prototype.actionSave === 'function') {
                parentActionSave = Dep.prototype.actionSave;
            }

            if (!parentActionSave) {
                return;
            }

            return Promise.resolve(parentActionSave.apply(this, arguments)).catch(function (e) {
                if (e === 'notModified' || (e && e.message === 'notModified')) {
                    return;
                }

                throw e;
            });
        },

        actionEdit: function () {
            // Что это: защита от перехода в edit, если Import уже übernommen.
            // Зачем: даже если кто-то обойдёт disabled-кнопку, edit не должен открыться.

            if (this.isAlreadyTransferred_()) {
                Espo.Ui.warning('Dieser Import wurde bereits übernommen und kann nicht mehr bearbeitet werden.');
                return;
            }

            if (Dep.prototype && typeof Dep.prototype.actionEdit === 'function') {
                return Dep.prototype.actionEdit.call(this);
            }
        },

        actionDokumentErkennen: async function () {
            // Что это: рабочая версия кнопки распознавания через Flask route.
            // Зачем: получить тестовый JSON от backend и записать его в CEingangsrechnungImport.

            if (this.isAlreadyTransferred_()) {
                Espo.Ui.warning('Dieser Import wurde bereits in eine Eingangsrechnung übernommen.');
                return;
            }
            const fileId = this.model.get('originalFileId') || null;
            const fileName = this.model.get('originalFileName') || '';

            if (!fileId) {
                Espo.Ui.error('Bitte laden Sie zuerst eine Datei hoch.');
                return;
            }

            try {
                this.notify('Verarbeitung...');

                // Что это: сначала переводим запись в "обрабатывается".
                // Зачем: пользователь должен видеть начало процесса.
                await this.model.save({
                    status: 'in_verarbeitung',
                    fehlertext: null
                }, {
                    patch: true,
                    silent: true
                });

                const response = await fetch('https://klesec.pagekite.me/api/eingangsrechnung-import/ai_parse', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        import_id: this.model.id,
                        file_name: fileName,
                        original_file_id: fileId
                    })
                });

                const rawText = await response.text();

                let data = null;

                try {
                    data = JSON.parse(rawText);
                } catch (parseError) {
                    throw new Error('Backend liefert kein JSON. Antwortanfang: ' + rawText.slice(0, 300));
                }

                if (!data || data.status !== 'ok') {
                    throw new Error((data && data.error) ? data.error : 'Unbekannter Backend-Fehler');
                }

                const recognized = data.recognized_data || {};
                const warnings = Array.isArray(data.warnings) ? data.warnings.join('\n') : '';
                const aiRawJson = data.ai_raw_json
                    ? JSON.stringify(data.ai_raw_json, null, 2)
                    : null;

                const payload = {
                    status: 'zur_pruefung',
                    dokumentTyp: recognized.dokumentTyp || 'unbekannt',
                    recognizedLieferantName: recognized.recognizedLieferantName || null,
                    recognizedIban: recognized.recognizedIban || null,
                    recognizedBic: recognized.recognizedBic || null,
                    recognizedBankName: recognized.recognizedBankName || null,
                    lieferantenRechnungsnummer: recognized.lieferantenRechnungsnummer || null,
                    belegdatum: recognized.belegdatum || null,
                    eingangsdatum: recognized.eingangsdatum || null,
                    faelligAm: recognized.faelligAm || null,
                    steuerfall: recognized.steuerfall || 'unbekannt',
                    betragNetto: recognized.betragNetto != null ? recognized.betragNetto : null,
                    steuerBetrag: recognized.steuerBetrag != null ? recognized.steuerBetrag : null,
                    betragBrutto: recognized.betragBrutto != null ? recognized.betragBrutto : null,
                    waehrung: recognized.waehrung || 'EUR',
                    strasse: recognized.strasse || null,
                    plz: recognized.plz || null,
                    ort: recognized.ort || null,
                    land: recognized.land || null,
                    warnhinweise: warnings || null,
                    fehlertext: null,
                    ocrText: data.ocr_text || null,
                    aiJson: aiRawJson || null
                };

                await this.model.save(payload, {
                    patch: true,
                    silent: true
                });
                await this.tryAutoMatchLieferant_();
                await this.syncImportPositionenFromAiData_(data);
                await this.autoMatchImportPositionenToMaterial_();

                this.notify(false);
                Espo.Ui.success('Dokument wurde erkannt.');
                await this.model.fetch();
                this.reloadPage_();
                return;

            } catch (e) {
                this.notify(false);

                try {
                    await this.model.save({
                        status: 'fehler',
                        fehlertext: e && e.message ? e.message : 'Unbekannter Fehler'
                    }, {
                        patch: true,
                        silent: true
                    });
                } catch (saveError) { }

                Espo.Ui.error('Fehler bei der Dokument-Erkennung.');
                console.error(e);
                await this.model.fetch();
            }
        },

        tryAutoMatchLieferant_: async function () {
            // Что это: пытается автоматически найти CLieferant по распознанному имени.
            // Зачем: если поставщик найден, адрес должен сразу подставиться в import.

            const recognizedName = (this.model.get('recognizedLieferantName') || '').trim();

            if (!recognizedName) {
                return;
            }

            // Если поставщик уже выбран, повторно не ищем.
            if (this.model.get('matchedLieferantId')) {
                await this.applyMatchedLieferantDataIfNeeded_(true);
                return;
            }

            try {
                const response = await Espo.Ajax.getRequest('CLieferant', {
                    where: [
                        {
                            type: 'contains',
                            attribute: 'name',
                            value: recognizedName
                        }
                    ],
                    maxSize: 10
                });

                const list = Array.isArray(response?.list) ? response.list : [];

                if (!list.length) {
                    return;
                }

                // Что это: сначала ищем точное совпадение без учёта регистра.
                // Зачем: если есть точный Treffer, берём его без лишней двусмысленности.
                const exact = list.find(item =>
                    String(item.name || '').trim().toLowerCase() === recognizedName.toLowerCase()
                );

                const supplier = exact || (list.length === 1 ? list[0] : null);

                if (!supplier || !supplier.id) {
                    return;
                }

                const patch = {
                    matchedLieferantId: supplier.id,
                    matchedLieferantName: supplier.name || null
                };

                this.model.set(patch, { silent: true });

                await this.model.save(patch, {
                    patch: true,
                    silent: true
                });

                await this.applyMatchedLieferantDataIfNeeded_(true);
            } catch (e) {
                console.error('Automatisches Lieferanten-Matching fehlgeschlagen.', e);
            }
        },

        syncImportPositionenFromAiData_: async function (data) {
            // Что это: синхронизирует import-позиции из ответа Flask.
            // Зачем: рабочие позиции должны жить в CEingangsrechnungImportPosition, а не только в aiJson.

            const importId = this.model.id;
            const positions = Array.isArray(data?.positions) ? data.positions : [];

            // Что это: сначала читаем уже существующие import-позиции текущего документа.
            // Зачем: перед созданием новых нужно удалить старые, чтобы не плодить дубли.
            const existing = await Espo.Ajax.getRequest('CEingangsrechnungImportPosition', {
                where: [
                    {
                        type: 'equals',
                        attribute: 'eingangsrechnungImportId',
                        value: importId
                    }
                ],
                maxSize: 200
            });

            const existingList = Array.isArray(existing?.list) ? existing.list : [];

            // Что это: удаляем старые строки импорта.
            // Зачем: при повторном "Dokument erkennen" позиции должны полностью пересобраться.
            for (const row of existingList) {
                if (row && row.id) {
                    await Espo.Ajax.deleteRequest('CEingangsrechnungImportPosition/' + row.id);
                }
            }

            // Что это: создаём новые import-позиции из AI-ответа.
            // Зачем: пользователь должен видеть и редактировать строки в relation-panel.
            for (let i = 0; i < positions.length; i++) {
                const p = positions[i] || {};

                const menge = p.menge != null ? parseFloat(p.menge) : null;
                const einzelpreisNetto = p.einzelpreisNetto != null ? parseFloat(p.einzelpreisNetto) : null;
                const gesamtNetto =
                    p.gesamtNetto != null
                        ? parseFloat(p.gesamtNetto)
                        : ((menge != null && einzelpreisNetto != null) ? (menge * einzelpreisNetto) : null);

                const rabattProzent =
                    p.rabattProzent != null && p.rabattProzent !== ''
                        ? parseFloat(p.rabattProzent)
                        : 0;

                const rabattBetrag =
                    p.rabattBetrag != null && p.rabattBetrag !== ''
                        ? parseFloat(p.rabattBetrag)
                        : null;

                await Espo.Ajax.postRequest('CEingangsrechnungImportPosition', {
                    eingangsrechnungImportId: importId,
                    positionsnummer: (i + 1).toString(),
                    name: (p.name || '').toString().trim() || ('Position ' + (i + 1)),
                    beschreibung: p.beschreibung || null,
                    menge: menge,
                    einheit: this.normalizeEinheit_(p.einheit) || 'Stk.',
                    einzelpreisNetto: einzelpreisNetto,
                    rabattProzent: isNaN(rabattProzent) ? 0 : rabattProzent,
                    rabattBetrag: isNaN(rabattBetrag) ? null : rabattBetrag,
                    gesamtNetto: gesamtNetto,
                    warnhinweis: null
                });
            }
        },

        autoMatchImportPositionenToMaterial_: async function () {
            // Что это: проходит по всем Import-Positionen и пытается найти CMaterial.
            // Зачем: не создавать дубли материалов, а сначала связать позицию со справочником.

            try {
                const response = await Espo.Ajax.getRequest('CEingangsrechnungImportPosition', {
                    where: [
                        {
                            type: 'equals',
                            attribute: 'eingangsrechnungImportId',
                            value: this.model.id
                        }
                    ],
                    maxSize: 200
                });

                const positions = Array.isArray(response?.list) ? response.list : [];

                for (const position of positions) {
                    await this.tryAutoMatchSingleImportPosition_(position);
                }
            } catch (e) {
                console.error('Material-Auto-Match für Import-Positionen fehlgeschlagen.', e);
            }
        },

        tryAutoMatchSingleImportPosition_: async function (position) {
            // Что это: пытается найти один passenden CMaterial для одной Import-Position.
            // Зачем: если Treffer eindeutig, сразу ставим material-link.

            if (!position || !position.id) {
                return;
            }

            const rawName = (position.name || '').trim();

            if (!rawName) {
                await this.updateImportPositionMatchResult_(position.id, {
                    materialMatchStatus: 'nicht_gefunden',
                    materialMatchScore: 0,
                    materialMatchHinweis: 'Kein Positionsname vorhanden.'
                });
                return;
            }

            const normalizedName = this.normalizeMaterialMatchText_(rawName);

            // Шаг 1: точный Treffer по имени материала
            let exactResponse = null;

            try {
                exactResponse = await Espo.Ajax.getRequest('CMaterial', {
                    where: [
                        {
                            type: 'equals',
                            attribute: 'name',
                            value: rawName
                        }
                    ],
                    maxSize: 10
                });
            } catch (e) {
                console.error('Exact material match failed.', e);
            }

            const exactList = Array.isArray(exactResponse?.list) ? exactResponse.list : [];

            if (exactList.length === 1) {
                await this.updateImportPositionMatchResult_(position.id, {
                    materialId: exactList[0].id,
                    materialName: exactList[0].name || null,
                    materialMatchStatus: 'automatisch_zugeordnet',
                    materialMatchScore: 1.0,
                    materialMatchHinweis: 'Exakter Materialname gefunden.'
                });
                return;
            }

            if (exactList.length > 1) {
                await this.updateImportPositionMatchResult_(position.id, {
                    materialMatchStatus: 'mehrdeutig',
                    materialMatchScore: 0.8,
                    materialMatchHinweis: 'Mehrere Materialien mit exakt gleichem Namen gefunden.'
                });
                return;
            }

            // Шаг 2: contains по name
            let containsResponse = null;

            try {
                containsResponse = await Espo.Ajax.getRequest('CMaterial', {
                    where: [
                        {
                            type: 'contains',
                            attribute: 'name',
                            value: rawName
                        }
                    ],
                    maxSize: 20
                });
            } catch (e) {
                console.error('Contains material match failed.', e);
            }

            let containsList = Array.isArray(containsResponse?.list) ? containsResponse.list : [];

            // Шаг 3: фильтрация по нормализованному имени
            containsList = containsList.filter(item => {
                const materialName = this.normalizeMaterialMatchText_(item.name || '');
                return materialName.includes(normalizedName) || normalizedName.includes(materialName);
            });

            if (containsList.length === 1) {
                await this.updateImportPositionMatchResult_(position.id, {
                    materialId: containsList[0].id,
                    materialName: containsList[0].name || null,
                    materialMatchStatus: 'automatisch_zugeordnet',
                    materialMatchScore: 0.9,
                    materialMatchHinweis: 'Material über Namens-/Code-Treffer automatisch zugeordnet.'
                });
                return;
            }

            if (containsList.length > 1) {
                await this.updateImportPositionMatchResult_(position.id, {
                    materialMatchStatus: 'mehrdeutig',
                    materialMatchScore: 0.6,
                    materialMatchHinweis: 'Mehrere ähnliche Materialien gefunden.'
                });
                return;
            }

            // Шаг 4: ничего не найдено
            await this.updateImportPositionMatchResult_(position.id, {
                materialMatchStatus: 'nicht_gefunden',
                materialMatchScore: 0,
                materialMatchHinweis: 'Kein passender Materialtreffer gefunden.'
            });
        },

        updateImportPositionMatchResult_: async function (positionId, patch) {
            // Что это: пишет результат material-match обратно в Import-Position.
            // Зачем: пользователь должен видеть итог автосопоставления.

            if (!positionId) {
                return;
            }

            try {
                await Espo.Ajax.putRequest('CEingangsrechnungImportPosition/' + positionId, patch);
            } catch (e) {
                console.error('Import-Position match result could not be saved.', e);
            }
        },

        normalizeMaterialMatchText_: function (value) {
            // Что это: нормализует текст для грубого material-match.
            // Зачем: чтобы "Ei650iRF" и "Rauchwarnmelder Ei650iRF" можно было лучше сравнивать.

            return String(value || '')
                .toLowerCase()
                .replace(/ä/g, 'ae')
                .replace(/ö/g, 'oe')
                .replace(/ü/g, 'ue')
                .replace(/ß/g, 'ss')
                .replace(/[^a-z0-9]/g, '');
        },

        actionAlsEingangsrechnungUebernehmen: async function () {
            // Что это: подготавливает данные из Import и открывает create-форму CEingangsrechnung.
            // Зачем: пользователь должен сначала проверить документ в create-режиме и только потом нажать Speichern.

            if (this.isAlreadyTransferred_()) {
                Espo.Ui.warning('Zu diesem Import wurde bereits eine Eingangsrechnung erstellt.');
                return;
            }

            const dokumentTyp = this.model.get('dokumentTyp') || 'unbekannt';

            if (dokumentTyp !== 'eingangsrechnung') {
                Espo.Ui.error('Dieses Dokument wurde nicht als Eingangsrechnung erkannt. Übernahme ist nicht erlaubt.');
                return;
            }
            const matchedLieferantId = this.model.get('matchedLieferantId') || null;
            const matchedLieferantName =
                this.model.get('matchedLieferantName') ||
                this.model.get('recognizedLieferantName') ||
                null;
            const lieferantenRechnungsnummer = this.model.get('lieferantenRechnungsnummer') || '';
            const belegdatum = this.model.get('belegdatum') || null;
            const eingangsdatum = this.model.get('eingangsdatum') || null;
            const faelligAm = this.model.get('faelligAm') || null;
            const steuerfall = this.model.get('steuerfall') || 'unbekannt';
            const betragNetto = this.model.get('betragNetto');
            const steuerBetrag = this.model.get('steuerBetrag');
            const betragBrutto = this.model.get('betragBrutto');
            const bemerkung = this.model.get('bemerkung') || null;

            if (!matchedLieferantId) {
                Espo.Ui.error('Bitte wählen Sie zuerst einen Lieferanten aus.');
                return;
            }

            if (!lieferantenRechnungsnummer.trim()) {
                Espo.Ui.error('Bitte füllen Sie die Lieferantenrechnungsnummer aus.');
                return;
            }

            if (!belegdatum) {
                Espo.Ui.error('Bitte füllen Sie das Belegdatum aus.');
                return;
            }

            if (!steuerfall || steuerfall === 'unbekannt') {
                Espo.Ui.error('Bitte prüfen Sie den Steuerfall.');
                return;
            }

            let preparedPositions = [];

            try {
                const response = await Espo.Ajax.getRequest('CEingangsrechnungImportPosition', {
                    where: [
                        {
                            type: 'equals',
                            attribute: 'eingangsrechnungImportId',
                            value: this.model.id
                        }
                    ],
                    maxSize: 200
                });

                const positions = Array.isArray(response?.list) ? response.list : [];

                if (!positions.length) {
                    Espo.Ui.error('Es wurden keine Import-Positionen gefunden.');
                    return;
                }

                for (let i = 0; i < positions.length; i++) {
                    const p = positions[i] || {};

                    const einheit = p.einheit || null;

                    if (!(p.name || '').toString().trim()) {
                        Espo.Ui.error('Mindestens eine Import-Position hat keinen Namen.');
                        return;
                    }

                    if (p.menge == null || p.einzelpreisNetto == null) {
                        Espo.Ui.error('Mindestens eine Import-Position hat keine gültige Menge oder keinen gültigen Netto-Preis.');
                        return;
                    }

                    if (!einheit) {
                        Espo.Ui.error('Mindestens eine Import-Position hat keine gültige Einheit.');
                        return;
                    }
                }

                preparedPositions = positions.map((p, index) => {
                    const menge = p.menge != null ? parseFloat(p.menge) : null;
                    const einzelpreisNetto = p.einzelpreisNetto != null ? parseFloat(p.einzelpreisNetto) : null;
                    const rabattProzent = p.rabattProzent != null ? parseFloat(p.rabattProzent) : 0;
                    const rabattBetrag = p.rabattBetrag != null ? parseFloat(p.rabattBetrag) : null;
                    const gesamtNetto =
                        p.gesamtNetto != null
                            ? parseFloat(p.gesamtNetto)
                            : ((menge != null && einzelpreisNetto != null)
                                ? (menge * einzelpreisNetto * (1 - ((isNaN(rabattProzent) ? 0 : rabattProzent) / 100)))
                                : null);

                    return {
                        positionsnummer: p.positionsnummer || (index + 1).toString(),
                        name: (p.name || '').toString().trim(),
                        beschreibung: p.beschreibung || null,
                        menge: menge,
                        einheit: p.einheit || null,
                        einzelpreisNetto: einzelpreisNetto,
                        rabattProzent: isNaN(rabattProzent) ? 0 : rabattProzent,
                        rabattBetrag: isNaN(rabattBetrag) ? null : rabattBetrag,
                        gesamtNetto: gesamtNetto,
                        materialId: p.materialId || null,
                        materialName: p.materialName || null
                    };
                });
            } catch (e) {
                console.error(e);
                Espo.Ui.error('Import-Positionen konnten nicht geladen werden.');
                return;
            }

            const payload = {
                source: 'CEingangsrechnungImport',
                importId: this.model.id,

                eingangsrechnung: {
                    lieferantId: matchedLieferantId,
                    lieferantName: matchedLieferantName,
                    lieferantenRechnungsnummer: lieferantenRechnungsnummer,
                    belegdatum: belegdatum,
                    eingangsdatum: eingangsdatum,
                    faelligAm: faelligAm,
                    steuerfall: steuerfall,
                    betragNetto: betragNetto != null ? betragNetto : null,
                    steuerBetrag: steuerBetrag != null ? steuerBetrag : null,
                    betragBrutto: betragBrutto != null ? betragBrutto : null,
                    bemerkung: bemerkung,
                    status: 'entwurf'
                },

                positionen: preparedPositions
            };

            try {
                sessionStorage.setItem(
                    'ceingangsrechnungImportTransfer',
                    JSON.stringify(payload)
                );

                Espo.Ui.success('Daten wurden vorbereitet. Die Eingangsrechnung wird im Erstellungsmodus geöffnet.');

                window.location.hash = '#CEingangsrechnung/create';
            } catch (e) {
                console.error(e);
                Espo.Ui.error('Die Daten konnten nicht für die Übergabe vorbereitet werden.');
            }
        },

        openImportPositionQuickCreate_: function () {
            // Что это: открывает маленькую modal-create форму для CEingangsrechnungImportPosition.
            // Зачем: relation-panel "+" должен открывать klein-форму, а не полную страницу.

            const importId = this.model.id;
            const importName = this.model.get('name') || null;

            if (!importId) {
                Espo.Ui.error('Import-Dokument hat keine ID.');
                return;
            }

            const attributes = {
                eingangsrechnungImportId: importId
            };

            if (importName) {
                attributes.eingangsrechnungImportName = importName;
            }

            this.createView('quickCreateImportPosition', 'views/modals/edit', {
                scope: 'CEingangsrechnungImportPosition',
                attributes: attributes
            }, function (view) {
                view.render();
                view.listenToOnce(view, 'after:save', () => {
                    setTimeout(() => {
                        this.reloadPage_();
                    }, 150);
                });
            });
        },

        openImportPositionQuickEdit_: function (e) {
            // Что это: открывает klein modal для редактирования строки импорта.
            // Зачем: стандартная обработка row-action после кастомного layout не даёт quick edit.

            const rowId = this.getRelatedRowIdFromEvent_(e);

            if (!rowId) {
                Espo.Ui.error('Positions-ID konnte nicht ermittelt werden.');
                return;
            }

            this.getModelFactory().create('CEingangsrechnungImportPosition', (model) => {
                model.id = rowId;

                model.fetch().then(() => {
                    this.createView('quickEditImportPosition', 'views/modals/edit', {
                        scope: 'CEingangsrechnungImportPosition',
                        model: model
                    }, function (view) {
                        view.render();

                        this.listenToOnce(view, 'after:save', () => {
                            setTimeout(() => {
                                this.reloadPage_();
                            }, 150);
                        });
                    });
                }).catch((err) => {
                    console.error(err);
                    Espo.Ui.error('Die Position konnte nicht zum Bearbeiten geladen werden.');
                });
            });
        },

        removeImportPosition_: async function (e) {
            // Что это: löscht eine Import-Position direkt per API.
            // Зачем: стандартная delete/remove action relation-panel не срабатывает после custom split.

            const rowId = this.getRelatedRowIdFromEvent_(e);

            if (!rowId) {
                Espo.Ui.error('Positions-ID konnte nicht ermittelt werden.');
                return;
            }

            const confirmed = window.confirm('Diese Import-Position wirklich löschen?');

            if (!confirmed) {
                return;
            }

            try {
                await Espo.Ajax.deleteRequest('CEingangsrechnungImportPosition/' + rowId);
                Espo.Ui.success('Position wurde gelöscht.');
                setTimeout(() => {
                    this.reloadPage_();
                }, 150);
                return;
            } catch (err) {
                console.error(err);
                Espo.Ui.error('Die Position konnte nicht gelöscht werden.');
            }
        },

        getRelatedRowIdFromEvent_: function (e) {
            // Что это: bestimmt die ID der geklickten Import-Position.
            // Зачем: delete/edit müssen sicher wissen, welche Zeile gemeint ist.

            const $target = $(e.currentTarget);

            const directId = $target.attr('data-id') || null;
            if (directId) {
                return directId;
            }

            const $row = $target.closest('tr[data-id]');
            const rowId = $row.attr('data-id') || null;
            if (rowId) {
                return rowId;
            }

            const $anyParent = $target.closest('[data-id]');
            return $anyParent.attr('data-id') || null;
        },

        reloadPage_: function () {
            // Что это: полный reload текущей страницы.
            // Зачем: нижняя relation-panel обновляется надёжно только после полного перезагрузки страницы.
            window.location.reload();
        },

        onMatchedLieferantChange_: function () {
            // Что это: вызывается при смене matchedLieferant.
            // Зачем: запускаем async-подстановку поставщика и гасим возможный notModified.

            Promise.resolve(this.applyMatchedLieferantDataIfNeeded_(true)).catch(e => {
                if (e === 'notModified' || (e && e.message === 'notModified')) {
                    return;
                }
                console.error('Fehler bei Lieferant-Autofill.', e);
            });
        },

        applyMatchedLieferantDataIfNeeded_: async function (force) {
            // Что это: подставляет адресные и банковские поля из CLieferant.
            // Зачем: после выбора поставщика пользователь должен сразу видеть Stammdaten из базы.

            const lieferantId = this.model.get('matchedLieferantId') || null;

            if (!lieferantId) {
                return;
            }

            try {
                const supplier = await Espo.Ajax.getRequest('CLieferant/' + lieferantId);

                if (!supplier || !supplier.id) {
                    return;
                }

                const patch = {
                    matchedLieferantId: lieferantId,
                    matchedLieferantName: supplier.name || this.model.get('matchedLieferantName') || null,
                    strasse: supplier.strasse || null,
                    plz: supplier.plz || null,
                    ort: supplier.ort || null,
                    land: supplier.land || null,
                    ustIdNr: supplier.ustIdNr || null,
                    steuernummer: supplier.steuernummer || null
                };

                const hasChanges = Object.keys(patch).some(key => {
                    const currentValue = this.model.get(key);
                    const nextValue = patch[key];

                    return currentValue !== nextValue;
                });

                if (!hasChanges) {
                    return;
                }

                this.model.set(patch, { silent: true });

                try {
                    await this.model.save(patch, {
                        patch: true,
                        silent: false
                    });
                } catch (e) {
                    if (e === 'notModified' || (e && e.message === 'notModified')) {
                        return;
                    }
                    throw e;
                }

                this.reRenderSupplierFields_();

            } catch (e) {
                console.error('Lieferant-Daten konnten nicht geladen werden.', e);
            }
        },

        reRenderSupplierFields_: function () {
            // Что это: точечно перерисовывает только поля блока поставщика.
            // Зачем: чтобы не перерисовывать всю карточку и не терять верхние кнопки/состояние UI.

            const fields = [
                'matchedLieferant',
                'strasse',
                'plz',
                'ort',
                'land',
                'ustIdNr',
                'steuernummer',
                'recognizedIban',
                'recognizedBic',
                'recognizedBankName'
            ];

            fields.forEach(field => {
                const view = this.getFieldView(field);

                if (view && typeof view.reRender === 'function') {
                    view.reRender();
                }
            });
        },

        // Что это: убирает служебный блок "Erstellt" вместе с его bootstrap-колонкой.
        // Зачем: чтобы не оставалась пустая боковая колонка.
        hideCreatedBlock_: function () {
            this.$el.find('.cei-import-left .panel').each(function () {
                const $panel = $(this);
                const title = $panel.find('.panel-title').text().trim();

                if (title === 'Erstellt') {
                    const $col = $panel.closest('[class*="col-"]');
                    if ($col.length) {
                        $col.remove();
                    } else {
                        $panel.remove();
                    }
                }
            });
        },

        // Что это: растягивает оставшийся основной bootstrap-столбец на всю ширину.
        // Зачем: после удаления side-колонки с "Erstellt" слева остаётся узкий main-col.
        normalizeLeftLayout_: function () {
            this.$el.find('.cei-import-left .row').each(function () {
                const $row = $(this);
                const $cols = $row.children('[class*="col-"]');

                if (!$cols.length) {
                    return;
                }

                // Убираем совсем пустые колонки.
                $cols.each(function () {
                    const $col = $(this);
                    const hasVisiblePanel = $col.find('.panel:visible').length > 0;
                    const text = $col.text().trim();

                    if (!hasVisiblePanel && !text) {
                        $col.remove();
                    }
                });

                const $remainingCols = $row.children('[class*="col-"]');

                // Если после удаления осталась одна колонка — растягиваем её на 12/12.
                if ($remainingCols.length === 1) {
                    const $col = $remainingCols.first();

                    const cls = ($col.attr('class') || '')
                        .split(/\s+/)
                        .filter(c => !/^col-(xs|sm|md|lg)-\d+$/.test(c))
                        .join(' ');

                    $col.attr('class', cls);
                    $col.addClass('col-xs-12 col-sm-12 col-md-12 col-lg-12');
                    $col.css({
                        width: '100%',
                        'max-width': '100%',
                        flex: '0 0 100%'
                    });
                }

                // Если row после чистки пустой — удаляем её.
                if (!$row.children().length) {
                    $row.remove();
                }
            });
        },

        // Что это: убирает внутреннюю side-колонку Espo в левой части.
        // Зачем: side создаёт пустое место, а основной контент живёт внутри .left.
        normalizeInnerRecordGrid_: function () {
            const $grid = this.$el.find('.cei-import-left .record-grid').first();

            if (!$grid.length) {
                return;
            }

            $grid.css({
                display: 'block',
                width: '100%',
                maxWidth: '100%'
            });

            $grid.children('.side').css({
                display: 'none',
                width: '0',
                minWidth: '0',
                maxWidth: '0',
                overflow: 'hidden'
            });

            $grid.children('.left').css({
                display: 'block',
                width: '100%',
                maxWidth: '100%',
                minWidth: '0'
            });

            $grid.children('.left').children('.middle, .extra, .bottom').css({
                width: '100%',
                maxWidth: '100%',
                minWidth: '0'
            });
        },
        // Что это: снимает ограничения ширины у внешних контейнеров страницы.
        // Зачем: стандартный layout Espo держит карточку в узком контейнере.
        expandPageWidth_: function () {
            const $page = this.$el.closest('.page-content');
            if ($page.length) {
                $page.css({
                    'max-width': '100%',
                    'width': '100%',
                    'padding-left': '15px',
                    'padding-right': '15px'
                });
            }

            const $record = this.$el.closest('.record');
            if ($record.length) {
                $record.css({
                    'max-width': '100%',
                    'width': '100%'
                });
            }

            const $main = this.$el.closest('.main-element');
            if ($main.length) {
                $main.css({
                    'max-width': '100%',
                    'width': '100%'
                });
            }

            const $middle = this.$el.closest('.middle');
            if ($middle.length) {
                $middle.css({
                    'max-width': '100%',
                    'width': '100%'
                });
            }

            const $container = this.$el.closest('.container');
            if ($container.length) {
                $container.css({
                    'width': '100%',
                    'max-width': '100%'
                });
            }

            const $containerFluid = this.$el.closest('.container-fluid');
            if ($containerFluid.length) {
                $containerFluid.css({
                    'width': '100%',
                    'max-width': '100%'
                });
            }
        },

        // Что это: добавляет CSS для двухколоночного detail view.
        // Зачем: на этом этапе держим всё в одном js-файле без отдельного css.
        injectCustomStyle_: function () {
            if (document.getElementById('ceingangsrechnungimport-detail-style')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'ceingangsrechnungimport-detail-style';
            style.textContent = `
                .page-header,
                .record {
                    max-width: 100% !important;
                }

                .record .middle {
                    max-width: 100% !important;
                }

                .record .main-element {
                    max-width: 100% !important;
                    width: 100% !important;
                }

                .record .detail-layout {
                    max-width: 100% !important;
                    width: 100% !important;
                }

                .record .panel {
                    max-width: 100%;
                }

                .cei-import-split {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) minmax(760px, 45%);
                    gap: 20px;
                    align-items: start;
                    width: 100%;
                    max-width: 100%;
                }

                .cei-import-left {
                    min-width: 0;
                    width: 100%;
                }

                .cei-import-right {
                    min-width: 0;
                    width: 100%;
                    position: sticky;
                    top: 20px;
                }

                .cei-import-left .panel,
                .cei-import-right .panel {
                    width: 100% !important;
                    max-width: 100% !important;
                }

                .cei-import-left .panel-body,
                .cei-import-right .panel-body {
                    width: 100%;
                }

                .cei-import-right .panel {
                    margin-bottom: 15px;
                }

                .cei-import-file-box {
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 12px;
                }

                .cei-import-file-fields {
                    display: block;
                    margin-bottom: 15px;
                }

                .cei-import-file-fields .cell,
                .cei-import-file-fields [data-name="originalFile"],
                .cei-import-file-fields [data-name="originalFileName"] {
                    display: block !important;
                    width: 100% !important;
                    float: none !important;
                    clear: both !important;
                    max-width: 100% !important;
                    margin-bottom: 10px;
                }

                .cei-import-preview-box {
                    display: block;
                    width: 100%;
                    clear: both;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    overflow: hidden;
                    background: #fafafa;
                    min-height: 420px;
                }

                .cei-import-preview-empty {
                    color: #777;
                    font-style: italic;
                    padding: 18px;
                }

                .cei-import-preview-frame {
                    width: 100%;
                    height: calc(100vh - 240px);
                    min-height: 700px;
                    border: 0;
                    background: #fff;
                }

                .cei-import-preview-image-wrap {
                    padding: 10px;
                    text-align: center;
                    background: #fff;
                }

                .cei-import-preview-image {
                    max-width: 100%;
                    height: auto;
                    display: inline-block;
                }

                .cei-import-left,
                .cei-import-right {
                    display: block;
                    box-sizing: border-box;
                }

                .cei-import-left > * ,
                .cei-import-right > * {
                    width: 100%;
                    box-sizing: border-box;
                }

                .cei-import-left {
                    justify-self: stretch;
                }

                .cei-import-right {
                    justify-self: stretch;
                }

                .detail-layout > .cei-import-split {
                    width: 100% !important;
                    max-width: 100% !important;
                }

                .cei-import-field-row {
                    display: block;
                    width: 100%;
                    clear: both;
                }

                .cei-import-left .record-side,
                .cei-import-left .side,
                .cei-import-left .side-panel,
                .cei-import-left .panel[data-name="side"],
                .cei-import-left .panel[data-name="default-side"],
                .cei-import-left .panel[data-name="createdInfo"] {
                    display: none !important;
                }

                .cei-import-left .record-grid {
                    display: block !important;
                    width: 100% !important;
                    max-width: 100% !important;
                }

                .cei-import-left .record-grid > .left {
                    display: block !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    min-width: 0 !important;
                }

                .cei-import-left .record-grid > .left > .middle,
                .cei-import-left .record-grid > .left > .extra,
                .cei-import-left .record-grid > .left > .bottom {
                    width: 100% !important;
                    max-width: 100% !important;
                }

                .cei-import-left .record-grid > .side {
                    display: none !important;
                    width: 0 !important;
                    min-width: 0 !important;
                    max-width: 0 !important;
                    overflow: hidden !important;
                }

                @media (max-width: 1200px) {
                    .cei-import-split {
                        display: block;
                    }

                    .cei-import-left,
                    .cei-import-right {
                        width: 100% !important;
                        position: static;
                    }

                    .cei-import-preview-frame {
                        height: 500px;
                        min-height: 500px;
                    }
                }
            `;
            document.head.appendChild(style);
        },

        // Что это: создаёт двухколоночный layout.
        // Зачем: берёт уже готовый стандартный content detail view целиком,
        // переносит его в левую колонку без разборки на panel/row/cell,
        // а справа создаёт отдельный блок документа.
        buildSplitLayout_: function () {
            if (this.$el.find('.cei-import-split').length) {
                return;
            }

            const $layoutRoot =
                this.$el.find('.detail-layout').first().length
                    ? this.$el.find('.detail-layout').first()
                    : this.$el;

            // Что это: берём весь уже существующий контент карточки.
            // Зачем: переносим его как есть, не ломая внутреннюю структуру Espo.
            const $existingChildren = $layoutRoot.children().toArray();

            if (!$existingChildren.length) {
                return;
            }

            const $split = $('<div class="cei-import-split"></div>');
            const $left = $('<div class="cei-import-left"></div>');
            const $right = $('<div class="cei-import-right"></div>');

            $split.append($left).append($right);

            // Сначала очищаем корень layout и вставляем новый split-контейнер.
            $layoutRoot.empty();
            $layoutRoot.append($split);

            // Теперь переносим весь прежний content целиком в левую колонку.
            $existingChildren.forEach(function (node) {
                $left.append($(node));
            });

            const $docPanel = $(`
                <div class="panel panel-default cei-import-doc-panel">
                    <div class="panel-heading">
                        <h4 class="panel-title">Dokument</h4>
                    </div>
                    <div class="panel-body">
                        <div class="cei-import-file-box">
                            <div class="cei-import-file-fields"></div>
                            <div class="cei-import-preview-box">
                                <div class="cei-import-preview-empty">Kein Dokument hochgeladen.</div>
                            </div>
                        </div>
                    </div>
                </div>
            `);

            $right.append($docPanel);

            const $fieldsTarget = $docPanel.find('.cei-import-file-fields');

            const $fileCell = this.findFieldCell_('originalFile');
            const $fileNameCell = this.findFieldCell_('originalFileName');

            if ($fileCell.length) {
                $fieldsTarget.append($('<div class="cei-import-field-row"></div>').append($fileCell));
            }

            if ($fileNameCell.length) {
                $fieldsTarget.append($('<div class="cei-import-field-row"></div>').append($fileNameCell));
            }
        },

        // Что это: рисует PDF или изображение в правом блоке.
        // Зачем: пользователь должен видеть оригинал документа рядом с формой.
        renderDocumentPreview_: function () {
            const $previewBox = this.$el.find('.cei-import-preview-box');

            if (!$previewBox.length) {
                return;
            }

            const fileData = this.model.get('originalFile');

            // Что это: если Espo не держит file data в самом поле, пробуем служебные атрибуты.
            // Зачем: у разных типов/file-полей структура может немного отличаться.
            const fileId =
                this.model.get('originalFileId') ||
                (fileData && fileData.id) ||
                null;

            const fileName =
                this.model.get('originalFileName') ||
                (fileData && fileData.name) ||
                '';

            if (!fileId) {
                $previewBox.html('<div class="cei-import-preview-empty">Kein Dokument hochgeladen.</div>');
                return;
            }

            const ext = this.getFileExtension_(fileName);
            const url = '?entryPoint=download&id=' + encodeURIComponent(fileId);

            if (ext === 'pdf') {
                $previewBox.html(
                    '<iframe class="cei-import-preview-frame" src="' + _.escape(url) + '"></iframe>'
                );
                return;
            }

            if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
                $previewBox.html(
                    '<div class="cei-import-preview-image-wrap">' +
                    '<img class="cei-import-preview-image" src="' + _.escape(url) + '" alt="' + _.escape(fileName || 'Dokument') + '">' +
                    '</div>'
                );
                return;
            }

            $previewBox.html(
                '<div class="cei-import-preview-empty">' +
                'Vorschau für diesen Dateityp nicht verfügbar. ' +
                '<a href="' + _.escape(url) + '" target="_blank" rel="noopener noreferrer">Datei öffnen</a>' +
                '</div>'
            );
        },

        // Что это: определяет расширение файла.
        // Зачем: понять, нужно рисовать iframe, img или просто ссылку.
        getFileExtension_: function (fileName) {
            if (!fileName || typeof fileName !== 'string') {
                return '';
            }

            const parts = fileName.toLowerCase().split('.');
            if (parts.length < 2) {
                return '';
            }

            return parts.pop();
        },

        normalizeEinheit_: function (value) {
            // Что это: нормализация единицы измерения по реальным option-значениям Espo.
            // Зачем: не гадать по надписям в UI, а брать допустимые значения из metadata.

            if (!value) {
                return null;
            }

            const raw = String(value).trim();
            if (!raw) {
                return null;
            }

            const lower = raw.toLowerCase();

            const options =
                this.getMetadata().get(['entityDefs', 'CEingangsrechnungsposition', 'fields', 'einheit', 'options']) || [];

            // Что это: helper для поиска реального option по разным вариантам написания.
            const findAllowed = (candidates) => {
                for (const candidate of candidates) {
                    const found = options.find(opt => String(opt).toLowerCase() === String(candidate).toLowerCase());
                    if (found) {
                        return found;
                    }
                }
                return null;
            };

            const variantsMap = {
                'stk': ['Stk.', 'stk.', 'stk'],
                'stk.': ['Stk.', 'stk.', 'stk'],
                'stück': ['Stk.', 'stk.', 'stk'],
                'stueck': ['Stk.', 'stk.', 'stk'],
                'stück.': ['Stk.', 'stk.', 'stk'],
                'stueck.': ['Stk.', 'stk.', 'stk'],

                'std': ['std', 'Std.', 'std.'],
                'std.': ['std', 'Std.', 'std.'],
                'stunde': ['std', 'Std.', 'std.'],
                'stunden': ['std', 'Std.', 'std.'],
                'h': ['std', 'Std.', 'std.'],

                'm': ['m'],
                'cm': ['cm'],
                'mm': ['mm'],
                'kg': ['kg'],
                'g': ['g'],
                'l': ['l'],

                'm2': ['m²', 'm2', 'qm'],
                'm²': ['m²', 'm2', 'qm'],
                'qm': ['m²', 'm2', 'qm'],

                'm3': ['m³', 'm3', 'cbm'],
                'm³': ['m³', 'm3', 'cbm'],
                'cbm': ['m³', 'm3', 'cbm'],

                'rol': ['Rol.', 'rol.', 'rol'],
                'rol.': ['Rol.', 'rol.', 'rol'],
                'rolle': ['Rol.', 'rol.', 'rol'],
                'rollen': ['Rol.', 'rol.', 'rol'],

                'pkg': ['Pkg.', 'pkg.', 'pkg'],
                'pkg.': ['Pkg.', 'pkg.', 'pkg'],
                'paket': ['Pkg.', 'pkg.', 'pkg'],
                'pakete': ['Pkg.', 'pkg.', 'pkg'],

                'dos': ['Dos.', 'dos.', 'dos'],
                'dos.': ['Dos.', 'dos.', 'dos'],
                'dose': ['Dos.', 'dos.', 'dos'],
                'dosen': ['Dos.', 'dos.', 'dos'],

                'ktn': ['Ktn.', 'ktn.', 'ktn'],
                'ktn.': ['Ktn.', 'ktn.', 'ktn'],
                'karton': ['Ktn.', 'ktn.', 'ktn'],
                'kartons': ['Ktn.', 'ktn.', 'ktn'],

                'satz': ['Satz', 'satz'],
                'set': ['Satz', 'satz'],

                've': ['VE', 've'],
                'd': ['d'],
                'tag': ['tag', 'd'],
                'tage': ['tag', 'd'],
                'paar': ['Paar', 'paar'],
                'monat': ['monat'],
                'monate': ['monat'],
                'jahr': ['jahr'],
                'jahre': ['jahr'],
                'pausch': ['pausch'],
                'pausch.': ['pausch'],
                'pauschal': ['pausch'],
                'vpe': ['vpe'],
                'lfdm': ['lfdm'],
                'lfd m': ['lfdm'],
                'laufender meter': ['lfdm'],
                'einht': ['einht'],
                'einheit': ['einht'],
                'km': ['Km', 'km']
            };

            if (variantsMap[lower]) {
                const found = findAllowed(variantsMap[lower]);
                if (found) {
                    return found;
                }
            }

            // Если AI уже вернул точное допустимое значение Espo — принимаем как есть.
            const direct = findAllowed([raw]);
            if (direct) {
                return direct;
            }

            console.warn('Einheit nicht erkannt.', {
                input: raw,
                allowedOptions: options
            });

            return null;
        },

        // Что это: ищет ячейку поля по имени.
        // Зачем: переносим уже отрендеренные поля, а не создаём их заново.
        findFieldCell_: function (fieldName) {
            let $cell = this.$el.find('.cell[data-name="' + fieldName + '"]').first();

            if ($cell.length) {
                return $cell;
            }

            $cell = this.$el.find('[data-name="' + fieldName + '"]').filter('.cell').first();

            if ($cell.length) {
                return $cell;
            }

            const $field = this.$el.find('[data-name="' + fieldName + '"]').first();

            if ($field.length) {
                const $closestCell = $field.closest('.cell');
                if ($closestCell.length) {
                    return $closestCell;
                }
            }

            return $();
        }
    });
});