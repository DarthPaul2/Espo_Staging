define('custom:views/c-arbeitszeit/panels/panel-monat', ['view'], function (Dep) {

    return Dep.extend({

        template: '',

        setup: function () {
            Dep.prototype.setup.call(this);
            this.flaskBaseUrl = (this.getConfig().get('flaskPdfUrl') || '').replace(/\/+$/, '');
        },

        render: function () {
            const html = `
                <div class="kb-filter" style="margin-bottom: 12px;">
                    <div class="row" style="gap:8px 0;">
                        <div class="col-sm-4">
                            <label><b>Techniker</b></label>
                            <select class="form-control" data-name="user"></select>
                        </div>
                        <div class="col-sm-3">
                            <label><b>Jahr</b></label>
                            <select class="form-control" data-name="year"></select>
                        </div>
                        <div class="col-sm-3">
                            <label><b>Monat</b></label>
                            <select class="form-control" data-name="month">
                                <option value="1">Januar</option>
                                <option value="2">Februar</option>
                                <option value="3">März</option>
                                <option value="4">April</option>
                                <option value="5">Mai</option>
                                <option value="6">Juni</option>
                                <option value="7">Juli</option>
                                <option value="8">August</option>
                                <option value="9">September</option>
                                <option value="10">Oktober</option>
                                <option value="11">November</option>
                                <option value="12">Dezember</option>
                            </select>
                        </div>
                        <div class="col-sm-2">
                            <label>&nbsp;</label>
                            <button class="btn btn-primary btn-block" data-action="anzeigen">
                                <i class="fas fa-calendar-alt"></i> Anzeigen
                            </button>
                        </div>
                    </div>
                </div>
                <div data-name="table" class="panel-body text-muted">
                    Bitte Techniker, Jahr und Monat auswählen und auf <b>Anzeigen</b> klicken.
                </div>
            `;
            this.$el.html(html);
            this._prefill();
            this._bind();
            return this;
        },

        async _prefill() {
            const now = new Date();

            // наполняем годы
            const $y = this.$el.find('[data-name="year"]');
            for (let i = 0; i < 5; i++) {
                const y = String(now.getFullYear() - i);
                $y.append(`<option value="${y}">${y}</option>`);
            }
            this.$el.find('[data-name="month"]').val(String(now.getMonth() + 1));

            // добавляем placeholder
            const $u = this.$el.find('[data-name="user"]');
            $u.empty().append('<option value="">-- Techniker wählen --</option>');

            try {
                const res = await Espo.Ajax.getRequest('User', {
                    select: 'id,name,firstName,lastName,isActive,title,userName,type',
                    maxSize: 200
                });

                const EXCLUDE_USERS = ['pythonserver', 'admin', 'system'];
                const ALLOWED_TITLES = ['techniker', 'it-spezialist']; // ← допустимые должности

                (res.list || []).forEach(u => {
                    const isActive = u.isActive === true || u.isActive === 1 || u.isActive === '1';
                    if (!isActive) return;

                    if (EXCLUDE_USERS.includes(u.userName)) return;
                    if (u.type === 'api') return;

                    // ⚙️ Проверяем, есть ли допустимая должность
                    const title = (u.title || '').toLowerCase();
                    if (!ALLOWED_TITLES.some(t => title.includes(t))) return;

                    const name = u.name || `${u.firstName || ''} ${u.lastName || ''}`.trim();
                    const role = u.title ? ` (${u.title})` : '';
                    $u.append(`<option value="${u.id}">${name}${role}</option>`);
                });
            } catch (e) {
                console.error('[panel-monat] Fehler beim Laden der Benutzer:', e);
                $u.append('<option disabled>⚠️ Fehler beim Laden</option>');
            }

        },


        _bind() {
            this.$el.on('click', '[data-action="anzeigen"]', () => this._load());
        },

        async _load() {
            const userId = this.$el.find('[data-name="user"]').val();
            const year = this.$el.find('[data-name="year"]').val();
            const month = this.$el.find('[data-name="month"]').val();
            const $c = this.$el.find('[data-name="table"]');

            if (!userId || !year || !month) {
                $c.html('<div class="text-warning">Bitte Techniker, Jahr und Monat wählen.</div>');
                return;
            }

            this.notify('Lade Daten...', 'info');

            try {
                const url = `api/v1/CArbeitszeit/action/getMonatsstatistik?technikerId=${encodeURIComponent(userId)}&month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`;
                const resp = await fetch(url, { credentials: 'include' });
                if (!resp.ok) throw new Error(`Request fehlgeschlagen: ${resp.status}`);

                const data = await resp.json();
                if (data.success) {
                    this._renderTable(data);
                    this.notify('Daten geladen.', 'success');
                } else {
                    $c.html('<div class="text-muted">Keine Daten gefunden.</div>');
                }
            } catch (e) {
                console.error('[panel-monat] Fehler:', e);
                $c.html('<div class="text-danger">Fehler beim Laden der Daten.</div>');
            }
        },

        _renderTable(data) {
            const $c = this.$el.find('[data-name="table"]');
            $c.removeClass().empty();

            const rows = data.rows || [];
            if (rows.length === 0) {
                $c.html('<div class="text-muted">Keine Daten gefunden.</div>');
                return;
            }

            const fmtTime = (s) => {
                if (!s) return '—';
                const t = s.split('T')[1] || s.split(' ')[1] || '';
                return t ? t.slice(0, 5) : '—';
            };

            const fmtBilanz = (min) => {
                if (min === null || min === undefined) return '—';
                const sign = min >= 0 ? '+' : '-';
                const h = Math.floor(Math.abs(min) / 60);
                const m = Math.abs(min) % 60;
                return `${sign}${h}h ${String(m).padStart(2, '0')}min`;
            };

            const bilanz    = data.bilanz_min ?? 0;
            const sollH     = Math.floor((data.soll_min ?? 0) / 60);
            const nettoH    = Math.floor((data.netto_min ?? 0) / 60);
            const nettoM    = (data.netto_min ?? 0) % 60;
            const bilanzCls = bilanz > 0 ? 'az-bilanz-plus' : (bilanz < 0 ? 'az-bilanz-minus' : '');

            const abw     = data.abwesenheiten || [];
            const typName = t => t === 'K' ? 'Krank' : 'Urlaub';
            const abwHtml = abw.length === 0 ? '' : `
                <div style="margin-top:12px;">
                    <strong><i class="fas fa-umbrella-beach"></i> Abwesenheiten:</strong>
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
                <div class="table-responsive az-panel az-monat">
                    <table class="table table-hover table-bordered az-stat-table">
                    <colgroup>
                        <col style="width:27%">
                        <col style="width:13%">
                        <col style="width:13%">
                        <col style="width:13%">
                        <col style="width:13%">
                        <col style="width:13%">
                    </colgroup>
                    <thead>
                        <tr>
                            <th style="text-align:center;">Datum</th>
                            <th style="text-align:center;">Start</th>
                            <th style="text-align:center;">Ende</th>
                            <th style="text-align:center;">Netto</th>
                            <th style="text-align:center;">Mehr-/Minderstunden</th>
                            <th style="text-align:center;">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(r => {
                            const s = r.status || 'gearbeitet';
                            let rowStyle = '';
                            let statusBadge = '';
                            let tagBilanzHtml = '<td style="text-align:center;">—</td>';

                            if (s === 'urlaub')   { rowStyle = 'background:#e8f4fd;'; statusBadge = '<span class="label label-info">Urlaub</span>'; }
                            if (s === 'krank')    { rowStyle = 'background:#fdf0f0;'; statusBadge = '<span class="label label-danger">Krank</span>'; }
                            if (s === 'fehlend')  { rowStyle = 'background:#fff3cd;'; statusBadge = '<span class="label label-warning">Fehlend !</span>';
                                tagBilanzHtml = '<td style="text-align:center;color:#c0392b;font-weight:bold;">−8h 00min</td>';
                            }
                            if (s === 'feiertag') { rowStyle = 'background:#f0f0f0;color:#888;'; statusBadge = `<span class="label label-default">${r.name || 'Feiertag'}</span>`; }

                            if (s === 'gearbeitet') {
                                const netto = parseInt(r.netto) || 0;
                                const diff  = netto - 480;
                                const sign  = diff >= 0 ? '+' : '−';
                                const h     = Math.floor(Math.abs(diff) / 60);
                                const m     = Math.abs(diff) % 60;
                                const color = diff > 0 ? '#27ae60' : (diff < 0 ? '#c0392b' : '#555');
                                tagBilanzHtml = `<td style="text-align:center;color:${color};font-weight:bold;">${sign}${h}h ${String(m).padStart(2,'0')}min</td>`;
                            }

                            return `
                            <tr style="${rowStyle}">
                                <td style="text-align:left;">${r.datum || '—'}</td>
                                <td style="text-align:center;">${fmtTime(r.startzeit)}</td>
                                <td style="text-align:center;">${fmtTime(r.endzeit)}</td>
                                <td style="text-align:center;">${r.netto ?? '—'}</td>
                                ${tagBilanzHtml}
                                <td style="text-align:center;">${statusBadge || '—'}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="az-summary-row">
                            <td colspan="3"><strong>Arbeitstage: ${data.arbeitstage ?? '—'} | Urlaub/Krank: ${data.urlaubstage ?? 0}</strong></td>
                            <td class="az-cell-right"><strong>Ist: ${nettoH}h ${String(nettoM).padStart(2,'0')}min</strong></td>
                            <td class="az-cell-right ${bilanzCls}"><strong>${fmtBilanz(bilanz)}</strong></td>
                            <td class="az-cell-right"><strong>Soll: ${sollH}h</strong></td>
                        </tr>
                    </tfoot>
                    </table>
                </div>
                ${abwHtml}
            `);
        },

        async _mapEspoUserToFlaskTechnikerId(userId) {
            try {
                const user = await Espo.Ajax.getRequest(`User/${userId}`);
                return user.externalId || user.technikerId || user.id;
            } catch (_) {
                return userId;
            }
        }
    });
});
