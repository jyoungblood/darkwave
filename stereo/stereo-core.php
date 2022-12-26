<?php

require 'stereo/lib/AltoRouter.php';
require 'stereo/lib/Handlebars/Autoloader.php';

Handlebars\Autoloader::register();
use Handlebars\Handlebars;

$router = new AltoRouter();
$engine = new Handlebars(array(
  'loader' => new \Handlebars\Loader\FilesystemLoader($_SERVER["DOCUMENT_ROOT"] . '/pages/',
		array(
	    'extension' => 'hbs'
		)),
  'partials_loader' => new \Handlebars\Loader\FilesystemLoader($_SERVER["DOCUMENT_ROOT"] . '/pages/_partials/',
		array(
	    'extension' => 'hbs'
		))
));

require 'stereo/lib/handlebars-helpers.php';





class StereoSystem {

// -------------------------------------------------------
//   STEREO ROUTING
// -------------------------------------------------------

	public function get($url, $callback){
		$GLOBALS['router']->map('GET', $url, $callback);
	}
	public function post($url, $callback){
		$GLOBALS['router']->map('POST', $url, $callback);
	}
	public function getpost($url, $callback){
		$GLOBALS['router']->map('GET|POST', $url, $callback);
	}
	public function patch($url, $callback){
		$GLOBALS['router']->map('PATCH', $url, $callback);
	}
	public function put($url, $callback){
		$GLOBALS['router']->map('PUT', $url, $callback);
	}
	public function delete($url, $callback){
		$GLOBALS['router']->map('DELETE', $url, $callback);
	}
	public function copy($url, $callback){
		$GLOBALS['router']->map('COPY', $url, $callback);
	}
	public function search($url, $callback){
		$GLOBALS['router']->map('SEARCH', $url, $callback);
	}
	public function head($url, $callback){
		$GLOBALS['router']->map('HEAD', $url, $callback);
	}
	public function options($url, $callback){
		$GLOBALS['router']->map('OPTIONS', $url, $callback);
	}
	public function all($url, $callback){
		$GLOBALS['router']->map('GET|POST|PUT|DELETE|PATCH|COPY|SEARCH|HEAD|OPTIONS', $url, $callback);
	}
	public function any($url, $callback){
		$GLOBALS['router']->map('GET|POST|PUT|DELETE|PATCH|COPY|SEARCH|HEAD|OPTIONS', $url, $callback);
	}



	
// -------------------------------------------------------
//   COOKIE HANDLERS
// -------------------------------------------------------

	// set a cookie
	public function cookie_set($k, $v, $time = false){
		$expires = time() + 31536000;
		if ($time){
			$expires = $time;
		}
		setcookie($k, $v, $expires, "/");
		return true;
	}
	
	// retrieve a cookie
	public function cookie_get($k){
		$o = false;
		if (isset($_COOKIE[$k])){
			$o = $_COOKIE[$k];
		}
		return $o;
	}
	
	// delete a cookie
	public function cookie_delete($k){
		if (isset($_COOKIE[$k])) {
	    unset($_COOKIE[$k]);
	    setcookie($k, '', time() - 3600, '/');
		}
		return true;
	}


	
// -------------------------------------------------------
//   HTTP REQUESTS
// -------------------------------------------------------

	// make an http request to a given url, send data, and return php array (expects response in json format)
  public function json_request($url, $data = array(), $options = array()){
		$_o = $GLOBALS['app']->http_request($url, $data, $options);
	  return json_decode($_o, true);
  }

	// make a json request w/ debugging output
  public function json_request_debug($url, $data = array(), $options = array()){
		$_o = $GLOBALS['app']->http_request($url, $data, $options);
	  return $_o;
  }

	// make a json request to a given url, send hard-coded data (for STEREO app patterns)
  public function api_request($url, $data = array(), $options = array()){
	  if ($GLOBALS['app']->cookie_get('user_id')){
		  $data['user_id'] = $GLOBALS['app']->cookie_get('user_id');
		  $data['auth_token'] = $GLOBALS['app']->cookie_get('auth_token');
		  $data['admin_token'] = $GLOBALS['app']->cookie_get('admin_token');
		  $data['moderator_token'] = $GLOBALS['app']->cookie_get('moderator_token');
	  }
	  return $GLOBALS['app']->json_request($GLOBALS['settings']['api_root'] . $url, $data, $options);
  }

