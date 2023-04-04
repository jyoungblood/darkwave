<?php

namespace DW;

// \DW\auth::what();


class auth {


  public static function authenticate(){

    if ($token = \VPHP\cookie::get('token')){
      $jwt_factory = new \PsrJwt\Factory\Jwt();

      $parser = $jwt_factory->parser($token, $GLOBALS['settings']['jwt_secret']);
      $parsed = $parser->parse()->getPayload();
      if ($parsed['_id']){

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
            // $html .= '(ur admin)';
          }
        }
      }
      // echo "yes token";
    }

  }


  public static function what(){
    echo "hi";
    return true;
	}

}

?>

