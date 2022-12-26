<?php




$app->get('/admin/?', function(){

	$title = $GLOBALS['site_title'] .' Admin';

	if (!$GLOBALS['is_admin']){
		$title = 'Log In - ' . $title;
	}

	$GLOBALS['app']->render_template(array(
		'layout' => 'admin',
		'template' => 'admin/index',
    'title' => $title,
		'data' => array(
			'current_home' => true,
	    'ip' => $GLOBALS['app']->client_ip(),
	    'install_deleted' => file_exists('./controllers/install.php') ? false : true
		)
	));

});
