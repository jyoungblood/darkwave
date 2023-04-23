<?php

/**
 * DW User Management Routes
 * @version    0.6.0
 * @author     Jonathan Youngblood <jy@hxgf.io>
 */

use Slime\render;
use VPHP\db;


$app->get('/users[/]', function ($req, $res, $args) {
  if (isset($GLOBALS['auth']) && !isset($GLOBALS['is_admin'])){
    return render::hbs($req, $res, [
      'template' => 'error',
      'title' => '401 - Unauthorized',
      'data' => [
        'status_code' => 401,
        'error_message' => 'You are not authorized to view this page.'
      ]
    ], 401);
  }else{
    $query = "id IS NOT NULL";
    if (isset($_GET['k'])){
      $query =  "screenname LIKE '%" . $_GET['k'] . "%' OR first_name LIKE '%" . $_GET['k'] . "%' OR last_name LIKE '%" . $_GET['k'] . "%' OR email LIKE '%" . $_GET['k'] . "%'";
    }
    $_users = db::find("users", $query . " ORDER BY date_created DESC");
    return render::hbs($req, $res, [
      'layout' => '_layouts/base',
      'template' => 'dw/users-list',
      'title' => 'Users - ' . $_ENV['SITE_TITLE'],
      'data' => [
        'current_users' => true,
        'current_system' => true,
        'users'=> $_users['data']
      ]
    ]);
  }
});



$app->get('/users/edit/{user_id}[/]', function ($req, $res, $args) {
  if (isset($GLOBALS['auth']) && !isset($GLOBALS['is_admin'])){
    return render::hbs($req, $res, [
      'template' => 'error',
      'status' => 401,
      'title' => '401 - Unauthorized',
      'data' => [
        'status_code' => 401,
        'error_message' => 'You are not authorized to view this page.'
      ]
    ]);
  }else{
    $_data = db::find("users", "_id='".$args['user_id']."'");
    $data = $_data['data'][0];
    if ($_data['data']){
      $title = 'Edit User - '.$data['screenname'].' - '.$_ENV['SITE_TITLE'];
    }else{
      $title = 'New User - '.$_ENV['SITE_TITLE'];
    }
    $has_avatar = false;
    if ($data['avatar_medium']){
      if ($data['avatar_medium'] != '/images/users/avatar-default-m.png'){
        $has_avatar = true;
      }
    }
    return render::hbs($req, $res, [
      'layout' => '_layouts/base',
      'template' => 'dw/users-edit',
      'title' => $title,
      'data' => [
        'current_users' => true,
        'current_system' => true,
        'has_avatar' => $has_avatar,
        'data' => $data,
        '_id' => $args['user_id']
      ]
    ]);
  }
});



