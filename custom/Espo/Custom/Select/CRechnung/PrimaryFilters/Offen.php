<?php
namespace Espo\Custom\Select\CRechnung\PrimaryFilters;

use Espo\Core\Select\Primary\Filter;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\SelectBuilder;

class Offen implements Filter
{
    public function apply(SelectBuilder $queryBuilder): void
    {
        $queryBuilder->where(
            Cond::in(Cond::column('status'), ['offen', 'teilweise_bezahlt', 'versendet'])
        );
    }
}
