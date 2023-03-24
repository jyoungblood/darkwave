<?php

/**
 * @package    VPHP - Cookie
 * @version    1.1.0
 * @author     Jonathan Youngblood <jy@hxgf.io>
 * @license    https://github.com/hxgf/cookie/blob/master/LICENSE.md (MIT License)
 * @source     https://github.com/hxgf/cookie
 */

namespace VPHP;

class cookie {

	// set a cookie
	public static function set($k, $v, $args = array()){
    $options['expires'] = isset($args['expires']) ? $args['expires'] : time() + 31536000000;
    $options['path'] = isset($args['path']) ? $args['path'] : '/';

    if (isset($args['domain'])){
      $options['domain'] = $args['domain'];
    }
    if (isset($args['secure'])){
      $options['secure'] = $args['secure'];
    }
    if (isset($args['httponly'])){
      $options['httponly'] = $args['httponly'];
    }
    if (isset($args['samesite'])){
      $options['samesite'] = $args['samesite'];
    }

		setcookie($k, $v, $options);
		return true;
	}

	// retrieve a cookie
	public static function get($k){
		$o = false;
		if (isset($_COOKIE[$k])){
			$o = $_COOKIE[$k];
		}
		return $o;
	}

	// delete a cookie
	public static function delete($k){
		if (isset($_COOKIE[$k])) {
	    unset($_COOKIE[$k]);
	    setcookie($k, '', time() - 3600, '/');
		}
		return true;
	}
  
}

?>