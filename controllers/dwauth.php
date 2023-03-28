<?php
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response;
use VPHP\cookie;





// fixit clean this up
  // this will be THE way we check auth and admin status


class is_auth
{
    /**
     * Example middleware invokable class
     *
     * @param  ServerRequest  $request PSR-7 request
     * @param  RequestHandler $handler PSR-15 request handler
     *
     * @return Response
     */
    public function __invoke(Request $request, RequestHandler $handler): Response
    {



    $jwt_factory = new \PsrJwt\Factory\Jwt();

    $parser = $jwt_factory->parser(cookie::get('token'), $GLOBALS['settings']['jwt_secret']);
    $parsed = $parser->parse()->getPayload();
    $GLOBALS['user_id'] = $parsed['_id'];
    $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
    // fixit verify auth token?
    // if (password_verify($GLOBALS['site_code'].'-'.$parsed['_id'], cookie::get('auth_token'))){
      $GLOBALS['auth'] = true;
      $GLOBALS['locals']['auth'] = $GLOBALS['auth'];

// $html = 'user_id="' . $parsed['_id'] .'" ';

    if ($parsed['admin_token']){
      if (password_verify($GLOBALS['site_code'], $parsed['admin_token'])){
        $GLOBALS['is_admin'] = true;
        $GLOBALS['locals']['is_admin'] = $GLOBALS['is_admin'];
        $html .= '(ur admin)';
      }
    }

  // fixit if not auth, redirect to login
    // or send "not auth" json if it's an api route

// echo $GLOBALS['locals']['auth'];
      


        $response = $handler->handle($request);
        $existingContent = (string) $response->getBody();
    
        $response = new Response();


        // 'BEFORE: ' . $html . 
        $response->getBody()->write($existingContent);
    
        return $response;
    }
}





class is_admin
{
    /**
     * Example middleware invokable class
     *
     * @param  ServerRequest  $request PSR-7 request
     * @param  RequestHandler $handler PSR-15 request handler
     *
     * @return Response
     */
    public function __invoke(Request $request, RequestHandler $handler): Response
    {


$html = '';
if ($GLOBALS['is_admin']){
  $html = 'ADMING!!! --- ';
  // echo "aaaaadmin";
}
// fixit show "unauthorized" error template if not admin
  // or send "unauthorized" json

        $response = $handler->handle($request);
        $existingContent = (string) $response->getBody();
    
        $response = new Response();



//     $jwt_factory = new \PsrJwt\Factory\Jwt();

//     $parser = $jwt_factory->parser(cookie::get('token'), $GLOBALS['settings']['jwt_secret']);
//     $parsed = $parser->parse()->getPayload();
//     $GLOBALS['user_id'] = $parsed['_id'];
//     $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
//     // fixit verify auth token?
//     // if (password_verify($GLOBALS['site_code'].'-'.$parsed['_id'], cookie::get('auth_token'))){
//       $GLOBALS['auth'] = true;
//       $GLOBALS['locals']['auth'] = $GLOBALS['auth'];

// $html = 'user_id="' . $parsed['_id'] .'" ';

//     if ($parsed['admin_token']){
//       if (password_verify($GLOBALS['site_code'], $parsed['admin_token'])){
//         $html .= '(ur admin)';
//       }
//     }


        // $html . 
        $response->getBody()->write($existingContent);
    
        return $response;
    }
}