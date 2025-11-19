define('custom:views/fields/netto', ['views/fields/float'], function (Dep) {
    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);
            this.readOnly = true;
            this.disabled = true;
            this.mode = 'detail';
        },

        isEditable: function () { return false; },
        isReadOnly: function () { return true; },
        isInlineEditEnabled: function () { return false; },

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this.setMode('detail');
            this.$el.css('pointer-events', 'none');
        }
    });
});
