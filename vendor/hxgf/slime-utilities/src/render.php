<?php

namespace Slime;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

use LightnCandy\LightnCandy;
use Slim\Views\Twig;

class render {

	// render data as json string
  public static function json($req, $res, $args){
    $data = [];
    if (isset($args['data'])){
      $data = $args['data'];
    }
    $status = 200;
    if (isset($args['status'])){
      $status = $args['status'];
    }
    $res->getBody()->write(json_encode($data));
    return $res->withHeader('content-type', 'application/json')->withStatus($status);
  }

  public static function twig($req, $res, $args){
    $data = [];
    $data['locals'] = $GLOBALS['locals'];
    if (isset($args['data'])){
      $data = array_merge($data, $args['data']);
    }
    if (isset($args['title'])){
      $data['title'] = $args['title'];
    }
    return Twig::fromRequest($req)->render($res, $args['template'] . '.html', $data);
  }

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
    return LightnCandy::prepare(
      LightnCandy::compile(
        $template,
        array(
          "flags" => LightnCandy::FLAG_ELSE | LightnCandy::FLAG_PARENT,
          "helpers" => @$GLOBALS['hbars_helpers'],
          "partials" => $partials
        )
      )
    );
  }

  public static function hbs($req, $res, $args){
    $data = [];
    if (isset($GLOBALS['locals'])){
      $data['locals'] = $GLOBALS['locals'];
    }
    if (isset($args['data'])){
      $data = array_merge($data, $args['data']);
    }
    if (isset($args['title'])){
      $data['title'] = $args['title'];
    }
    $body = $res->getBody();
    $body->write(render::lightncandy_html($args)($data));
    return $res->withStatus(isset($args['status']) ? $args['status'] : 200);
  }

}

?>