	// make an api request w/ debugging output
  public function api_request_debug($url, $data = array(), $options = array()){
	  if ($GLOBALS['app']->cookie_get('user_id')){
		  $data['user_id'] = $GLOBALS['app']->cookie_get('user_id');
		  $data['auth_token'] = $GLOBALS['app']->cookie_get('auth_token');
		  $data['admin_token'] = $GLOBALS['app']->cookie_get('admin_token');
		  $data['moderator_token'] = $GLOBALS['app']->cookie_get('moderator_token');
	  }
	  return $GLOBALS['app']->json_request_debug($GLOBALS['settings']['api_root'] . $url, $data, $options);
  }

	// make an http request to a given url, send data, return the raw result
	public function http_request($url, $data = array(), $options = array()){
		$data_string = '';
		foreach($data as $key=>$value) { $data_string .= $key . '=' . $value . '&'; }
		rtrim($data_string, '&');
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

		if ($options['type'] == 'GET'){
			curl_setopt($ch,CURLOPT_URL, $url . '?' .$data_string);
		}else{
			curl_setopt($ch,CURLOPT_URL, $url);
			curl_setopt($ch,CURLOPT_POST, count($data));
			curl_setopt($ch,CURLOPT_POSTFIELDS, $data_string);			
		}

		$result = curl_exec($ch);
		curl_close($ch);
		return $result;
	}



	
// -------------------------------------------------------
//   RENDER CONTENT
// -------------------------------------------------------

	// render a template (STEREO app abstraction)
		// check for auth vars
		// make variables available to templates
	public function render_template($p){
	// if $p['layout'] is explicitly false render by itself
		// if $p['layout'], render w/ layout
		// otherwise render w/ base.hbs
		$data = $p['data'];
		if ($p['title']){
			$data['title'] = $p['title'];
		}else{
			$data['title'] = $GLOBALS['site_title'];
		}

		$data['user_id'] = $GLOBALS['user_id'];
		$data['profile_url'] = $GLOBALS['profile_url'];
		$data['auth'] = $GLOBALS['auth'];
		$data['is_admin'] = $GLOBALS['is_admin'];
		$data['is_moderator'] = $GLOBALS['is_moderator'];

		$data['locals'] = $GLOBALS['locals'];
		$data['year'] = date('Y');
		$data['site_title'] = $GLOBALS['site_title'];
		$data['site_code'] = $GLOBALS['site_code'];
		$data['site_url'] = $GLOBALS['site_url'];
		$rendered_template = $GLOBALS['engine']->render($p['template'], $data);
		if ($p['layout'] === false){
			echo $rendered_template;
		}else{
			if ($p['layout']){
				$layout_template = $p['layout'];
			}else{
				$layout_template = 'base';
			}
			$layout = explode('[[outlet]]', $GLOBALS['engine']->render('_layouts/' . $layout_template, $data));
			echo $layout[0];
			if (count($layout) > 1){
				echo $rendered_template;
			}
			echo $layout[1];
		}
		return true;
	}

	// render data as json string
	function render_json($o){
		header("Access-Control-Allow-Origin: *");
		header("Access-Control-Allow-Headers: *");
		header('content-type: application/json; charset=utf-8');
		header('Access-Control-Request-Method: GET, POST, PUT, DELETE, PATCH, COPY, SEARCH, HEAD, OPTIONS');
		echo json_encode($o);
	}

	// render as error document (error template with 404 headers)
	public function render_error($p){
		if ($p['status'] == 404){
			header($_SERVER["SERVER_PROTOCOL"].' 404 Not Found');
			$GLOBALS['app']->render_template(array(
				'template' => '404',
		    'title' => '404 not found',
		    'layout' => false,
				'data' => array()
			));			
		}
	}



	
// -------------------------------------------------------
//   MISC UTILITY
// -------------------------------------------------------

