define(['views/list'], function (Dep) {

    return Dep.extend({

        _filterButtons: [
            {name: 'offen',       label: 'Offen',      style: 'primary'},
            {name: 'bezahlt',     label: 'Bezahlt',    style: 'success'},
            {name: 'ueberfaellig', label: 'Überfällig', style: 'danger'},
        ],

        _activeFilter: null,

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this._renderFilterButtons();
        },

        _renderFilterButtons: function () {
            var self = this;
            var $container = $('<div class="kb-preset-buttons" style="margin:0 0 10px 0;display:flex;gap:6px;"></div>');

            this._filterButtons.forEach(function (f) {
                var isActive = self._activeFilter === f.name;
                var $btn = $('<button>')
                    .addClass('btn btn-sm')
                    .addClass(isActive ? 'btn-' + f.style : 'btn-default')
                    .attr('data-filter', f.name)
                    .text(f.label);

                $btn.on('click', function () {
                    var name = $(this).data('filter');
                    if (self._activeFilter === name) {
                        self._activeFilter = null;
                        self._applyPreset(null);
                    } else {
                        self._activeFilter = name;
                        self._applyPreset(name);
                    }
                    self._renderFilterButtons();
                });

                $container.append($btn);
            });

            this.$el.find('.kb-preset-buttons').remove();
            this.$el.find('.search-container').after($container);
        },

        _applyPreset: function (name) {
            var searchView = this.getView('search');
            if (searchView && searchView.selectPreset) {
                searchView.selectPreset(name);
            }
        },

    });

});
