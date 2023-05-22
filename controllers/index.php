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

  	$welcome_headline = array(
      'Given enough time, all your code will get deleted',
      'Valar Morghoulis',
      'Anyone can have a good time',
      'There is much pain in the world, but not in this room',
      'Any gyroscope can spin forever',
      'Why tear out single pages when you can throw away the book?',
      'I\'m heaven-sent...don\'t you dare forget',
      'Live your dreams, don\'t chase \'em',
      'Do what you love, and the necessary resources will follow',
      'Take a knife and drain your life',
      'We were promised bicycles for the mind, but we got aircraft carriers instead',
      'No need to ask my name to figure out how cool I am',
      'You don\'t need to hide, my friend, I\'m just like you',
      'It\'s so hard to focus when everything is broken'
    );

    return render::hbs($req, $res, [
      'layout' => '_layouts/base',
      'template' => 'index',
      'title' => $_ENV['SITE_TITLE'],
      'data' => [
        'current_home' => true,
        'welcome_headline' => $welcome_headline[array_rand($welcome_headline)]
      ]
    ]);
  }

});






$app->get('/elements', function ($req, $res, $args) {


    return render::hbs($req, $res, [
      'layout' => '_layouts/base',
      'template' => 'elements',
      'title' => $_ENV['SITE_TITLE'],
      'data' => [
        'current_home' => true,
      ]
    ]);

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
