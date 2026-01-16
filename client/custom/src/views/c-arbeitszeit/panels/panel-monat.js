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
                if (data.success && Array.isArray(data.rows)) {
                    this._renderTable(data.rows);
                    this.notify('Daten geladen.', 'success');
                } else {
                    $c.html('<div class="text-muted">Keine Daten gefunden.</div>');
                }
            } catch (e) {
                console.error('[panel-monat] Fehler:', e);
                $c.html('<div class="text-danger">Fehler beim Laden der Daten.</div>');
            }
        },

        _renderTable(rows) {
            const $c = this.$el.find('[data-name="table"]');
            $c.removeClass().empty();
            if (!Array.isArray(rows) || rows.length === 0) {
                $c.html('<div class="text-muted">Keine Daten gefunden.</div>');
                return;
            }

            const fmtTime = (s) => {
                if (!s) return '—';
                const t = s.split('T')[1] || s.split(' ')[1] || '';
                return t ? t.slice(0, 5) : '—';
            };

            const trs = rows.map(r => `
                <tr>
                    <td>${r.datum || '—'}</td>
                    <td>${fmtTime(r.startzeit)}</td>
                    <td>${fmtTime(r.endzeit)}</td>
                    <td>${r.dauer ?? '—'}</td>
                    <td>${r.netto ?? '—'}</td>
                    <td>${r.ueberstunden ?? (r.netto && r.netto > 480 ? r.netto - 480 : '—')}</td>
                    <td>${r.wochenende ? (r.netto ?? '—') : '—'}</td>
                </tr>
            `).join('');

            $c.html(`
                <div class="table-responsive az-panel az-monat">
                    <table class="table table-hover table-bordered az-stat-table">
                    <thead>
                        <tr>
                        <th>Datum</th>
                        <th>Startzeit</th>
                        <th>Endzeit</th>
                        <th>Dauer</th>
                        <th>Netto</th>
                        <th>Überstunden</th>
                        <th>Feiertag/Wochenende</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map(r => {
                const weekend = r.wochenende ? 'weekend' : '';
                const ue = (r.ueberstunden ?? (r.netto && r.netto > 480 ? r.netto - 480 : null));
                return `
                            <tr class="${weekend}">
                            <td>${r.datum || '—'}</td>
                            <td>${fmtTime(r.startzeit)}</td>
                            <td>${fmtTime(r.endzeit)}</td>
                            <td class="az-cell-right">${r.dauer ?? '—'}</td>
                            <td class="az-cell-right">${r.netto ?? '—'}</td>
                            <td class="az-cell-right">${ue ?? '—'}</td>
                            <td class="az-cell-center">${r.wochenende ? `<span class="az-badge az-badge-wf">${r.netto ?? '—'}</span>` : '—'}</td>
                            </tr>`;
            }).join('')}
                    </tbody>
                    </table>
                </div>
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
