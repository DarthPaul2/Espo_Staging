<?php
namespace Espo\Custom\Hooks\CLieferschein;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class FillLieferadresse
{
    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        if ($entity->get('accountId') && !$entity->get('lieferadresseStreet')) {

            $account = $this->em->getEntity('Account', $entity->get('accountId'));
            if ($account) {

                // 🔹 Берём Straße и Hausnummer
                $street  = (string) $account->get('billingAddressStreet');       // z. B. "Florenweg"
                $hausnr  = (string) $account->get('cHausnummer');               // z. B. "1"

                // 🔹 Склеиваем с пробелом, если Hausnummer есть
                $fullStreet = trim($street . ' ' . $hausnr);

                $entity->set('lieferadresseStreet', $fullStreet);
                $entity->set('lieferadresseCity', $account->get('billingAddressCity'));
                $entity->set('lieferadressePostalCode', $account->get('billingAddressPostalCode'));
                $entity->set('lieferadresseCountry', $account->get('billingAddressCountry'));
                $entity->set('lieferadresseState', $account->get('billingAddressState'));
            }
        }
    }
}
