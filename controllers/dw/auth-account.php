<?php



use Slime\render;
use VPHP\db;



$app->get('/account[/]', function ($req, $res, $args) {
	$user_data = db::find("users", "_id='".$GLOBALS['user_id']."'");
	return render::hbs($req, $res, [
    'layout' => '_layouts/base',
		'template' => 'dw/auth-account',
    'title' => 'Account - ' . $_ENV['SITE_TITLE'],
    'data' => [
	    'data' => $user_data['data'][0]
    ]
	]);
});



$app->post('/account/save[/]', function ($req, $res, $args) {
  if (!isset($GLOBALS['user_id'])){
    return render::json($req, $res, [
      'error_code' => 401,
      'error_message' => 'You are not authorized to use this resource.'
    ], 401);
  }else{
    parse_str($_POST['form'],$form);
    $input = [
      'email' => strtolower($form['email']),
      'url_slug' => \VPHP\x::url_slug($form['screenname']),
      'screenname' => $form['screenname'],
      'first_name' => $form['first_name'],
      'last_name' => $form['last_name'],
		  'date_updated' => date('Y-m-d H:i:s')
    ];
    if ($form['password']){
      $input['password'] = password_hash($form['password'], PASSWORD_BCRYPT);
    }
    db::update("users", $input, "_id='".$GLOBALS['user_id']."'");
    $user_id = $GLOBALS['user_id'];
    if (isset($form['upload_avatar'])){
    	if ($form['upload_avatar'] == 'DELETE'){
    		$user = db::find("users", "_id='".$user_id."'");
    		if ($user['data'][0]['avatar_small'] != '/images/avatar-default.png'){
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_small']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_medium']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_large']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_original']);
    		}
    		$photo_input = [
    			'avatar_small' => '/images/avatar-default.png',
    			'avatar_medium' => '/images/avatar-default.png',
    			'avatar_large' => '/images/avatar-default.png',
    			'avatar_original' => '/images/avatar-default.png',
        ];
    	}else{
    		$user = db::find("users", "_id='".$user_id."'");
    		if ($user['data'][0]['avatar_small'] && $user['data'][0]['avatar_small'] != '/images/avatar-default.png'){
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_small']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_medium']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_large']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_original']);
    		}
        $source = $_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $form['upload_avatar'];
    		$ext = strtolower(pathinfo($source, PATHINFO_EXTENSION));
    		$filename_clean = explode('||-||', str_replace('.'.$ext, '', $form['upload_avatar']));
    		$filename_small = $user_id . '-' . $filename_clean[1] . '-s.' . $ext;
    		$filename_medium = $user_id . '-' . $filename_clean[1] . '-m.' . $ext;
    		$filename_large = $user_id . '-' . $filename_clean[1] . '-l.' . $ext;
    		$filename_original = $user_id . '-' . $filename_clean[1] . '-o.' . $ext;
    		$photo_input = [
    			'avatar_small' => '/media/avatars/' . $filename_small,
    			'avatar_medium' => '/media/avatars/' . $filename_medium,
    			'avatar_large' => '/media/avatars/' . $filename_large,
    			'avatar_original' => '/media/avatars/' . $filename_original,
        ];
        \Darkwave\dw::convert_image([
          'source' => $source,
          'target' => $_SERVER['DOCUMENT_ROOT'] . $photo_input['avatar_small'],
          'resize' => [300, 300],
          'crop' => 'center',
        ]);
        \Darkwave\dw::convert_image([
          'source' => $source,
          'target' => $_SERVER['DOCUMENT_ROOT'] . $photo_input['avatar_medium'],
          'resize' => [800, 800],
          'threshold' => 800
        ]);
        \Darkwave\dw::convert_image([
          'source' => $source,
          'target' => $_SERVER['DOCUMENT_ROOT'] . $photo_input['avatar_large'],
          'resize' => [1024, 1024],
          'threshold' => 1024
        ]);
    		copy($source, $_SERVER['DOCUMENT_ROOT'] . $photo_input['avatar_original']);
    		unlink($source);
    	}
    	db::update("users", $photo_input, "_id='".$user_id."'");
    }
    $_user = db::find("users", "_id = '".$GLOBALS['user_id']."'");
    return render::json($req, $res, [
      'success' => true,
      'token' => \Darkwave\dw::generate_jwt($_user['data'][0])
    ]);
  }
});









// fixit delete after debugging

$app->get('/demo-resize', function ($req, $res, $args) {
  // phpinfo();
  // die;

  $source = $_SERVER['DOCUMENT_ROOT'] .'/uploads/demo-o.jpg';
  $destination = $_SERVER['DOCUMENT_ROOT'] .'/uploads/demo-r.jpg';






  // $image = new \Gumlet\ImageResize($source);
  // $image->scale(50);
  // $image->save($destination);


  // $image2 = new \Gumlet\ImageResize($source);
  // $image2->resizeToBestFit(800, 600);
  // $image2->save($_SERVER['DOCUMENT_ROOT'] .'/uploads/demo-r-800.jpg');



  echo "<img src='/uploads/demo-r.jpg' style='width: 50%;' />";

  echo "<img src='/uploads/demo-o.jpg' style='width: 50%;' />";



  echo "<img src='/uploads/demo-r-800.jpg' style='' />";
  // echo "<img src='/uploads/demo-r-300.jpg' style='' />";

  return render::html($req, $res, '');
});