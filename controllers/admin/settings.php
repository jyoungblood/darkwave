<?php




$app->get('/admin/settings/?', function(){

	$GLOBALS['app']->render_template(array(
		'layout' => 'admin',
		'template' => 'admin/settings',
    'title' => 'Settings - ' . $GLOBALS['site_title'] .' Admin',
		'data' => array(
	    'current_settings' => true,
	    'settings' => $GLOBALS['settings']
		)
	));

});





$app->post('/admin/settings/save', function(){

	$settings_file = '<?php

// WARNING: THIS FILE IS GENERATED PROGRAMMATICALLY. ANY CHANGES YOU MAKE MAY BE OVERWRITTEN.

$GLOBALS[\'site_title\'] = \''.$_POST['site_title'].'\';
$GLOBALS[\'site_code\'] = \''.$_POST['site_code'].'\';
$GLOBALS[\'site_url\'] = \''.$_POST['site_url'].'\';';


	if ($_POST['db_host']){
	$settings_file .= '

$GLOBALS[\'settings\'][\'database\'][\'host\'] = \''.$_POST['db_host'].'\';
$GLOBALS[\'settings\'][\'database\'][\'name\'] = \''.$_POST['db_name'].'\';
$GLOBALS[\'settings\'][\'database\'][\'user\'] = \''.$_POST['db_user'].'\';
$GLOBALS[\'settings\'][\'database\'][\'password\'] = \''.$_POST['db_password'].'\';';
	}

	if ($_POST['api_root']){
		$settings_file .= '

$GLOBALS[\'settings\'][\'api_root\'] = \''.$_POST['api_root'].'\';';
	}

	if ($_POST['mailgun_api_key']){
		$settings_file .= '

$GLOBALS[\'settings\'][\'mailgun\'][\'api_key\'] = \''.$_POST['mailgun_api_key'].'\';
$GLOBALS[\'settings\'][\'mailgun\'][\'domain\'] = \''.$_POST['mailgun_domain'].'\';';
	}


	if ($_POST['s3_key']){
		$settings_file .= '

$GLOBALS[\'settings\'][\'s3\'][\'key\'] = \''.$_POST['s3_key'].'\';
$GLOBALS[\'settings\'][\'s3\'][\'secret\'] = \''.$_POST['s3_secret'].'\';
$GLOBALS[\'settings\'][\'s3\'][\'bucket\'] = \''.$_POST['s3_bucket'].'\';';

	}


	file_put_contents("./settings.php", $settings_file);

	header("Location: /admin");

});
