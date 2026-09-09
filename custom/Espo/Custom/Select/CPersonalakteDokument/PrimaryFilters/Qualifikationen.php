<?php
namespace Espo\Custom\Select\CPersonalakteDokument\PrimaryFilters;

use Espo\Core\Select\Primary\Filter;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\SelectBuilder;

class Qualifikationen implements Filter
{
    public function apply(SelectBuilder $queryBuilder): void
    {
        $queryBuilder->where(
            Cond::in(Cond::column('dokumentart'), [
                'Qualifikationen',
                'Führerschein',
                'Zertifikate',
                'Weiterbildungen',
                'Unterweisungen',
            ])
        );
    }
}
