<?php

/**
 * DW Utility Routes
 * @version    0.6.0
 * @author     Jonathan Youngblood <jy@hxgf.io>
 */

use Slime\render;
use VPHP\db;



$app->post('/dw/utility/validate-unique[/]', function ($req, $res, $args) {
	$out = [
		'error' => false,
		'success' => true
  ];
  $query = $_POST['field'] . "='" . $_POST['value'] . "'";
  if (isset($_POST['exempt_id'])){
    $query .= " AND _id != '".$_POST['exempt_id']."'";
  }
  $collection = db::find($_POST['collection'], $query);
  if ($collection['data']){
    $out = [
      'error' => true,
      'success' => false,
    ];
  }
  $out['post'] = [
    'collection' => $collection,
    'post_collection' => $_POST['collection'],
    'post_field' => $_POST['field'],
    'post_value' => $_POST['value'],
    'post_exempt_id' => $_POST['exempt_id'],
  ];
	return render::json($req, $res, $out);
});



$app->post('/dw/utility/upload-file[/]', function ($req, $res, $args) {
  if ($_FILES['file']['error'] == 0){
		$filename_clean = \VPHP\x::url_slug($_FILES['file']['name']);
		$filename_clean_full = uniqid(uniqid()) . '||-||' . $filename_clean;
		$upload_path = $_SERVER['DOCUMENT_ROOT'] . '/uploads/';
    $target = $upload_path . $filename_clean_full;
		if (substr(sprintf('%o', fileperms($upload_path)), -4) != "0755" || !is_writeable($upload_path)){
			$out = [
	      'success' => false,
	      'error' => true,
	      'error_message' => 'Server Error: permission denied. Upload folder permissions must be 0755.'
      ];
		}else{
	    if (move_uploaded_file($_FILES['file']['tmp_name'], $target)){
					$out = [
						'filename' => $filename_clean_full,
						'filename_clean' => $filename_clean,
						'preview_url' => '/uploads/' . $filename_clean_full,
			      'success' => true,
			      'error' => false,
          ];
	    }else{
				$out = [
		      'success' => false,
		      'error' => true,
		      'error_message' => 'An unknown server error occurred.'
        ];
	    }
		}
  }else{
		$out = [
      'success' => false,
      'error' => true,
      'error_message' => 'PHP Error Code: ' . $_FILES['file']['error']
    ];
  }
	return render::json($req, $res, $out);
});



$app->post('/dw/utility/delete-upload[/]', function ($req, $res, $args) {
	if ($_POST['filename']){
		unlink($_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $_POST['filename']);
	}
	$out = [ 'success' => true ];
	return render::json($req, $res, $out);
});
