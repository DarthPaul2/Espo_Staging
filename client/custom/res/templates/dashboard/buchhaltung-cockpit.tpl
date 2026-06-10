<div class="kb-cockpit">

    <style>
        .kb-cockpit .kb-toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 14px;
            gap: 10px;
            flex-wrap: wrap;
        }

        .kb-cockpit .kb-status {
            font-size: 12px;
            color: #777;
            margin-bottom: 12px;
        }

        .kb-cockpit .kb-kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(160px, 1fr));
            gap: 10px;
            margin-bottom: 14px;
        }

        .kb-cockpit .kb-kpi-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            background: #fff;
            min-height: 82px;
        }

        .kb-cockpit .kb-kpi-label {
            font-size: 12px;
            color: #777;
            margin-bottom: 6px;
        }

        .kb-cockpit .kb-kpi-value {
            font-size: 22px;
            font-weight: 700;
            white-space: nowrap;
        }

        .kb-cockpit .kb-chart-box {
            height: 280px;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            background: #fff;
            margin-bottom: 14px;
        }

        .kb-cockpit .kb-small-box {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 12px;
            background: #fff;
            margin-bottom: 14px;
        }

        .kb-cockpit .kb-box-title {
            font-weight: 700;
            margin-bottom: 10px;
        }

        .kb-cockpit .kb-cockpit-tabs {
            margin-bottom: 12px;
        }

        .kb-cockpit table th,
        .kb-cockpit table td {
            vertical-align: middle !important;
        }

        @media (max-width: 1200px) {
            .kb-cockpit .kb-kpi-grid {
                grid-template-columns: repeat(2, minmax(160px, 1fr));
            }
        }

        @media (max-width: 700px) {
            .kb-cockpit .kb-kpi-grid {
                grid-template-columns: 1fr;
            }
        }

        .kb-cockpit .kb-worklist-box {
            border: 1px solid #ddd;
            border-radius: 10px;
            background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
            padding: 14px;
            margin-bottom: 14px;
        }

        .kb-cockpit .kb-worklist-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            gap: 10px;
            flex-wrap: wrap;
        }

        .kb-cockpit .kb-worklist-title {
            font-size: 16px;
            font-weight: 700;
        }

        .kb-cockpit .kb-worklist-subtitle {
            font-size: 12px;
            color: #777;
        }

        .kb-cockpit .kb-worklist-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(260px, 1fr));
            gap: 10px;
        }

        .kb-cockpit .kb-work-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            border-radius: 10px;
            padding: 12px 14px;
            border: 1px solid #e5e7eb;
            background: #fff;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }

        .kb-cockpit .kb-work-item__icon {
            width: 30px;
            min-width: 30px;
            height: 30px;
            border-radius: 50%;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            margin-top: 2px;
        }

        .kb-cockpit .kb-work-item__content {
            flex: 1;
            min-width: 0;
        }

        .kb-cockpit .kb-work-item__title {
            font-weight: 700;
            margin-bottom: 3px;
        }

        .kb-cockpit .kb-work-item__text {
            color: #444;
            margin-bottom: 4px;
            line-height: 1.4;
        }

        .kb-cockpit .kb-work-item__meta {
            font-size: 12px;
            color: #666;
            font-weight: 600;
        }

        .kb-cockpit .kb-work-item--success {
            border-left: 4px solid #1f9d55;
            background: #f3fcf7;
        }

        .kb-cockpit .kb-work-item--success .kb-work-item__icon {
            background: #1f9d55;
            color: #fff;
        }

        .kb-cockpit .kb-work-item--warning {
            border-left: 4px solid #f59e0b;
            background: #fffaf0;
        }

        .kb-cockpit .kb-work-item--warning .kb-work-item__icon {
            background: #f59e0b;
            color: #fff;
        }

        .kb-cockpit .kb-work-item--danger {
            border-left: 4px solid #dc2626;
            background: #fff5f5;
        }

        .kb-cockpit .kb-work-item--danger .kb-work-item__icon {
            background: #dc2626;
            color: #fff;
        }

        .kb-cockpit .kb-work-item--info {
            border-left: 4px solid #2563eb;
            background: #f5f9ff;
        }

        .kb-cockpit .kb-work-item--info .kb-work-item__icon {
            background: #2563eb;
            color: #fff;
        }

        @media (max-width: 900px) {
            .kb-cockpit .kb-worklist-grid {
                grid-template-columns: 1fr;
            }
        }

        .kb-cockpit .kb-work-item--clickable {
            cursor: pointer;
            transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease;
        }

        .kb-cockpit .kb-work-item--clickable:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
        }

        .kb-cockpit .kb-work-item__footer {
            margin-top: 8px;
        }

        .kb-cockpit .kb-work-item__action {
            display: inline-block;
            font-size: 12px;
            font-weight: 700;
            padding: 5px 10px;
            border-radius: 999px;
            background: rgba(0, 0, 0, 0.05);
            color: #333;
        }

        .kb-cockpit .kb-work-item--success .kb-work-item__action {
            background: rgba(31, 157, 85, 0.12);
            color: #166534;
        }

        .kb-cockpit .kb-work-item--warning .kb-work-item__action {
            background: rgba(245, 158, 11, 0.14);
            color: #92400e;
        }

        .kb-cockpit .kb-work-item--danger .kb-work-item__action {
            background: rgba(220, 38, 38, 0.12);
            color: #991b1b;
        }

        .kb-cockpit .kb-work-item--info .kb-work-item__action {
            background: rgba(37, 99, 235, 0.12);
            color: #1d4ed8;
        }

        .kb-cockpit .kb-two-line-th {
            line-height: 1.15;
            white-space: nowrap;
        }

        .kb-cockpit .kb-op-graph {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e5e7eb;
        }

        .kb-cockpit .kb-op-graph-row {
            display: grid;
            grid-template-columns: 120px 1fr 110px;
            gap: 8px;
            align-items: center;
            margin-bottom: 7px;
        }

        .kb-cockpit .kb-op-graph-label {
            font-size: 12px;
            color: #555;
        }

        .kb-cockpit .kb-op-graph-bar-wrap {
            height: 10px;
            border-radius: 999px;
            background: #eef2f7;
            overflow: hidden;
        }

        .kb-cockpit .kb-op-graph-bar {
            height: 100%;
            border-radius: 999px;
            transition: width 0.2s ease;
        }

        .kb-cockpit .kb-op-graph-bar--forderungen {
            background: #2563eb;
        }

        .kb-cockpit .kb-op-graph-bar--verbindlichkeiten {
            background: #dc2626;
        }

        .kb-cockpit .kb-op-graph-value {
            text-align: right;
            font-size: 12px;
            font-weight: 600;
            white-space: nowrap;
        }

        .kb-cockpit .kb-op-graph-netto {
            margin-top: 8px;
            font-size: 12px;
            text-align: right;
        }

        .kb-cockpit .kb-expected-liquidity-box {
            padding: 18px 26px;
            border: 1px solid #bbf7d0;
            border-left: 7px solid #16a34a;
            border-right: 7px solid #16a34a;
            border-radius: 14px;
            background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
            box-shadow: 0 3px 12px rgba(22, 163, 74, 0.14);
            text-align: center;
        }

        .kb-cockpit .kb-expected-liquidity-label {
            font-size: 13px;
            font-weight: 700;
            color: #166534;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .kb-cockpit .kb-expected-liquidity-value {
            font-size: 34px;
            line-height: 1.1;
            font-weight: 800;
            color: #15803d;
            margin-bottom: 6px;
            white-space: nowrap;
        }

        .kb-cockpit .kb-expected-liquidity-formula {
            font-size: 12px;
            color: #4b5563;
        }

        .kb-cockpit .kb-summary-row {
            display: flex;
            gap: 16px;
            align-items: stretch;
            margin-bottom: 18px;
        }

        .kb-cockpit .kb-fakturiert-box {
            flex: 0 0 auto;
            width: 260px;
            padding: 14px 20px;
            border: 1px solid #bae6fd;
            border-left: 7px solid #0284c7;
            border-right: 7px solid #0284c7;
            border-radius: 14px;
            background: linear-gradient(180deg, #f0f9ff 0%, #ffffff 100%);
            box-shadow: 0 3px 12px rgba(2, 132, 199, 0.12);
            text-align: center;
        }

        .kb-cockpit .kb-fakturiert-label {
            font-size: 12px;
            font-weight: 700;
            color: #075985;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
        }

        .kb-cockpit .kb-fakturiert-value {
            font-size: 26px;
            line-height: 1.1;
            font-weight: 800;
            color: #0369a1;
            margin-bottom: 5px;
            white-space: nowrap;
        }

        .kb-cockpit .kb-fakturiert-formula {
            font-size: 11px;
            color: #4b5563;
        }

        .kb-cockpit .kb-expected-liquidity-box {
            flex: 1 1 auto;
        }


        /* Что это:
        Визуально отделяет operative Hinweise от periodischen Kennzahlen.

        Зачем:
        Vorschau nächste Wochen und Kritische Forderungen sind aktueller Handlungsbedarf
        und не зависят от выбранного Monats-/Quartals-/Jahreszeitraum. */

        .kb-cockpit .kb-operative-section {
            margin-top: 18px;
            padding: 14px;
            border: 1px solid #dbeafe;
            border-left: 5px solid #2563eb;
            border-radius: 10px;
            background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
        }

        .kb-cockpit .kb-operative-header {
            margin-bottom: 12px;
        }

        .kb-cockpit .kb-operative-title {
            font-size: 15px;
            font-weight: 700;
            color: #1e3a8a;
        }

        .kb-cockpit .kb-operative-subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 3px;
        }

        .kb-cockpit .kb-operative-section .kb-small-box:last-child {
            margin-bottom: 0;
        }
    </style>

    <div class="kb-toolbar">
        <div>
            <strong>Buchhaltung Cockpit</strong>
            <div class="text-muted small">Journalbasierte Übersicht für Geschäftsführung und Buchhaltung</div>
        </div>

        <div style="display: flex; gap: 8px; align-items: center;">
            <label style="margin: 0;">Zeitraum</label>

            <select class="form-control input-sm" data-name="periodMode" style="width: 110px;">
                <option value="monat">Monat</option>
                <option value="quartal">Quartal</option>
                <option value="jahr">Jahr</option>
            </select>

            <select class="form-control input-sm" data-name="monthFilter" style="width: 120px;">
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

            <select class="form-control input-sm hidden" data-name="quarterFilter" style="width: 90px;">
                <option value="1">Q1</option>
                <option value="2">Q2</option>
                <option value="3">Q3</option>
                <option value="4">Q4</option>
            </select>

            <select class="form-control input-sm" data-name="yearFilter" style="width: 100px;"></select>

            <button type="button" class="btn btn-default btn-sm" data-action="kb-cockpit-print">
                <span class="fas fa-print"></span>
            </button>
        </div>
    </div>

    <div class="kb-status" data-name="cockpitStatus">
        Lade Buchhaltungsdaten ...
    </div>

    <ul class="nav nav-tabs kb-cockpit-tabs">
        <li class="active">
            <a href="#" data-action="kb-cockpit-tab" data-tab="gf">Geschäftsführung</a>
        </li>
        <li>
            <a href="#" data-action="kb-cockpit-tab" data-tab="buha">Buchhaltung</a>
        </li>
    </ul>

    <div class="kb-cockpit-tab-panel" data-tab-panel="gf">

        <div class="kb-kpi-grid">
            <div class="kb-kpi-card">
                <div class="kb-kpi-label">Umsatz netto</div>
                <div class="kb-kpi-value" data-kpi="umsatz">0,00 €</div>
            </div>

            <div class="kb-kpi-card">
                <div class="kb-kpi-label">Aufwand netto</div>
                <div class="kb-kpi-value" data-kpi="aufwand">0,00 €</div>
            </div>

            <div class="kb-kpi-card">
                <div class="kb-kpi-label">Basis-Ergebnis</div>
                <div class="kb-kpi-value" data-kpi="ergebnis">0,00 €</div>
            </div>

            <div class="kb-kpi-card">
                <div class="kb-kpi-label">Bankbewegung Zeitraum</div>
                <div class="kb-kpi-value" data-kpi="bank">0,00 €</div>
            </div>

            <div class="kb-kpi-card">
                <div class="kb-kpi-label">Offene Forderungen</div>
                <div class="kb-kpi-value" data-kpi="forderungen">0,00 €</div>
            </div>

            <div class="kb-kpi-card">
                <div class="kb-kpi-label">Offene Verbindlichkeiten (Abzug)</div>
                <div class="kb-kpi-value" data-kpi="verbindlichkeiten">0,00 €</div>
            </div>

            <div class="kb-kpi-card">
                <div class="kb-kpi-label">Steuer-Saldo</div>
                <div class="kb-kpi-value" data-kpi="steuer">0,00 €</div>
            </div>

            <div class="kb-kpi-card">
                <div class="kb-kpi-label">Liquiditätsbewegung</div>
                <div class="kb-kpi-value" data-kpi="liquiditaet">0,00 €</div>
            </div>
        </div>
        <div class="kb-summary-row">
            <div class="kb-fakturiert-box">
                <div class="kb-fakturiert-label">Fakturiert (brutto)</div>
                <div class="kb-fakturiert-value" data-kpi="fakturiert">0,00 €</div>
                <div class="kb-fakturiert-formula">Alle Rechnungen im Zeitraum</div>
            </div>
            <div class="kb-expected-liquidity-box">
                <div class="kb-expected-liquidity-label">Liquiditätsbild</div>
                <div class="kb-expected-liquidity-value" data-kpi="erwartete-liquiditaet">0,00 €</div>
                <div class="kb-expected-liquidity-formula">
                    Bankbewegung Zeitraum + offene Forderungen - offene Verbindlichkeiten
                </div>
            </div>
        </div>
        <div class="kb-chart-box">
            <div class="kb-box-title" data-name="umsatzChartTitle">
                Wirtschaftliches Ergebnis nach Monaten im Jahr
            </div>
            <canvas id="kb-chart-umsatz"></canvas>
        </div>

        <div class="kb-chart-box">
            <div class="kb-box-title" data-name="liquiditaetChartTitle">
                Liquiditätsbewegung nach Monaten im Jahr
            </div>
            <canvas id="kb-chart-liquiditaet"></canvas>
        </div>

        <div class="row">
            <div class="col-md-6">
                <div class="kb-small-box">
                    <div class="kb-box-title">Offene Posten</div>
                    <table class="table table-condensed">
                        <tbody>
                            <tr>
                                <td>Offene Forderungen</td>
                                <td class="text-right" data-open-item="forderungen">0,00 €</td>
                            </tr>
                            <tr>
                                <td>Offene Verbindlichkeiten / zu zahlen</td>
                                <td class="text-right" data-open-item="verbindlichkeiten">0,00 €</td>
                            </tr>
                            <tr>
                                <th>Netto-Position</th>
                                <th class="text-right" data-open-item="netto">0,00 €</th>
                            </tr>
                            <tr>
                                <th>Erwartete Liquidität</th>
                                <th class="text-right" data-open-item="erwartete-liquiditaet">0,00 €</th>
                            </tr>
                        </tbody>
                    </table>
                    <div class="kb-op-graph" data-name="offenePostenGraph">
                        <div class="kb-op-graph-row">
                            <div class="kb-op-graph-label">Forderungen</div>
                            <div class="kb-op-graph-bar-wrap">
                                <div class="kb-op-graph-bar kb-op-graph-bar--forderungen"
                                    data-op-bar="forderungen"
                                    style="width: 0%;"></div>
                            </div>
                            <div class="kb-op-graph-value" data-op-graph-value="forderungen">0,00 €</div>
                        </div>

                        <div class="kb-op-graph-row">
                            <div class="kb-op-graph-label">Verbindlichkeiten</div>
                            <div class="kb-op-graph-bar-wrap">
                                <div class="kb-op-graph-bar kb-op-graph-bar--verbindlichkeiten"
                                    data-op-bar="verbindlichkeiten"
                                    style="width: 0%;"></div>
                            </div>
                            <div class="kb-op-graph-value" data-op-graph-value="verbindlichkeiten">0,00 €</div>
                        </div>

                        <div class="kb-op-graph-netto">
                            Netto-Position:
                            <strong data-op-graph-value="netto">0,00 €</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="kb-small-box">
                    <div class="kb-box-title">Steuer-Saldo</div>
                    <table class="table table-condensed">
                        <tbody>
                            <tr>
                                <td>Umsatzsteuer</td>
                                <td class="text-right" data-tax="umsatzsteuer">0,00 €</td>
                            </tr>
                            <tr>
                                <td>Vorsteuer</td>
                                <td class="text-right" data-tax="vorsteuer">0,00 €</td>
                            </tr>
                            <tr>
                                <th>Saldo</th>
                                <th class="text-right" data-tax="saldo">0,00 €</th>
                            </tr>
                            <tr>
                                <th>Ergebnis</th>
                                <th class="text-right" data-tax="result">–</th>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <div class="kb-operative-section">
            <div class="kb-operative-header">
                <div class="kb-operative-title">Aktuelle operative Hinweise</div>
                <div class="kb-operative-subtitle">
                    Diese Blöcke sind unabhängig vom gewählten Zeitraum und zeigen den aktuellen Handlungsbedarf.
                </div>
            </div>

            <div class="kb-small-box">
                <div class="kb-box-title">Vorschau nächste Wochen</div>
                <div class="text-muted small" style="margin-bottom: 8px;">
                    Berechnet aus offenen, noch nicht überfälligen Ausgangs- und Eingangsrechnungen nach Fälligkeitsdatum.
                    Überfällige Forderungen bleiben separat unter kritischen Forderungen sichtbar.
                </div>

                <div class="table-responsive">
                    <table class="table table-bordered table-striped table-condensed">
                        <thead>
                            <tr>
                                <th>Zeitraum</th>
                                <th class="text-right">Erwartete Eingänge</th>
                                <th class="text-right">Erwartete Ausgänge</th>
                                <th class="text-right">Netto-Ausblick</th>
                                <th>Belege</th>
                            </tr>
                        </thead>
                        <tbody data-name="vorschauNaechsteWochenBody">
                            <tr>
                                <td colspan="5" class="text-muted">Noch keine Daten geladen.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="kb-small-box">
                <div class="kb-box-title">Kritische Forderungen</div>
                <div class="text-muted small" style="margin-bottom: 8px;">
                    Zuerst Forderungen ab 5.000 €, danach weitere kritische Forderungen nach Mahnstufe und Überfälligkeit.
                </div>

                <div class="table-responsive">
                    <table class="table table-bordered table-striped table-condensed">
                        <thead>
                            <tr>
                                <th>Kunde</th>
                                <th>Rechnung</th>
                                <th>Fällig am</th>
                                <th class="text-right">Tage überfällig</th>
                                <th class="text-right">Offener Betrag</th>
                                <th>Mahnstufe</th>
                                <th>Grund / Aktion</th>
                            </tr>
                        </thead>
                        <tbody data-name="topOpenForderungenBody">
                            <tr>
                                <td colspan="7" class="text-muted">Noch keine Daten geladen.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <div class="kb-cockpit-tab-panel hidden" data-tab-panel="buha">

        <div class="kb-kpi-grid">
            <div class="kb-kpi-card">
                <div class="kb-kpi-label">Prüfsaldo Soll/Haben</div>
                <div class="kb-kpi-value" data-check="pruefsaldo">0,00 €</div>
                <div class="small" data-check-status="pruefsaldo">–</div>
            </div>

            <div class="kb-kpi-card">
                <div class="kb-kpi-label">OP-Abstimmung Forderungen</div>
                <div class="kb-kpi-value" data-check="op-forderungen">0,00 €</div>
                <div class="small" data-check-status="op-forderungen">–</div>
            </div>

            <div class="kb-kpi-card">
                <div class="kb-kpi-label">OP-Abstimmung Verbindlichkeiten</div>
                <div class="kb-kpi-value" data-check="op-verbindlichkeiten">0,00 €</div>
                <div class="small" data-check-status="op-verbindlichkeiten">–</div>
            </div>

            <div class="kb-kpi-card">
                <div class="kb-kpi-label">Anzahl Buchungen</div>
                <div class="kb-kpi-value" data-check="anzahl-buchungen">0</div>
                <div class="small">
                    Soll: <span data-check="summe-soll">0,00 €</span> ·
                    Haben: <span data-check="summe-haben">0,00 €</span>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-6">
                <div class="kb-small-box">
                    <div class="kb-box-title">Steuerprüfung kompakt</div>

                    <div class="table-responsive">
                        <table class="table table-bordered table-striped table-condensed">
                            <thead>
                                <tr>
                                    <th>Konto</th>
                                    <th>Bezeichnung</th>
                                    <th>Steuerart</th>
                                    <th class="text-right">Wirkung</th>
                                </tr>
                            </thead>
                            <tbody data-name="taxCheckBody">
                                <tr>
                                    <td colspan="4" class="text-muted">Noch keine Daten geladen.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="col-md-6">
                <div class="kb-small-box">
                    <div class="kb-box-title">Offene-Posten-Abstimmung kompakt</div>

                    <div class="table-responsive">
                        <table class="table table-bordered table-striped table-condensed">
                            <thead>
                                <tr>
                                    <th>Bereich</th>
                                    <th class="text-right" data-name="opCheckJournalHeader">Journal</th>
                                    <th class="text-right" data-name="opCheckOperativHeader">Operativ</th>
                                    <th class="text-right">Differenz</th>
                                    <th class="text-right">Anzahl</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody data-name="opCheckBody">
                                <tr>
                                    <td colspan="6" class="text-muted">Noch keine Daten geladen.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        <div class="kb-small-box">
            <div class="kb-box-title">Detailberichte</div>

            <div data-name="detailReportButtons">
                <span class="text-muted">Berichte werden geladen ...</span>
            </div>

            <p class="text-muted small" style="margin-top: 8px; margin-bottom: 0;">
                Die Detailberichte öffnen die prüfbaren Phase-6-Auswertungen wie Summen- und Saldenliste,
                Kontenblatt, Steuerübersicht und Offene-Posten-Abstimmung.
            </p>
        </div>

        <div class="kb-small-box">
            <div class="kb-box-title">Kontenübersicht kompakt</div>
            <div class="table-responsive">
                <table class="table table-bordered table-striped table-condensed">
                    <thead>
                        <tr>
                            <th>Konto</th>
                            <th>Bezeichnung</th>
                            <th class="text-right">Soll</th>
                            <th class="text-right">Haben</th>
                            <th class="text-right kb-two-line-th">
                                <div>Technischer</div>
                                <div>Saldo</div>
                            </th>
                            <th class="text-right kb-two-line-th">
                                <div>Wirtschaftliche</div>
                                <div>Wirkung</div>
                            </th>
                            <th class="text-right">Buchungen</th>
                        </tr>
                    </thead>
                    <tbody data-name="kontenTableBody">
                        <tr>
                            <td colspan="7" class="text-muted">Noch keine Daten geladen.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class="kb-worklist-box">
            <div class="kb-worklist-header">
                <div>
                    <div class="kb-worklist-title">Auffälligkeiten / Arbeitsliste</div>
                    <div class="kb-worklist-subtitle">
                        Automatische Hinweise auf Basis der aktuellen Buchhaltungs- und Prüfdaten.
                    </div>
                </div>
            </div>

            <div class="kb-worklist-grid" data-name="arbeitslisteItems">
                <div class="kb-work-item kb-work-item--info">
                    <div class="kb-work-item__icon">i</div>
                    <div class="kb-work-item__content">
                        <div class="kb-work-item__title">Arbeitsliste wird geladen</div>
                        <div class="kb-work-item__text">Die Hinweise werden aus den aktuellen Dashboard-Daten aufgebaut.</div>
                        <div class="kb-work-item__meta">Bitte warten ...</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="kb-small-box">
            <div class="kb-box-title">Hinweise</div>
            <p class="text-muted" style="margin-bottom: 0;">
                Diese Ansicht ist eine kompakte Prüfsicht. Detailprüfungen erfolgen weiterhin über Summen- und Saldenliste, Kontenblatt, Steuerübersicht gesamt und Offene-Posten-Abstimmung.
                OP- und Forderungsblöcke zeigen den aktuellen operativen Stand und sind nicht auf den gewählten Zeitraum begrenzt.
            </p>
        </div>

    </div>
</div>