// custom:views/c-mitarbeiterkompass-bericht/list
console.log('[LOAD] custom:views/c-mitarbeiterkompass-bericht/list');

define('custom:views/c-mitarbeiterkompass-bericht/list', [
    'views/list'
], function (Dep) {

    // Farben: validierte kategoriale Palette (dataviz-Skill), CVD-sicher in dieser
    // Reihenfolge — nicht einzelne Farben austauschen, ohne die Reihenfolge neu zu prüfen.
    const INDEX_COLORS = {
        kmi: '#2a78d6', kfi: '#1baf7a', koi: '#eda100',
        kti: '#008300', kki: '#4a3aa7', kbi: '#e34948', kgi: '#000244'
    };

    // Version 1.0 (Freigabe Herr Schiller, 2026-07-06) — nur Anzeige, keine Bearbeitung.
    // Muss mit den Fragen in mitarbeiterkompass.html (Flask) übereinstimmen.
    const SECTIONS = [
        { key: 'KMI', color: INDEX_COLORS.kmi, title: 'Motivationsindex', range: 'Fragen 1–4', questions: [
            'Wie motiviert bist du aktuell bei deiner Arbeit?',
            'Wie gerne gehst du zur Arbeit?',
            'Wie gut kannst du deine Stärken und Fähigkeiten in deinen Aufgaben einsetzen?',
            'Wie zufrieden bist du mit deinen Möglichkeiten, dich bei KleSec weiterzuentwickeln?'
        ]},
        { key: 'KFI', color: INDEX_COLORS.kfi, title: 'Führungsindex', range: 'Fragen 5–9', questions: [
            'Wie zufrieden bist du mit deinem direkten Vorgesetzten?',
            'Wie fair fühlst du dich behandelt?',
            'Wie gut wird dir zugehört, wenn du etwas ansprichst?',
            'Wie gut wirst du unterstützt, wenn du Hilfe brauchst?',
            'Wie gut werden deine Leistung und dein Einsatz anerkannt und wertgeschätzt?'
        ]},
        { key: 'KOI', color: INDEX_COLORS.koi, title: 'Organisationsindex', range: 'Fragen 10–14', questions: [
            'Wie gut sind die Baustellen und Einsätze organisiert?',
            'Wie gut funktioniert die Materialplanung?',
            'Wie zufrieden bist du mit Werkzeug, Material und Ausstattung, die dir zur Verfügung stehen?',
            'Wie gut funktionieren die Arbeitsabläufe im Alltag?',
            'Wie gut passt deine Arbeitsbelastung (Menge und Verteilung der Arbeit)?'
        ]},
        { key: 'KTI', color: INDEX_COLORS.kti, title: 'Teamindex', range: 'Fragen 15–18', questions: [
            'Wie gut funktioniert die Zusammenarbeit mit deinen Kollegen?',
            'Wie sehr kannst du dich auf deine Kollegen verlassen?',
            'Wie respektvoll ist der Umgang untereinander?',
            'Wie sehr werden alle im Betrieb gleich behandelt?'
        ]},
        { key: 'KKI', color: INDEX_COLORS.kki, title: 'Kommunikationsindex', range: 'Fragen 19–21', questions: [
            'Wie bewertest du die Kommunikation bei KleSec insgesamt?',
            'Wie gut bekommst du wichtige Informationen rechtzeitig (z. B. vor einem Einsatz)?',
            'Wie klar weißt du, was von dir erwartet wird?'
        ]},
        { key: 'KBI', color: INDEX_COLORS.kbi, title: 'Bindungsindex', range: 'Fragen 22–27', questions: [
            'Wie zufrieden bist du insgesamt mit KleSec als Arbeitgeber? (Skala 1–10)',
            'Wie sicher fühlst du dich an deinem Arbeitsplatz (Zukunft deines Jobs)? (Skala 1–10)',
            'Wie stolz bist du, bei KleSec zu arbeiten? (Skala 1–10)',
            'Wie wahrscheinlich würdest du KleSec als Arbeitgeber weiterempfehlen? (eNPS, Skala 0–10)',
            'Würdest du dich mit dem Wissen von heute noch einmal für KleSec entscheiden? (Ja / Wahrscheinlich ja / Unentschlossen / Wahrscheinlich nein / Nein)',
            'Hast du in den letzten 12 Monaten über einen Arbeitgeberwechsel nachgedacht? (Nein / Ja, kurz / Ja, ernsthaft)'
        ]},
        { key: '💬', color: '#6b7280', title: 'Offene Fragen', range: 'fließen nicht in die Indizes ein', questions: [
            'Was läuft bei KleSec besonders gut?',
            'Was sollten wir als Erstes verbessern?',
            'Wenn du einen Tag Geschäftsführer wärst: Was würdest du sofort ändern oder umsetzen?'
        ]}
    ];

    // Kleines SVG-Liniendiagramm (Sparkline mit Achsen) für einen Index über mehrere Wellen.
    // points: [{ label: 'H2’25', value: 61.2 }, ...] — value auf fester Skala 0–100.
    function buildTrendSvg(points, color, opts) {
        opts = opts || {};
        const w = opts.width || 280;
        const h = opts.height || 150;
        const padL = 26, padR = 14, padT = 16, padB = 24;
        const plotW = w - padL - padR;
        const plotH = h - padT - padB;
        const n = points.length;

        const xAt = (i) => padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW);
        const yAt = (v) => padT + plotH - (Math.max(0, Math.min(100, v)) / 100) * plotH;

        let svg = `<svg viewBox="0 0 ${w} ${h}" width="100%" style="display:block;">`;

        // Gridlines (recessive, hairline, nie gestrichelt)
        [0, 25, 50, 75, 100].forEach((v) => {
            const gy = yAt(v);
            svg += `<line x1="${padL}" y1="${gy}" x2="${w - padR}" y2="${gy}" stroke="#e8e9ed" stroke-width="1"/>`;
            if (v === 0 || v === 50 || v === 100) {
                svg += `<text x="${padL - 6}" y="${gy + 3}" text-anchor="end" font-size="9" fill="#9aa0a8">${v}</text>`;
            }
        });

        if (n > 1) {
            let area = `M ${xAt(0)} ${yAt(points[0].value)}`;
            points.forEach((p, i) => { if (i > 0) area += ` L ${xAt(i)} ${yAt(p.value)}`; });
            area += ` L ${xAt(n - 1)} ${yAt(0)} L ${xAt(0)} ${yAt(0)} Z`;
            svg += `<path d="${area}" fill="${color}" opacity="0.1"/>`;

            let line = `M ${xAt(0)} ${yAt(points[0].value)}`;
            points.forEach((p, i) => { if (i > 0) line += ` L ${xAt(i)} ${yAt(p.value)}`; });
            svg += `<path d="${line}" fill="none" stroke="${color}" stroke-width="${opts.lineWidth || 2}" ` +
                'stroke-linecap="round" stroke-linejoin="round"/>';
        }

        points.forEach((p, i) => {
            const cx = xAt(i), cy = yAt(p.value);
            const r = opts.markerR || 4.5;
            svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="#fff" stroke-width="2">` +
                `<title>${p.label}: ${Math.round(p.value)}</title></circle>`;
            if (i === n - 1) {
                const labelY = p.value >= 88 ? cy + 14 : cy - 10;
                svg += `<text x="${cx}" y="${labelY}" text-anchor="middle" font-size="${opts.labelSize || 12}" ` +
                    `font-weight="700" fill="#1f2430">${Math.round(p.value)}</text>`;
            }
            svg += `<text x="${cx}" y="${h - 7}" text-anchor="middle" font-size="9" fill="#9aa0a8">${p.label}</text>`;
        });

        svg += '</svg>';
        return svg;
    }

    return Dep.extend({

        afterRender: function () {
            Dep.prototype.afterRender.call(this);
            this._renderNeueWelleButton();
            this._renderInfoPanel();
            this._renderTrendChart();
        },

        _renderTrendChart: function () {
            if (this.$el.find('[data-name="mak-trend-panel"]').length) {
                return;
            }
            const $listContainer = this.$el.find('.list-container').first();
            if (!$listContainer.length) {
                return;
            }

            Espo.Ajax.getRequest('CMitarbeiterkompassBericht', {
                select: 'jahr,halbjahr,kmi,kfi,koi,kti,kki,kbi,kgi',
                where: [{ type: 'equals', attribute: 'welleStatus', value: 'ausgewertet' }],
                maxSize: 200
            }).then((res) => {
                const records = (res.list || []).slice().sort((a, b) => {
                    const ka = a.jahr * 10 + (a.halbjahr === 'H1' ? 1 : 2);
                    const kb = b.jahr * 10 + (b.halbjahr === 'H1' ? 1 : 2);
                    return ka - kb;
                });

                if (records.length < 2) {
                    $(
                        '<div data-name="mak-trend-panel" style="margin-top:18px; padding:16px 20px; ' +
                        'background:#fff; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.06); ' +
                        'color:#8a8f98; font-size:.92em;">' +
                        '📈 Sobald mindestens zwei Wellen ausgewertet sind, erscheint hier die Entwicklung über die Zeit.' +
                        '</div>'
                    ).insertAfter($listContainer);
                    return;
                }

                const shortLabel = (r) => (r.halbjahr === 'H1' ? 'H1’' : 'H2’') + String(r.jahr).slice(2);
                const points = (key) => records.map((r) => ({ label: shortLabel(r), value: r[key] }));

                const kgiSvg = buildTrendSvg(points('kgi'), INDEX_COLORS.kgi, {
                    width: 900, height: 190, lineWidth: 3, markerR: 5.5, labelSize: 15
                });

                const miniHtml = SECTIONS.filter((s) => INDEX_COLORS[s.key.toLowerCase()] && s.key !== 'KGI')
                    .map((s) => {
                        const key = s.key.toLowerCase();
                        const svg = buildTrendSvg(points(key), INDEX_COLORS[key], { width: 280, height: 150 });
                        return (
                            '<div style="background:#fff; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.06); ' +
                            'overflow:hidden; border-top:4px solid ' + INDEX_COLORS[key] + ';">' +
                            '<div style="padding:10px 14px 0; display:flex; align-items:center; gap:8px;">' +
                            '<span style="background:' + INDEX_COLORS[key] + '1a; color:' + INDEX_COLORS[key] + '; ' +
                            'font-weight:700; font-size:.74em; padding:3px 8px; border-radius:999px;">' + s.key + '</span>' +
                            '<span style="font-weight:600; font-size:.88em; color:#1f2430;">' + s.title + '</span>' +
                            '</div>' + svg + '</div>'
                        );
                    }).join('');

                const $panel = $(
                    '<div data-name="mak-trend-panel" style="margin-top:18px;">' +
                    '<div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">' +
                    '<span class="fas fa-chart-line" style="color:#000244;"></span>' +
                    '<strong style="font-size:1.05em;">Entwicklung über die Zeit</strong>' +
                    '</div>' +
                    '<div style="background:#fff; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.06); ' +
                    'overflow:hidden; border-top:4px solid ' + INDEX_COLORS.kgi + '; margin-bottom:14px;">' +
                    '<div style="padding:12px 16px 0; display:flex; align-items:center; gap:8px;">' +
                    '<span style="background:#0002441a; color:' + INDEX_COLORS.kgi + '; font-weight:700; ' +
                    'font-size:.78em; padding:4px 10px; border-radius:999px;">KGI</span>' +
                    '<span style="font-weight:700; font-size:1em; color:#1f2430;">Gesamtindex</span>' +
                    '</div>' + kgiSvg + '</div>' +
                    '<div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:14px;">' +
                    miniHtml +
                    '</div>' +
                    '</div>'
                );

                $panel.insertAfter($listContainer);
            }).catch(() => {});
        },

        _renderNeueWelleButton: function () {
            const $container = this.$el.find('.header-buttons').first();
            if (!$container.length || $container.find('[data-name="neueWelle"]').length) {
                return;
            }

            const $btn = $(
                '<a role="button" tabindex="0" data-name="neueWelle" ' +
                'class="btn btn-primary btn-xs-wide main-header-manu-action action" ' +
                'style="margin-left: 5px;">' +
                '<span class="fas fa-plus"></span> <span>Neue Welle anlegen</span></a>'
            );
            $btn.on('click', () => this._openNeueWelleModal());
            $container.prepend($btn);
        },

        _openNeueWelleModal: function () {
            this.createView('neueWelleModal', 'custom:views/c-mitarbeiterkompass-bericht/modals/neue-welle', {
                parentView: this
            }, (view) => {
                view.render();
                this.listenToOnce(view, 'welle-angelegt', () => {
                    this.collection.fetch();
                });
            });
        },

        _renderInfoPanel: function () {
            if (this.$el.find('[data-name="mak-info-panel"]').length) {
                return;
            }

            const cardsHtml = SECTIONS.map((s) => (
                '<div style="background:#fff; border-radius:10px; box-shadow:0 2px 8px rgba(0,0,0,.06); ' +
                'overflow:hidden; border-top:4px solid ' + s.color + ';">' +
                '<div style="padding:12px 16px 8px; display:flex; align-items:center; gap:10px;">' +
                '<span style="background:' + s.color + '1a; color:' + s.color + '; font-weight:700; ' +
                'font-size:.76em; letter-spacing:.03em; padding:4px 10px; border-radius:999px; white-space:nowrap;">' +
                s.key + '</span>' +
                '<div>' +
                '<div style="font-weight:700; color:#1f2430; font-size:.98em;">' + s.title + '</div>' +
                '<div style="font-size:.78em; color:#8a8f98;">' + s.range + '</div>' +
                '</div>' +
                '</div>' +
                '<ol style="margin:0; padding:4px 16px 14px 32px; font-size:.92em; color:#333;">' +
                s.questions.map((q) => '<li style="margin-bottom:6px;">' + q + '</li>').join('') +
                '</ol>' +
                '</div>'
            )).join('');

            const $panel = $(`
                <div data-name="mak-info-panel" style="margin-top: 16px; border-radius: 12px; overflow: hidden;
                     box-shadow: 0 4px 14px rgba(0,2,68,.12);">
                    <div data-role="toggle" style="cursor:pointer; padding: 14px 20px;
                         background: linear-gradient(120deg, #000244, #1a2470); color:#fff;
                         display:flex; align-items:center; justify-content:space-between;">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span class="fas fa-compass" style="font-size:1.2em;"></span>
                            <div>
                                <div style="font-weight:700; font-size:1.05em;">Mitarbeiterkompass — Über diese Seite &amp; Fragebogen</div>
                                <div style="font-size:.82em; opacity:.85;">Wozu, was du hier tust, und alle Fragen im Überblick</div>
                            </div>
                        </div>
                        <span class="fas fa-chevron-down" data-name="mak-toggle-icon"></span>
                    </div>
                    <div data-name="mak-info-body" style="background:#f2f4f9; padding: 18px 20px; display:none;">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px; margin-bottom:18px;">
                            <div style="background:#eef2ff; border-left:4px solid #000244; border-radius:8px; padding:12px 16px;">
                                <div style="font-weight:700; margin-bottom:4px;">🎯 Wozu</div>
                                <div style="font-size:.92em; line-height:1.5;">
                                    Halbjährliche, <strong>vollständig anonyme</strong> Mitarbeiterbefragung.
                                    Misst sechs Indizes (Motivation, Führung, Organisation, Team, Kommunikation,
                                    Bindung) plus einen Gesamtindex — als ehrliches Stimmungsbild, um konkrete
                                    Verbesserungsmaßnahmen abzuleiten und die Entwicklung über die Zeit zu
                                    verfolgen. Einzelne Antworten sind nie einer Person zuordenbar.
                                </div>
                            </div>
                            <div style="background:#dcfce7; border-left:4px solid #16a34a; border-radius:8px; padding:12px 16px;">
                                <div style="font-weight:700; margin-bottom:4px;">⚙️ Was du hier tust</div>
                                <div style="font-size:.92em; line-height:1.5;">
                                    Mit <em>„Neue Welle anlegen“</em> startest du eine neue Runde für ein
                                    Halbjahr und wählst die Empfänger — Einladungen gehen automatisch per
                                    E-Mail raus.
                                    Auf der Bericht-Karte kannst du danach Erinnerungen senden, die Welle
                                    schließen und den PDF-Managementbericht generieren.
                                </div>
                            </div>
                        </div>

                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                            <span class="fas fa-lock" style="color:#6b7280;"></span>
                            <strong>Fragebogen — Version 1.0</strong>
                            <span style="color:#6b7280; font-size:.85em;">
                                (Freigabe Herr Schiller, 06.07.2026 — festgeschrieben, nur zur Erinnerung)
                            </span>
                        </div>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:14px;">
                            ${cardsHtml}
                        </div>
                    </div>
                </div>
            `);

            $panel.find('[data-role="toggle"]').on('click', () => {
                $panel.find('[data-name="mak-info-body"]').slideToggle(150);
                $panel.find('[data-name="mak-toggle-icon"]').toggleClass('fa-chevron-up fa-chevron-down');
            });

            const $searchContainer = this.$el.find('.search-container').first();
            if ($searchContainer.length) {
                $panel.insertAfter($searchContainer);
            } else {
                this.$el.prepend($panel);
            }
        }

    });
});
