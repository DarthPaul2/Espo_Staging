// client/custom/src/views/user/record/list.js
// Что это:
// Custom List View für User.
//
// Зачем:
// Inaktive Benutzer (isActive = false, z.B. ausgeschiedene Mitarbeiter) werden
// in der Liste blass/verblasst dargestellt, damit sie auf einen Blick von
// aktiven Mitarbeitern zu unterscheiden sind.

define('custom:views/user/record/list', ['views/user/record/list'], function (Dep) {

    return Dep.extend({

        afterRender: function () {
            Dep.prototype.afterRender.call(this);

            const run = () => {
                this.ensureStyles_();
                this.decorateRows_();
            };

            run();
            window.requestAnimationFrame(run);
            setTimeout(run, 50);
            setTimeout(run, 200);
        },

        decorateRows_: function () {
            if (!this.collection || !this.collection.models) {
                return;
            }

            this.collection.models.forEach((model) => {
                const id = model.id;

                if (!id) {
                    return;
                }

                const $row = this.findRowById_(id);

                if (!$row || !$row.length) {
                    return;
                }

                $row.toggleClass('kb-user-inactive-row', !model.get('isActive'));

                if (model.get('userName') === 'rechnungserinnerungen') {
                    $row.addClass('kb-user-system-row');
                    $row.attr('title', 'Technischer Systembenutzer — nicht verändern oder deaktivieren.');
                }
            });
        },

        findRowById_: function (id) {
            let $row = this.$el.find('tr[data-id="' + id + '"]').first();

            if ($row.length) {
                return $row;
            }

            const $link = this.$el.find('a[href="#User/view/' + id + '"]').first();

            if ($link.length) {
                return $link.closest('tr');
            }

            return $();
        },

        ensureStyles_: function () {
            if (document.getElementById('kb-user-list-styles')) {
                return;
            }

            const style = document.createElement('style');
            style.id = 'kb-user-list-styles';

            style.textContent = `
                .kb-user-inactive-row {
                    opacity: 0.5;
                }

                .kb-user-inactive-row:hover {
                    opacity: 0.75;
                }

                .kb-user-system-row td {
                    background: #fdeef2 !important;
                }

                .kb-user-system-row:hover td {
                    background: #fbe2e9 !important;
                }
            `;

            document.head.appendChild(style);
        }
    });
});
