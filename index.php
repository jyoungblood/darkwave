<?php

/*

  ███████╗ ██╗      ██╗ ███╗   ███╗ ███████╗
  ██╔════╝ ██║      ██║ ████╗ ████║ ██╔════╝
  ███████╗ ██║      ██║ ██╔████╔██║ █████╗  
  ╚════██║ ██║      ██║ ██║╚██╔╝██║ ██╔══╝  
  ███████║ ███████╗ ██║ ██║ ╚═╝ ██║ ███████╗
  ╚══════╝ ╚══════╝ ╚═╝ ╚═╝     ╚═╝ ╚══════╝
                                        
  1.2.0 - https://github.com/hxgf/slime

*/


use Slim\Factory\AppFactory;
use VPHP\db;
use Slime\render;

require __DIR__ . '/vendor/autoload.php';
require 'settings.php';

$app = AppFactory::create();

$app->addBodyParsingMiddleware();

$GLOBALS['database'] = isset($GLOBALS['settings']['database']) ? db::init($GLOBALS['settings']['database']) : false;











// tmp auth "middleware" from stereo version

use VPHP\cookie;

if (cookie::get('user_id')){
  $GLOBALS['user_id'] = cookie::get('user_id');
  $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
  if (cookie::get('group_id')){
    $GLOBALS['group_id'] = cookie::get('group_id');
    $GLOBALS['locals']['group_id'] = $GLOBALS['group_id'];
  }
  if (password_verify($GLOBALS['site_code'].'-'.cookie::get('user_id'), cookie::get('auth_token'))){
    $GLOBALS['auth'] = true;
    $GLOBALS['locals']['auth'] = $GLOBALS['auth'];
  }
  if (cookie::get('admin_token')){
    if (password_verify($GLOBALS['site_code'], cookie::get('admin_token'))){
      $GLOBALS['is_admin'] = true;
      $GLOBALS['locals']['is_admin'] = $GLOBALS['is_admin'];
    }
  }
  if (cookie::get('moderator_token')){
    if (password_verify($GLOBALS['site_code'].'-moderator', cookie::get('moderator_token'))){
      $GLOBALS['is_moderator'] = true;
      $GLOBALS['locals']['is_moderator'] = $GLOBALS['is_moderator'];
    }
  }
}












$errorMiddleware = $app->addErrorMiddleware(false, false, false);

$errorMiddleware->setErrorHandler(\Slim\Exception\HttpNotFoundException::class, function (
  \Psr\Http\Message\ServerRequestInterface $request,
  \Throwable $exception,
  bool $displayErrorDetails,
  bool $logErrors,
  bool $logErrorDetails
) {
  return render::hbs($request, new \Slim\Psr7\Response(), [
    'template' => '404',
    'status' => 404,
    'title' => '404 NOT FOUND',
  ]);
});

require 'controllers/index.php';

$app->run();
