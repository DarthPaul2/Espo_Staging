<?php
namespace Espo\Custom\Select\CEingangsrechnung\PrimaryFilters;

use Espo\Core\Select\Primary\Filter;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\SelectBuilder;

class Bezahlt implements Filter
{
    public function apply(SelectBuilder $queryBuilder): void
    {
        $queryBuilder->where(
            Cond::equal(Cond::column('zahlungsstatus'), 'bezahlt')
        );
    }
}
