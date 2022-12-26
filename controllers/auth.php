<?php




$app->get('/login/?', function(){

	$GLOBALS['app']->render_template(array(
		'template' => 'auth/auth-login',
    'title' => 'Log In - ' . $GLOBALS['site_title'],
    'data' => array(
	    'current_login' => true,
	    'ip' => $GLOBALS['app']->client_ip(),
	    'redirect' => $_GET['redirect'] == 'home' ? "/" : $_SERVER['HTTP_REFERER']
		)
	));

});








$app->get('/register/?', function(){

	$GLOBALS['app']->render_template(array(
		'template' => 'auth/auth-register',
    'title' => 'Register - ' . $GLOBALS['site_title'],
    'data' => array(
	    'current_register' => true
    )
	));

});









$app->get('/forgot/?', function(){

	$GLOBALS['app']->render_template(array(
		'template' => 'auth/auth-forgot',
    'title' => 'Forgot Password - ' . $GLOBALS['site_title'],
	));

});










$app->get('/forgot/reset/[*:hash]', function($hash){

	$GLOBALS['app']->render_template(array(
		'template' => 'auth/auth-feedback',
    'title' => 'New Password - ' . $GLOBALS['site_title'],
		'data' => array(
	    'hash' => $hash,
			'forgot_reset' => true,
		)
	));

});












$app->get('/register/activate/[*:hash]', function($hash){

	$_user = db_find("users", "validate_hash='".$hash."'");

	if ($_user['data']){
		db_update("users", array(
		  'validate_hash' => NULL
		), "validate_hash='".$hash."'");
	}

	$GLOBALS['app']->render_template(array(
		'template' => 'auth/auth-feedback',
    'title' => 'Registration Complete - ' . $GLOBALS['site_title'],
    'data' => array(
			'registration_complete' => true
    )
	));

});

















$app->post('/register/process', function(){

	if (!$_POST['website'] && $_POST['email'] != ''){

		$hash = uniqid(uniqid());

		db_insert("users", array(
			'_id' => uniqid(uniqid()),
			'email' => strtolower($_POST['email']),
			'password' => password_hash($_POST['password'], PASSWORD_BCRYPT),
			'group_id' => '3',
			'date_created' => time(),
			'screenname' => $_POST['screenname'],
			'validate_hash' => $hash
		));

		$message = "Thanks for registering with ".$GLOBALS['site_title'].".\r\r".
		"In order to complete your account setup, we will need to verify your email address. Please click the link below and we can activate your account:\r\r".
		"http://".$GLOBALS['site_url']."/register/activate/".$hash;

		$GLOBALS['app']->email_send(array(
		  'to' => strtolower($_POST['email']),
		  'from' => '"'.$GLOBALS['site_title'].'" <notifications@'.$GLOBALS['site_url'].'>',
		  'subject' => 'Activate your new account',
		  'message' => $message
		));

		$GLOBALS['app']->render_template(array(
			'template' => 'auth/auth-feedback',
	    'title' => 'Register - ' . $GLOBALS['site_title'],
	    'data' => array(
				'register_process' => true
			)
		));

	}else{
		header("Location: /");
	}

});













$app->post('/forgot/process', function(){

	if (!$_POST['website']){

		$hash = uniqid(uniqid());

		db_update("users", array(
			'password_hash' => $hash
		), "email='".strtolower($_POST['email'])."'");

		$message = "Here's the link to reset the password for your account at ".$GLOBALS['site_title'].".\r\r".
		"http://".$GLOBALS['site_url']."/forgot/reset/".$hash;

		$GLOBALS['app']->email_send(array(
		  'to' => strtolower($_POST['email']),
		  'from' => '"'.$GLOBALS['site_title'].'" <notifications@'.$GLOBALS['site_url'].'>',
		  'subject' => 'Reset your password',
		  'message' => $message
		));


		$GLOBALS['app']->render_template(array(
			'template' => 'auth/auth-feedback',
	    'title' => 'Reset Password - ' . $GLOBALS['site_title'],
		  'data' => array(
				'forgot_process' => true
			)
		));

	}else{
		header("Location: /");
	}

});












$app->post('/forgot/reset/process', function(){

	if (!$_POST['website']){

		db_update("users", array(
			'password' => password_hash($_POST['password'], PASSWORD_BCRYPT),
			'password_hash' => NULL
		), "password_hash='".$_POST['hash']."'");

		$GLOBALS['app']->render_template(array(
			'template' => 'auth/auth-feedback',
	    'title' => 'Password Reset Successfully - ' . $GLOBALS['site_title'],
	    'data' => array(
				'forgot_reset_process' => true
	    )
		));

	}else{
		header("Location: /");
	}

});










