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








// DW


  // authentication checks

  if (isset($_COOKIE['token'])){
    $jwt_factory = new \PsrJwt\Factory\Jwt();
    $parser = $jwt_factory->parser($_COOKIE['token'], $GLOBALS['settings']['jwt_secret']);
    $parsed = $parser->parse()->getPayload();
    if ($parsed['_id']){      
      $GLOBALS['user_id'] = $parsed['_id'];
      $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
      // fixit verify auth token?
      // if (password_verify($GLOBALS['site_code'].'-'.$parsed['_id'], cookie::get('auth_token'))){
        $GLOBALS['auth'] = true;
        $GLOBALS['locals']['auth'] = $GLOBALS['auth'];
      if ($parsed['admin_token']){
        if (password_verify($GLOBALS['site_code'], $parsed['admin_token'])){
          $GLOBALS['is_admin'] = true;
          $GLOBALS['locals']['is_admin'] = $GLOBALS['is_admin'];
        }
      }
    }
  }



  // custom error handling

  if ($GLOBALS['settings']['mode'] == 'development'){
    $errorMiddleware = $app->addErrorMiddleware(true, true, true);
  }else{
    $errorMiddleware = $app->addErrorMiddleware(false, false, false);
  }

  $errorMiddleware->setErrorHandler(\Slim\Exception\HttpNotFoundException::class, function (
    \Psr\Http\Message\ServerRequestInterface $request,
    \Throwable $exception,
    bool $displayErrorDetails,
    bool $logErrors,
    bool $logErrorDetails
  ) {
    return render::hbs($request, new \Slim\Psr7\Response(), [
      'template' => 'error',
      'status' => 404,
      'title' => '404 - NOT FOUND',
      'data' => [
        'status_code' => 404,
        'error_message' => 'This page could not be found.'
      ]
    ]);
  });












require 'controllers/index.php';

$app->run();
