<?php

use Slime\render;
use VPHP\x;
use VPHP\db;





$app->get('/install[/]', function ($req, $res, $args) {

  return render::hbs($req, $res, [
    'layout' => '_layouts/base',
    'template' => 'install',
    'title' => 'Install Darkwave',
    'data' => [

    ]
  ]);

});











$app->post('/execute-install[/]', function ($req, $res, $args) {

	// 1. make the settings file

	$settings_file = '<?php

$GLOBALS[\'site_title\'] = \''.$_POST['site_title'].'\';
$GLOBALS[\'site_code\'] = \''.$_POST['site_code'].'\';
$GLOBALS[\'site_url\'] = \''.$_POST['site_url'].'\';
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

	if ($_POST['db_host'] && $_POST['db_name']){
		$settings_file .= '
$GLOBALS[\'settings\'][\'database\'] = [
  \'host\' => \''.$_POST['db_host'].'\',
  \'name\' => \''.$_POST['db_name'].'\',
  \'user\' => \''.$_POST['db_user'].'\',
  \'password\' => \''.$_POST['db_password'].'\'
];';
	}

	file_put_contents("./settings.php", $settings_file);



	// 2. make the db tables (only if there's a database to connect to)

	$error = false;
	$db_install = false;

	if ($_POST['db_host'] && $_POST['db_name']){

		$db_install = true;

		try {

      $GLOBALS['database'] = db::init([
        'host' => $_POST['db_host'],
        'name' => $_POST['db_name'],
        'user' => $_POST['db_user'],
        'password' => $_POST['db_password']
      ]);

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
			date_last_login BIGINT(20) NULL DEFAULT NULL,
			group_id TINYINT NOT NULL DEFAULT '3' COMMENT '1 admin, 2 moderator, 3 end user, 4 blocked user',
			date_created BIGINT(20) NULL DEFAULT NULL,
			avatar_filename VARCHAR(255) DEFAULT NULL,
			avatar_small VARCHAR(255) NOT NULL DEFAULT '/images/users/avatar-default-s.png',
			avatar_medium VARCHAR(255) NOT NULL DEFAULT '/images/users/avatar-default-m.png',
			avatar_large VARCHAR(255) NOT NULL DEFAULT '/images/users/avatar-default-l.png',
			avatar_original VARCHAR(255) NOT NULL DEFAULT '/images/users/avatar-default-o.png',
			PRIMARY KEY (id)
			) ENGINE=InnoDB CHARACTER SET utf8mb4;";


			$GLOBALS['database']->exec($sql);
		}
		catch(PDOException $e){
			$error = $e->getMessage();
		}




		// 3. insert the admin user
		if ($_POST['user_email']){
			if (!$error){
				db::insert("users", [
					'_id' => uniqid(uniqid()),
					'email' => strtolower($_POST['user_email']),
					'password' => password_hash($_POST['user_password'], PASSWORD_BCRYPT),
					'group_id' => '1',
					'date_created' => time(),
					'url_slug' => x::url_slug($_POST['user_screenname']),
					'screenname' => $_POST['user_screenname'],
				]);
			}
		}


	}


	// 4. show success/failure

	if ($error){

    return render::hbs($req, $res, [
      'layout' => '_layouts/base-auth',
      'template' => 'index',
      'title' => $GLOBALS['site_title'] ? $GLOBALS['site_title'] : 'Install Darkwave',
      'data' => [
        'error' => $error
      ]
    ]);

	}else{
		unlink("controllers/install.php");
    return render::redirect($req, $res, [ 'location' => '/' ]);
	}

});





?>
