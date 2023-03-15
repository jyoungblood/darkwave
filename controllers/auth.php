<?php


use Slime\render;
use VPHP\cookie;
use VPHP\x;
use VPHP\db;


$app->get('/login[/]', function ($req, $res, $args) {

	return render::hbs($req, $res, [
    'layout' => '_layouts/base-unauth',
		'template' => 'auth/auth-login',
    'title' => 'Log In - ' . $GLOBALS['site_title'],
    'data' => [
	    'redirect' => isset($_GET['redirect']) ? $_GET['redirect'] : '/'
    ]
	]);

});








$app->get('/register[/]', function ($req, $res, $args) {

	return render::hbs($req, $res, [
    'layout' => '_layouts/base-unauth',
		'template' => 'auth/auth-register',
    'title' => 'Register - ' . $GLOBALS['site_title'],
    'data' => [
	    'current_register' => true
    ]
	]);

});









$app->get('/forgot[/]', function ($req, $res, $args) {

	return render::hbs($req, $res, [
    'layout' => '_layouts/base-unauth',
		'template' => 'auth/auth-forgot',
    'title' => 'Forgot Password - ' . $GLOBALS['site_title'],
	]);

});










$app->get('/forgot/reset/{hash}[/]', function ($req, $res, $args) {

	return render::hbs($req, $res, [
    'layout' => '_layouts/base-unauth',
		'template' => 'auth/auth-feedback',
    'title' => 'New Password - ' . $GLOBALS['site_title'],
		'data' => [
	    'hash' => $args['hash'],
			'forgot_reset' => true,
    ]
	]);

});












$app->get('/register/activate/{hash}[/]', function ($req, $res, $args) {

	$_user = db::find("users", "validate_hash='".$args['hash']."'");

	if ($_user['data']){
		db::update("users", [
		  'validate_hash' => NULL
    ], "validate_hash='".$args['hash']."'");
	}

	return render::hbs($req, $res, [
    'layout' => '_layouts/base-unauth',
		'template' => 'auth/auth-feedback',
    'title' => 'Registration Complete - ' . $GLOBALS['site_title'],
    'data' => [
			'registration_complete' => true
    ]
	]);

});

















$app->post('/register/process[/]', function ($req, $res, $args) {

	if (!$_POST['website'] && $_POST['email'] != ''){

		$hash = uniqid(uniqid());

		db::insert("users", [
			'_id' => uniqid(uniqid()),
			'email' => strtolower($_POST['email']),
			'password' => password_hash($_POST['password'], PASSWORD_BCRYPT),
			'group_id' => '3',
			'date_created' => time(),
			'screenname' => $_POST['screenname'],
			'validate_hash' => $hash
		]);

		$message = "Thanks for registering with ".$GLOBALS['site_title'].".\r\r".
		"In order to complete your account setup, we will need to verify your email address. Please click the link below and we can activate your account:\r\r".
		"http://".$GLOBALS['site_url']."/register/activate/".$hash;

		x::email_send([
		  'to' => strtolower($_POST['email']),
		  'from' => '"'.$GLOBALS['site_title'].'" <notifications@'.$GLOBALS['site_url'].'>',
		  'subject' => 'Activate your new account',
		  'message' => $message
		]);

		return render::hbs($req, $res, [
      'layout' => '_layouts/base-unauth',
			'template' => 'auth/auth-feedback',
	    'title' => 'Register - ' . $GLOBALS['site_title'],
	    'data' => [
				'register_process' => true
      ]
		]);

	}else{
    return render::redirect($req, $res, [ 'location' => '/' ]);
	}

});













$app->post('/forgot/process[/]', function ($req, $res, $args) {

	if (!$_POST['website']){

		$hash = uniqid(uniqid());

		db::update("users", [
			'password_hash' => $hash
    ], "email='".strtolower($_POST['email'])."'");

		$message = "Here's the link to reset the password for your account at ".$GLOBALS['site_title'].".\r\r".
		"http://".$GLOBALS['site_url']."/forgot/reset/".$hash;

		x::email_send([
		  'to' => strtolower($_POST['email']),
		  'from' => '"'.$GLOBALS['site_title'].'" <notifications@'.$GLOBALS['site_url'].'>',
		  'subject' => 'Reset your password',
		  'message' => $message
		]);


		return render::hbs($req, $res, [
      'layout' => '_layouts/base-unauth',
			'template' => 'auth/auth-feedback',
	    'title' => 'Reset Password - ' . $GLOBALS['site_title'],
		  'data' => [
				'forgot_process' => true
      ]
		]);

	}else{
    return render::redirect($req, $res, [ 'location' => '/' ]);
	}

});












$app->post('/forgot/reset/process[/]', function ($req, $res, $args) {

	if (!$_POST['website']){

		db::update("users", [
			'password' => password_hash($_POST['password'], PASSWORD_BCRYPT),
			'password_hash' => NULL
    ], "password_hash='".$_POST['hash']."'");

		return render::hbs($req, $res, [
      'layout' => '_layouts/base-unauth',
			'template' => 'auth/auth-feedback',
	    'title' => 'Password Reset Successfully - ' . $GLOBALS['site_title'],
	    'data' => [
				'forgot_reset_process' => true
      ]
		]);

	}else{
    return render::redirect($req, $res, [ 'location' => '/' ]);
	}

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
			cookie::set('user_id', $user['_id']);
			cookie::set('auth_token', $auth_token);
			if ($user['group_id'] == 1){
				$out['admin_token'] = password_hash($GLOBALS['site_code'], PASSWORD_BCRYPT);
				cookie::set('admin_token', $out['admin_token']);
			}

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

  return render::redirect($req, $res, [ 'location' => '/' ]);

});















$app->get('/account/settings[/]', function ($req, $res, $args) {

	$user_data = db::find("users", "_id='".cookie::get('user_id')."'");

	return render::hbs($req, $res, [
    'layout' => '_layouts/base',
		'template' => 'auth/auth-settings',
    'title' => 'Account Settings - ' . $GLOBALS['site_title'],
    'data' => [
	    'current_settings' => true,
	    'data' => $user_data['data'][0]
    ]
	]);

});









$app->post('/account/settings/process[/]', function ($req, $res, $args) {

	$input = [
		'email' => strtolower($_POST['email']),
		'screenname' => $_POST['screenname'],
		'first_name' => $_POST['first_name'],
		'last_name' => $_POST['last_name']
  ];

	if ($_POST['password']){
		$input['password'] = password_hash($_POST['password'], PASSWORD_BCRYPT);
	}

	db::update("users", $input, "_id='".cookie::get('user_id')."'");

	$user_data = db::find("users", "_id='".cookie::get('user_id')."'");

	return render::hbs($req, $res, [
    'layout' => '_layouts/base',
		'template' => 'auth/auth-settings',
    'title' => 'Account Settings - ' . $GLOBALS['site_title'],
    'data' => [
	    'current_settings' => true,
	    'saved' => true,
	    'data' => $user_data['data'][0]
    ]
	]);

});
















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
