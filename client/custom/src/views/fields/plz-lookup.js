Espo.define('custom:views/fields/plz-lookup', ['views/fields/varchar'], function (Dep) {

    // Wunsch von Bianca Rally (KUG-Wertschöpfungsprozess): Ort/Bundesland sollen sich schon
    // WÄHREND der Eingabe der PLZ füllen, nicht erst nach dem Speichern (siehe beforeSave-Hooks
    // Account/CObjekt/CLieferant PlzAutoFill.php — dieselbe lokale Zuordnungstabelle, hier über
    // den Endpoint GET PlzLookup?plz=... abgefragt). Füllt nur leere Zielfelder.
    // Console-Logs bewusst drin gelassen (Debug auf Wunsch von Pavel, 01.09.2026).
    var ZIEL_FELDER = {
        'cPLZ': {stadt: 'cOrt', land: 'cBundesland', staat: 'cLand'},
        'plz': {stadt: 'ort', land: 'bundesland', staat: 'land'},
    };

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            this.plzLookupLetzterWert = null;
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            console.log('[plz-lookup] plz-lookup afterRender, name=' + this.name + ', mode=' + this.mode);

            if (this.mode !== 'edit') {
                return;
            }

            var ziel = ZIEL_FELDER[this.name];

            if (!ziel) {
                console.log('[plz-lookup] Feldname nicht in ZIEL_FELDER, breche ab:', this.name);
                return;
            }

            var $input = this.$el.find('input');
            console.log('[plz-lookup] gefundene Inputs (' + $input.length + ') für ' + this.name);

            if (!$input.length) {
                console.warn('[plz-lookup] Kein Input-Element gefunden für ' + this.name);
                return;
            }

            $input.on('blur.plzLookup keyup.plzLookup', function () {
                var plz = ($input.val() || '').trim();
                console.log('[plz-lookup] Event ausgelöst (' + this.name + '), aktueller Wert="' + plz + '"');
                this.plzNachschlagen(ziel, plz);
            }.bind(this));
        },

        plzNachschlagen: function (ziel, wert) {
            var plz = (wert || '').trim();

            if (!/^\d{5}$/.test(plz)) {
                console.log('[plz-lookup] Kein gültiges 5-stelliges PLZ-Format, breche ab:', plz);
                return;
            }

            if (plz === this.plzLookupLetzterWert) {
                console.log('[plz-lookup] Gleicher Wert wie zuletzt, breche ab:', plz);
                return;
            }

            this.plzLookupLetzterWert = plz;

            var stadtLeer = !this.model.get(ziel.stadt);
            var landLeer = !this.model.get(ziel.land);
            var staatLeer = !this.model.get(ziel.staat);

            console.log('[plz-lookup] stadtLeer=' + stadtLeer + ' landLeer=' + landLeer + ' staatLeer=' + staatLeer + ' -> rufe PlzLookup?plz=' + plz);

            if (!stadtLeer && !landLeer && !staatLeer) {
                console.log('[plz-lookup] Alle Zielfelder bereits gefüllt, kein Überschreiben.');
                return;
            }

            if (staatLeer) {
                this.model.set(ziel.staat, 'Deutschland');
                console.log('[plz-lookup] gesetzt: ' + ziel.staat + ' = Deutschland');
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
                    this.model.set(ziel.stadt, daten.ort);
                    console.log('[plz-lookup] gesetzt: ' + ziel.stadt + ' = ' + daten.ort);
                }

                if (landLeer && daten.bundesland) {
                    this.model.set(ziel.land, daten.bundesland);
                    console.log('[plz-lookup] gesetzt: ' + ziel.land + ' = ' + daten.bundesland);
                }
            }.bind(this)).catch(function (e) {
                console.warn('[plz-lookup] Fehler beim Request:', e);
            });
        },
    });
});