	// return user's ip address
	public function client_ip(){
	  if (!empty($_SERVER['HTTP_CLIENT_IP'])){
	    $ip = $_SERVER['HTTP_CLIENT_IP'];
	  }elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])){
	    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
	  }else{
	    $ip = $_SERVER['REMOTE_ADDR'];
	  }
	  return $ip;
	}

	// determine wether the current user is authenticated/admin/moderator
	public function authenticate(){
		if ($GLOBALS['app']->cookie_get('user_id')){
		  $GLOBALS['user_id'] = $GLOBALS['app']->cookie_get('user_id');
			if ($GLOBALS['app']->cookie_get('group_id')){
				$GLOBALS['group_id'] = $GLOBALS['app']->cookie_get('group_id');
			}
			if (password_verify($GLOBALS['site_code'].'-'.$GLOBALS['app']->cookie_get('user_id'), $GLOBALS['app']->cookie_get('auth_token'))){
				$GLOBALS['auth'] = true;
			}
			if ($GLOBALS['app']->cookie_get('admin_token')){
				if (password_verify($GLOBALS['site_code'], $GLOBALS['app']->cookie_get('admin_token'))){
					$GLOBALS['is_admin'] = true;
				}
			}
			if ($GLOBALS['app']->cookie_get('moderator_token')){
				if (password_verify($GLOBALS['site_code'].'-moderator', $GLOBALS['app']->cookie_get('moderator_token'))){
					$GLOBALS['is_moderator'] = true;
				}
			}
		}
		return true;
	}

	// connect to the database
	public function db_init(){
		$dbh = false;
		if ($GLOBALS['settings']['database']['host']){
			try {
			  $dbh = new PDO("mysql:host=".$GLOBALS['settings']['database']['host'].";dbname=".$GLOBALS['settings']['database']['name'], $GLOBALS['settings']['database']['user'], $GLOBALS['settings']['database']['password']);
				$dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
			}
			catch(PDOException $e) {
		    echo $e->getMessage();
			}
		}
		return $dbh;
	}

	// create db placeholders, sanitize data for query building
	public function db_where_placeholders($where){
		$d = preg_match_all('/\'([^\"]*?)\'/', $where, $o);
		foreach ($o[0] as $ph){
			$data[] = str_replace("'","",$ph);
		}
		$o = array(
			'where' => preg_replace('/\'([^\"]*?)\'/', '?', $where),
			'data' => $data,
		);	
		return $o;
	}

	// send an email (with mailgun api, if available, otherwise use php mail)
	public function email_send($input){

		$message_html = false;

		if ($input['template'] || $input['html']){
			if ($input['template']){
				$rendered_template = $GLOBALS['engine']->render($input['template'], $input['data']);
				if ($input['layout']){
					$layout = explode('[[outlet]]', $GLOBALS['engine']->render('_layouts/' . $input['layout'], $input['data']));
					$message_html = $layout[0];
					if (count($layout) > 1){
						$message_html .= $rendered_template;
					}
					$message_html .= $layout[1];
				}else{
					$message_html = $rendered_template;
				}
			}
			if ($input['html']){
				$message_html = $input['message'];					
			}	
			$message_text = strip_tags($GLOBALS['app']->br2nl($message_html));	
		}



		if ($GLOBALS['settings']['mailgun']['api_key']){
			$message = array(
				'from' => $input['from'],
				'to' => $input['to'],
				'subject' => $input['subject']
			);
			if ($input['cc']){
				$message['cc'] = $input['cc'];
			}	
			if ($input['reply_to']){
				$message['h:Reply-To'] = $input['reply_to'];
			}
			if ($input['bcc']){
				$message['bcc'] = $input['bcc'];
			}	
			if ($message_html){
				$message['html'] = $message_html;
				$message['text'] = $message_text;
			}else{
				$message['text'] = $input['message'];
			}
			$ch = curl_init();
			curl_setopt($ch, CURLOPT_URL, "https://api.mailgun.net/v3/".$GLOBALS['settings']['mailgun']['domain']."/messages");
			curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
			curl_setopt($ch, CURLOPT_USERPWD, "api:".$GLOBALS['settings']['mailgun']['api_key']."");
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
			curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
			curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
			curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
			curl_setopt($ch, CURLOPT_POST, true); 
			curl_setopt($ch, CURLOPT_POSTFIELDS, $message);
			$result = curl_exec($ch);
			curl_close($ch);
			return $result;
		}
		else{
			if ($message_html){
				$boundary = uniqid('st');
				$headers .= "MIME-Version: 1.0\r\n" . "Content-type: multipart/alternative; boundary=" . $boundary . "; charset=utf-8\r\n";
				$message = $message_text;
				$message .= "\r\n\r\n--" . $boundary . "\r\n";
				$message .= "Content-type: text/plain;charset=utf-8\r\n\r\n" . $message_text;
				$message .= "\r\n\r\n--" . $boundary . "\r\n";
				$message .= "Content-type: text/html;charset=utf-8\r\n\r\n" . $message_html;
				$message .= "\r\n\r\n--" . $boundary . "--";

			}else{
				$message = $input['message'];
			}
			if ($input['from']){
				$headers 	.= "From: " . $input['from'] . "\r\n";	
			}		
			if ($input['cc']){
				$headers 	.= "Cc: " . $input['cc'] . "\r\n";	
			}		
			if ($input['bcc']){
				$headers 	.= "Bcc: " . $input['bcc'] . "\r\n";	
			}		
			if ($input['reply_to']){
				$headers 	.= "Reply-To: " . $input['reply_to'] . "\r\n";	
			}

			if ($input['preview']){
				echo $message;
			}

			if ($input['debug']){
				echo '<pre class="bg-black white">';
				print_r($input);
				echo "<hr />";
				echo $headers;
				echo "<hr />";
				echo $message;
				echo '</pre>';
			}

			if ($input['to'] && !$input['preview']&& !$input['debug']){
				mail($input['to'], $input['subject'], $message, $headers);
				return true;
			}else{
				return false;
			}
		}
	}




	// return string as url-safe slug
	public function url_slug($string){
		// unicode-compatible chars only (i think)
		return strtolower(preg_replace('#[^\pL\pN./-]+#', "-", $string)); 
	}


	// return just the domain of a given url (remove "http://","https://","www.")
	public function url_strip($input){
		if (!preg_match('#^http(s)?://#', $input)) {
	    $input = 'http://' . $input;
		}	
		$url_parts = parse_url($input);
		$domain = preg_replace('/^www\./', '', $url_parts['host']);
		return $domain;
	}


	// add http to url, if needed
	public function url_validate($url){
		if (!preg_match('#^http(s)?://#', $url)) {
	    $o = 'http://' . $url;
		}
		else{
			$o = $url;
		}
		return $o;
	}


	// return mysql-formatted date (of a given date, current date if false)
	public function mysql_date($date = false){
		if ($date){
			return date("Y-m-d H:i:s", strtotime($date));
		}else{
			return date("Y-m-d H:i:s");
		}
	}


	// return the id of a video, given a youtube or vimeo url
	public function video_id($video_url){
		if(preg_match("/youtube.com/i", $video_url)){
			$youtube_video = str_replace("https://", "http://", str_replace("m.", "", str_replace("www.", "", $video_url)));
			$id = str_replace("http://youtube.com/watch?v=", "", $youtube_video);
			$id = explode("&", $id);
			$video_id = $id[0];
		}else{
			$vimeo_video = str_replace("www.", "", $video_url);
			$id = str_replace("http://vimeo.com/", "", str_replace("https://vimeo.com/", "", $vimeo_video));
			$video_id = str_replace("/", "", $id);
		}
		return $video_id;
	}


	// replace "<br />" with "\n" (the opposite of nl2br)
	public function br2nl($string) {
	  return preg_replace('/\<br(\s*)?\/?\>/i', "\n", $string);
	} 




	// encode an array (of strings) for storage in mysql (turn it into a string)
	function array_encode($array){
		$o = "";
		foreach ($array as $ar){
			$o .= "|" . $ar;
		}
		return $o;
	}	


	// decode an encoded string and return an array
	function array_decode($string){
		return explode("|", $string);
	}	



	// ------- pagination (updates in progress) -------------
	// determine data for query building
		// current page
		// number of records to offset
	public function pagination_query($current_page, $limit){
		if ($current_page == 0 || $current_page == 1 || $current_page == ''){
			$o['offset'] = 0;
			$o['current'] = 1;
		}else{
			$o['offset'] = $limit * ($current_page - 1);
			$o['current'] = $current_page;
		}
		return $o;
	}

	// determine
		// total number of results pages
		// current page
		// url to next page (if available)
		// url to previous page (if available)
	public function pagination_links($url_path, $current_page, $total_results, $limit){
		$total_pages = ceil(($total_results / $limit));
		$paginate = false;
	
		if ($total_pages >= $current_page && $total_pages > 1){
			$prev = $current_page - 1;
			$next = $current_page + 1;
			if ($prev <= 0){
				$p_prev = false;
			}else{
				$p_prev = $url_path . $prev;
			}
			if ($next > $total_pages){
				$p_next = false;
			}else{
				$p_next = $url_path . $next;
			}
			$paginate = array(
				"previous" => $p_prev,
				"next" => $p_next,
				"current" => $current_page,
				"total" => $total_pages
			);
		}
		return $paginate;
	}





}















	
// -------------------------------------------------------
//   MYSQL CRUD functionality
// -------------------------------------------------------

