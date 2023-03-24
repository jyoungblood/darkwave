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

// ??

// 	if (!$GLOBALS['is_admin']){
// 		$title = 'Log In - ' . $title;
// 	}

  return render::hbs($req, $res, [
    'layout' => '_layouts/base',
    'template' => 'index',
    'title' => $GLOBALS['site_title'] ? $GLOBALS['site_title'] : 'Install Darkwave',
    'data' => [
	    'install_deleted' => file_exists('./controllers/install.php') ? false : true,
      'what' => 'what',
      'number' => 327,
      'foo' => 0,
      'date_created' => 1672419228,
      'current_home' => true,
// 	    'ip' => x::client_ip(),
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