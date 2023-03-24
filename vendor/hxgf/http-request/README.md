# VPHP - HTTP Request

Vanilla PHP functions to handle sending and receiving HTTP requests with CURL. This is a set of thin abstractions over a typical CURL request workflow with configurable options.


# Installation
Easy install with composer:
```
composer require hxgf/http-request
```
```php
use VPHP\http;
require __DIR__ . '/vendor/autoload.php';
```


# Usage
## http::request($url, $parameters)
Makes an http request to a given url, sending an array of data and returning the raw response.
```php
$api_data = http::request('https://external-api.com/v3/example-response', [
  'method' => 'POST', // optional, GET by default, GET and POST supported currently
  'json_decode' => true, // optional, returns an expected JSON response as a PHP array
  'debug' => true, // optional, returns all request information from curl_getinfo()
  'headers' => [ // optional, define any custom header
    'Cache-Control' => 'no-cache',
    'Content-Type' => 'application/json',
  ],
  'data' => [ // optional, will be submitted as querystring (GET) or FormData (POST)
    'user_id' => 581146,
    'api_key' => '696719xvckvzxspigh24y1e-b'
  ]
]);
```

## http::get($url, $parameters)
Alias to `http::request` using the default `GET` method.
```php
$api_data = http::get('https://external-api.com/v3/example-response', [
  'data' => [
    'user_id' => 581146,
    'api_key' => '696719xvckvzxspigh24y1e-b'
  ]
]);
```
Everything in the the 'data' array will be submitted as a querystring. For example: 
```bash
https://external-api.com/v3/example-response?user_id=581146&api_key=696719xvckvzxspigh24y1e-b
```

## http::post($url, $parameters)
Alias to `http::request` using the `POST` method.
```php
$api_data = http::post('https://external-api.com/v3/example-response', [
  'data' => [
    'user_id' => 581146,
    'api_key' => '696719xvckvzxspigh24y1e-b'
  ]
]);
```
Everything in the 'data' array will be submitted as FormData.

## http::json($url, $parameters)
Alias to `http::request()` using the `json_decode` parameter (returns an expected JSON response as a PHP array)
```php
$api_data = http::json('https://external-api.com/v3/example-response', [
  'data' => [
    'user_id' => 581146,
    'api_key' => '696719xvckvzxspigh24y1e-b'
  ]
]);
```
