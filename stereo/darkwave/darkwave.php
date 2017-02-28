<?php

require 'stereo/darkwave/phmagick/phmagick.php';


$app->post('/utility/upload-file', function(){

  if ($_FILES['file']['error'] == 0){

		$filename_clean_full = uniqid(uniqid()) . '||-||' . $GLOBALS['app']->url_slug($_FILES['file']['name']);
		$upload_path = $_SERVER['DOCUMENT_ROOT'] . '/uploads/';
    $target = $upload_path . $filename_clean_full;

		if (substr(sprintf('%o', fileperms($upload_path)), -4) != "0755" || !is_writeable($upload_path)){

			$out = array(
	      'success' => false,
	      'error' => true,
	      'error_message' => 'Server Error: permission denied. Upload folder permissions must be 0755.'
			);

		}else{

	    if (move_uploaded_file($_FILES['file']['tmp_name'], $target)){

					$out = array(
						'filename' => $filename_clean_full,
						'preview_url' => '/uploads/' . $filename_clean_full,
			      'success' => true,
			      'error' => false,
					);

	    }else{

				$out = array(
		      'success' => false,
		      'error' => true,
		      'error_message' => 'An unknown server error occurred.'
				);

	    }


		}

  }else{

		$out = array(
      'success' => false,
      'error' => true,
      'error_message' => 'PHP Error Code: ' . $_FILES['file']['error']
		);

  }

	$GLOBALS['app']->render_json($out);

});








$app->post('/utility/delete-upload', function(){

	if ($_POST['filename']){
		$target = $_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $_POST['filename'];
		unlink($target);
	}

	$out = array(
    'success' => true
	);

	$GLOBALS['app']->render_json($out);

});
