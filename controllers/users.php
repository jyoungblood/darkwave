<?php

use Slime\render;
use VPHP\db;
use VPHP\x;
use VPHP\cookie;


// use DW\dw;


$app->get('/users[/]', function ($req, $res, $args) {

// dw::what();

	$_users = db::find("users", "id IS NOT NULL ORDER BY email ASC");

	return render::hbs($req, $res, [
		'layout' => '_layouts/base',
		'template' => 'users-list',
    'title' => 'Users - ' . $GLOBALS['site_title'],
		'data' => [
	    'current_users' => true,
	    'current_system' => true,
	    'users'=> $_users['data']
    ]
	]);

})->add(new is_admin())->add(new is_auth());










$app->get('/users/edit/{user_id}[/]', function ($req, $res, $args) {

	$_data = db::find("users", "_id='".$args['user_id']."'");

	$data = $_data['data'][0];

	if ($_data['data']){
		$title = 'Edit User - '.$data['screenname'].' - '.$GLOBALS['site_title'];
	}else{
		$title = 'New User - '.$GLOBALS['site_title'];
	}

	$has_avatar = false;
	if ($data['avatar_medium']){
		if ($data['avatar_medium'] != '/images/users/avatar-default-m.png'){
			$has_avatar = true;
		}
	}

	return render::hbs($req, $res, [
		'layout' => '_layouts/base',
		'template' => 'users-edit',
    'title' => $title,
		'data' => [
	    'current_users' => true,
	    'current_system' => true,
	    'has_avatar' => $has_avatar,
	    'data' => $data,
      '_id' => $args['user_id']
    ]
	]);

});











$app->post('/users/save[/]', function ($req, $res, $args) {

	if ($GLOBALS['is_admin']){

		$form = [];
		parse_str($_POST['form'],$form);
	
		$input = [
			'email' => strtolower($form['email']),
			'group_id' => $form['group_id'],
			'url_slug' => x::url_slug($form['screenname']),
			'screenname' => $form['screenname'],
			'first_name' => $form['first_name'],
			'last_name' => $form['last_name'],
    ];
	
		if ($form['password']){
			$input['password'] = password_hash($form['password'], PASSWORD_BCRYPT);
		}
	
	  if ($_POST['_id'] == 'new'){
		  $input['date_created'] = time();
		  $input['_id'] = uniqid(uniqid());
			db::insert("users", $input);
			$user_id = $input['_id'];
	  }else{
			db::update("users", $input, "_id='".$_POST['_id']."'");
			$user_id = $_POST['_id'];
	  }
	
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

	}

	return render::json($req, $res, [
    'data' => [
      'success' => true,
      // 'input' => $input,
      // 'form' => $form,
      // 'form_string' => $_POST['form']
    ]
  ]);

});





















$app->post('/users/api-fetch-debug[/]', function ($req, $res, $args) {

  $form = [];
  parse_str($_POST['form'],$form);

	return render::json($req, $res, [
    'data' => [
      'success' => true,
      'form' => $form,
      'form_string' => $_POST['form'],
      'user_id' => $_POST['user_id'],
      '_id' => $_POST['_id']
    ]
  ]);

});






$app->post('/users/delete[/]', function ($req, $res, $args) {

	if ($GLOBALS['is_admin']){
		$user = db::find("users", "_id='".$_POST['_id']."'");
		if ($user['data'][0]['avatar_small'] && $user['data'][0]['avatar_small'] != '/images/users/avatar-default-s.png'){
			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_small']);
			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_medium']);
			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_large']);
			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_original']);
		}
		db::delete("users", "_id='".$_POST['_id']."'");
	}


  return render::json($req, $res, [
    'data' => [
      'success' => true
    ]
  ]);

});
