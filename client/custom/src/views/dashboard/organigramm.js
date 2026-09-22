// custom:views/dashboard/organigramm
// Что это:
// Dashboard-Dashlet "Organigramm 2030" (AW-Bianca-Gerd Punkt 16, 22.09.2026).
// Zeigt die von Tobias freigegebene Organisationsstruktur (organigram V3.png,
// Stand 16.09.2026) live aus CRollenkatalog (Feld "bereich") und CRollenzuordnung
// (wer die Rolle aktuell tatsächlich innehat) - keine statische Grafik, sondern
// echte Espo-Daten, damit die Anzeige nie veraltet.

Espo.define('custom:views/dashboard/organigramm', ['view'], function (Dep) {

    // Gleiche Reihenfolge/Gruppierung wie auf der freigegebenen Grafik.
    var BEREICHE = [
        {code: 'verkaufMarketing', label: 'Verkauf & Marketing', farbe: '#2e8b57', hell: '#eaf7ef'},
        {code: 'technikService', label: 'Technik & Service', farbe: '#3d8fc7', hell: '#eaf4fb'},
        {code: 'backOffice', label: 'Back Office', farbe: '#c0504d', hell: '#fbeaea'},
        {code: 'itDigitalisierung', label: 'IT & Digitalisierung', farbe: '#6b4d9e', hell: '#f2edf8'}
    ];

    // R-07 wird auf der freigegebenen Grafik bewusst dreistellig als "R-007" geschrieben
    // (Pavels ausdrückliche Vorgabe, kein Tippfehler) - der Rollencode in Espo selbst bleibt
    // aus technischen Gründen zweistellig (Feldformat R-XX), nur die Anzeige hier weicht ab.
    var CODE_ANZEIGE_UEBERSCHREIBUNG = {
        'R-07': 'R-007'
    };

    return Dep.extend({

        name: 'organigramm',
        template: 'custom:dashboard/organigramm',

        getTitle: function () {
            return 'Organigramm 2030';
        },

        getColor: function () {
            return 'default';
        },

        getActionItemDataList: function () {
            return [];
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this.ladeUndRendereOrganigramm_();
        },

        ladeUndRendereOrganigramm_: function () {
            Promise.all([
                Espo.Ajax.getRequest('CRollenkatalog', {
                    select: 'id,name,rollencode,bereich,aktiv',
                    orderBy: 'rollencode',
                    maxSize: 200
                }),
                Espo.Ajax.getRequest('CRollenzuordnung', {
                    select: 'rolleId,inhaberId,inhaberName,status',
                    maxSize: 200
                })
            ]).then(function (results) {
                var rollen = ((results[0] && results[0].list) || []).filter(function (r) {
                    return r.aktiv !== false;
                });
                var zuordnungen = ((results[1] && results[1].list) || []).filter(function (z) {
                    return z.status === 'aktiv';
                });

                var inhaberJeRolle = {};
                zuordnungen.forEach(function (z) {
                    if (!z.rolleId) {
                        return;
                    }
                    inhaberJeRolle[z.rolleId] = inhaberJeRolle[z.rolleId] || [];
                    if (z.inhaberName) {
                        inhaberJeRolle[z.rolleId].push(z.inhaberName);
                    }
                });

                this.rendereGrid_(rollen, inhaberJeRolle);
            }.bind(this)).catch(function () {
                Espo.Ui.error('Organigramm konnte nicht geladen werden.');
            });
        },

        rendereGrid_: function (rollen, inhaberJeRolle) {
            var $root = this.$el || $(this.el);
            var $ges = $root.find('[data-name="ges-block"]');
            var $stab = $root.find('[data-name="stab-block"]');
            var $grid = $root.find('[data-name="bereiche-grid"]');

            if (!$grid.length) {
                return;
            }

            var self = this;

            function zeileHtml(rolle) {
                var inhaber = inhaberJeRolle[rolle.id] || [];
                var inhaberText = inhaber.length ? inhaber.join(', ') : 'unbesetzt';
                var code = CODE_ANZEIGE_UEBERSCHREIBUNG[rolle.rollencode] || rolle.rollencode;

                return (
                    '<div class="og-zeile">' +
                        '<div class="og-zeile-kopf">' +
                            '<span class="og-code">' + self.escape_(code) + '</span>' +
                            '<span class="og-name">' + self.escape_(rolle.name) + '</span>' +
                        '</div>' +
                        '<span class="og-inhaber' + (inhaber.length ? '' : ' og-unbesetzt') + '">' +
                            self.escape_(inhaberText) +
                        '</span>' +
                    '</div>'
                );
            }

            // Geschäftsführung (R-01) + Assistenz (R-02) oben.
            var gfRollen = rollen.filter(function (r) { return r.bereich === 'geschaeftsfuehrung'; });
            var r01 = gfRollen.filter(function (r) { return r.rollencode === 'R-01'; })[0];
            var r02 = gfRollen.filter(function (r) { return r.rollencode === 'R-02'; })[0];

            var gesHtml = '';
            if (r02) {
                gesHtml += '<div class="og-r02">' + zeileHtml(r02) + '</div>';
            }
            if (r01) {
                var r01Inhaber = (inhaberJeRolle[r01.id] || []).join(', ') || 'unbesetzt';
                gesHtml +=
                    '<div class="og-r01">' +
                        '<div class="og-r01-code">' + self.escape_(r01.rollencode) + '</div>' +
                        '<div class="og-r01-name">' + self.escape_(r01Inhaber) + '</div>' +
                        '<div class="og-r01-rolle">' + self.escape_(r01.name) + '</div>' +
                    '</div>';
            }
            $ges.html(gesHtml);

            // Stabsstellen (Qualität, Recht) oben rechts.
            var qualRollen = rollen.filter(function (r) { return r.bereich === 'stabsstelleQualitaet'; });
            var rechtRollen = rollen.filter(function (r) { return r.bereich === 'stabsstelleRecht'; });

            var stabHtml =
                '<div class="og-stab og-stab-qualitaet">' +
                    '<div class="og-stab-titel">Stabsstelle Qualität</div>' +
                    qualRollen.map(zeileHtml).join('') +
                '</div>' +
                '<div class="og-stab og-stab-recht">' +
                    '<div class="og-stab-titel">Stabsstelle Recht</div>' +
                    rechtRollen.map(zeileHtml).join('') +
                '</div>';
            $stab.html(stabHtml);

            // Die 4 Hauptbereiche.
            var gridHtml = BEREICHE.map(function (bereich) {
                var bereichRollen = rollen.filter(function (r) { return r.bereich === bereich.code; });

                return (
                    '<div class="og-bereich" style="border-color: ' + bereich.farbe + ';">' +
                        '<div class="og-bereich-kopf" style="background: ' + bereich.farbe + ';">' +
                            self.escape_(bereich.label) +
                        '</div>' +
                        '<div class="og-bereich-body" style="background: ' + bereich.hell + ';">' +
                            bereichRollen.map(zeileHtml).join('') +
                        '</div>' +
                    '</div>'
                );
            }).join('');

            $grid.html(gridHtml);
        },

        escape_: function (text) {
            return $('<div>').text(text == null ? '' : text).html();
        }

    });
});
