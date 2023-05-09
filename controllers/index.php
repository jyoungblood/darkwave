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
        'title' => 'Subnav 1'
      ], 
      [
        'href' => '?subnav=2',
        'title' => 'Subnav 2'
      ],
      [
        'href' => '?subnav=3',
        'title' => 'Subnav 3'
      ]
    ];
  }
  if ($args['page'] == 'second'){
    $subnav = [
      [
        'href' => '?subnav=different-subnav',
        'title' => 'Different Subnav'
      ], 
      [
        'href' => '?subnav=ok-cool',
        'title' => 'OK Cool'
      ],
      [
        'href' => '?subnav=new-thing',
        'title' => '+ New Thing'
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
