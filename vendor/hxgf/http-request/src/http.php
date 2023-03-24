<?php

/**
 * @package    VPHP - HTTP Request
 * @version    1.2.0
 * @author     Jonathan Youngblood <jy@hxgf.io>
 * @license    https://github.com/hxgf/http-request/blob/master/LICENSE.md (MIT License)
 * @source     https://github.com/hxgf/http-request
 */

namespace VPHP;

class http {

	// make an http request to a given url, send data, return the raw result (or error)

  public static function request($url, $args = array()){

    $data_string = false;
    $data = [];
    if (isset($args['data'])){
      $data_string = '';
      $data = $args['data'];
      foreach($args['data'] as $key=>$value) { $data_string .= $key . '=' . $value . '&'; }
      $data_string = rtrim($data_string, '&');
    }

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FAILONERROR, true);

    if (isset($args['method']) && $args['method'] == 'POST'){
      // POST request
      curl_setopt($ch, CURLOPT_POST, count($data));
      curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
    }else{
      // GET request (default)
      if ($data_string){
        $url .= '?' . $data_string;
      }
      curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'GET');
    }
    curl_setopt($ch, CURLOPT_URL, $url);

    if (isset($args['headers'])){
      $headers = [];
      foreach ($args['headers'] as $k => $v){
        $headers[] = $k . ': ' . $v;
      } 
      curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }

    $result = curl_exec($ch);
    curl_close($ch);

    if (!isset($result)){
      $result = [];
    }

    if (isset($args['json_decode'])){
      $result = json_decode($result, true);
    }

    if (curl_errno($ch)) {
      $result['error'] = [
        'code' => curl_errno($ch),
        'message' => curl_error($ch)
      ];
    }

    if (isset($args['debug']) && is_array($result)){
      $result['debug'] = curl_getinfo($ch);
    }

    return $result;
  }

  public static function get($url, $args = array()){
    return http::request($url, $args);
  }

  public static function post($url, $args = array()){
    $args['method'] = 'POST';
    return http::request($url, $args);
  }

  // return a json response as a php array
  public static function json($url, $args = array()){
    $args['json_decode'] = true;
    return http::request($url, $args);
  }

}

?>