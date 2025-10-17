define('custom:views/c-arbeitszeit/panels/panel-jahr', ['view'], function (Dep) {

    return Dep.extend({

        template: false,

        render: function () {
            const html = `
                <div class="kb-filter" style="margin-bottom: 12px;">
                    <div class="row" style="gap:8px 0;">
                        <div class="col-sm-5">
                            <label><b>Techniker</b></label>
                            <select class="form-control" data-name="user"></select>
                        </div>
                        <div class="col-sm-3">
                            <label><b>Jahr</b></label>
                            <select class="form-control" data-name="year"></select>
                        </div>
                        <div class="col-sm-2">
                            <label>&nbsp;</label>
                            <button class="btn btn-primary btn-block" data-action="anzeigen">
                                <i class="fas fa-chart-bar"></i> Anzeigen
                            </button>
                        </div>
                    </div>
                </div>
                <div data-name="table" class="panel-body text-muted">
                    Bitte Techniker und Jahr auswählen und <b>Anzeigen</b> klicken.
                </div>
            `;
            this.$el.html(html);
            this._prefill();
            this._bind();
            return this;
        },

        async _prefill() {
            // Годы: текущий и 4 предыдущих
            const now = new Date();
            const $y = this.$el.find('[data-name="year"]');
            for (let i = 0; i < 5; i++) {
                const yy = String(now.getFullYear() - i);
                $y.append(`<option value="${yy}">${yy}</option>`);
            }

            // Техники (active, title содержит Techniker или IT-Spezialist, исключаем служебных)
            const $u = this.$el.find('[data-name="user"]');
            $u.empty().append('<option value="">-- Techniker wählen --</option>');

            try {
                const res = await Espo.Ajax.getRequest('User', {
                    select: 'id,name,firstName,lastName,isActive,title,userName,type',
                    maxSize: 200
                });

                const EXCLUDE = ['pythonserver', 'admin', 'system'];
                const ALLOWED_TITLES = ['techniker', 'it-spezialist'];

                (res.list || []).forEach(u => {
                    const active = u.isActive === true || u.isActive === 1 || u.isActive === '1';
                    if (!active) return;
                    if (EXCLUDE.includes(u.userName)) return;
                    if (u.type === 'api') return;

                    const title = (u.title || '').toLowerCase();
                    if (!ALLOWED_TITLES.some(t => title.includes(t))) return;

                    const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
                    const role = u.title ? ` (${u.title})` : '';
                    $u.append(`<option value="${u.id}">${name}${role}</option>`);
                });
            } catch (e) {
                console.error('[panel-jahr] Fehler beim Laden der Benutzer:', e);
                $u.append('<option disabled>⚠️ Fehler beim Laden</option>');
            }
        },

        _bind() {
            this.$el.on('click', '[data-action="anzeigen"]', () => this._load());
        },

        async _load() {
            const userId = this.$el.find('[data-name="user"]').val();
            const year = this.$el.find('[data-name="year"]').val();
            const $c = this.$el.find('[data-name="table"]');

            if (!userId || !year) {
                $c.html('<div class="text-warning">Bitte Techniker und Jahr wählen.</div>');
                return;
            }

            try {
                this.notify('Lade Daten…', 'info');
                // ⚙️ дергаем наш Espo-контроллер, НЕ Flask
                const res = await Espo.Ajax.getRequest('CArbeitszeit/action/getJahresstatistik', {
                    technikerId: userId,
                    year: year
                });

                this._renderTable(res && res.rows ? res.rows : []);
                this.notify('Daten geladen.', 'success');
            } catch (e) {
                console.error('[panel-jahr] Fehler:', e);
                this.notify('Fehler beim Laden der Daten.', 'error');
                $c.html('<div class="text-danger">Fehler beim Laden der Daten.</div>');
            }
        },

        _renderTable(rows) {
            const $c = this.$el.find('[data-name="table"]');
            if (!Array.isArray(rows) || rows.length === 0) {
                $c.html('<div class="text-muted">Keine Daten gefunden.</div>');
                return;
            }

            const monthName = m => {
                const names = [
                    '', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
                ];
                return names[Number(m)] || m;
            };

            const trs = rows.map(r => `
                <tr>
                    <td>${monthName(r.monat)}</td>
                    <td>${r.summeDauer ?? '—'}</td>
                    <td>${r.summeNetto ?? '—'}</td>
                    <td>${r.summeUeberstunden ?? '—'}</td>
                    <td>${r.summeFeiertagWochenende ?? '—'}</td>
                </tr>
            `).join('');

            $c.html(`
                <div class="table-responsive az-panel az-jahr">
                    <table class="table table-hover table-bordered az-stat-table">
                    <thead>
                        <tr>
                        <th>Monat</th>
                        <th>Summe Dauer</th>
                        <th>Summe Netto</th>
                        <th>Überstunden</th>
                        <th>Wochenende/Feiertag</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(r => `
                        <tr>
                            <td>${monthName(r.monat)}</td>
                            <td class="az-cell-right">${r.summeDauer ?? '—'}</td>
                            <td class="az-cell-right">${r.summeNetto ?? '—'}</td>
                            <td class="az-cell-right">${r.summeUeberstunden ?? '—'}</td>
                            <td class="az-cell-right">${r.summeFeiertagWochenende ?? '—'}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                    </table>
                </div>
                `);

        },
    });
});
