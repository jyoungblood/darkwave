<?php

namespace DW;

class utility {

  public static function authenticate(){
    if (isset($_COOKIE['token'])){
      $jwt_factory = new \PsrJwt\Factory\Jwt();
      $parser = $jwt_factory->parser($_COOKIE['token'], $GLOBALS['settings']['jwt_secret']);
      $parsed = $parser->parse()->getPayload();
      if ($parsed['_id']){      
        $GLOBALS['user_id'] = $parsed['_id'];
        $GLOBALS['locals']['user_id'] = $GLOBALS['user_id'];
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
  }

  public static function test($test){
    return $test;
	}

}

?>