$app->post('/auth/login/process', function(){

	$email = $_POST['email'];
	$password = $_POST['password'];

	$_user = db_find("users", "email='".strtolower($email)."' OR screenname='".strtolower($email)."' AND validate_hash IS NULL");
	if ($_user['data'] && !$_POST['website']){
		$user = $_user['data'][0];

		// successful login
		if ($user['group_id'] != 4 && password_verify($password, $user['password'])){

			// update user info
			db_update("users", array(
			  'ua_header' => $_POST['ua'],
			  'ip_address' => $_POST['ip'],
			  'date_last_login' => time()
			), "_id='".$user['_id']."'");

			$auth_token = password_hash($GLOBALS['site_code'].'-'.$user['_id'], PASSWORD_BCRYPT);

			// send success data
			$out = array(
				'success' => true,
				'user_id' => $user['_id'],
				'user_avatar' => $user['avatar_small'],
				'group_id' => $user['group_id'],
				'redirect' => $_POST['redirect'],
				'auth_token' => $auth_token
			);

			$GLOBALS['app']->cookie_set('user_id', $user['_id']);
			$GLOBALS['app']->cookie_set('auth_token', $auth_token);
			$GLOBALS['app']->cookie_set('user_avatar', $user['avatar_small']);
			if ($user['group_id'] == 1){
				$out['admin_token'] = password_hash($GLOBALS['site_code'], PASSWORD_BCRYPT);
				$GLOBALS['app']->cookie_set('admin_token', $out['admin_token']);
			}

			if ($user['group_id'] == 2){
				$out['moderator_token'] = password_hash($GLOBALS['site_code'].'-moderator', PASSWORD_BCRYPT);
				$GLOBALS['app']->cookie_set('moderator_token', $out['moderator_token']);
			}

		}else{
			// error: not a valid password
			$out = array(
				'error' => array(
					'password' => true,
					'message' => "Error: Incorrect password"
				),
				'success' => false
			);
		}
	}else{
		// error: not a valid email address
		$out = array(
			'error' => array(
				'email' => true,
				'message' => "Error: Unregistered email address"
			),
			'success' => false
		);
	}

	$GLOBALS['app']->render_json($out);

});














$app->get('/logout/?', function(){

	$GLOBALS['app']->cookie_delete('user_id');
	$GLOBALS['app']->cookie_delete('user_avatar');
	$GLOBALS['app']->cookie_delete('auth_token');
	$GLOBALS['app']->cookie_delete('admin_token');
	$GLOBALS['app']->cookie_delete('moderator_token');

	header("Location: /");

});















$app->get('/account/settings', function(){

	$user_data = db_find("users", "_id='".$GLOBALS['app']->cookie_get('user_id')."'");

	$GLOBALS['app']->render_template(array(
		'template' => 'auth/auth-settings',
    'title' => 'Account Settings - ' . $GLOBALS['site_title'],
    'data' => array(
	    'current_settings' => true,
	    'data' => $user_data['data'][0]
    )
	));

});









$app->post('/account/settings/process', function(){

	$input = array(
		'email' => strtolower($_POST['email']),
		'screenname' => $_POST['screenname'],
		'first_name' => $_POST['first_name'],
		'last_name' => $_POST['last_name']
	);

	if ($_POST['password']){
		$input['password'] = password_hash($_POST['password'], PASSWORD_BCRYPT);
	}


	db_update("users", $input, "_id='".$GLOBALS['app']->cookie_get('user_id')."'");

	$user_data = db_find("users", "_id='".$GLOBALS['app']->cookie_get('user_id')."'");

	$GLOBALS['app']->render_template(array(
		'template' => 'auth/auth-settings',
    'title' => 'Account Settings - ' . $GLOBALS['site_title'],
    'data' => array(
	    'current_settings' => true,
	    'saved' => true,
	    'data' => $user_data['data'][0]
    )
	));

});
















$app->post('/auth/validate-unique', function(){

	$out = array(
		'error' => false,
		'success' => true
	);

	if ($_POST['type'] == 'email'){
		$user = db_find("users", "email='".strtolower($_POST['value'])."'");
		if ($user['data']){
			if ($_POST['user_id'] == $user['data'][0]['_id']){
				// return true
			}else{
				// return error
				$out = array(
					'error' => true,
					'error_message' => '* This address is already registered',
					'success' => false,
				);
			}
		}else{
			// return true
		}
	}



	if ($_POST['type'] == 'screenname'){
		$user = db_find("users", "screenname='".$_POST['value']."'");
		if ($user['data']){
			if ($_POST['user_id'] == $user['data'][0]['_id']){
				// return true
			}else{
				// return error
				$out = array(
					'error' => true,
					'error_message' => '* This name is already registered',
					'success' => false,
				);
			}
		}else{
			// return true
		}
	}


	$GLOBALS['app']->render_json($out);

});



?>
