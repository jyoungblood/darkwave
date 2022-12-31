# SLIME Utilities

## Abstraction functions to promote a fast and easy development workflow with Slim.

Most of these functions aren't specific to Slim and can be used in other contexts or on their own (except for the 'render' functions). We've bundled them together for convenience to be included with the [Slime boilerplate and metaframework](https://github.com/hxgf/slime).

These functions are also available as separate packages:
- [slime-render](https://github.com/hxgf/slime-render)
- [dbkit](https://github.com/hxgf/dbkit)
- [http-request](https://github.com/hxgf/http-request)
- [cookie](https://github.com/hxgf/cookie)
- [x-utilities](https://github.com/hxgf/x-utilities)


## Installation
```
composer require hxgf/slime-utilities
```

```php

use Slime\render;
use Slime\db;
use Slime\http;
use Slime\cookie;
use Slime\x;

require __DIR__ . '/vendor/autoload.php';

```

## API

Refer to the source packages for usage examples.

### [render - Render Content as PSR-7](https://github.com/hxgf/slime-render)
- render::hbs($request, $response, $parameters)
- render::json($request, $response, $parameters)
- render::lightncandy_html($parameters)($data)
- render::twig($request, $response, $parameters)


### [db - Data Handlers (mysql w/ PDO)](https://github.com/hxgf/dbkit)
- db::init($settings)
- db::insert($table, $input)
- db::find($table, $criteria, $options)
- db::update($table, $input, $criteria)
- db::delete($table, $criteria)
- db::where_placeholders($criteria)



### [http - HTTP Request Handlers](https://github.com/hxgf/http-request)
- http::request($url, $parameters)
- http::get($url, $parameters)
- http::post($url, $parameters)
- http::json($url, $parameters)

### [cookie - Cookie Handlers](https://github.com/hxgf/cookie)
- cookie::set($key, $value, $expiration_date)
- cookie::get($key)
- cookie::delete($key)

### [x - Misc Utilities](https://github.com/hxgf/x-utilities)
- x::email_send($parameters)
- x::client_ip()
- x::url_slug($string)
- x::url_strip($url)
- x::url_validate($url)
- x::br2nl($string)
- x::array_encode($array)
- x::array_decode($string)