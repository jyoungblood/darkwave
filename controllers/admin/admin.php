<?php

use Slime\render;
use Slime\x;

$app->get('/admin[/]', function ($req, $res, $args) {

	$title = $GLOBALS['site_title'] .' Admin';

	if (!$GLOBALS['is_admin']){
		$title = 'Log In - ' . $title;
	}


	return render::hbs($req, $res, array(
		'layout' => '_layouts/admin',
		'template' => 'admin/index',
    'title' => $title,
		'data' => array(
			'current_home' => true,
	    'ip' => x::client_ip(),
	    'install_deleted' => file_exists('./controllers/install.php') ? false : true
		)
	));

});
