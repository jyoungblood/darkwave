<?php

/**
 * @package    VPHP - X-Utilities
 * @version    1.2.0
 * @author     Jonathan Youngblood <jy@hxgf.io>
 * @license    https://github.com/hxgf/x-utilities/blob/master/LICENSE.md (MIT License)
 * @source     https://github.com/hxgf/x-utilities
 */

namespace VPHP;

class x {

	// return user's ip address
	public static function client_ip(){
	  if (!empty($_SERVER['HTTP_CLIENT_IP'])){
	    $ip = $_SERVER['HTTP_CLIENT_IP'];
	  }elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])){
	    $ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
	  }else{
	    $ip = $_SERVER['REMOTE_ADDR'];
	  }
	  return $ip;
	}

	// send an email (with mailgun api, if available, otherwise use php mail)
	public static function email_send($input){
    $message_html = false;
		if (isset($input['html'])){
      $message_html = $input['message'];					
			$message_text = strip_tags(x::br2nl($message_html));	
		}
		if (isset($GLOBALS['settings']['mailgun']['api_key'])){
			$message = array(
				'from' => $input['from'],
				'to' => $input['to'],
				'subject' => $input['subject']
			);
			if (isset($input['cc'])){
				$message['cc'] = $input['cc'];
			}	
			if (isset($input['reply_to'])){
				$message['h:Reply-To'] = $input['reply_to'];
			}
			if (isset($input['bcc'])){
				$message['bcc'] = $input['bcc'];
			}	
			if ($message_html){
				$message['html'] = $message_html;
				$message['text'] = $message_text;
			}else{
				$message['text'] = $input['message'];
			}
			if (isset($input['preview'])){
				echo $message;
			}
			if (isset($input['debug'])){
				echo '<pre class="bg-black white">';
				print_r($input);
				echo "<hr />";
				echo $headers;
				echo "<hr />";
				echo $message;
				echo '</pre>';
			}
			if (isset($input['to']) && !isset($input['preview']) && !isset($input['debug'])){
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
      }else{
				return false;
      }
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
			if (isset($input['from'])){
				$headers 	.= "From: " . $input['from'] . "\r\n";	
			}		
			if (isset($input['cc'])){
				$headers 	.= "Cc: " . $input['cc'] . "\r\n";	
			}		
			if (isset($input['bcc'])){
				$headers 	.= "Bcc: " . $input['bcc'] . "\r\n";	
			}		
			if (isset($input['reply_to'])){
				$headers 	.= "Reply-To: " . $input['reply_to'] . "\r\n";	
			}
			if (isset($input['preview'])){
				echo $message;
			}
			if (isset($input['debug'])){
				echo '<pre class="bg-black white">';
				print_r($input);
				echo "<hr />";
				echo $headers;
				echo "<hr />";
				echo $message;
				echo '</pre>';
			}
			if (isset($input['to']) && !isset($input['preview']) && !isset($input['debug'])){
				mail($input['to'], $input['subject'], $message, $headers);
				return true;
			}else{
				return false;
			}
		}
	}

	// return string as url-safe slug
	public static function url_slug($string){
		// unicode-compatible chars only (i think)
		return strtolower(preg_replace('#[^\pL\pN./-]+#', "-", $string)); 
	}

	// return just the domain of a given url (remove "http://","https://","www.")
	public static function url_strip($input){
		if (!preg_match('#^http(s)?://#', $input)) {
	    $input = 'http://' . $input;
		}	
		$url_parts = parse_url($input);
		$domain = str_replace('/','',preg_replace('/^www\./', '', $url_parts['host']));
		return $domain;
	}

	// add http to url, if needed
	public static function url_validate($url){
		if (!preg_match('#^http(s)?://#', $url)) {
	    $o = 'http://' . $url;
		}
		else{
			$o = $url;
		}
		return $o;
	}

	// replace "<br />" with "\n" (the opposite of nl2br)
	public static function br2nl($string) {
	  return preg_replace('/\<br(\s*)?\/?\>/i', "\n", $string);
	} 

	// encode an array (of strings) for storage in mysql (turn it into a string)
	public static function array_encode($array){
		$o = "";
		foreach ($array as $ar){
			$o .= "|" . $ar;
		}
		return $o;
	}	

	// decode an encoded string and return an array
	public static function array_decode($string){
		return explode("|", $string);
	}	

  // inspect an array or object, with formatting enabled by default
  public static function console_log($var, $args = array()){
    if (!(isset($args['format']) && $args['format'] == false)){
      $font_size = isset($args['style']['font-size']) ? $args['style']['font-size'] : '11px';
      $background = isset($args['style']['background']) ? $args['style']['background'] : '#000';
      $color = isset($args['style']['color']) ? $args['style']['color'] : '#eee';
      $padding = isset($args['style']['padding']) ? $args['style']['padding'] : '13px';
      $line_height = isset($args['style']['line_height']) ? $args['style']['line_height'] : '150%';
      $custom = isset($args['style']['custom']) ? $args['style']['custom'] : '';
      echo '<pre style="font-size: '.$font_size.'; background: '.$background.'; color: '.$color.'; padding: '.$padding.'; line-height: '.$line_height.'; '.$custom.'">';
    }    
    if (is_array($var)){
      print_r($var);
    }elseif (is_object($var)){
      var_dump($var);
    }else{
      echo $var;
    }
    if (!(isset($args['format']) && $args['format'] == false)){
      echo "</pre>";
    }
    return true;
	}	

  // append a string of text (or object, array) to a given file
  public static function file_write($content, $target_file, $args = array()){
    if (is_array($content)){
      $content = print_r($content, true);
    }
    if (is_object($content)){
      ob_start();
      var_dump($content);
      $content = ob_get_clean();      
    }
    $mode = isset($args['mode']) ? $args['mode'] : 'a';
    $line_beginning = isset($args['line_beginning']) ? $args['line_beginning'] : '';
    $line_ending = isset($args['line_ending']) ? $args['line_ending'] : PHP_EOL;
    $fh = fopen($target_file, $mode) or die("Error: can't open file: " . $target_file);
    fwrite($fh, $line_beginning . $content . $line_ending);
    fclose($fh);
    return true;
  }

  // dump variable (auto-detected array, object, string), then die
  public static function dd($var, $args = array()){
    x::console_log($var, $args);
    die;
  }

  // append object, array, or string to error_log
  public static function error_log($var){
    if (is_array($var)){
      $var = print_r($var, true);
    }elseif (is_object($var)){
      ob_start();
      var_dump($var);
      $var = ob_get_clean();      
    }
    error_log($var);
  }

}

?>