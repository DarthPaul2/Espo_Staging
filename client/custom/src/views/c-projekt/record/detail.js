// client/custom/src/views/c-projekt/record/detail.js
// Что это:
// Fügt oberhalb des Panels "Projektteamzuordnungen" die Schaltfläche "Techniker finden"
// ein (T4-21-Minimalanbindung) — ruft QualifikationsMatchingResolver::finde() über
// CProjekt.php/action/findeTechniker auf. Gleiches Muster wie "Aus Rechnungen übernehmen"
// auf CAuftrag (client/custom/src/views/c-auftrag/record/detail.js), da der Weg über
// die actionList/Dropdown-Aktionen (views/record/detail-actions) auf CProjekt nicht
// gerendert wurde.
//
// Зачем:
// Pavel wollte den Knopf sichtbar direkt am Team-Panel, nicht versteckt im "..."-Menü.

define('custom:views/c-projekt/record/detail', ['views/record/detail'], function (Dep) {

    return Dep.extend({

        // 17.09.2026, Pavel: beim Speichern mit leerem Pflichtfeld zeigt Espo nur ganz oben
        // ein generisches "Ungültig"-Banner - die eigentliche Meldung existiert bereits als
        // Popover direkt am betroffenen Feld, ist aber unsichtbar, wenn der Nutzer weiter
        // oben im Formular steht. Rein additiv (Dep.prototype.afterNotValid laeuft zuerst
        // unveraendert) - scrollt zusaetzlich zum sichtbar gewordenen Popover.
        afterNotValid: function () {
            Dep.prototype.afterNotValid.call(this);

            setTimeout(() => {
                const popovers = document.querySelectorAll('.popover');
                const popover = popovers.length ? popovers[popovers.length - 1] : null;

                if (popover) {
                    popover.scrollIntoView({behavior: 'smooth', block: 'center'});
                }
            }, 50);
        },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            setTimeout(() => {
                const $panel = this.$el.find('.panel[data-name="projektteamzuordnungen"]').first();

                if (!$panel.length) {
                    return;
                }

                if (this.$el.find('[data-name="projekt-technikerFinden-actions"]').length) {
                    return;
                }

                const $actions = $(
                    '<div data-name="projekt-technikerFinden-actions" style="margin-bottom: 6px;">' +
                        '<button class="btn btn-success" data-action="findeTechniker">' +
                            'Techniker finden' +
                        '</button>' +
                    '</div>'
                );

                $actions.insertBefore($panel);
                $actions.on('click', '[data-action="findeTechniker"]', () => this._openTechnikerFindenModal());
            }, 500);
        },

        _openTechnikerFindenModal: function () {
            this.createView('findeTechnikerModal', 'custom:views/c-projekt/modals/techniker-finden', {
                projektId: this.model.id,
                einsatzTermin: this.model.get('einsatzTermin')
            }, (view) => {
                view.render();

                this.listenToOnce(view, 'team-updated', () => {
                    this.model.fetch({
                        success: () => this.reRender()
                    });
                });
            });
        }

    });
});
