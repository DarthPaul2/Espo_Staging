<?php
namespace Espo\Custom\Hooks\Account;

use Espo\ORM\Entity;
use Espo\ORM\EntityManager;
use Espo\Core\Utils\Log;

class FillShippingAdresse
{
    public static int $order = 5;

    public function __construct(
        private EntityManager $em,
        private Log $log
    ) {}

    public function beforeSave(Entity $entity, array $options = []): void
    {
        $id = $entity->getId() ?: 'NEW';
        $this->log->info("[FillShippingAdresse::Account] beforeSave ID={$id}");

        $streetBilling = trim((string) $entity->get('billingAddressStreet'));
        $hausnr        = trim((string) $entity->get('cHausnummer'));
        $streetShipping = trim((string) $entity->get('shippingAddressStreet'));

        $this->log->info(
            "[FillShippingAdresse::Account] billingStreet='{$streetBilling}', cHausnummer='{$hausnr}', shippingStreet='{$streetShipping}'"
        );

        // если чего-то нет — выходим
        if ($streetBilling === '' || $hausnr === '') {
            $this->log->info("[FillShippingAdresse::Account] skip: empty billingStreet or hausnummer");
            return;
        }

        // Строка, которую надо вставить
        $combined = trim($streetBilling . ' ' . $hausnr);

        $this->log->info(
            "[FillShippingAdresse::Account] combined new shippingStreet='{$combined}'"
        );

        // Обновляем shippingAddressStreet только если оно пустое или другое
        if ($streetShipping !== $combined) {
            $entity->set('shippingAddressStreet', $combined);
            $this->log->info("[FillShippingAdresse::Account] shippingAddressStreet updated");
        } else {
            $this->log->info("[FillShippingAdresse::Account] no change (already combined)");
        }
    }
}
