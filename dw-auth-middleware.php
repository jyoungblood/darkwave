<?php

// namespace DW\Auth;



use Slim\Psr7\Response;



// move this to a composer package



// fixit clean this up
  // this will be THE way we check auth and admin status



// desired usage
// \DWauth\restrict_admin
// })->add(new restrict_admin([
//   // show error template
//   'unauthorized_message' => 'unauthorized',
//   'status' => '401'
//   'response_type' => 'html' // shows on error template
//   'response_type' => 'json' // shows on error template
//   // or show redirect
//   'unauthorized_redirect' => '/'
//   'status' => '301'
// ]))->add(new authorize([
//   // just checks to see if this user is authorize, and it sets it with the system
//   // by default do nothing if not auth (you can handle that manually)
//   // or show error template
//   'unauthorized_message' => 'unauthorized',
//   'status' => '401'
//   'response_type' => 'html' // shows on error template
//   'response_type' => 'json' // shows on error template
//   // or show redirect
//   'unauthorized_redirect' => '/login'
//   'status' => '301'
// ]));


// want to use like psrjwt
// like: ->add(\PsrJwt\Factory\JwtMiddleware::json('Secret123!456$', 'jwt', 'Authorisation Failed'))
// https://dev.to/robdwaller/how-to-easily-add-jwts-to-slim-php-18g4



// fixit call next() like expressjs middleware (also like psrjwt)




// class dw_authorize_old
// {
//     private $params;
//     public function __construct($params = false)
//     {
//         $this->params = $params;
//     }

//     public function __invoke(\Psr\Http\Message\ServerRequestInterface $request, \Psr\Http\Server\RequestHandlerInterface $handler): Response
//     {

//       // echo $this->params['what'];


//       $jwt_factory = new \PsrJwt\Factory\Jwt();

//       $parser = $jwt_factory->parser(\VPHP\cookie::get('token'), $GLOBALS['settings']['jwt_secret']);
//       $parsed = $parser->parse()->getPayload();
//       if ($parsed['_id']){

//         $GLOBALS['user_id'] = $parsed['_id'];
//         $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
//         // fixit verify auth token?
//         // if (password_verify($GLOBALS['site_code'].'-'.$parsed['_id'], cookie::get('auth_token'))){
//           $GLOBALS['auth'] = true;
//           $GLOBALS['locals']['auth'] = $GLOBALS['auth'];

//     // $html = 'user_id="' . $parsed['_id'] .'" ';

//         if ($parsed['admin_token']){
//           if (password_verify($GLOBALS['site_code'], $parsed['admin_token'])){
//             $GLOBALS['is_admin'] = true;
//             $GLOBALS['locals']['is_admin'] = $GLOBALS['is_admin'];
//             $html .= '(ur admin)';
//           }
//         }
//       }

//   // fixit if not auth, redirect to login
//     // or send "not auth" json if it's an api route

// // echo $GLOBALS['locals']['auth'];


//       if (!$GLOBALS['auth'] && $this->params['redirect']){
//         $response = new Response();
//         return $response->withHeader('Location', $this->params['redirect'])->withStatus(302);
//       }else{

//           $response = $handler->handle($request);
//           $existingContent = (string) $response->getBody();
      
//           $response = new Response();


//           // 'BEFORE: ' . $html . 
//           $response->getBody()->write($existingContent);
      
//           return $response;
//       }

//     }
// }

































// NEW VERSION


class dw_authorize
{
    private $params;
    public function __construct($params = false)
    {
        $this->params = $params;
    }

