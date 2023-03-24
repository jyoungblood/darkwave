# SLIME Render

### PHP abstraction functions to help more easily render views for [Slim Framework](https://www.slimframework.com/) (v4) with [LightnCandy](https://github.com/zordius/lightncandy) (Handlebars) or [Twig](https://github.com/slimphp/Twig-View).

These functions aim to provide a simplified and standardized interface for rendering various types of data-driven responses as PSR-7 objects for use with Slim.

Included with the [Slime boilerplate](https://github.com/hxgf/slime) for Slim applications.

# Installation
Easy install with composer:
```
composer require hxgf/slime-render
```
```php
use Slime\render;
require __DIR__ . '/vendor/autoload.php';
```

## Requirements
- [Slim Framework](https://www.slimframework.com/) 4
- [LightnCandy](https://github.com/zordius/lightncandy) >= 1.2.6
- (or) [Twig-View for Slim](https://github.com/slimphp/Twig-View) >= 3.3.0
- PHP >= 7.4


# Usage
## render::html($request, $response, $string, $status = 200)
Renders a string as html. Returns a standard Slim (PSR-7) response object with optional HTTP status code (200 by default).
```php
$app->get('/', function ($req, $res, $args) {

  return render::html($req, $res, '<h2>Hey whats up</h2>');

});
```


## render::text($request, $response, $string, $status = 200)
Renders a string as plain text. Returns a standard Slim (PSR-7) response object with optional HTTP status code (200 by default).
```php
$app->get('/', function ($req, $res, $args) {

  return render::text($req, $res, 'Hey whats up');

});
```


## render::hbs($request, $response, $parameters)
Renders a specific Handlebars template with an array of data, including any partials and global `locals` variables array. Returns a standard Slim (PSR-7) response object with optional HTTP status code.
```php
$app->get('/', function ($req, $res, $args) {

  return render::hbs($req, $res, [
    'template' => 'index',
    'layout' => '_layouts/base', // optional "wrapper" layout template
    'title' => 'Page title', // for HTML <title> tag
    'status' => 200, // optional, 200 by default
    'data' => [
      'name' => 'Ringo',
      'friends' => [
        'Paul', 'George', 'John'
      ]
    ],
  ]);

});
```

The parser function expects templates to be in a `templates` directory with `html` file extension. This can be customized by defining these variables in a global `settings` array:
```php
$GLOBALS['settings']['templates']['path'] = 'pages';
$GLOBALS['settings']['templates']['extension'] = 'hbs';
```

Additionally, an array of `locals` can be added to make variables available across all templates:
```php
$GLOBALS['locals'] = [
  'year' => date('Y'),
  'site_title' => 'Web Site Title',
  'site_code' => 'WST',
  'site_domain' => 'example.com',
];
```
```html
Welcome to {{locals.site_title}}, the year is {{locals.year}}!
```

Check out the [Handlebars Cookbook](https://zordius.github.io/HandlebarsCookbook/) to see everything you can do with LightnCandy and Handlebars.

Additionally, we've included a couple of helper functions.

The `date` helper applies the PHP `date()` function to a given variable or string (or `now` keyword for the current time)
```html
Current date: {{date now "d/m/Y"}}
```
The `#is` block helper allows for basic conditional logic:
```html
Is it 1981? {{#is locals.year "==" "1981"}} Yes! {{else}} No! {{/is}}
```

Custom helpers are easy to create. Take a look at how these helpers are defined in [initialize_handlebars_helpers()](https://github.com/hxgf/slime-render/blob/74e6e4a89a90a2490196a4d50d7466855820dd3a/src/render.php#L46). The Handlebars cookbook also has a reference for creating [custom helpers](https://zordius.github.io/HandlebarsCookbook/0021-customhelper.html) and [custom block helpers](https://zordius.github.io/HandlebarsCookbook/0022-blockhelper.html).

## render::redirect($request, $response, $parameters)
Renders a redirect as standard Slim (PSR-7) response object with optional HTTP status code.
```php
  return render::redirect($req, $res, [
    'location' => 'https://google.com',
    'status' => 301 // optional, default is 302
  ]);
```

## render::json($request, $response, $parameters)
Renders an array or data as standard Slim (PSR-7) response object with `application/json` content type and optional HTTP status code.
```php
$app->get('/json/', function ($req, $res, $args) {

  $data = [
    'name' => 'Ringo',
    'friends' => [
      'Paul', 'George', 'John'
    ]
  ];

  return render::json($req, $res, [
    'status' => 200, // optional, 200 by default
    'data' => $data
  ]);

});
```

## render::lightncandy_html($parameters)($data)
Prepares and compiles a specific Handlebars template with an array of data, including any partials and global `locals` variables array.<br />
This is automatically called by `render::hbs()` but can be used as a standalone function if desired.
```php
$args = [
  'template' => 'index',
  'layout' => '_layouts/base',
  'title' => 'Page title',
];

$data = [
  'name' => 'Ringo',
  'friends' => [
    'Paul', 'George', 'John'
  ]
];

echo render::lightncandy_html($args)($data);
```

## render::initialize_handlebars_helpers()
For internal use by `lightncandy_html()`. Defines a couple custom Handlebars helper functions to be used by the LightnCandy compiler.


## render::twig($request, $response, $parameters)
Similar to `render::hbs()` except with Twig templates.
```php
$app->get('/', function ($req, $res, $args) {

  return render::twig($req, $res, [
    'template' => 'index',
    'title' => 'Page title', // for HTML <title> tag
    'data' => [
      'name' => 'Ringo',
      'friends' => [
        'Paul', 'George', 'John'
      ]
    ],
  ]);

});
```
To use Twig templates, remember to add the middleware declarations after initializing your Slim app (as outlined in the [Twig-View](https://github.com/slimphp/Twig-View) documentation). 
```php
$app = AppFactory::create();

use Slim\Views\Twig;
use Slim\Views\TwigMiddleware;

$twig = Twig::create(__DIR__ . '/templates', ['cache' => false]);
$app->add(TwigMiddleware::create($app, $twig));
```
<sub>\* NOTE: Although this function renders the global `locals` variable array, it doesn't read any of the `settings` template variables mentioned above, and all templates are expected to be `.html`.</sub>