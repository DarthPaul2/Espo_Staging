// client/custom/src/views/user/record/detail.js
// Что это:
// Custom Detail View für User — zeigt im Feld "Personalakte" eine Schaltfläche
// "Personalakte anlegen" an, solange der Benutzer noch keine verknüpfte
// CPersonalakte hat. Nach dem Anlegen verschwindet die Schaltfläche und das
// Feld zeigt den normalen Link zur neuen Personalakte.
//
// Зачем:
// Schiller/Bianca sollen eine Personalakte mit einem Klick anlegen können, statt
// manuell zu CPersonalakte zu wechseln und den Benutzer selbst auszuwählen.
// Für alle anderen Benutzer ist das Feld cPersonalakte ohnehin unsichtbar
// (siehe custom/Espo/Custom/Resources/metadata/entityAcl/User.json), daher
// erscheint dort auch nie eine Schaltfläche.

define('custom:views/user/record/detail', ['views/user/record/detail'], function (Dep) {

    return Dep.extend({

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            this.renderPersonalaktenButton_();

            if (!this._personalaktenListenerAttached_) {
                this._personalaktenListenerAttached_ = true;

                this.listenTo(this.model, 'sync change:cPersonalakteId', () => {
                    this.renderPersonalaktenButton_();
                });
            }
        },

        renderPersonalaktenButton_: function () {
            var $field = this.$el.find('[data-name="cPersonalakte"]');

            if (!$field.length) {
                return;
            }

            if (this.model.get('cPersonalakteId')) {
                return;
            }

            if (!this.getAcl().checkScope('CPersonalakte', 'create')) {
                return;
            }

            if ($field.find('[data-action="createPersonalakte"]').length) {
                return;
            }

            var $noneValue = $field.find('.none-value, .loading-value').first();

            var $button = $(
                '<button type="button" class="btn btn-sm" data-action="createPersonalakte" style="' +
                    'background-color: #d9f2e3; ' +
                    'border: 1px solid #6cc490; ' +
                    'color: #333333; ' +
                    'font-weight: 600; ' +
                    'box-shadow: 0 2px 4px rgba(0,0,0,0.12);' +
                '">' +
                    'Personalakte anlegen' +
                '</button>'
            );

            if ($noneValue.length) {
                $noneValue.replaceWith($button);
            } else {
                $field.find('.field-value, .cell-edit, .cell').first().append($button);
            }

            $field.find('[data-action="createPersonalakte"]').off('click').on('click', () => {
                this.createPersonalakte_();
            });
        },

        createPersonalakte_: function () {
            var userId = this.model.id;

            var $field = this.$el.find('[data-name="cPersonalakte"]');
            $field.find('[data-action="createPersonalakte"]').prop('disabled', true).text('Wird angelegt …');

            Espo.Ajax.postRequest('CPersonalakte', {
                userId: userId
            }).then(() => {
                Espo.Ui.success('Personalakte angelegt.');

                this.model.fetch({
                    success: () => {
                        this.reRender();
                    }
                });
            }).catch(() => {
                Espo.Ui.error('Fehler beim Anlegen der Personalakte.');
                $field.find('[data-action="createPersonalakte"]').prop('disabled', false).text('Personalakte anlegen');
            });
        }
    });
});