    public function __invoke(\Psr\Http\Message\ServerRequestInterface $request, \Psr\Http\Server\RequestHandlerInterface $handler): Response
    {
      $cfg = $this->params;











// echo "huh";


  // fixit move to dw package (or global middleware)
  // if (isset($_COOKIE['token'])){
  //   $jwt_factory = new \PsrJwt\Factory\Jwt();

  //   $parser = $jwt_factory->parser($_COOKIE['token'], $GLOBALS['settings']['jwt_secret']);
  //   $parsed = $parser->parse()->getPayload();
  //   print_r($parsed);
  //   if ($parsed['_id']){

  //     // echo $parsed['_id'];
      
  //     $GLOBALS['user_id'] = $parsed['_id'];
  //     $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
  //     // fixit verify auth token?
  //     // if (password_verify($GLOBALS['site_code'].'-'.$parsed['_id'], cookie::get('auth_token'))){
  //       $GLOBALS['auth'] = true;
  //       $GLOBALS['locals']['auth'] = $GLOBALS['auth'];

  // // $html = 'user_id="' . $parsed['_id'] .'" ';

  //     if ($parsed['admin_token']){
  //       if (password_verify($GLOBALS['site_code'], $parsed['admin_token'])){
  //         $GLOBALS['is_admin'] = true;
  //         $GLOBALS['locals']['is_admin'] = $GLOBALS['is_admin'];
  //         // $html .= '(ur admin)';
  //       }
  //     }
  //   }
  //   // echo "yes token";
  // }
















      // echo $this->params['what'];



// print_r($this->params['test']);



// admin restriction

// $html = '';
// if ($GLOBALS['is_admin']){
//   $html = 'ADMING!!! --- ';
//   //  echo "ur admin";
//   // echo "aaaaadmin";
// }else{
//   // echo "no admin";
// }
// fixit show "unauthorized" error template if not admin
  // or send "unauthorized" json


  // return \Slime\render::hbs($request, new \Slim\Psr7\Response(), [
  //   'template' => 'error',
  //   'status' => 401,
  //   'title' => '401 - Unauthorized',
  //   'data' => [
  //     'status_code' => 401,
  //     'error_message' => isset($cfg['unauthorized_message']) ? $cfg['unauthorized_message'] : 'You are not authorized to view this page.'
  //   ]
  // ]);



















if ($GLOBALS['auth']){
      // echo 'yes auth';


  // fixit admin checking

  // continue with response
  // return $handler->handle($request);

          $response = $handler->handle($request);
          $existingContent = (string) $response->getBody();
      
          $response = new Response();


          // 'BEFORE: ' . $html . 
          $response->getBody()->write($existingContent);
      
          return $response;

}else{
  if ($cfg['unauthenticated']['redirect']){
    // redirect
    // return \Slime\render::redirect($req, new \Slim\Psr7\Response(), [ 'location' => $cfg['unauthenticated']['redirect'] ]);

    $response = new Response();
    return $response->withHeader('Location', $cfg['unauthenticated']['redirect'])->withStatus(302);

  }else{
    // return message
  }
}




          // $response = $handler->handle($request);
          // $existingContent = (string) $response->getBody();
      
          // $response = new Response();


          // // 'BEFORE: ' . $html . 
          // $response->getBody()->write($existingContent);
      
          // return $response;
























//   // fixit if not auth, redirect to login
//     // or send "not auth" json if it's an api route

// // echo $GLOBALS['locals']['auth'];
      
      // if (!$GLOBALS['auth'] && $this->params['redirect']){
      //   $response = new Response();
      //   return $response->withHeader('Location', $this->params['redirect'])->withStatus(302);
      // }else{

      //     $response = $handler->handle($request);
      //     $existingContent = (string) $response->getBody();
      
      //     $response = new Response();


      //     // 'BEFORE: ' . $html . 
      //     $response->getBody()->write($existingContent);
      
      //     return $response;
      // }






    }
}



















































// DELETING











// class dw_restrict_auth
// {
//     private $params;
//     public function __construct($params = false)
//     {
//         $this->params = $params;
//     }

//     public function __invoke(Request $request, RequestHandler $handler): Response
//     {


// $html = '';
// if ($GLOBALS['is_admin']){
//   $html = 'ADMING!!! --- ';
//   //  echo "ur admin";
//   // echo "aaaaadmin";
// }else{
//   // echo "no admin";
// }
// // fixit show "unauthorized" error template if not admin
//   // or send "unauthorized" json

//       if (!$GLOBALS['is_admin'] && $this->params['redirect']){
// // fixit why is the redirect not working?
//       // is it because it's not the only middleware? can we send this directive to the other auth check OR just die and send it now? (preferred)
//         // $response = new Response();
//         // return $response->withHeader('Location', $this->params['redirect'])->withStatus(302);

    
//         $response = new Response();

//         $response->getBody()->write('this should be a redirect but its not working for some reason.<br /><Br />
//         anyway, youre unauthorized...<a href="/">go home</a>');
//         return $response;
//       }else{

//         $response = $handler->handle($request);
//         $existingContent = (string) $response->getBody();
    
//         $response = new Response();



// //     $jwt_factory = new \PsrJwt\Factory\Jwt();

// //     $parser = $jwt_factory->parser(cookie::get('token'), $GLOBALS['settings']['jwt_secret']);
// //     $parsed = $parser->parse()->getPayload();
// //     $GLOBALS['user_id'] = $parsed['_id'];
// //     $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
// //     // fixit verify auth token?
// //     // if (password_verify($GLOBALS['site_code'].'-'.$parsed['_id'], cookie::get('auth_token'))){
// //       $GLOBALS['auth'] = true;
// //       $GLOBALS['locals']['auth'] = $GLOBALS['auth'];

// // $html = 'user_id="' . $parsed['_id'] .'" ';

// //     if ($parsed['admin_token']){
// //       if (password_verify($GLOBALS['site_code'], $parsed['admin_token'])){
// //         $html .= '(ur admin)';
// //       }
// //     }


//         // $html . 
//         $response->getBody()->write($existingContent);
    
//         return $response;

//       }
//     }
// }