<?php

/**
 * DW Utility Routes / Controllers
 * @version    0.6.0
 * @author     Jonathan Youngblood <jy@hxgf.io>
 */

use Slime\render;



$app->post('/dw/utility/validate-unique[/]', function ($req, $res, $args) {
	$out = [
		'error' => false,
		'success' => true
  ];
  $query = $_POST['field'] . "='" . $_POST['value'] . "'";
  if (isset($_POST['exempt_id'])){
    $query .= " AND _id != '".$_POST['exempt_id']."'";
  }
  $collection = \VPHP\db::find($_POST['collection'], $query);
  if ($collection['data']){
    $out = [
      'error' => true,
      'success' => false,
    ];
  }
	return render::json($req, $res, $out);
});



$app->post('/dw/utility/upload-file[/]', function ($req, $res, $args) {
  if ($_FILES['file']['error'] == 0){
    $filename_original_full = $_FILES['file']['name'];
    $ext = pathinfo($_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $filename_original_full, PATHINFO_EXTENSION);
    $filename_original = str_replace('.' . $ext, '', $filename_original_full);
    $filename_clean = \VPHP\x::url_slug($_FILES['file']['name']);
		$filename_clean_full = uniqid(uniqid()) . '||-||' . $filename_clean;
		$upload_path = $_SERVER['DOCUMENT_ROOT'] . '/uploads/';
    $target = $upload_path . $filename_clean_full;
    if (substr(sprintf('%o', fileperms($upload_path)), -4) != "0755" || !is_writeable($upload_path)){
			$out = [
	      'success' => false,
	      'error' => true,
        'error_title' => 'Error: Permission Denied',
	      'error_message' => 'Upload folder permissions must be 0755.'
      ];
		}else{
	    if (move_uploaded_file($_FILES['file']['tmp_name'], $target)){
        $out = [
          'success' => true,
          'error' => false,
          'filename_original' => $filename_original,
          'filename_original_full' => $filename_original_full,
          'filename' => $filename_clean_full,
          'filename_clean' => $filename_clean,
          'preview_url' => '/uploads/' . $filename_clean_full,
        ];
	    }else{
				$out = [
		      'success' => false,
		      'error' => true,
          'error_title' => 'Server Error',
		      'error_message' => 'An unknown server error occurred.',
          'tmp_name' => $_FILES['file']['tmp_name'],
          '_FILES' => $_FILES,
          'target' => $target
        ];
	    }
		}
  }else{
		$out = [
      'success' => false,
      'error' => true,
      'error_title' => 'Server Error',
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
