define('custom:views/c-arbeitszeit/panels/panel-jahr', ['view'], function (Dep) {

    return Dep.extend({

        template: '',

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

                this._renderTable(res || {});
                this.notify('Daten geladen.', 'success');
            } catch (e) {
                console.error('[panel-jahr] Fehler:', e);
                this.notify('Fehler beim Laden der Daten.', 'error');
                $c.html('<div class="text-danger">Fehler beim Laden der Daten.</div>');
            }
        },

        _renderTable(res) {
            const $c = this.$el.find('[data-name="table"]');
            const rows = res.rows || [];
            if (rows.length === 0) {
                $c.html('<div class="text-muted">Keine Daten gefunden.</div>');
                return;
            }

            const monthName = m => {
                const names = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
                    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
                return names[Number(m)] || m;
            };

            const fmtBilanz = (min) => {
                if (min === null || min === undefined) return '—';
                const sign = min >= 0 ? '+' : '-';
                const h = Math.floor(Math.abs(min) / 60);
                const m = Math.abs(min) % 60;
                return `${sign}${h}h ${String(m).padStart(2, '0')}min`;
            };

            const gesamtBilanz    = res.gesamt_bilanz ?? 0;
            const gesamtBilanzCls = gesamtBilanz > 0 ? 'az-bilanz-plus' : (gesamtBilanz < 0 ? 'az-bilanz-minus' : '');
            const gesamtSollH     = Math.floor((res.gesamt_soll ?? 0) / 60);
            const gesamtNettoH    = Math.floor((res.gesamt_netto ?? 0) / 60);
            const gesamtNettoM    = (res.gesamt_netto ?? 0) % 60;

            const abw     = res.abwesenheiten || [];
            const typName = t => t === 'K' ? 'Krank' : 'Urlaub';
            const abwHtml = abw.length === 0 ? '' : `
                <div style="margin-top:16px;">
                    <strong><i class="fas fa-umbrella-beach"></i> Abwesenheiten im Jahr:</strong>
                    <table class="table table-sm table-bordered az-stat-table" style="margin-top:6px;max-width:500px;">
                        <thead><tr><th>Typ</th><th>Von</th><th>Bis</th><th>Bezeichnung</th></tr></thead>
                        <tbody>
                            ${abw.map(a => `
                                <tr class="${a.typ === 'K' ? 'az-krank-row' : 'az-urlaub-row'}">
                                    <td><span class="label ${a.typ === 'K' ? 'label-danger' : 'label-info'}">${typName(a.typ)}</span></td>
                                    <td>${a.date_start_date || '—'}</td>
                                    <td>${a.date_end_date || '—'}</td>
                                    <td>${a.name || '—'}</td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;

            $c.html(`
                <div class="table-responsive az-panel az-jahr">
                    <table class="table table-hover table-bordered az-stat-table">
                    <thead>
                        <tr>
                            <th>Monat</th>
                            <th>Arbeitstage</th>
                            <th>Urlaub/Krank</th>
                            <th>Soll</th>
                            <th>Netto</th>
                            <th>Bilanz</th>
                            <th>WE/Feiertag</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(r => {
                            const bilanz    = r.bilanz_min ?? 0;
                            const bilanzCls = bilanz > 0 ? 'az-bilanz-plus' : (bilanz < 0 ? 'az-bilanz-minus' : '');
                            const sollH     = Math.floor((r.soll_min ?? 0) / 60);
                            const nettoH    = Math.floor((r.summeNetto ?? 0) / 60);
                            const nettoM    = (r.summeNetto ?? 0) % 60;
                            return `
                            <tr>
                                <td><strong>${monthName(r.monat)}</strong></td>
                                <td class="az-cell-right">${r.arbeitstage ?? '—'}</td>
                                <td class="az-cell-right">${r.urlaubstage ?? 0}</td>
                                <td class="az-cell-right">${sollH}h</td>
                                <td class="az-cell-right">${nettoH}h ${String(nettoM).padStart(2,'0')}min</td>
                                <td class="az-cell-right ${bilanzCls}">${fmtBilanz(bilanz)}</td>
                                <td class="az-cell-right">${Math.floor((r.summeFeiertagWochenende ?? 0) / 60)}h</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="az-summary-row">
                            <td colspan="3"><strong>Gesamt</strong></td>
                            <td class="az-cell-right"><strong>${gesamtSollH}h</strong></td>
                            <td class="az-cell-right"><strong>${gesamtNettoH}h ${String(gesamtNettoM).padStart(2,'0')}min</strong></td>
                            <td class="az-cell-right ${gesamtBilanzCls}"><strong>${fmtBilanz(gesamtBilanz)}</strong></td>
                            <td></td>
                        </tr>
                    </tfoot>
                    </table>
                </div>
                ${abwHtml}
            `);
        },
    });
});
