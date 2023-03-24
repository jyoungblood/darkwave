# VPHP - Cookie

### Vanilla PHP functions to more easily handle cookie operations.


# Installation
Easy install with composer:
```
composer require hxgf/cookie
```
```php
use VPHP\cookie;
require __DIR__ . '/vendor/autoload.php';
```

# Usage

## cookie::set($key, $value, $parameters)
Sets a cookie with a specific key for a specific amount of time. Native PHP [setcookie()](https://www.php.net/manual/en/function.setcookie.php) parameters are allowed. All parameters are optional.
```php
cookie::set('user_name', 'Buzz', [
  'expires' => time() + 86400, // unix time, default is 1 year
  'path' => '/custom-path/', // default is '/'
  'domain' => 'custom.example.com',
  'secure' => true,
  'httponly' => true,
  'samesite' => 'Lax',
]);
```

## cookie::get($key)
Returns the value of a specific cookie.
```php
echo cookie::get('user_name');
```

## cookie::delete($key)
Deletes a specific cookie.
```php
cookie::delete('user_name');
```
