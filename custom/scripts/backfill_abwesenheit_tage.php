#!/usr/bin/env php
<?php
// Однократный backfill cUrlaubTage/cKrankTage для всех активных пользователей.

chdir('/var/www/espocrm-staging');
require 'bootstrap.php';

use Espo\Core\Application;
use Espo\Custom\Hooks\CAbwesenheit\RecalcUserTage;

$app = new Application();
$container = $app->getContainer();

/** @var \Espo\ORM\EntityManager $em */
$em = $container->get('entityManager');

$users = $em->getRepository('User')
    ->where(['deleted' => false])
    ->find();

foreach ($users as $user) {
    [$urlaub, $krank] = RecalcUserTage::calc($em, $user->getId());

    $user->set('cUrlaubTage', $urlaub);
    $user->set('cKrankTage', $krank);
    $em->saveEntity($user, ['skipHooks' => true, 'silent' => true]);

    echo $user->get('userName') . ": Urlaub={$urlaub}, Krank={$krank}\n";
}

echo "DONE\n";
