<?php

namespace Espo\Custom\Traits;

use Espo\Core\Record\SearchParamsFetcher;
use Espo\Core\Record\CreateParamsFetcher;
use Espo\Core\Record\ReadParamsFetcher;
use Espo\Core\Record\UpdateParamsFetcher;
use Espo\Core\Record\DeleteParamsFetcher;
use Espo\Core\Record\FindParamsFetcher;
use Espo\Core\Record\ServiceContainer as RecordServiceContainer;
use Espo\Core\Acl;
use Espo\Core\Utils\Config;
use Espo\Core\InjectableFactory;
use Espo\Entities\User;
use Espo\ORM\EntityManager;

/**
 * Kompatibilitäts-Shim: stellt $this->getEntityManager() wieder her, das die
 * Basis-Controller-Klasse (Espo\Core\Controllers\RecordBase) in dieser
 * Espo-Version nicht mehr bereitstellt.
 *
 * Der Konstruktor wird komplett mit der identischen Parameterliste von
 * RecordBase überschrieben (nur so wird EntityManager beim Bauen der
 * Controller-Instanz per Namens-Matching korrekt aus dem Container injiziert —
 * ein direktes injectableFactory->create(EntityManager::class) im Methodenrumpf
 * schlägt fehl, da EntityManager interne Abhängigkeiten braucht, die nur der
 * Container kennt, nicht die reflection-basierte Autowiring von create()).
 */
trait HasEntityManagerCompat
{
    private EntityManager $customEntityManager;

    public function __construct(
        SearchParamsFetcher $searchParamsFetcher,
        CreateParamsFetcher $createParamsFetcher,
        ReadParamsFetcher $readParamsFetcher,
        UpdateParamsFetcher $updateParamsFetcher,
        DeleteParamsFetcher $deleteParamsFetcher,
        RecordServiceContainer $recordServiceContainer,
        FindParamsFetcher $findParamsFetcher,
        Config $config,
        User $user,
        Acl $acl,
        InjectableFactory $injectableFactory,
        EntityManager $entityManager,
    ) {
        parent::__construct(
            $searchParamsFetcher,
            $createParamsFetcher,
            $readParamsFetcher,
            $updateParamsFetcher,
            $deleteParamsFetcher,
            $recordServiceContainer,
            $findParamsFetcher,
            $config,
            $user,
            $acl,
            $injectableFactory,
        );

        $this->customEntityManager = $entityManager;
    }

    protected function getEntityManager(): EntityManager
    {
        return $this->customEntityManager;
    }
}
