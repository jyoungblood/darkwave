<?php

use Slime\render;


$app->get('/admin/settings[/]', function ($req, $res, $args) {

	return render::hbs($req, $res, array(
		'layout' => '_layouts/admin',
		'template' => 'admin/settings',
    'title' => 'Settings - ' . $GLOBALS['site_title'] .' Admin',
		'data' => array(
	    'current_settings' => true,
	    'current_system' => true,
	    'settings' => $GLOBALS['settings']
		)
	));

});





$app->post('/admin/settings/save[/]', function ($req, $res, $args) {

	if ($GLOBALS['is_admin']){

		$form = array();
		parse_str($_POST['form'],$form);


	$settings_file = '<?php

// WARNING: THIS FILE IS GENERATED PROGRAMMATICALLY. ANY CHANGES YOU MAKE MAY BE OVERWRITTEN.

$GLOBALS[\'site_title\'] = \''.$form['site_title'].'\';
$GLOBALS[\'site_code\'] = \''.$form['site_code'].'\';
$GLOBALS[\'site_url\'] = \''.$form['site_url'].'\';
$GLOBALS[\'settings\'][\'mode\'] = \'development\';

$GLOBALS[\'locals\'] = [
  \'year\' => date(\'Y\'),
  \'site_title\' => $GLOBALS[\'site_title\'],
  \'site_code\' => $GLOBALS[\'site_code\'],
  \'site_url\' => $GLOBALS[\'site_url\'],
  \'auth\' => @$GLOBALS[\'auth\'],
  \'user_id\' => @$GLOBALS[\'user_id\'],
  \'is_admin\' => @$GLOBALS[\'is_admin\'],
];
';

	if ($form['db_host'] && $form['db_name']){
		$settings_file .= '
$GLOBALS[\'settings\'][\'database\'] = [
  \'host\' => \''.$form['db_host'].'\',
  \'name\' => \''.$form['db_name'].'\',
  \'user\' => \''.$form['db_user'].'\',
  \'password\' => \''.$form['db_password'].'\'
];';
	}


		if ($form['mailgun_api_key']){
			$settings_file .= '

$GLOBALS[\'settings\'][\'mailgun\'][\'api_key\'] = \''.$form['mailgun_api_key'].'\';
$GLOBALS[\'settings\'][\'mailgun\'][\'domain\'] = \''.$form['mailgun_domain'].'\';';
		}


		if ($form['s3_key']){
			$settings_file .= '

$GLOBALS[\'settings\'][\'s3\'][\'key\'] = \''.$form['s3_key'].'\';
$GLOBALS[\'settings\'][\'s3\'][\'secret\'] = \''.$form['s3_secret'].'\';
$GLOBALS[\'settings\'][\'s3\'][\'bucket\'] = \''.$form['s3_bucket'].'\';';

		}


		if ($form['bitly_login']){
			$settings_file .= '

$GLOBALS[\'settings\'][\'bitly\'][\'login\'] = \''.$form['bitly_login'].'\';
$GLOBALS[\'settings\'][\'bitly\'][\'apikey\'] = \''.$form['bitly_apikey'].'\';
$GLOBALS[\'settings\'][\'bitly\'][\'token\'] = \''.$form['bitly_token'].'\';';

		}



		if ($form['twilio_sid']){
			$settings_file .= '

$GLOBALS[\'settings\'][\'twilio\'][\'sid\'] = \''.$form['twilio_sid'].'\';
$GLOBALS[\'settings\'][\'twilio\'][\'token\'] = \''.$form['twilio_token'].'\';
$GLOBALS[\'settings\'][\'twilio\'][\'pk\'] = \''.$form['twilio_pk'].'\';
$GLOBALS[\'settings\'][\'twilio\'][\'number\'] = \''.$form['twilio_number'].'\';';

		}


		if ($form['imap_username']){
			$settings_file .= '

$GLOBALS[\'settings\'][\'imap\'][\'username\'] = \''.$form['imap_username'].'\';
$GLOBALS[\'settings\'][\'imap\'][\'password\'] = \''.$form['imap_password'].'\';
$GLOBALS[\'settings\'][\'imap\'][\'host\'] = \''.$form['imap_host'].'\';
$GLOBALS[\'settings\'][\'imap\'][\'port\'] = \''.$form['imap_port'].'\';
$GLOBALS[\'settings\'][\'imap\'][\'tls\'] = \''.$form['imap_tls'].'\';';

		}


		file_put_contents("./settings.php", $settings_file);

	}
	return render::json($req, $res, [
    'data' => array(
      'success' => true
    )
  ]);

});
