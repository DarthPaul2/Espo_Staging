define('custom:views/c-stundenbericht/record/edit', ['views/record/edit'], function (Dep) {

    console.log('[LOAD] custom:views/c-stundenbericht/record/edit');

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            console.log('[SETUP] CStundenbericht edit setup');

            this.listenTo(this.model, 'change:accountId', this.onAccountChanged, this);
            this.listenTo(this.model, 'change:accountName', this.onAccountChanged, this);

            this.listenTo(this.model, 'change:objektAuswahlId', this.onObjektChanged, this);
            this.listenTo(this.model, 'change:objektAuswahlName', this.onObjektChanged, this);

            this.once('after:render', function () {
                console.log('[AFTER:RENDER] accountId=', this.model.get('accountId'));
                console.log('[AFTER:RENDER] objektAuswahlId=', this.model.get('objektAuswahlId'));

                if (this.model.get('accountId')) {
                    this.onAccountChanged();
                }

                if (this.model.get('objektAuswahlId')) {
                    this.onObjektChanged();
                }
            }, this);
        },

        onAccountChanged: function () {
            const accountId = this.model.get('accountId');

            console.log('[CStundenbericht/edit] account changed →', accountId);

            if (!accountId) {
                this.model.set({
                    kundeStrasse: '',
                    kundeOrt: ''
                });
                return;
            }

            Espo.Ajax.getRequest('Account/' + encodeURIComponent(accountId))
                .then((acc) => {
                    if (!acc) return;

                    const street = (acc.billingAddressStreet || '').trim();
                    const postal = (acc.billingAddressPostalCode || '').trim();
                    const city = (acc.billingAddressCity || '').trim();
                    const ort = [postal, city].filter(Boolean).join(', ');

                    console.log('[CStundenbericht/edit] account fetched:', { street, ort });

                    this.model.set({
                        kundeStrasse: street,
                        kundeOrt: ort
                    });
                })
                .catch((e) => {
                    console.error('[CStundenbericht/edit] Account fetch FAILED', e);
                    Espo.Ui.error('Account-Adresse konnte nicht geladen werden.');
                });
        },

        onObjektChanged: function () {
            const objektId = this.model.get('objektAuswahlId');

            console.log('[CStundenbericht/edit] objekt changed →', objektId);

            if (!objektId) {
                return;
            }

            Espo.Ajax.getRequest('CObjekt/' + encodeURIComponent(objektId))
                .then((obj) => {
                    if (!obj) return;

                    console.log('[CStundenbericht/edit] raw objekt:', obj);

                    const objektName = (obj.name || '').trim();
                    const street = (obj.cStrasseHausnum || '').trim();
                    const postal = (obj.cPLZ || '').trim();
                    const city = (obj.cOrt || '').trim();
                    const ort = [postal, city].filter(Boolean).join(', ');

                    console.log('[CStundenbericht/edit] objekt fetched:', {
                        objektName,
                        street,
                        ort
                    });

                    this.model.set({
                        objektName: objektName,
                        objektStrasse: street,
                        objektOrt: ort
                    });
                })
                .catch((e) => {
                    console.error('[CStundenbericht/edit] Objekt fetch FAILED', e);
                    Espo.Ui.error('Objektdaten konnten nicht geladen werden.');
                });
        }
    });
});