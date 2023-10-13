<?php

/*
  ▲▼ DARKWAVE - 0.6.1 - https://github.com/hxgf/darkwave
  based on Slime - 1.2.1 - https://github.com/hxgf/slime
*/

require __DIR__ . '/vendor/autoload.php';
require 'darkwave.php';

\Dotenv\Dotenv::createImmutable(__DIR__)->load();

$app = \Slim\Factory\AppFactory::create();
$app->addBodyParsingMiddleware();

$GLOBALS['locals'] = [ 'year' => date('Y'), 'site_title' => isset($_ENV['SITE_TITLE']) ? $_ENV['SITE_TITLE'] : false, 'site_code' => isset($_ENV['SITE_CODE']) ? $_ENV['SITE_CODE'] : false, 'site_url' => isset($_ENV['SITE_URL']) ? $_ENV['SITE_URL'] : false ];
$GLOBALS['database'] = isset($_ENV['DB_HOST']) ? \VPHP\db::init([ 'host' => $_ENV['DB_HOST'], 'name' => $_ENV['DB_NAME'], 'user' => $_ENV['DB_USER'], 'password' => $_ENV['DB_PASSWORD'] ]) : false;

\Darkwave\dw::authenticate();

$errorMiddleware = isset($_ENV['SITE_MODE']) && $_ENV['SITE_MODE'] == 'development' ? $app->addErrorMiddleware(true, true, true) : $app->addErrorMiddleware(false, false, false);

$errorMiddleware->setErrorHandler(\Slim\Exception\HttpNotFoundException::class, function ( \Psr\Http\Message\ServerRequestInterface $request, \Throwable $exception, bool $displayErrorDetails, bool $logErrors, bool $logErrorDetails ) {
  return \Slime\render::hbs($request, new \Slim\Psr7\Response(), [
    'template' => 'dw/error',
    'title' => '404 - NOT FOUND',
    'data' => [
      'status_code' => 404,
      'error_message' => 'This page could not be found.'
    ]
  ], 404);
});

require 'controllers/index.php';

$app->run();
