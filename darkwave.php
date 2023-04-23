<?php

/**
 * @package    DW Utilities (PHP)
 * @version    0.1.0
 * @author     Jonathan Youngblood <jy@hxgf.io>
 * @license    https://github.com/hxgf/dw-utilities-php/blob/master/LICENSE.md (MIT License)
 * @source     https://github.com/hxgf/dw-utilities-php
 */

namespace Darkwave;

class dw {

	public static function client_ip(){
	  if (!empty($_SERVER['HTTP_CLIENT_IP'])){
	    $ip = $_SERVER['HTTP_CLIENT_IP'];
	  }elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])){
	    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
	  }else{
	    $ip = $_SERVER['REMOTE_ADDR'];
	  }
	  return $ip;
	}

	// parse the JWT 'token' cookie and set global authentication variables
  public static function authenticate(){
    if (isset($_COOKIE['token'])){
      $jwt_factory = new \PsrJwt\Factory\Jwt();
      $parser = $jwt_factory->parser($_COOKIE['token'], $_ENV['JWT_SECRET']);
      $parsed = $parser->parse()->getPayload();
      if ($parsed['_id']){
        $GLOBALS['auth'] = true;
        $GLOBALS['user_id'] = $parsed['_id'];
        $GLOBALS['identity'] = [
          'name' => $parsed['name'],
          'screenname' => $parsed['screenname'],
          'avatar_url' => $parsed['avatar_url'],
        ];
        $GLOBALS['locals']['auth'] = $GLOBALS['auth'];
        $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
        $GLOBALS['locals']['identity'] = $GLOBALS['identity'];
        if ($parsed['admin_token']){
          if (password_verify($_ENV['SITE_CODE'], $parsed['admin_token'])){
            $GLOBALS['is_admin'] = true;
            $GLOBALS['locals']['is_admin'] = $GLOBALS['is_admin'];
          }
        }
      }
    }
  }

  public static function generate_jwt($user){
    $jwt_factory = new \PsrJwt\Factory\Jwt();
    $token = $jwt_factory->builder()->setSecret($_ENV['JWT_SECRET'])
      ->setPayloadClaim('_id', $user['_id'])
      ->setPayloadClaim('name', $user['first_name'] .' '.$user['last_name'])
      ->setPayloadClaim('avatar_url', '//' . $_ENV['SITE_URL'] . $user['avatar_small'])
      ->setPayloadClaim('screenname', $user['screenname'])
      ->setPayloadClaim('admin_token', $user['group_id'] == 1 ? password_hash($_ENV['SITE_CODE'], PASSWORD_BCRYPT) : false)
      ->build();
    return $token->getToken();
  }
  
}

?>