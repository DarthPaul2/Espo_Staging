<?php

namespace Espo\Custom\Hooks\CPersonalakte;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;

/**
 * Что это:
 * Before-Save-Hook für CPersonalakte.
 *
 * Зачем:
 * Weist beim Anlegen einer neuen Personalakte automatisch die nächste freie
 * Personalnummer zu (Format "KSN-<Zahl>", Pavel, 03.09.2026). Grundlage ist die
 * höchste bereits vergebene Nummer — unabhängig davon, ob der zugehörige Benutzer
 * noch aktiv ist (ausgeschiedene Mitarbeiter zählen mit). Datensätze, deren Name
 * mit "TEST" beginnt, werden bei der Ermittlung ignoriert. Ist bereits eine
 * Personalnummer gesetzt (z.B. Pavels eigene "KSN-1001"), wird nichts verändert.
 */
class AssignPersonalnummer
{
    private const PREFIX = 'KSN-';
    private const START_NUMBER = 1001;

    public function __construct(
        private EntityManager $entityManager
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        if (!$entity->isNew()) {
            return;
        }

        if ((string) ($entity->get('personalnummer') ?? '') !== '') {
            return;
        }

        $entity->set('personalnummer', self::PREFIX . $this->getNextNumber());
    }

    private function getNextNumber(): int
    {
        $list = $this->entityManager
            ->getRDBRepository('CPersonalakte')
            ->select(['id', 'name', 'personalnummer'])
            ->where([
                'personalnummer!=' => null,
            ])
            ->find();

        $max = self::START_NUMBER - 1;

        foreach ($list as $item) {
            $name = (string) ($item->get('name') ?? '');

            if (str_starts_with($name, 'TEST')) {
                continue;
            }

            $value = (string) $item->get('personalnummer');

            if (!str_starts_with($value, self::PREFIX)) {
                continue;
            }

            $numberPart = substr($value, strlen(self::PREFIX));

            if (!ctype_digit($numberPart)) {
                continue;
            }

            $number = (int) $numberPart;

            if ($number > $max) {
                $max = $number;
            }
        }

        return $max + 1;
    }
}
