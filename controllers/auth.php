<?php


use Slime\render;
use VPHP\cookie;
use VPHP\x;
use VPHP\db;


$app->get('/login[/]', function ($req, $res, $args) {

	return render::hbs($req, $res, [
    'layout' => '_layouts/base',
		'template' => 'auth/login',
    'title' => 'Log In - ' . $GLOBALS['site_title'],
    'data' => [
	    'redirect' => isset($_GET['redirect']) ? $_GET['redirect'] : '/'
    ]
	]);

});








$app->get('/register[/]', function ($req, $res, $args) {

	return render::hbs($req, $res, [
    'layout' => '_layouts/base',
		'template' => 'auth/register',
    'title' => 'Register - ' . $GLOBALS['site_title'],
    'data' => [
	    'current_register' => true
    ]
	]);

});









$app->get('/forgot[/]', function ($req, $res, $args) {

	return render::hbs($req, $res, [
    'layout' => '_layouts/base',
		'template' => 'auth/forgot',
    'title' => 'Forgot Password - ' . $GLOBALS['site_title'],
	]);

});










$app->get('/forgot/reset/{hash}/{e_hash}[/]', function ($req, $res, $args) {

	return render::hbs($req, $res, [
    'layout' => '_layouts/base',
		'template' => 'auth/forgot-reset',
    'title' => 'Choose a new password - ' . $GLOBALS['site_title'],
		'data' => [
	    'hash' => $args['hash'],
	    'e_hash' => $args['e_hash'],
    ]
	]);

});












$app->get('/register/activate/{hash}/{e_hash}[/]', function ($req, $res, $args) {

	$_user = db::find("users", "validate_hash='".$args['hash']."' and email='".base64_decode($args['e_hash'])."'");

	if ($_user['data']){
		db::update("users", [
		  'validate_hash' => NULL
    ], "validate_hash='".$args['hash']."'");
	}

	return render::hbs($req, $res, [
    'layout' => '_layouts/base',
		'template' => 'auth/register-activate',
    'title' => 'Registration Complete - ' . $GLOBALS['site_title'],
    'data' => [
			'registration_complete' => true
    ]
	]);

});

















$app->post('/auth/register/process[/]', function ($req, $res, $args) {

  $out = [
    'success' => true,
  ];

	if (!$_POST['website'] && $_POST['email'] != ''){

		$hash = uniqid(uniqid());

    $email = strtolower($_POST['email']);

		db::insert("users", [
			'_id' => uniqid(uniqid()),
			'email' => $email,
			'password' => password_hash($_POST['password'], PASSWORD_BCRYPT),
			'group_id' => '3',
			'date_created' => time(),
			'screenname' => $_POST['screenname'],
      'url_slug' => x::url_slug($_POST['screenname']),
			'first_name' => $_POST['first_name'],
			'last_name' => $_POST['last_name'],
      'ua_header' => $_POST['ua'],
      'ip_address' => x::client_ip(),
			'validate_hash' => $hash
		]);

		x::email_send([
		  'to' => $email,
		  'from' => '"'.$GLOBALS['site_title'].'" <notifications@'.$GLOBALS['site_url'].'>',
		  'subject' => 'Activate your new account',
		  'message' => "Thanks for registering with ".$GLOBALS['site_title'].".\r\r". "In order to complete your account setup, we will need to verify your email address.\r\r Please click the link below to activate your account:\r\r"."http://".$GLOBALS['site_url']."/register/activate/".$hash."/".base64_encode($email)
		]);

	}else{
    // no error for bots
	}


	return render::json($req, $res, [
    'data' => $out
  ]);

});













$app->post('/auth/forgot/process[/]', function ($req, $res, $args) {

	$email = strtolower($_POST['email']);
  $out = [];
  
  $_user = db::find("users", "email='".$email."' OR screenname='".$email."' AND validate_hash IS NULL");
  if ($_user['data'] && !$_POST['website']){

    $hash = uniqid(uniqid());

    db::update("users", [
      'password_hash' => $hash
    ], "email='".$email."'");

    x::email_send([
      'to' => $email,
      'from' => '"'.$GLOBALS['site_title'].'" <notifications@'.$GLOBALS['site_url'].'>',
      'subject' => 'Reset your password',
      'message' => "Here's the link to reset the password for your account at ".$GLOBALS['site_title'].".\r\r"."http://".$GLOBALS['site_url']."/forgot/reset/".$hash."/".base64_encode($email)
    ]);

    $out = [
      'success' => true,
    ];

  }else{
    // error: not a valid email address
    $out = [
      'error' => [
        'type' => 'email',
        'message' => "Error: Unregistered email address"
      ],
      'success' => false
    ];
  }
  
	return render::json($req, $res, [
    'data' => $out
  ]);

});












$app->post('/auth/forgot/reset/process[/]', function ($req, $res, $args) {

  $out = [
    'success' => true,
  ];

	if (!$_POST['website']){

		db::update("users", [
			'password' => password_hash($_POST['password'], PASSWORD_BCRYPT),
			'password_hash' => NULL
    ], "password_hash='".$_POST['hash']."' and email='".base64_decode($_POST['e_hash'])."'");

	}else{
    // no errors now
	}

	return render::json($req, $res, [
    'data' => $out
  ]);

});





























