<?php

require 'controllers/darkwave.php'; 


require 'controllers/admin/admin.php';
require 'controllers/admin/users.php';
require 'controllers/admin/settings.php';
require 'controllers/auth.php';

// ------- safe to delete after installation (and replace with your own routes) ----- //
if (file_exists('./controllers/install.php')){ 
  require 'controllers/install.php'; 
}

use Slime\render;


$app->get('/', function ($req, $res, $args) {

  return render::hbs($req, $res, [
    'layout' => '_layouts/base',
    'template' => 'index',
    'title' => $GLOBALS['site_title'] ? $GLOBALS['site_title'] : 'Install Darkwave',
    'data' => [
	    'install_deleted' => file_exists('./controllers/install.php') ? false : true,
      'what' => 'what',
      'number' => 327,
      'foo' => 0,
      'date_created' => 1672419228
    ]
  ]);

});












$app->get('/halfmoon[/]', function ($req, $res, $args) {

  return render::hbs($req, $res, [
    'template' => 'halfmoon',
    'title' => 'halfmoon demo - ' . $GLOBALS['site_title'],
    'data' => [

    ]
  ]);

});








$app->get('/bootstrap[/]', function ($req, $res, $args) {

  return render::hbs($req, $res, [
    'template' => 'bootstrap',
    'title' => 'bootstrap demo - ' . $GLOBALS['site_title'],
    'data' => [

    ]
  ]);

});











$app->get('/pico[/]', function ($req, $res, $args) {

  return render::hbs($req, $res, [
    'template' => 'pico',
    'title' => 'pico demo - ' . $GLOBALS['site_title'],
    'data' => [

    ]
  ]);

});







?>