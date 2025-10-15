define('custom:views/c-auftrag/record/relationship-row-actions-no-delete',
    ['views/record/row-actions/relationship'],
    function (Parent) {

        return Parent.extend({

            setup: function () {
                Parent.prototype.setup.call(this);
                console.log('[CAuftrag] custom relationship row-actions loaded (final)');
            },

            getActionList: function () {
                const list = Parent.prototype.getActionList.call(this) || [];
                // убираем только Löschen (removeRelated)
                const filtered = list.filter(a => a?.action !== 'removeRelated');
                console.log('[CAuftrag] filtered actions:', filtered.map(x => x.action));
                return filtered;
            }
        });
    });
