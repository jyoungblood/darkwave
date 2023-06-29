<?php

date_default_timezone_set('America/Chicago');

use Slime\render;

foreach (glob("controllers/dw/*.php") as $file) {
  require $file;
}


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
        'current' => $_GET['subnav'] == '1' || $_GET['subnav'] == '' ? true : false
      ], 
      [
        'href' => '?subnav=2',
        'title' => 'Subnav 2',
        'current' => $_GET['subnav'] == '2' ? true : false
      ],
      [
        'href' => '?subnav=3',
        'title' => 'Subnav 3',
        'current' => $_GET['subnav'] == '3' ? true : false
      ]
    ];
  }
  if ($args['page'] == 'second'){
    $subnav = [
      [
        'href' => '?subnav=different-subnav',
        'title' => 'Different Subnav',
        'current' => $_GET['subnav'] == 'different-subnav' || $_GET['subnav'] == '' ? true : false
      ], 
      [
        'href' => '?subnav=ok-cool',
        'title' => 'OK Cool',
        'current' => $_GET['subnav'] == 'ok-cool' ? true : false
      ],
      [
        'href' => '?subnav=new-thing',
        'title' => '+ New Thing',
        'current' => $_GET['subnav'] == 'new-thing' ? true : false
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
