<?php


$app->post('/install', function(){



	// 1. make the settings file

	$settings_file = '<?php

// WARNING: THIS FILE IS GENERATED PROGRAMMATICALLY. ANY CHANGES YOU MAKE MAY BE OVERWRITTEN.

$GLOBALS[\'site_title\'] = \''.$_POST['site_title'].'\';
$GLOBALS[\'site_code\'] = \''.$_POST['site_code'].'\';
$GLOBALS[\'site_url\'] = \''.$_POST['site_url'].'\';';

	if ($_POST['db_host'] && $_POST['db_name']){
		$settings_file .= '
$GLOBALS[\'settings\'][\'database\'][\'host\'] = \''.$_POST['db_host'].'\';
$GLOBALS[\'settings\'][\'database\'][\'name\'] = \''.$_POST['db_name'].'\';
$GLOBALS[\'settings\'][\'database\'][\'user\'] = \''.$_POST['db_user'].'\';
$GLOBALS[\'settings\'][\'database\'][\'password\'] = \''.$_POST['db_password'].'\';';
	}

	file_put_contents("./settings.php", $settings_file);



	// 2. make the db tables (only if there's a database to connect to)

	$error = false;
	$db_install = false;

	if ($_POST['db_host'] && $_POST['db_name']){

		$db_install = true;

		try {
			$GLOBALS['database'] = new PDO("mysql:host=".$_POST['db_host'].";dbname=".$_POST['db_name'], $_POST['db_user'], $_POST['db_password']);

			$GLOBALS['database']->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

			$sql = "CREATE TABLE users (
			id INT(255) NOT NULL AUTO_INCREMENT,
			_id VARCHAR(255) NULL DEFAULT NULL,
			password VARCHAR(255) NULL DEFAULT NULL,
			email VARCHAR(255) NULL DEFAULT NULL,
			validate_hash VARCHAR(255) NULL DEFAULT NULL,
			password_hash VARCHAR(255) NULL DEFAULT NULL,
			url_slug VARCHAR(255) NULL DEFAULT NULL COMMENT 'profile url handle (url-safe version of screenname)',
			screenname VARCHAR(255) NULL DEFAULT NULL COMMENT 'display name',
			first_name VARCHAR(255) NULL DEFAULT NULL,
			last_name VARCHAR(255) NULL DEFAULT NULL,
			ua_header VARCHAR(255) NULL DEFAULT NULL,
			ip_address VARCHAR(255) NULL DEFAULT NULL,
			date_last_login INT(255) NULL DEFAULT NULL,
			group_id TINYINT NOT NULL DEFAULT '3' COMMENT '1 admin, 2 moderator, 3 end user, 4 blocked user',
			date_created INT(255) NULL DEFAULT NULL,
			avatar_filename VARCHAR(255) DEFAULT NULL,
			avatar_small VARCHAR(255) NOT NULL DEFAULT '/images/auth/avatar-default-s.png',
			avatar_medium VARCHAR(255) NOT NULL DEFAULT '/images/auth/avatar-default-m.png',
			avatar_large VARCHAR(255) NOT NULL DEFAULT '/images/auth/avatar-default-l.png',
			avatar_original VARCHAR(255) NOT NULL DEFAULT '/images/auth/avatar-default-o.png',
			PRIMARY KEY (id)
			)";


			$GLOBALS['database']->exec($sql);
		}
		catch(PDOException $e){
			$error = $e->getMessage();
		}




		// 3. insert the admin user

		if (!$error){
			db_insert("users", array(
				'_id' => uniqid(uniqid()),
				'email' => strtolower($_POST['user_email']),
				'password' => password_hash($_POST['user_password'], PASSWORD_BCRYPT),
				'group_id' => '1',
				'date_created' => time(),
				'url_slug' => $GLOBALS['app']->url_slug($_POST['user_screenname']),
				'screenname' => $_POST['user_screenname'],
			));
		}

	}


	// 4. show success/failure

	if ($error){
		$GLOBALS['app']->render_template(array(
			'template' => 'index',
			'site_title' => false,
	    'title' => 'INSTALL',
	    'error' => $error
		));
	}else{
		unlink("controllers/install.php");
		if ($db_install){
			header("Location: /admin");
		}else{
			header("Location: /");
		}

	}

});





?>
