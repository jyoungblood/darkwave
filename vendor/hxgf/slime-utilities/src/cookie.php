<?php

namespace Slime;

class cookie {

	// set a cookie
	public static function set($k, $v, $time = false){
		$expires = time() + 31536000000;
		if ($time){
			$expires = $time;
		}
		setcookie($k, $v, $expires, "/");
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