<?php

/**
 * DW System Configuration Routes / Controllers
 * @version    0.6.0
 * @author     Jonathan Youngblood <jy@hxgf.io>
 */

use Slime\render;


$app->get('/configure[/]', function ($req, $res, $args) {
  $digits    = array_flip(range('0', '9'));
  $lowercase = array_flip(range('a', 'z'));
  $uppercase = array_flip(range('A', 'Z')); 
  $special   = array_flip(str_split('*&!@%^#$'));
  return render::hbs($req, $res, [
    'layout' => '_layouts/base-guest',
    'template' => 'dw/configure',
    'title' => 'Configure Darkwave',
    'data' => [
      'jwt_secret' => str_shuffle(array_rand($digits) . array_rand($lowercase) . array_rand($uppercase) . array_rand($special) . implode(array_rand(array_merge($digits, $lowercase, $uppercase, $special), rand(12, 20)))),
      'site_url_default' => $_SERVER['HTTP_HOST']
    ]
  ]);
});



$app->post('/configure/execute[/]', function ($req, $res, $args) {
  $out = [ 'success' => true ];
  parse_str($_POST['form'], $form);
  if (isset($form['create_default_users']) && $form['create_default_users'] == 'on'){
    if (isset($form['db_host']) && isset($form['db_name'])){
      try {
        $GLOBALS['database'] = \VPHP\db::init([
          'host' => $form['db_host'],
          'name' => $form['db_name'],
          'user' => $form['db_user'],
          'password' => $form['db_password']
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
        group_id TINYINT NOT NULL DEFAULT '3' COMMENT '1 Admin, 2 Staff, 3 General User, 4 Blocked User',
        avatar_filename VARCHAR(255) DEFAULT NULL,
        avatar_small VARCHAR(255) NOT NULL DEFAULT '/images/avatar-default.png',
        avatar_medium VARCHAR(255) NOT NULL DEFAULT '/images/avatar-default.png',
        avatar_large VARCHAR(255) NOT NULL DEFAULT '/images/avatar-default.png',
        avatar_original VARCHAR(255) NOT NULL DEFAULT '/images/avatar-default.png',
        date_last_login DATETIME NULL DEFAULT NULL,
        date_created DATETIME NULL DEFAULT NULL,
        date_updated DATETIME NULL DEFAULT NULL,
        PRIMARY KEY (id)
        ) ENGINE=InnoDB CHARACTER SET utf8mb4;";
        $GLOBALS['database']->exec($sql);
      }
      catch(PDOException $e){
        $out['success'] = false;
        $out['error'] = true;
        $out['error_message'] = $e->getMessage();
      } catch (Exception $e) {
        $out['success'] = false;
        $out['error'] = true;
        $out['error_message'] = $e->getMessage();
      }
    }
  }
  if ($out['success'] == true && isset($form['create_admin_user']) && $form['create_admin_user'] == 'on'){
    if (isset($GLOBALS['database'])){
      \VPHP\db::insert("users", [
        '_id' => uniqid(uniqid()),
        'email' => trim(strtolower($form['user_email'])),
        'password' => password_hash($form['user_password'], PASSWORD_BCRYPT),
        'group_id' => '1',
        'date_created' => date('Y-m-d H:i:s'),
        'url_slug' => \VPHP\x::url_slug($form['user_screenname']),
        'screenname' => $form['user_screenname'],
        'first_name' => $form['user_first_name'],
        'last_name' => $form['user_last_name'],
      ]);
    }
  }
  if ($out['success'] == true){
    $env_file = 
'SITE_TITLE = "'. $form['site_title'] .'"
SITE_CODE = "'. $form['site_code'] .'"
SITE_URL = "'. $form['site_url'] .'"
SITE_MODE = "development"
JWT_SECRET="'. $form['jwt_secret'] .'"';
    if (isset($form['db_host']) && isset($form['db_name']) && isset($form['db_user']) && isset($form['db_password'])){
      $env_file .= '
DB_HOST="'. $form['db_host'] .'"
DB_NAME="'. $form['db_name'] .'"
DB_USER="'. $form['db_user'] .'"
DB_PASSWORD="'. $form['db_password'] .'"';
    }
    file_put_contents("./.env", $env_file);
  }
  if ($out['success'] == true && $form['delete_configure_files'] == 'on'){
    unlink("controllers/dw/configure.php");
    unlink("templates/dw/configure.html");
  }
  return render::json($req, $res, $out);
});





?>
