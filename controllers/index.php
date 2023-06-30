<?php

foreach (glob("controllers/dw/*.php") as $file) {
  require $file;
}

date_default_timezone_set('America/Chicago');

use Slime\render;



$app->get('/', function ($req, $res, $args) {
  if (!isset($_ENV['SITE_TITLE'])){
    return render::redirect($req, $res, '/configure');
  }else{
    return render::hbs($req, $res, [
      'layout' => '_layouts/base',
      'template' => 'index',
      'title' => $_ENV['SITE_TITLE'],
      'data' => [
        'current_home' => true,
      ]
    ]);
  }
});



$app->get('/demo/{page}[/]', function ($req, $res, $args) {
  $subnav = false;
  if ($args['page'] == 'first'){
    $subnav = [
      [
        'href' => '?subnav=1',
        'title' => 'Subnav 1',
        'current' => isset($_GET['subnav']) && $_GET['subnav'] == '1' || !isset($_GET['subnav']) ? true : false
      ], 
      [
        'href' => '?subnav=2',
        'title' => 'Subnav 2',
        'current' => isset($_GET['subnav']) && $_GET['subnav'] == '2' ? true : false
      ],
      [
        'href' => '?subnav=3',
        'title' => 'Subnav 3',
        'current' => isset($_GET['subnav']) && $_GET['subnav'] == '3' ? true : false
      ]
    ];
  }
  if ($args['page'] == 'second'){
    $subnav = [
      [
        'href' => '?subnav=different-subnav',
        'title' => 'Different Subnav',
        'current' => isset($_GET['subnav']) && $_GET['subnav'] == 'different-subnav' || !isset($_GET['subnav']) ? true : false
      ], 
      [
        'href' => '?subnav=ok-cool',
        'title' => 'OK Cool',
        'current' => isset($_GET['subnav']) && $_GET['subnav'] == 'ok-cool' ? true : false
      ],
      [
        'href' => '?subnav=new-thing',
        'title' => '+ New Thing',
        'current' => isset($_GET['subnav']) && $_GET['subnav'] == 'new-thing' ? true : false
      ]
    ];
  }
  return render::hbs($req, $res, [
    'layout' => '_layouts/base',
    'template' => 'index',
    'title' => 'DEMO ' . $args['page'] . ' - ' . $_ENV['SITE_TITLE'],
    'data' => [
      'current_first' => $args['page'] == 'first' ? true : false,
      'current_second' => $args['page'] == 'second' ? true : false,
      'current_third' => $args['page'] == 'third' || $args['page'] == 'fourth' || $args['page'] == 'fifth' || $args['page'] == 'sixth' ? true : false,
      'subnav' => $subnav,
    ]
  ]);
});
