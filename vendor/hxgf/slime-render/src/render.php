<?php

/**
 * @package    SLIME Render
 * @version    1.3.1
 * @author     Jonathan Youngblood <jy@hxgf.io>
 * @license    https://github.com/hxgf/slime-render/blob/master/LICENSE.md (MIT License)
 * @source     https://github.com/hxgf/slime-render
 */

namespace Slime;

use LightnCandy\LightnCandy;

class render {

	// render data as json string
  public static function json($req, $res, $data = [], $status = 200){
    $res->getBody()->write(json_encode($data));
    return $res->withHeader('content-type', 'application/json')->withStatus($status);
  }

  // define custom helpers
  public static function initialize_handlebars_helpers(){

    $GLOBALS['hbars_helpers']['date'] = function ($arg1, $arg2, $arg3 = false) {
      if (isset($arg1) && $arg1 != ''){
        if ($arg1 == "now"){
          return date($arg2);
        }else{
          if ($arg3 == "convert"){
            return date($arg2, strtotime($arg1));
          }else{
            return date($arg2, $arg1);
          }
        }
      }else{
        return false;
      }
    };

    $GLOBALS['hbars_helpers']['is'] = function ($l, $operator, $r, $options) {
      if ($operator == '=='){
        $condition = ($l == $r);
      }
      if ($operator == '==='){
        $condition = ($l === $r);
      }
      if ($operator == 'not' || $operator == '!='){
        $condition = ($l != $r);
      }	
      if ($operator == '<'){
        $condition = ($l < $r);
      }
      if ($operator == '>'){
        $condition = ($l > $r);
      }
      if ($operator == '<='){
        $condition = ($l <= $r);
      }
      if ($operator == '>='){
        $condition = ($l >= $r);
      }
      if ($operator == 'in'){
        if (gettype($r) == 'array'){
          $condition = (in_array($l, $r));
        }else{
          // expects a csv string
          $condition = (in_array($l, str_getcsv($r)));
        }
      }
      if ($operator == 'typeof'){
        $condition = (gettype($l) == gettype($r));
      }
      if ($condition){
        return $options['fn']();
      }else{
        return $options['inverse']();
      }
    }; 
            
  }

  // render a LightnCandy template, compiled with HBS settings
  public static function lightncandy_html($args){
    $template_path = isset($GLOBALS['settings']['templates']['path']) ? $GLOBALS['settings']['templates']['path'] : 'templates';
    $template_extension = isset($GLOBALS['settings']['templates']['extension']) ? $GLOBALS['settings']['templates']['extension'] : 'html';
    $template = file_get_contents( './' . $template_path .'/'. $args['template'] . '.' . $template_extension );
    if (isset($args['layout'])){
      $layout = explode('{{outlet}}', file_get_contents( './' . $template_path .'/'. $args['layout'] . '.' . $template_extension ));
      $template = $layout[0] . $template . $layout[1];
    }
    preg_match_all('/{{> ([^}}]+)/', $template, $partial_handles);
    $partials = [];
    foreach ($partial_handles[1] as $handle){
      $partials[$handle] = file_get_contents( './' . $template_path .'/'. $handle . '.' . $template_extension );        
    }
    render::initialize_handlebars_helpers();
    return LightnCandy::prepare(
      LightnCandy::compile($template, array(
        "flags" => LightnCandy::FLAG_HANDLEBARS,
        "partials" => $partials,
        "helpers" => $GLOBALS['hbars_helpers']
      ))
    );
  }

  // return a rendered LightnCandy/HBS template
  public static function hbs($req, $res, $args, $status = 200){
    $data = [];
    if (isset($GLOBALS['locals'])){
      $data['locals'] = $GLOBALS['locals'];
    }
    if (isset($_GET)){
      $data['GET'] = $_GET;
    }
    if (isset($_POST)){
      $data['POST'] = $_POST;
    }
    if (isset($args['data'])){
      $data = array_merge($data, $args['data']);
    }
    if (isset($args['title'])){
      $data['title'] = $args['title'];
    }
    $body = $res->getBody();
    $body->write(render::lightncandy_html($args)($data));
    return $res->withStatus($status);
  }

  // return a url redirect
  public static function redirect($req, $res, $location, $status = 302){
    return $res->withHeader('Location', $location)->withStatus($status);
  }

  // return an HTML string or file
  public static function html($req, $res, $html, $status = 200){
    $body = $res->getBody();
    if (substr($html, -5) == '.html' && file_exists('./'.$html)){
      $html = file_get_contents('./'.$html);
    }
    $body->write($html);
    return $res->withStatus($status);
  }

  // return a plain text string
  public static function text($req, $res, $text, $status = 200){
    $body = $res->getBody();
    $body->write($text);
    return $res->withHeader('Content-Type', 'text/plain')->withStatus($status);
  }
  
}

?>