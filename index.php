<?php 
/*

   ______     ______    ______     ______     ______     ______    
  /\  ___\   /\__  _\  /\  ___\   /\  == \   /\  ___\   /\  __ \   
  \ \___  \  \/_/\ \/  \ \  __\   \ \  __<   \ \  __\   \ \ \/\ \  
   \/\_____\    \ \_\   \ \_____\  \ \_\ \_\  \ \_____\  \ \_____\ 
    \/_____/     \/_/    \/_____/   \/_/ /_/   \/_____/   \/_____/ 
                                                                

  Version: 1.3.0
	Docs: http://stereotk.com

*/


require 'settings.php';
require 'stereo/stereo-core.php';

$app = new StereoSystem;

$GLOBALS['database'] = $app->db_init();

$app->authenticate();

require 'stereo/darkwave/darkwave.php'; /* ---- DW ----- */
require 'controllers/_global.php';
require 'controllers/_routes.php';

$match = $router->match();

if($match && is_callable($match['target'])){
	call_user_func_array($match['target'], $match['params']); 
} else {
	$app->render_error(array(
		'status' => 404
	));
}