$app->post('/users/save[/]', function ($req, $res, $args) {
  if (isset($GLOBALS['auth']) && !isset($GLOBALS['is_admin'])){
    return render::json($req, $res, [
      'error_code' => 401,
      'error_message' => 'You are not authorized to use this resource.'
    ], 401);
  }else{
		$form = [];
		parse_str($_POST['form'],$form);
		$input = [
			'email' => strtolower($form['email']),
			'group_id' => $form['group_id'],
			'url_slug' => \VPHP\x::url_slug($form['screenname']),
			'screenname' => $form['screenname'],
			'first_name' => $form['first_name'],
			'last_name' => $form['last_name'],
    ];
		if ($form['password']){
			$input['password'] = password_hash($form['password'], PASSWORD_BCRYPT);
		}
	  if ($_POST['_id'] == 'new'){
		  $input['date_created'] = date('Y-m-d H:i:s');
		  $input['_id'] = uniqid(uniqid());
			db::insert("users", $input);
			$user_id = $input['_id'];
	  }else{
		  $input['date_updated'] = date('Y-m-d H:i:s');
			db::update("users", $input, "_id='".$_POST['_id']."'");
			$user_id = $_POST['_id'];
	  }

    // fixit photo uploads
    // fixit make component functions & move to dw.php

	  // if ($form['file_1']){
		// 	if ($form['file_1'] == 'DELETE'){
		// 		$user = db::find("users", "_id='".$user_id."'");
		// 		if ($user['data'][0]['avatar_small'] != '/images/users/avatar-default-s.png'){
		// 			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_small']);
		// 			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_medium']);
		// 			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_large']);
		// 			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_original']);
		// 		}
		// 		$photo_input = [
		// 			'avatar_small' => '/images/users/avatar-default-s.png',
		// 			'avatar_medium' => '/images/users/avatar-default-m.png',
		// 			'avatar_large' => '/images/users/avatar-default-l.png',
		// 			'avatar_original' => '/images/users/avatar-default-o.png',
    //     ];
		// 	}else{
		// 		$user = db::find("users", "_id='".$user_id."'");
		// 		if ($user['data'][0]['avatar_small'] && $user['data'][0]['avatar_small'] != '/images/users/avatar-default-s.png'){
		// 			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_small']);
		// 			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_medium']);
		// 			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_large']);
		// 			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_original']);
		// 		}
		// 		$filename = $form['file_1'];
		// 		$ext = strtolower(pathinfo($_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $filename, PATHINFO_EXTENSION));
		// 		$filename_clean = explode('||-||', str_replace('.'.$ext, '', $filename));
		//     $source = $_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $filename;
		// 		$filename_small = $user_id . '-' . $filename_clean[1] . '-s.' . $ext;
		// 		$filename_medium = $user_id . '-' . $filename_clean[1] . '-m.' . $ext;
		// 		$filename_large = $user_id . '-' . $filename_clean[1] . '-l.' . $ext;
		// 		$filename_original = $user_id . '-' . $filename_clean[1] . '-o.' . $ext;
		// 		list($photo_width, $photo_height) = getimagesize($source);
		// 		$sq = new phMagick($source, $_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_small);
		// 		$sq->resizeExactly(300,300);
		// 		if ($photo_width > 800){
		// 			$md = new phMagick($source, $_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_medium);
		// 			$md->resize(800, 0);
		// 		}else{
		// 			copy($source, $_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_medium);
		// 		}
		// 		if ($photo_width > 1024){
		// 			$ld = new phMagick($source, $_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_large);
		// 			$ld->resize(1024, 0);
		// 		}else{
		// 			copy($source, $_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_large);
		// 		}
		// 		copy($source, $_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_original);
		// 		unlink($source);
		// 		$photo_input = [
		// 			'avatar_small' => '/images/users/' . $filename_small,
		// 			'avatar_medium' => '/images/users/' . $filename_medium,
		// 			'avatar_large' => '/images/users/' . $filename_large,
		// 			'avatar_original' => '/images/users/' . $filename_original,
    //     ];
		// 	}
		// 	db::update("users", $photo_input, "_id='".$user_id."'");
		// }

    return render::json($req, $res, [
      'success' => true,
      // 'input' => $input,
      // 'form' => $form,
      // 'form_string' => $_POST['form']
    ]);
	}
});



$app->post('/users/delete[/]', function ($req, $res, $args) {
  if (isset($GLOBALS['auth']) && !isset($GLOBALS['is_admin'])){
    return render::json($req, $res, [
      'error_code' => 401,
      'error_message' => 'You are not authorized to use this resource.'
    ], 401);
  }else{
		$user = db::find("users", "_id='".$_POST['_id']."'");
		if ($user['data'][0]['avatar_small'] && $user['data'][0]['avatar_small'] != '/images/users/avatar-default-s.png'){
			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_small']);
			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_medium']);
			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_large']);
			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_original']);
		}
		db::delete("users", "_id='".$_POST['_id']."'");
    return render::json($req, $res, [
      'success' => true
    ]);
	}
});