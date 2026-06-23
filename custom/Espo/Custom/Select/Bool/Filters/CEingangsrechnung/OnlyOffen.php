<?php
namespace Espo\Custom\Select\Bool\Filters\CEingangsrechnung;

use Espo\Core\Select\Bool\Filter;
use Espo\ORM\Query\Part\Condition as Cond;
use Espo\ORM\Query\Part\Where\OrGroupBuilder;
use Espo\ORM\Query\SelectBuilder;

class OnlyOffen implements Filter
{
    public function apply(SelectBuilder $queryBuilder, OrGroupBuilder $orGroupBuilder): void
    {
        $orGroupBuilder->add(
            Cond::in(Cond::column('zahlungsstatus'), ['offen', 'teilweise_bezahlt'])
        );
    }
}
