Espo.define('custom:views/fields/address-plz-lookup', ['views/fields/address'], function (Dep) {

    // Für zusammengesetzte Adress-Felder (Account.billingAddress/shippingAddress) — im
    // Unterschied zu plz-lookup.js (einzelne varchar-Felder bei CObjekt/CLieferant) rendert
    // Espo hier street/city/state/country/postalCode als EIN Widget, kein eigenständiges
    // Feld pro Attribut. Console-Logs bewusst drin gelassen (Debug auf Wunsch von Pavel,
    // 01.09.2026) — bei Problemen bitte Browser-Konsole prüfen und mir die Ausgabe schicken.
    var ZIEL_FELDER_PRAEFIX = ['billingAddress', 'shippingAddress'];

    return Dep.extend({

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            console.log('[plz-lookup] address-plz-lookup afterRender, name=' + this.name + ', mode=' + this.mode);

            if (this.mode !== 'edit') {
                return;
            }

            if (ZIEL_FELDER_PRAEFIX.indexOf(this.name) === -1) {
                console.log('[plz-lookup] Feldname nicht in ZIEL_FELDER_PRAEFIX, breche ab:', this.name);
                return;
            }

            var alleInputs = this.$el.find('input');
            console.log('[plz-lookup] gefundene Inputs im Adressblock (' + alleInputs.length + '):');
            alleInputs.each(function () {
                console.log('  - name="' + ($(this).attr('name') || '') + '" data-name="' + ($(this).data('name') || '') + '"');
            });

            var $plzInput = this.$el.find('input[data-name="postalCode"]');
            if (!$plzInput.length) {
                $plzInput = this.$el.find('input[name="postalCode"]');
            }
            if (!$plzInput.length) {
                $plzInput = this.$el.find('input[data-name="' + this.name + 'PostalCode"]');
            }
            if (!$plzInput.length) {
                $plzInput = this.$el.find('input[name="' + this.name + 'PostalCode"]');
            }

            console.log('[plz-lookup] PLZ-Input gefunden?', $plzInput.length > 0, $plzInput);

            if (!$plzInput.length) {
                console.warn('[plz-lookup] Kein PLZ-Input gefunden für ' + this.name + ' — Selektoren stimmen nicht, bitte Pavel die obige Input-Liste schicken.');
                return;
            }

            var stadtFeld = this.subFieldMap ? this.subFieldMap['city'] : (this.name + 'City');
            var landFeld = this.subFieldMap ? this.subFieldMap['state'] : (this.name + 'State');
            var staatFeld = this.subFieldMap ? this.subFieldMap['country'] : (this.name + 'Country');

            console.log('[plz-lookup] Zielfelder: stadtFeld=' + stadtFeld + ', landFeld=' + landFeld + ', staatFeld=' + staatFeld);

            $plzInput.on('blur.plzLookup keyup.plzLookup', function () {
                var plz = ($plzInput.val() || '').trim();
                console.log('[plz-lookup] Event ausgelöst, aktueller Wert="' + plz + '"');
                this.plzNachschlagen(stadtFeld, landFeld, staatFeld, plz);
            }.bind(this));
        },

        plzLookupLetzterWert: null,

        plzNachschlagen: function (stadtFeld, landFeld, staatFeld, wert) {
            var plz = (wert || '').trim();

            if (!/^\d{5}$/.test(plz)) {
                console.log('[plz-lookup] Kein gültiges 5-stelliges PLZ-Format, breche ab:', plz);
                return;
            }

            if (plz === this.plzLookupLetzterWert) {
                console.log('[plz-lookup] Gleicher Wert wie zuletzt, breche ab (kein Doppel-Request):', plz);
                return;
            }

            this.plzLookupLetzterWert = plz;

            var stadtLeer = !this.model.get(stadtFeld);
            var landLeer = !this.model.get(landFeld);
            var staatLeer = !this.model.get(staatFeld);

            console.log('[plz-lookup] stadtLeer=' + stadtLeer + ' landLeer=' + landLeer + ' staatLeer=' + staatLeer + ' -> rufe PlzLookup?plz=' + plz);

            if (!stadtLeer && !landLeer && !staatLeer) {
                console.log('[plz-lookup] Alle Zielfelder bereits gefüllt, kein Überschreiben.');
                return;
            }

            if (staatLeer) {
                this.model.set(staatFeld, 'Deutschland');
                console.log('[plz-lookup] gesetzt: ' + staatFeld + ' = Deutschland');
            }

            if (!stadtLeer && !landLeer) {
                return;
            }

            Espo.Ajax.getRequest('PlzLookup', {plz: plz}).then(function (daten) {
                console.log('[plz-lookup] Antwort vom Server:', daten);

                if (!daten) {
                    return;
                }

                if (stadtLeer && daten.ort) {
                    this.model.set(stadtFeld, daten.ort);
                    console.log('[plz-lookup] gesetzt: ' + stadtFeld + ' = ' + daten.ort);
                }

                if (landLeer && daten.bundesland) {
                    this.model.set(landFeld, daten.bundesland);
                    console.log('[plz-lookup] gesetzt: ' + landFeld + ' = ' + daten.bundesland);
                }
            }.bind(this)).catch(function (e) {
                console.warn('[plz-lookup] Fehler beim Request:', e);
            });
        },
    });
});
