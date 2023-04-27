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

    
// fixit can we make it more concise and efficient? anything we can abstract?

    if (isset($form['upload_avatar'])){
    	if ($form['upload_avatar'] == 'DELETE'){

    		$user = db::find("users", "_id='".$user_id."'");
    		if ($user['data'][0]['avatar_small'] != '/images/users/avatar-default-s.png'){
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_small']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_medium']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_large']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_original']);
    		}

    		$photo_input = [
    			'avatar_small' => '/images/users/avatar-default-s.png',
    			'avatar_medium' => '/images/users/avatar-default-m.png',
    			'avatar_large' => '/images/users/avatar-default-l.png',
    			'avatar_original' => '/images/users/avatar-default-o.png',
        ];

    	}else{

    		$user = db::find("users", "_id='".$user_id."'");
    		if ($user['data'][0]['avatar_small'] && $user['data'][0]['avatar_small'] != '/images/users/avatar-default-s.png'){
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_small']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_medium']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_large']);
    			unlink($_SERVER['DOCUMENT_ROOT'] . $user['data'][0]['avatar_original']);
    		}

    		$filename = $form['upload_avatar'];
    		$ext = strtolower(pathinfo($_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $filename, PATHINFO_EXTENSION));
    		$filename_clean = explode('||-||', str_replace('.'.$ext, '', $filename));
        $source = $_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $filename;
    		$filename_small = $user_id . '-' . $filename_clean[1] . '-s.' . $ext;
    		$filename_medium = $user_id . '-' . $filename_clean[1] . '-m.' . $ext;
    		$filename_large = $user_id . '-' . $filename_clean[1] . '-l.' . $ext;
    		$filename_original = $user_id . '-' . $filename_clean[1] . '-o.' . $ext;

    		$photo_input = [
    			'avatar_small' => '/images/users/' . $filename_small,
    			'avatar_medium' => '/images/users/' . $filename_medium,
    			'avatar_large' => '/images/users/' . $filename_large,
    			'avatar_original' => '/images/users/' . $filename_original,
        ];






        list($photo_width, $photo_height) = getimagesize($source);

        // fixit abstraction
        $sq = new \Gumlet\ImageResize($source);
        $sq->crop(300, 300, true, \Gumlet\ImageResize::CROPCENTER);
        $sq->save($_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_small);
        $sq = null;

        if ($photo_width > 800){
          // fixit abstraction
          $md = new \Gumlet\ImageResize($source);
          $md->resizeToBestFit(800, 800);
          $md->save($_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_medium);
          $md = null;
        }else{
          // fixit save compressed version
    			copy($source, $_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_medium);
    		}

        if ($photo_width > 1024){
          // fixit abstraction
          $ld = new \Gumlet\ImageResize($source);
          $ld->resizeToBestFit(1024, 1024);
          $ld->save($_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_large);
          $ld = null;
        }else{
          // fixit save compressed version
          copy($source, $_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_large);
    		}



    		copy($source, $_SERVER['DOCUMENT_ROOT'].'/images/users/'.$filename_original);
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