// sanitize parameters and retrieve data from mysql, returning array w/ total
function db_find($table, $where, $options = false){
	$qr = false;
	$wd = $GLOBALS['app']->db_where_placeholders($where);
	try {
		$query = "SELECT * FROM $table WHERE " . $wd['where'];
		if ($options['raw']){
			$query = $wd['where'];
		}
		$a = $GLOBALS['database']->prepare($query);
		$a->execute($wd['data']);
		$a->setFetchMode(PDO::FETCH_ASSOC);
	}
	catch(PDOException $e) {
	  echo $e->getMessage();
	}
	if ($options['cache'] && function_exists("apc_store")){
		$cache_key = base64_encode($table.$where);
		if ($qr = apc_fetch($cache_key)){
		}else{
			$_options = $options;
			$_options['cache'] = false;
			$qr = db_find($table, $where, $options);
			$cache_length = 60;
			if ($options['cache_length']){
				$cache_length = $options['cache_length'];
			}
			apc_store($cache_key, $qr, $cache_length);
		}
	}else{
		$i = 0;
		while($ad = $a->fetch()){
			$qr['data'][] = $ad;
			$i++;
		}
		if ($i > 0){
			$qr['total'] = $i;
		}		
	}
	return $qr;
}


// sanitize parameters and insert array of data into mysql, returning the id of the record created
function db_insert($table, $input){
	$columns = '';	
	$placeholders = '';	
	$total = count($input);
	$i = 1;
	foreach ($input as $key => $val){
		$columns .= $key;
		$placeholders .= ':' . $key;
		if ($val != NULL){
			$data[$key] = $val;
		}else{
			$data[$key] = NULL;
		}
		if ($total != $i){
			$columns .= ", ";
			$placeholders .= ", ";
		}
		$i++;
	}
	try {
		$a = $GLOBALS['database']->prepare("INSERT INTO $table ($columns) value ($placeholders)");
		$a->execute($data);
	}
	catch(PDOException $e) {
	  echo $e->getMessage();
	}
	$o = $GLOBALS['database']->lastInsertId();
	return $o;
}


