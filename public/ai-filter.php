<?php
/**
 * AI-Assistent → EspoCRM Deep Link
 *
 * Записывает фильтр напрямую в localStorage в формате EspoCRM
 * (ключ: espo-listSearch-{Entity}, значение: __JSON__:{...})
 * и переходит на список.  URL-параметры where EspoCRM игнорирует,
 * поэтому единственный надёжный способ — pre-populate localStorage.
 *
 * GET-параметры: entity=CRechnung, where=JSON, textFilter=string
 */
$entity     = preg_replace('/[^a-zA-Z0-9]/', '', $_GET['entity'] ?? 'CRechnung');
$whereJson  = $_GET['where'] ?? '[]';
$textFilter = $_GET['textFilter'] ?? '';

$where = json_decode($whereJson, true);
if (!is_array($where)) { $where = []; }

/**
 * Конвертирует список where-условий в EspoCRM advanced-filter объект.
 *
 * EspoCRM хранит в localStorage:
 *   - between: { type: "between", value: [date1, date2], data: {value: date1, valueTo: date2} }
 *     PHP backend принимает value как массив [0] и [1] (иначе 400 "Bad where item 'between'")
 *   - остальные: { type: "...", value: "..." }
 */
function buildAdvanced(array $where): array {
    $byAttr = [];
    foreach ($where as $cond) {
        $attr = $cond['attribute'] ?? '';
        if ($attr === '') continue;
        $byAttr[$attr][] = $cond;
    }

    $advanced = [];
    foreach ($byAttr as $attr => $conds) {
        $gte = null; $lte = null;
        foreach ($conds as $c) {
            if ($c['type'] === 'greaterThanOrEquals') $gte = $c;
            if ($c['type'] === 'lessThanOrEquals')    $lte = $c;
        }

        if ($gte && $lte) {
            // Диапазон дат → between
            // value ДОЛЖЕН быть массив [date1, date2] иначе PHP бросит 400
            $d1 = (string)($gte['value'] ?? '');
            $d2 = (string)($lte['value'] ?? '');
            $advanced[$attr] = [
                'type'  => 'between',
                'value' => [$d1, $d2],        // массив для PHP backend
                'data'  => ['value' => $d1, 'valueTo' => $d2], // для отображения в search panel
            ];
        } else {
            foreach ($conds as $c) {
                $type = $c['type'] ?? 'equals';
                $val  = $c['value'] ?? null;
                // EspoCRM enum-Felder erwarten type=in mit Array-Wert
                if ($type === 'equals' && $val !== null && !is_array($val)) {
                    $entry = ['type' => 'in', 'value' => [$val]];
                } else {
                    $entry = ['type' => $type];
                    if ($val !== null) $entry['value'] = $val;
                }
                $advanced[$attr] = $entry;
            }
        }
    }
    return $advanced;
}

$advanced    = buildAdvanced($where);
$entityJson  = json_encode($entity);
$advancedJson = json_encode($advanced, JSON_UNESCAPED_UNICODE);
$textJson    = json_encode($textFilter);
// Хэш для навигации — только с textFilter, where игнорируются EspoCRM из URL
$hashBase    = '#' . $entity;
if ($textFilter !== '') {
    $hashBase .= '?textFilter=' . rawurlencode($textFilter);
}
$hashJson    = json_encode($hashBase);
?><!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>EspoCRM öffnen…</title>
<style>
 body{font-family:system-ui,sans-serif;display:flex;align-items:center;
      justify-content:center;height:100vh;margin:0;background:#f1f5f9;}
 .box{text-align:center;color:#475569;}
 .spin{font-size:32px;animation:spin 1s linear infinite;display:inline-block;}
 @keyframes spin{to{transform:rotate(360deg)}}
</style>
</head>
<body>
<div class="box">
  <div class="spin">⏳</div>
  <p>EspoCRM wird geöffnet…</p>
</div>
<script>
(function(){
  var entity   = <?= $entityJson ?>;
  var advanced = <?= $advancedJson ?>;
  var hash     = <?= $hashJson ?>;

  // EspoCRM хранит состояние поиска в localStorage:
  //   ключ:    espo-listSearch-{Entity}
  //   значение: __JSON__:{"advanced":{...},"bool":{}}
  // Записываем нужный фильтр ДО навигации — EspoCRM подхватит его при загрузке.
  try {
    var storageKey = 'espo-listSearch-' + entity;
    var data = { advanced: advanced, bool: {} };
    localStorage.setItem(storageKey, '__JSON__:' + JSON.stringify(data));
  } catch(e) {}

  window.location.replace('/' + hash);
})();
</script>
</body>
</html>
