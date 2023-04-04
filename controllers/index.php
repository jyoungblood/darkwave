<?php

use Slime\render;


// require 'controllers/darkwave.php'; 
require 'controllers/dw.php';

require 'controllers/users.php';
require 'controllers/auth.php';
require 'controllers/debug.php'; 

// ------- safe to delete after installation ----- //
if (file_exists('./controllers/install.php')){ 
  require 'controllers/install.php'; 
}


$app->get('/', function ($req, $res, $args) {

// echo "what";

  return render::hbs($req, $res, [
    'layout' => '_layouts/base-auth',
    'template' => 'index',
    'title' => $GLOBALS['site_title'],
    'data' => [
	    'install_deleted' => file_exists('./controllers/install.php') ? false : true,
      'current_home' => true,
    ]
  ]);

});
// ->add(new dw_authorize([
//   'unauthenticated' => [
//     'redirect' => '/login',
//   ]
// ]))




$app->get('/search[/]', function ($req, $res, $args) {


  return render::hbs($req, $res, [
    'layout' => '_layouts/base-auth',
    'template' => 'search',
    'title' => 'Search - ' . $GLOBALS['site_title'],
    'data' => [
      'GET' => $_GET
    ]
  ]);

});
// ->add(new dw_authorize())




























?>