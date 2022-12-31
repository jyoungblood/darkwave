<?php

namespace Slime;

class http {

	// make an http request to a given url, send data, return the raw result
  // POST by default

  public static function request($url, $args = array()){

    $data_string = '';
    $data = [];
    if (isset($args['data'])){
      $data = $args['data'];
      foreach($args['data'] as $key=>$value) { $data_string .= $key . '=' . $value . '&'; }
    }

    rtrim($data_string, '&');

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    if (isset($args['method']) && $args['method'] == 'GET'){
      curl_setopt($ch, CURLOPT_URL, $url . '?' . $data_string);
    }else{
      curl_setopt($ch, CURLOPT_URL, $url);
      curl_setopt($ch, CURLOPT_POST, count($data));
      curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
    }

    $result = curl_exec($ch);
    curl_close($ch);

    if (isset($args['format']) && strtolower($args['format']) == 'json'){
      $result = json_decode($result, true);
    }

    return $result;
  }

  public static function get($url, $args = array()){
    $args['method'] = 'GET';
    return http::request($url, $args);
  }

  public static function post($url, $args = array()){
    return http::request($url, $args);
  }

  // return a json response as a php array
  public static function json($url, $args = array()){
    $args['format'] = 'json';
    return http::request($url, $args);
  }

}

?>