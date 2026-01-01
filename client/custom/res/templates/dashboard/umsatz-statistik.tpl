<div class="kls-stat-dashboard">
    <div class="kls-print-btn-container" style="text-align: right; margin-bottom: 10px;">
        <button class="btn btn-default btn-sm kls-print-btn">
            <span class="fas fa-print"></span> Drucken
        </button>
    </div>
    <div class="kls-stat-header">
        <div class="kls-stat-title">
            <span class="kls-stat-title-main">Umsatz & Zahlungen</span>
            <span class="kls-stat-title-sub">Rechnungen nach Jahr und Monat</span>
        </div>
        
        <div class="kls-stat-controls">
            <label>
                Jahr:
                <select data-name="yearFilter" class="form-control input-sm kls-year-select"></select>
            </label>
            
        </div>
    </div>

    <div class="kls-stat-kpi-row">

        <div class="kls-kpi-card kls-kpi--umsatz">
            <div class="kls-kpi__label">Umsatz (gestellt)</div>
            <div class="kls-kpi__value kls-kpi__value-netto">–</div>
            <div class="kls-kpi__sub">Netto</div>
            <div class="kls-kpi__value kls-kpi__value-brutto kls-kpi__value--small">–</div>
            <div class="kls-kpi__sub">Brutto</div>
        </div>

        <div class="kls-kpi-card kls-kpi--bezahlt">
            <div class="kls-kpi__label">Bezahlt</div>
            <div class="kls-kpi__value kls-kpi__value-netto">–</div>
            <div class="kls-kpi__sub">Netto</div>
            <div class="kls-kpi__value kls-kpi__value-brutto kls-kpi__value--small">–</div>
            <div class="kls-kpi__sub">Brutto</div>
        </div>

        <div class="kls-kpi-card kls-kpi--offen">
            <div class="kls-kpi__label">Offene Posten</div>
            <div class="kls-kpi__value kls-kpi__value-netto">–</div>
            <div class="kls-kpi__sub">Netto</div>
            <div class="kls-kpi__value kls-kpi__value-brutto kls-kpi__value--small">–</div>
            <div class="kls-kpi__sub">Brutto</div>
        </div>

        <div class="kls-kpi-card kls-kpi--gesamt">
            <div class="kls-kpi__label">Gesamt (alle Rechnungen)</div>
            <div class="kls-kpi__value kls-kpi__value-total">–</div>
            <div class="kls-kpi__sub kls-kpi__line-bezahlt">–</div>
            <div class="kls-kpi__sub kls-kpi__line-offen">–</div>
        </div>

    </div>

    <div class="kls-stat-charts">
        <div class="kls-chart-block">
            <div class="kls-chart-title">Monatliche Entwicklung (Netto)</div>
            <div class="kls-chart-wrapper">
                <canvas id="kls-chart-month"></canvas>
            </div>
        </div>

        <div class="kls-chart-block kls-chart-block--small">
            <div class="kls-chart-title">Jahresübersicht (Netto)</div>
            <div class="kls-chart-wrapper">
                <canvas id="kls-chart-year"></canvas>
            </div>
        </div>
    </div>
    <div class="kls-stat-table-block">
    <div class="kls-table-title">Monatliche Übersicht (Netto & Anzahl)</div>

    <table class="kls-stat-table table table-condensed">
        <thead>
            <tr data-name="monthTableHeader">
                <!-- сюда JS вставит заголовки месяцев -->
            </tr>
        </thead>
        <tbody>
            <tr data-row-type="gestellt">
                <!-- Gestellt: будет заполнено JS -->
            </tr>
            <tr data-row-type="bezahlt">
                <!-- Bezahlt: будет заполнено JS -->
            </tr>
            <tr data-row-type="offen">
                <!-- Offen: будет заполнено JS -->
            </tr>
        </tbody>
    </table>
</div>


</div>
