<?php

require 'controllers/darkwave.php'; 
require 'controllers/dw.php'; 



require 'controllers/users.php';
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
    'title' => $GLOBALS['site_title'],
    'data' => [
	    'install_deleted' => file_exists('./controllers/install.php') ? false : true,
      'current_home' => true,
    ]
  ]);

});








$app->get('/search[/]', function ($req, $res, $args) {


  return render::hbs($req, $res, [
    'layout' => '_layouts/base',
    'template' => 'search',
    'title' => 'Search - ' . $GLOBALS['site_title'],
    'data' => [
      'GET' => $_GET
    ]
  ]);

});







$app->get('/elements[/]', function ($req, $res, $args) {

  return render::hbs($req, $res, [
    'layout' => '_layouts/base-unauth',
    'template' => 'elements',
    'title' => 'All Elements - ' . $GLOBALS['site_title'],
    'data' => [

    ]
  ]);

});





?>