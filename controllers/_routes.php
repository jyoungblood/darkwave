<?php

include('admin/admin.php');
include('admin/users.php');
include('admin/settings.php');

include('auth.php');





// ------- safe to delete after installation (and replace with your own routes) ----- //

if (file_exists('./controllers/install.php')){ include('install.php'); }


$app->get('/', function(){

	$GLOBALS['app']->render_template(array(
		'template' => 'index',
    'title' => $GLOBALS['site_title'],
    'data' => array(
	    'install_deleted' => file_exists('./controllers/install.php') ? false : true
    )
	));

});