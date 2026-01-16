Espo.define('custom:views/c-arbeitszeit/record/edit', 'views/record/edit', function (Dep) {

    return Dep.extend({

        setup: function () {
            Dep.prototype.setup.call(this);

            this.listenTo(this.model, 'change:startzeit change:endzeit', this.recalcAutoPauseOnly, this);
            this.listenTo(this.model, 'change:pauseminuten', this.recalcFromManualPauseOnly, this);

            this.recalcAutoPauseOnly();
        },

        _parseMoment: function (v) {
            if (!v) return null;

            var m = moment(v, moment.ISO_8601, true);
            if (!m.isValid()) {
                m = moment(v, 'YYYY-MM-DD HH:mm', true);
            }
            return m.isValid() ? m : null;
        },

        _autoPause: function (dauer) {
            if (dauer >= 540) return 45;
            if (dauer >= 360) return 30;
            return 0;
        },

        recalcAutoPauseOnly: function () {
            var s = this._parseMoment(this.model.get('startzeit'));
            var e = this._parseMoment(this.model.get('endzeit'));

            this.model.set('status', this.model.get('endzeit') ? 'closed' : 'open');

            if (!s || !e) {
                this.model.set({
                    'dauerminuten': null,
                    'nettominuten': null,
                    'ueberstundenminuten': null
                });
                return;
            }

            var dauer = e.diff(s, 'minutes');
            if (dauer < 0) {
                this.model.set({
                    'dauerminuten': null,
                    'pauseminuten': null,
                    'nettominuten': null,
                    'ueberstundenminuten': null
                });
                return;
            }

            var pause = this._autoPause(dauer);
            var netto = Math.max(dauer - pause, 0);
            var ueber = Math.max(netto - 480, 0);

            this.model.set({
                'dauerminuten': dauer,
                'pauseminuten': pause,
                'nettominuten': netto,
                'ueberstundenminuten': ueber
            });
        },

        recalcFromManualPauseOnly: function () {
            var s = this._parseMoment(this.model.get('startzeit'));
            var e = this._parseMoment(this.model.get('endzeit'));
            if (!s || !e) return;

            var dauer = e.diff(s, 'minutes');
            if (dauer < 0) return;

            var pause = parseInt(this.model.get('pauseminuten') || 0, 10);
            if (isNaN(pause) || pause < 0) pause = 0;

            var netto = Math.max(dauer - pause, 0);
            var ueber = Math.max(netto - 480, 0);

            this.model.set({
                'dauerminuten': dauer,
                'nettominuten': netto,
                'ueberstundenminuten': ueber
            });
        }

    });
});
