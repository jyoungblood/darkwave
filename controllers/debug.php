<?php


use Slime\render;



$app->get('/elements[/]', function ($req, $res, $args) {

  return render::hbs($req, $res, [
    'layout' => '_layouts/base',
    'template' => 'elements',
    'title' => 'All Elements - ' . $GLOBALS['site_title'],
    'data' => [

    ]
  ]);

});






$app->get('/htmldemod[/]', function ($req, $res, $args) {

  // return render::redirect($req, $res, '/accounts');
  // echo "what";
  return render::html($req, $res, '/huh/what.html');

});










// $app->get('/token-validate[/]', function ($req, $res, $args) {
//   return render::html($req, $res, 'valid for everyone');
// })->add(\PsrJwt\Factory\JwtMiddleware::html($GLOBALS['settings']['jwt_secret'], 'token', '<meta http-equiv="refresh" content="0; url=/login">'));











// use ReallySimpleJWT\Parse;
// use ReallySimpleJWT\Jwt;
// use ReallySimpleJWT\Decode;

$app->get('/token-debug[/]', function ($req, $res, $args) {

  // this works

  // $token = \VPHP\cookie::get('token');

  // $jwt = new Jwt($token, $GLOBALS['settings']['jwt_secret']);

  // $parse = new Parse($jwt, new Decode());

  // $parsed = $parse->parse();

  // // // Return the token header claims as an associative array.
  // print_r($parsed->getHeader());

  // // // Return the token payload claims as an associative array.
  // print_r($parsed->getPayload());



  $jwt_factory = new \PsrJwt\Factory\Jwt();

  // $parser = $jwt_factory->parser(\VPHP\cookie::get('token'), $GLOBALS['settings']['jwt_secret']);

  // // // var_dump($parser);

  // // // $parser->validate();

  // $parsed = $parser->parse()->getPayload();
  // // var_dump($parsed);



  // $html = "user_id: " . $parsed['_id'];

  $html = '';

  return render::html($req, $res, 'jesus loves you<br />' . $html);

});



$app->get('/token[/]', function ($req, $res, $args) {


$jwt_factory = new \PsrJwt\Factory\Jwt();

$token = $jwt_factory->builder()->setSecret($GLOBALS['settings']['jwt_secret'])
    ->setPayloadClaim('_id', '63ae4eabdc8ea63ae4eabdc8eb')
    ->setPayloadClaim('group_id', 1)
    ->setPayloadClaim('is_admin', 1)
    ->build();

  $data = [
    'token' => $token->getToken()
  ];

	return render::json($req, $res, $data);

});


