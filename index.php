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














// this works - just applying to every route
  // fixit make an invokable version?

// $beforeMiddleware = function (\Psr\Http\Message\ServerRequestInterface $request, \Psr\Http\Server\RequestHandlerInterface $handler) {
//   $response = $handler->handle($request);
//   $existingContent = (string) $response->getBody();

//   $response = new \Slim\Psr7\Response();



//     $jwt_factory = new \PsrJwt\Factory\Jwt();

//     $parser = $jwt_factory->parser(cookie::get('token'), $GLOBALS['settings']['jwt_secret']);
//     $parsed = $parser->parse()->getPayload();

//     $GLOBALS['user_id'] = $parsed['_id'];
//     $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
//     // fixit verify auth token?
//     // if (password_verify($GLOBALS['site_code'].'-'.$parsed['_id'], cookie::get('auth_token'))){
//       $GLOBALS['auth'] = true;
//       $GLOBALS['locals']['auth'] = $GLOBALS['auth'];

//     if ($parsed['admin_token']){
//       if (password_verify($GLOBALS['site_code'], $parsed['admin_token'])){
//         $GLOBALS['is_admin'] = true;
//         $GLOBALS['locals']['is_admin'] = $GLOBALS['is_admin'];
//       }
//     }


//   $response->getBody()->write($html . $existingContent);
//   return $response;

// };

// $app->add($beforeMiddleware);
























// fixit make this work


































// use Psr\Http\Message\ResponseInterface as Response;
// use Psr\Http\Message\ServerRequestInterface as Request;
// use Psr\Http\Server\RequestHandlerInterface as RequestHandler;



// $mw = function (Request $request, RequestHandler $handler) {
//     $response = $handler->handle($request);
//     // $response->getBody()->write('World');



//     $jwt_factory = new \PsrJwt\Factory\Jwt();

//     $parser = $jwt_factory->parser(cookie::get('token'), $GLOBALS['settings']['jwt_secret']);
//     $parsed = $parser->parse()->getPayload();

//     $GLOBALS['user_id'] = $parsed['_id'];
//     $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
//     // fixit verify auth token?
//     // if (password_verify($GLOBALS['site_code'].'-'.$parsed['_id'], cookie::get('auth_token'))){
//       $GLOBALS['auth'] = true;
//       $GLOBALS['locals']['auth'] = $GLOBALS['auth'];

//     if ($parsed['admin_token']){
//       if (password_verify($GLOBALS['site_code'], $parsed['admin_token'])){
//         $GLOBALS['is_admin'] = true;
//         $GLOBALS['locals']['is_admin'] = $GLOBALS['is_admin'];
//       }
//     }
    

//     return $response;
// };






// $app->get('/what', function (Request $request, Response $response, $args) {
//     $response->getBody()->write('Hello ');

//     return $response;
// })->add($mw);


// $app->add(new Tuupola\Middleware\JwtAuthentication([
//     "secret" => "supersecretkeyyoushouldnotcommittogithub"
// ]));



// tmp auth "middleware" from stereo version

// use VPHP\cookie;
// if (cookie::get('user_id')){
//   $GLOBALS['user_id'] = cookie::get('user_id');
//   $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
//   if (password_verify($GLOBALS['site_code'].'-'.cookie::get('user_id'), cookie::get('auth_token'))){
//     $GLOBALS['auth'] = true;
//     $GLOBALS['locals']['auth'] = $GLOBALS['auth'];
//   }
//   if (cookie::get('admin_token')){
//     if (password_verify($GLOBALS['site_code'], cookie::get('admin_token'))){
//       $GLOBALS['is_admin'] = true;
//       $GLOBALS['locals']['is_admin'] = $GLOBALS['is_admin'];
//     }
//   }
// }











$errorMiddleware = $app->addErrorMiddleware(true, true, true);

// $errorMiddleware = $app->addErrorMiddleware(false, false, false);

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
