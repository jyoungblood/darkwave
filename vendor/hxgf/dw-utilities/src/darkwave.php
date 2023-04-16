<?php

/**
 * @package    DW Utilities (PHP)
 * @version    0.1.0
 * @author     Jonathan Youngblood <jy@hxgf.io>
 * @license    https://github.com/hxgf/dw-utilities-php/blob/master/LICENSE.md (MIT License)
 * @source     https://github.com/hxgf/dw-utilities-php
 */

namespace DW;

class dw {

  public static function what(){
    echo "what";
  }

	// parse the JWT 'token' cookie and set global authentication variables
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
  
}

?>