<?php




$app->get('/admin/users/?', function(){

	$_users = db_find("users", "id IS NOT NULL ORDER BY email ASC");

	$GLOBALS['app']->render_template(array(
		'layout' => 'admin',
		'template' => 'admin/users-list',
    'title' => 'Users - ' . $GLOBALS['site_title'] .' Admin',
		'data' => array(
	    'ip' => $GLOBALS['app']->client_ip(),
	    'current_users' => true,
	    'users'=> $_users['data']
		)
	));

});










$app->get('/admin/users/edit/[*:user_id]', function($user_id){

	$_data = db_find("users", "_id='".$user_id."'");

	$data = $_data['data'][0];

	if ($_data['data']){
		$title = 'Edit User - '.$data['screenname'].' - '.$GLOBALS['site_title'].' Admin';
	}else{
		$title = 'New User - '.$GLOBALS['site_title'].' Admin';
	}

	$GLOBALS['app']->render_template(array(
		'layout' => 'admin',
		'template' => 'admin/users-edit',
    'title' => $title,
		'data' => array(
	    'current_users' => true,
	    'data' => $data
		)
	));

});











$app->post('/admin/users/save', function(){

	$form = array();
	parse_str($_POST['form'],$form);

	$input = array(
		'email' => strtolower($form['email']),
		'group_id' => $form['group_id'],
		'url_slug' => $GLOBALS['app']->url_slug($form['screenname']),
		'screenname' => $form['screenname'],
		'first_name' => $form['first_name'],
		'last_name' => $form['last_name'],
	);

	if ($form['password']){
		$input['password'] = password_hash($form['password'], PASSWORD_BCRYPT);
	}

  if ($form['_id'] == ''){
	  $input['date_created'] = time();
	  $input['_id'] = uniqid(uniqid());
		db_insert("users", $input);
  }else{
		db_update("users", $input, "_id='".$form['_id']."'");
  }

	$GLOBALS['app']->render_json(array(
		'success' => true
	));

});







$app->post('/admin/users/delete', function(){

	db_delete("users", "_id='".$_POST['_id']."'");

	$GLOBALS['app']->render_json(array(
		'success' => true
	));

});
