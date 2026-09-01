<?php

namespace Espo\Custom;

use Espo\Core\Binding\Binder;
use Espo\Core\Binding\BindingProcessor;

class Binding implements BindingProcessor
{
    public function process(Binder $binder): void
    {
        $binder->bindImplementation(
            'Espo\\Modules\\Crm\\Tools\\Calendar\\Service',
            'Espo\\Custom\\Classes\\Calendar\\Service'
        );
    }
}
