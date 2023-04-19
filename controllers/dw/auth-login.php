<?php



use Slime\render;
use VPHP\db;



$app->get('/login[/]', function ($req, $res, $args) {
	return render::hbs($req, $res, [
    'layout' => '_layouts/base-guest',
		'template' => 'dw/auth-login',
    'title' => 'Log In - ' . $GLOBALS['site_title'],
	]);
});



$app->post('/auth/login/process[/]', function ($req, $res, $args) {
	$email = $_POST['email'];
	$password = $_POST['password'];
	$_user = db::find("users", "(email='".strtolower($email)."' OR screenname='".strtolower($email)."') AND validate_hash IS NULL");
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
			$auth_token = password_hash($GLOBALS['site_code'].'-'.$user['_id'], PASSWORD_BCRYPT);
			// send success data
			$out = [
				'success' => true,
				'auth_token' => $auth_token
      ];
			if ($user['group_id'] == 1){
				$out['admin_token'] = password_hash($GLOBALS['site_code'], PASSWORD_BCRYPT);
			}
      $jwt_factory = new \PsrJwt\Factory\Jwt();
      $token = $jwt_factory->builder()->setSecret($GLOBALS['settings']['jwt_secret'])
        ->setPayloadClaim('_id', $user['_id'])
        ->setPayloadClaim('admin_token', $out['admin_token'])
        ->build();
      $out['token'] = $token->getToken();
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