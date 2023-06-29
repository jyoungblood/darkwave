<?php



use Slime\render;
use VPHP\db;



$app->get('/login[/]', function ($req, $res, $args) {
	return render::hbs($req, $res, [
    'layout' => '_layouts/base-guest',
		'template' => 'dw/auth-login',
    'title' => 'Log In - ' . $_ENV['SITE_TITLE'],
	]);
});



$app->post('/auth/login/process[/]', function ($req, $res, $args) {
	$email = trim(strtolower($_POST['email']));
	$password = $_POST['password'];
	$_user = db::find("users", "(email='".$email."' OR screenname='".$email."') AND validate_hash IS NULL");
	if ($_user['data'] && !$_POST['website']){
		$user = $_user['data'][0];
		// successful login
		if ($user['group_id'] != 4 && password_verify($password, $user['password'])){
			// update user info
			db::update("users", [
			  'ua_header' => $_POST['ua'],
			  'ip_address' => \VPHP\x::client_ip(),
			  'date_last_login' => date('Y-m-d H:i:s')
      ], "_id='".$user['_id']."'");
  		$out = [
				'success' => true,
      ];
      \VPHP\cookie::set('token', \Darkwave\dw::generate_jwt($user), [
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
	return render::json($req, $res, $out);
});




$app->get('/logout[/]', function ($req, $res, $args) {
  \VPHP\cookie::delete('token');
  return render::redirect($req, $res, '/');
});