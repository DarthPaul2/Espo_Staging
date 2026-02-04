<?php
return [
  'actualDatabaseType' => 'mysql',
  'actualDatabaseVersion' => '8.0.45',
  'microtimeInternal' => 1770191537.939181,
  'instanceId' => 'ab6f82be-80a7-4ab3-98dd-fe0eef820244',
  'smtpPassword' => NULL,
  'logger' => [
    'path' => 'data/logs/espo.log',
    'level' => 'WARNING',
    'rotation' => true,
    'maxFileNumber' => 30,
    'printTrace' => false,
    'databaseHandler' => false,
    'sql' => false,
    'sqlFailed' => false
  ],
  'restrictedMode' => false,
  'cleanupAppLog' => true,
  'cleanupAppLogPeriod' => '30 days',
  'webSocketMessager' => 'ZeroMQ',
  'clientSecurityHeadersDisabled' => false,
  'clientCspDisabled' => false,
  'clientCspScriptSourceList' => [
    0 => 'https://maps.googleapis.com'
  ],
  'adminUpgradeDisabled' => false,
  'database' => [
    'host' => 'localhost',
    'port' => 3306,
    'charset' => 'utf8mb4',
    'dbname' => 'espocrm',
    'user' => 'pavel',
    'password' => 'klesec.481263!!',
    'driver' => 'pdo_mysql'
  ],
  'isInstalled' => true
];
