Espo.define('custom:views/opportunity/record/kanban', ['crm:views/opportunity/record/kanban'], function (Dep) {

    // Wunsch von Pavel (01.09.2026): mit 8 Stufen (nach Hinzufügen von "Bestandskunde") passte
    // das Kanban-Board nicht mehr ohne horizontales Scrollen auf den Bildschirm. Standard-Espo
    // nutzt minColumnWidthPx=220 — hier etwas schmaler, nur für Opportunity (Task/andere Kanban-
    // Boards bleiben unverändert bei 220).
    //
    // Wunsch von Bianca Rally (04.09.2026): über den Spalten Anzahl + Summe (€) der jeweiligen
    // Stufe anzeigen. Erster Versuch war, den Text direkt in den Spaltenkopf (th.group-header)
    // zu schreiben — das Farbfeld dort wächst aber nicht mit (starres Grid-Layout von Espo,
    // gemeinsam für ALLE Kanban-Boards), der Text fiel optisch unter die Karten. Stattdessen:
    // eine eigene, unabhängige Zusammenfassungsleiste OBERHALB des ganzen Boards, mit denselben
    // Statusfarben (bg-primary/info/warning/success, Standard-Espo-Klassen) — fasst die
    // bestehende Struktur nicht an, kein Risiko für andere Kanban-Boards.
    var FARBE_MAP = {
        kontaktOffen: 'bg-info',
        interessentAngebotAngefordert: 'bg-primary',
        interessentAngebotInErstellung: 'bg-primary',
        kaeuferAngebotErhalten: 'bg-warning',
        kundeInDisposition: 'bg-success',
        kundeLeistungserbringung: 'bg-success',
        bestandskunde: 'bg-success',
    };

    return Dep.extend({
        minColumnWidthPx: 190,

        setup: function () {
            Dep.prototype.setup.call(this);

            // "change:stage" feuert schon beim Ziehen, bevor der Server die neue Stufe wirklich
            // gespeichert hat — deshalb kleine Verzögerung vor dem Nachladen der Statistik,
            // damit die Speicherung sicher durch ist (kein sauberer "sync"-Event auf der
            // Collection verfügbar für diesen Fall, siehe Versuch mit "sync" am 04.09.2026 —
            // hat gar nicht mehr gefeuert).
            this.listenTo(this.collection, 'change:' + this.statusField, function () {
                setTimeout(function () {
                    this.ladeKanbanStatistik_();
                }.bind(this), 600);
            }.bind(this));
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this.ladeKanbanStatistik_();
            this.aktiviereKlickAufGanzeKarte_();
        },

        // Wunsch von Bianca Rally (19.09.2026, WhatsApp: "wenn ich darein klicke, egal wohin,
        // soll sich das öffnen"). Ursache (per Logauswertung bestätigt, 19.09.2026): Standard-
        // Espo-Kanban macht per "click a.link" NUR den Namen der Karte klickbar — der Rest der
        // Karte (Betrag, Firma, freier Bereich) hat gar keinen Klick-Handler. Auf dem iPad führte
        // ein Tippen daneben dazu, dass nichts passierte bzw. versehentlich der "+"-Button der
        // Spalte getroffen wurde (führte zur leeren "erstellen"-Seite statt zur echten Karte).
        // Fix: zusätzlicher Klick-Handler auf die ganze Karte (".item"), der dieselbe Navigation
        // auslöst wie der Namens-Link — per addEventListener statt Backbone-"events"-Override,
        // damit das bestehende Verhalten (Namens-Link, Drei-Punkte-Menü, Drag-Sortierung) unverändert
        // bleibt und nicht versehentlich überschrieben wird.
        aktiviereKlickAufGanzeKarte_: function () {
            this.$el.off('click.kartenKlick');
            this.$el.on('click.kartenKlick', '.item', function (e) {
                if ($(e.target).closest('a.link, .item-menu-container').length) {
                    return;
                }

                var id = $(e.currentTarget).data('id');

                if (!id) {
                    return;
                }

                var scope = this.getModelScope(id);
                var model = this.collection.get(id);

                this.getRouter().navigate('#' + scope + '/view/' + id, {trigger: false});
                this.getRouter().dispatch(scope, 'view', {id: id, model: model});
            }.bind(this));
        },

        ladeKanbanStatistik_: function () {
            Espo.Ajax.getRequest('OpportunityKanbanStats').then(function (daten) {
                this.zeigeKanbanStatistik_(daten || {});
            }.bind(this)).catch(function () {});
        },

        zeigeKanbanStatistik_: function (daten) {
            var $root = this.$el || $(this.el);
            // Wichtig: NICHT vor .list-kanban-container einfügen, sondern als erstes Kind IN
            // .list-kanban selbst — nur so hat die Leiste dieselbe min-width wie die Spalten
            // und scrollt beim horizontalen Scrollen mit (sonst verschiebt es sich, siehe
            // Biancas iPad-Screenshot vom 04.09.2026).
            var $listKanban = $root.find('.list-kanban').first();

            if (!$listKanban.length) {
                return;
            }

            var reihenfolge = this.getMetadata().get(['entityDefs', 'Opportunity', 'fields', 'stage', 'options']) || [];

            var teile = reihenfolge.map(function (stageName) {
                var eintrag = daten[stageName] || {anzahl: 0, summe: 0};
                var summeFormatted = new Intl.NumberFormat('de-DE', {maximumFractionDigits: 0}).format(eintrag.summe || 0);
                var farbe = FARBE_MAP[stageName] || 'bg-secondary';

                return (
                    '<div class="' + farbe + '" style="min-width:0; padding:4px 6px; border-radius:3px; ' +
                    'text-align:center; font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' +
                    eintrag.anzahl + ' · ' + summeFormatted + ' €' +
                    '</div>'
                );
            });

            // Feste Spaltenanzahl statt grid-auto-columns — sonst ordnet der Browser die Felder
            // uneinheitlich an (teils untereinander statt nebeneinander, beobachtet 04.09.2026).
            // grid-column-gap bewusst identisch zur Espo-Kopfzeile (.kanban-head-container>
            // table>thead tr.kanban-row), damit die Breiten exakt übereinstimmen.
            var html =
                '<div class="opportunity-kanban-stats-bar" style="display:grid; ' +
                'grid-template-columns: repeat(' + reihenfolge.length + ', 1fr); ' +
                'grid-column-gap:var(--padding-base-horizontal); margin-bottom:8px;">' +
                teile.join('') +
                '</div>';

            $root.find('.opportunity-kanban-stats-bar').remove();
            $listKanban.prepend(html);
        },
    });
});
