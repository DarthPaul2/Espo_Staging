// custom:c-stundenbericht/record/detail
console.log('[LOAD] custom:views/c-stundenbericht/record/detail');

define('custom:views/c-stundenbericht/record/detail', ['views/record/detail'], function (Dep) {

    return Dep.extend({

        FLASK_URL: 'https://klesec.pagekite.me/api/espo/stundenbericht/pdf_erzeugen',

        setup: function () {
            Dep.prototype.setup.call(this);

            // кнопка
            this.buttonList = this.buttonList || [];
            this.buttonList.push({
                name: 'pdfErzeugen',
                label: 'PDF erzeugen',
                style: 'primary',
                title: 'PDF erzeugen'
            });

            // 1) слушаем и accountId, и accountName (в Espo иногда меняется только Name в UI)
            this.listenTo(this.model, 'change:accountId', this.onAccountChanged, this);
            this.listenTo(this.model, 'change:accountName', this.onAccountChanged, this);

            // 2) если запись уже открылась и account уже выбран — подтянем сразу
            this.once('after:render', function () {
                if (this.model.get('accountId')) {
                    this.onAccountChanged();
                }
            }, this);
        },


        onAccountChanged: function () {
            const accountId = this.model.get('accountId');

            console.log('[CStundenbericht/detail] account changed →', accountId);

            if (!accountId) {
                this.model.set({ kundeStrasse: '', kundeOrt: '' });
                return;
            }

            Espo.Ajax.getRequest('Account/' + encodeURIComponent(accountId))
                .then((acc) => {
                    if (!acc) return;

                    const street = (acc.billingAddressStreet || '').trim();
                    const postal = (acc.billingAddressPostalCode || '').trim();
                    const city = (acc.billingAddressCity || '').trim();
                    const ort = [postal, city].filter(Boolean).join(', ');

                    console.log('[CStundenbericht/detail] address fetched:', { street, ort });

                    this.model.set({
                        kundeStrasse: street,
                        kundeOrt: ort
                    });

                })
                .catch((e) => {
                    console.error('[CStundenbericht/detail] Account fetch FAILED', e);
                    Espo.Ui.error('Account-Adresse konnte nicht geladen werden (siehe Konsole).');
                });
        },

        actionPdfErzeugen: function () {
            const model = this.model;

            // helpers
            const s = (v) => (v === null || v === undefined) ? '' : String(v);
            const b = (v) => !!v;

            // --- 1) Собираем formData идентично Logcat ---
            const formData = {
                kunde_name: s(model.get('accountName')),
                kunde_strasse: s(model.get('kundeStrasse')),
                kunde_ort: s(model.get('kundeOrt')),

                objekt: s(model.get('objektName')),
                objekt_strasse: s(model.get('objektStrasse')),
                objekt_ort: s(model.get('objektOrt')),

                vorgangsnummer: s(model.get('vorgangsnummer')),
                anlagennummer: s(model.get('anlagennummer')),

                ausgefuhrte_arbeiten: s(model.get('ausgefuhrteArbeiten')),

                auftrag: b(model.get('auftrag')),
                zusatzliche_arbeiten: b(model.get('zusatzlicheArbeiten')),

                bma: b(model.get('anlageBma')),
                ema: b(model.get('anlageEma')),
                uma: b(model.get('anlageUma')),
                video: b(model.get('anlageVideo')),
                zk: b(model.get('anlageZk')),
                funk: b(model.get('anlageFunk')),

                einsatzbeginn: s(model.get('einsatzbeginn')),
                person_name: s(model.get('notdienstAnruferName')),
                person_telefonnummer: s(model.get('notdienstAnruferTelefon')),

                monday: b(model.get('tagMontag')),
                tuesday: b(model.get('tagDienstag')),
                wednesday: b(model.get('tagMittwoch')),
                thursday: b(model.get('tagDonnerstag')),
                friday: b(model.get('tagFreitag')),
                saturday: b(model.get('tagSamstag')),
                sunday: b(model.get('tagSonntag')),

                abgeschlossen: b(model.get('auftragAbgeschlossen')),
                restarbeiten: b(model.get('restarbeiten')),
                neuer_termin: b(model.get('neuerTermin')),

                bemerkung: s(model.get('bemerkung')),
                datum_unterschrift: s(model.get('datumUnterschrift')),

                techniker: [],
                materialien: []
            };

            // --- Techniker[0..4] ---
            for (let i = 1; i <= 5; i++) {
                const datum = model.get(`techniker${i}Datum`);
                const fahrzeit = model.get(`techniker${i}Fahrzeit`);
                const arbeitszeit = model.get(`techniker${i}Arbeitszeit`);
                const kilometer = model.get(`techniker${i}Kilometer`);

                const technikerName = model.get(`stundenberichteTechniker${i}Name`);

                if (datum || fahrzeit || arbeitszeit || kilometer || technikerName) {
                    formData.techniker.push({
                        datum: s(datum),
                        fahrzeit: s(fahrzeit),
                        arbeitszeit: s(arbeitszeit),
                        kilometer: s(kilometer),
                        techniker_name: s(technikerName)
                    });
                }
            }

            // --- Materialien[0..7] ---
            for (let i = 1; i <= 8; i++) {
                const menge = model.get(`material${i}Menge`);
                const name = model.get(`material${i}Name`);
                const best = model.get(`material${i}Bestellnr`);

                if (menge || name || best) {
                    formData.materialien.push({
                        stuckzahl: s(menge),
                        name: s(name),
                        bestellnummer: s(best)
                    });
                }
            }

            // (опционально) сохранить JSON в поле (но без автологики ты можешь это убрать)
            model.set('formDataJson', JSON.stringify(formData));
            // model.save(); // не обязательно

            const payload = {
                c_stundenbericht_id: model.id,
                form_data: formData
            };

            const notifyId = this.notify('PDF wird erzeugt…', 'loading');

            fetch(this.FLASK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
                .then(async (r) => {
                    const resp = await r.json().catch(() => null);

                    this.notify(false, 'loading', notifyId);

                    if (!r.ok || !resp || !resp.ok) {
                        Espo.Ui.error((resp && resp.error) ? resp.error : ('PDF Fehler (HTTP ' + r.status + ')'));
                        return;
                    }

                    Espo.Ui.success('PDF erzeugt');
                    this.model.fetch();
                })
                .catch((err) => {
                    this.notify(false, 'loading', notifyId);
                    Espo.Ui.error('Serverfehler beim PDF-Erzeugen');
                    console.error(err);
                });


        }

    });
});
