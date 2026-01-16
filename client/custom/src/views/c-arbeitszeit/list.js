define('custom:views/c-arbeitszeit/list', ['views/list', 'bullbone'], function (Dep, BB) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            // включаем патч один раз, но храним у себя, чтобы откатить
            this.__bbOrigGetTemplate = null;

            if (BB && BB.View && BB.View.prototype && typeof BB.View.prototype._getTemplate === 'function') {
                this.__bbOrigGetTemplate = BB.View.prototype._getTemplate;

                // IMPORTANT: обычная function, не стрелка, и orig.call(this,...)
                BB.View.prototype._getTemplate = function (tpl, data) {
                    if (arguments.length < 2 || data == null) {
                        try {
                            if (typeof this.data === 'function') data = this.data() || {};
                            else data = {};
                        } catch (e) {
                            data = {};
                        }
                    }
                    return this.__bbOrigGetTemplate__(tpl, data);
                };

                // сохраняем оригинал рядом с прототипом, чтобы call был корректный
                BB.View.prototype.__bbOrigGetTemplate__ = this.__bbOrigGetTemplate;
            }
        },

        remove: function () {
            // откат
            if (BB && BB.View && BB.View.prototype && this.__bbOrigGetTemplate) {
                BB.View.prototype._getTemplate = this.__bbOrigGetTemplate;
                try { delete BB.View.prototype.__bbOrigGetTemplate__; } catch (e) { }
            }
            return Dep.prototype.remove.call(this);
        }

    });
});