$app->post('/auth/login/process[/]', function ($req, $res, $args) {

	$email = $_POST['email'];
	$password = $_POST['password'];

	$_user = db::find("users", "email='".strtolower($email)."' OR screenname='".strtolower($email)."' AND validate_hash IS NULL");
	if ($_user['data'] && !$_POST['website']){
		$user = $_user['data'][0];

		// successful login
		if ($user['group_id'] != 4 && password_verify($password, $user['password'])){

			// update user info
			db::update("users", [
			  'ua_header' => $_POST['ua'],
			  'ip_address' => x::client_ip(),
			  'date_last_login' => time()
      ], "_id='".$user['_id']."'");

			$auth_token = password_hash($GLOBALS['site_code'].'-'.$user['_id'], PASSWORD_BCRYPT);

			// send success data
			$out = [
				'success' => true,
				'user_id' => $user['_id'],
				'user_avatar' => $user['avatar_small'],
				'group_id' => $user['group_id'],
				'redirect' => $_POST['redirect'],
				'auth_token' => $auth_token
      ];
			// cookie::set('user_id', $user['_id']);
			// cookie::set('auth_token', $auth_token);
			if ($user['group_id'] == 1){
				$out['admin_token'] = password_hash($GLOBALS['site_code'], PASSWORD_BCRYPT);
				// cookie::set('admin_token', $out['admin_token']);
			}

      // fixit set expiration for like 6 months from now
      $jwt_factory = new \PsrJwt\Factory\Jwt();
      $token = $jwt_factory->builder()->setSecret($GLOBALS['settings']['jwt_secret'])
          ->setPayloadClaim('_id', $user['_id'])
          ->setPayloadClaim('admin_token', $out['admin_token'])
          ->build();

      $out['token'] = $token->getToken();
      cookie::set('token', $token->getToken(), [
        'secure' => true,
        'httponly' => true,
      ]);

		}else{
			// error: not a valid password
			$out = [
				'error' => [
          'type' => 'password',
					'message' => "Error: Incorrect password"
          // 'type' => 'general',
          // 'message' => "Error: Incorrect email or password."
        ],
				'success' => false
      ];
		}
	}else{
		// error: not a valid email address
		$out = [
			'error' => [
				'type' => 'email',
				'message' => "Error: Unregistered email address"
        // 'type' => 'general',
        // 'message' => "Error: Incorrect email or password."        
      ],
			'success' => false
    ];
	}

	return render::json($req, $res, [
    'data' => $out
  ]);

});

















$app->get('/logout[/]', function ($req, $res, $args) {

  cookie::delete('user_id');
	cookie::delete('auth_token');
	cookie::delete('admin_token');
	cookie::delete('token');

  // return $res->withHeader('Location', '/')->withStatus(302);

    $body = $res->getBody();
    $body->write('logged out <a href="/">ok</a>');
    return $res->withStatus(200);

  // return render::redirect($req, $res, [ 'location' => '/' ]);

});















$app->get('/account[/]', function ($req, $res, $args) {

	$user_data = db::find("users", "_id='".$GLOBALS['user_id']."'");

	return render::hbs($req, $res, [
    'layout' => '_layouts/base-auth',
		'template' => 'auth/settings',
    'title' => 'Account Settings - ' . $GLOBALS['site_title'],
    'data' => [
	    'current_settings' => true,
	    'data' => $user_data['data'][0]
    ]
	]);

})->add(new dw_authenticate([
  'redirect' => '/login'
]));




















$app->post('/account/save[/]', function ($req, $res, $args) {

  // fixit only if this is my account

  $form = [];
  parse_str($_POST['form'],$form);

  $input = [
    'email' => strtolower($form['email']),
    'url_slug' => x::url_slug($form['screenname']),
    'screenname' => $form['screenname'],
    'first_name' => $form['first_name'],
    'last_name' => $form['last_name'],
  ];

  if ($form['password']){
    $input['password'] = password_hash($form['password'], PASSWORD_BCRYPT);
  }

  db::update("users", $input, "_id='".$GLOBALS['user_id']."'");
  $user_id = $GLOBALS['user_id'];

    
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
    'data' => [
      'success' => true,
      'input' => $input,
      'form' => $form,
      'form_string' => $_POST['form'],
      'user_id' => $GLOBALS['user_id']
    ]
  ]);

})->add(new dw_authenticate());












$app->post('/auth/validate-unique[/]', function ($req, $res, $args) {

	$out = [
		'error' => false,
		'success' => true
  ];

	if ($_POST['type'] == 'email'){
		$user = db::find("users", "email='".strtolower($_POST['value'])."'");
		if ($user['data']){
			if ($_POST['user_id'] == $user['data'][0]['_id']){
				// return true
			}else{
				// return error
				$out = [
					'error' => true,
					'error_message' => '* This address is already registered',
					'success' => false,
        ];
			}
		}else{
			// return true
		}
	}



	if ($_POST['type'] == 'screenname'){
		$user = db::find("users", "screenname='".$_POST['value']."'");
		if ($user['data']){
			if ($_POST['user_id'] == $user['data'][0]['_id']){
				// return true
			}else{
				// return error
				$out = [
					'error' => true,
					'error_message' => '* This name is already registered',
					'success' => false,
        ];
			}
		}else{
			// return true
		}
	}


	return render::json($req, $res, [
    'data' => $out
  ]);

});



?>