// sanitize parameters and update a mysql record
function db_update($table, $input, $where){
	$query = '';
	$total = count($input);
	$i = 1;
	foreach ($input as $key => $val){
		$query .= $key . ' = ?';
		if ($val != NULL){
			$data[] = $val;
		}else{
			$data[] = NULL;
		}
		if ($total != $i){
			$query .= ", ";
		}
		$i++;
	}	
	$wd = $GLOBALS['app']->db_where_placeholders($where);
	foreach ($wd['data'] as $dw){
		$data[] = $dw;
	}
	try {
		$a = $GLOBALS['database']->prepare("UPDATE $table SET $query WHERE " . $wd['where']);
		$a->execute($data);
	}
	catch(PDOException $e) {
	  echo $e->getMessage();
	}
	return true;
}


// sanitize parameters and delete a given mysql record
function db_delete($table, $where){
	$wd = $GLOBALS['app']->db_where_placeholders($where);
	try {
		$a = $GLOBALS['database']->prepare("DELETE FROM $table WHERE " . $wd['where']);
		$a->execute($wd['data']);
	}
	catch(PDOException $e) {
	  echo $e->getMessage();
	}
	return true;
}



// -------------------------------------------------------
//   ADAPTERS FOR LEGACY SUPPORT (STEREO < 1.0)
// -------------------------------------------------------

function db_get($table, $where, $numrows = false){
	$a = db_find($table, $where);
	if ($a['data']){
		$o['r'] = $a['data'];
	}else{
		$o = false;
	}
	if ($numrows){
		$o['total'] = $a['total'];
	}
	return $o;
}

function db_get_raw($table, $where, $numrows = false){
	$a = db_find($table, $where,array(
		'raw' => true
	));
	if ($a['data']){
		$o['r'] = $a['data'];
	}else{
		$o = false;
	}
	if ($numrows){
		$o['total'] = $a['total'];
	}
	return $o;
}

function db_get_c($a, $b, $c = false){
	$a = db_find($a, $b, array(
		'cache' => true
	));
	if ($a['data']){
		$o['r'] = $a['data'];
	}else{
		$o = false;
	}
	if ($c){
		$o['total'] = $a['total'];
	}
	return $o;
}




