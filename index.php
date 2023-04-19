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






/*
  ________/\\\\\\\\\\\\__________/\\\______________/\\\____       
   _______\/\\\////////\\\_______\/\\\_____________\/\\\____       
    _______\/\\\______\//\\\______\/\\\_____________\/\\\____      
     _______\/\\\_______\/\\\______\//\\\____/\\\____/\\\_____     
      _______\/\\\_______\/\\\_______\//\\\__/\\\\\__/\\\______    
       _______\/\\\_______\/\\\________\//\\\/\\\/\\\/\\\_______   
        _______\/\\\_______/\\\__________\//\\\\\\//\\\\\________  
         _______\/\\\\\\\\\\\\/____________\//\\\__\//\\\_________ 
          _______\////////////_______________\///____\///__________
  
            DARKWAVE - 0.6.0 - https://github.com/hxgf/darkwave
*/


require_once 'darkwave.php';
use Darkwave\dw;
dw::authenticate();




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
