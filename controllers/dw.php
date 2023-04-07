<?php


use Slime\render;

// require 'stereo/darkwave/phmagick/phmagick.php';

// only show errors, not warnings
// error_reporting(E_ERROR | E_PARSE);







$app->post('/api/validate-unique[/]', function ($req, $res, $args) {

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
    // return error
    $out = [
      'error' => true,
      'success' => false,
    ];
  }else{
    // return true
  }


  $out['post'] = [
    'collection' => $collection,
    'post_collection' => $_POST['collection'],
    'post_field' => $_POST['field'],
    'post_value' => $_POST['value'],
    'post_exempt_id' => $_POST['exempt_id'],
  ];

	return render::json($req, $res, [
    'data' => $out,
  ]);

});









// fixit dev mode

// utilities for dev mode only
// if ($GLOBALS['settings']['mode'] == 'development'){

	$app->get('/uuid[/]', function ($req, $res, $args) {
    // $body = $res->getBody();
    // $body->write(
    //   uniqid(uniqid())
    // );
    echo uniqid(uniqid());
    return $res;
	});

  $app->get('/db-structure[/]', function ($req, $res, $args) {
		$tf = '';
		echo "<div style='line-height: 180%; padding: 2rem;'>";
		foreach ($GLOBALS['database']->query('show tables')->fetchAll(PDO::FETCH_ASSOC) as $table){
			$table_name = $table['Tables_in_' . $GLOBALS['settings']['database']['name']];
			$tf .= $table_name . "\n";
			echo "<h1>" . $table_name . "</h1>";
			$_fields = [];
			foreach ($GLOBALS['database']->query('DESCRIBE ' . $table_name)->fetchAll(PDO::FETCH_ASSOC) as $field){
				if ($field['Field'] != 'id'){
					$_fields[] = [$field['Field'] => $field['Type']];
					$tf .= '  ' . $field['Field'] . '		' . $field['Type'] . "\n";
					echo '<span style="display: inline-block; width: 250px;">' . $field['Field'] . '</span> <span>' . $field['Type'] . '</span><br />';
				}
			}
			$_tables[] = [
				$table_name => $_fields
      ];

			$tf .= "\n";	
			echo "<br /><br />";	
		}
		echo "</div>";	
		// $fp = fopen('data.txt', 'w');
		// fwrite($fp, $tf);
		// fclose($fp);
    return $res;
	});




// }









$app->post('/utility/upload-file[/]', function ($req, $res, $args) {

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

	return render::json($req, $res, [
    'data' => $out
  ]);

});








$app->post('/utility/delete-upload[/]', function ($req, $res, $args) {

	if ($_POST['filename']){
		$target = $_SERVER['DOCUMENT_ROOT'] . '/uploads/' . $_POST['filename'];
		unlink($target);
	}

	$out = [
    'success' => true
  ];

	return render::json($req, $res, [
    'data' => $out
  ]);

});
