<?php

use Slime\render;

foreach (glob("controllers/dw/*.php") as $file) {
  require $file;
}

$app->get('/', function ($req, $res, $args) {

  return render::hbs($req, $res, [
    'layout' => '_layouts/base',
    'template' => 'index',
    'title' => $GLOBALS['site_title'],
    'data' => [
	    'install_deleted' => file_exists('./controllers/dw/install.php') ? false : true,
      'current_home' => true,
    ]
  ]);
});




