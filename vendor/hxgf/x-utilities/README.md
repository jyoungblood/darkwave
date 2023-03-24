# VPHP - X-Utilities

### A collection of standalone utility functions to help do things faster with PHP.


# Installation
Easy install with composer:
```
composer require hxgf/x-utilities
```
```php
use VPHP\x;
require __DIR__ . '/vendor/autoload.php';
```



# Usage

## x::email_send($parameters)
Sends a plain text or html email using the native PHP [mail()](https://www.php.net/manual/en/function.mail.php) function.
```php
x::email_send([
  'to' => 'recipient@domain.com',
  'from' => 'sender@example.com',
  'cc' => 'cc-address@example.com',  // optional
  'bcc' => 'bcc-address@example.com',  // optional
  'reply-to' => 'reply-address@example.com',  // optional
  'subject' => 'Send me an email',
  'html' => true,  // optional, message will be sent as plain text unless this is true
  'message' => 'Right now...<br /><br /><br /><b><u>RIGHT NOW</u></b>'
]);
```
Messages can be sent using the Mailgun API if Mailgun credentials are available in a global settings array like this:
```php
$GLOBALS['settings']['mailgun']['api_key'] = 'key-f453654gg65sd6234r6rw5df6544e';
$GLOBALS['settings']['mailgun']['domain'] = 'notifications.example.com';
```

## x::client_ip()
Returns the address of the computer making the current request.
```php
echo x::client_ip();
```

## x::url_slug($string)
Returns a lowercase URL-safe version of a given string, substituting `-` for spaces and punctuation.
```php
echo x::url_slug('John User Name'); 
// john-user-name
```

## x::url_strip($url)
Removes the protocol and trailing slashes from a given url, returning only the domain name.
```php
echo x::url_strip('https://example.com/'); 
// example.com
```

## x::url_validate($url)
Returns a valid URL, adding `http://` if needed.
```php
echo x::url_validate('example.com'); 
// http://example.com
```

## x::br2nl($string)
The opposite of `nl2br()`, replaces `<br />` (and `<br>`) html tags with newline (`\n`) character.
```php
echo x::br2nl('This is a <br /> multi-line <br /> string!'); 
// This is a \n multi-line \n string!
```

## x::array_encode($array)
Turns an array of strings into a single string, separated by a vertical bar (`|`) character.
```php
echo x::array_encode(['Peter', 'Paul', 'Ringo', 'George']); 
// Peter|Paul|Ringo|George
```

## x::array_decode($string)
Turns a string separated by a vertical bar (`|`) character into an array of strings.
```php
$people = x::array_decode('Peter|Paul|Ringo|George');
print_r($people); 
// ['Peter', 'Paul', 'Ringo', 'George']
```


## x::console_log($input, $parameters)
Prints an array, object, or string in a stylized DOM container. Input type is automatically detected, and optional parameters can be used to customize the style of the container.

Typical usage:
```php
x::console_log(['example' => 'array']);
```

With optional parameters:
```php
x::console_log(['example' => 'array'], [
  'format' => false, // removes all container formatting
  'style' => [ // defines custom styles for container formatting
    'font-size' => '16px',
    'background' => 'blue',
    'color' => 'yellow',
    'padding' => '2.5rem',
    'line-height' => '200%',
    'custom' => 'font-style: italic'
  ]
]);
```

## x::dd($input, $parameters)
Same as `console_log()`, but with with a `die()` function called afterward. The same parameters are available for styling the container. Yes, it's kinda like Laravel's [dd()](https://laravel.com/docs/9.x/collections#method-dd) method. 
```php
x::dd(['example' => 'array']);
```


## x::file_write($input, $target_filename, $parameters)
Appends a string, array, or object to a given file. Input type is automatically detected and converted to plain text. Optional parameters can be used to customize [fopen() mode](https://www.php.net/manual/en/function.fopen.php) and newline behavior.
```php
x::file_write('A string to append to a file', 'data.txt');
```

Using custom parameters:
```php
x::file_write(
  ['array_example' => 'An array to append to a file'], 
  'data.txt', 
  [
    'mode' => 'w+', // define PHP fopen mode, default is 'a'
    'line_beginning' => "\n- ", // prepend to beginning of input
    'line_ending' => "", // append end of input, default is PHP_EOL
  ]
);
```






## x::error_log($input, $parameters)
Abstraction for the native PHP [error_log()](https://www.php.net/manual/en/function.error-log.php) function, appends a timestamp with a given string, array, or object to an `error_log` file. Input type is automatically detected and converted to plain text.
```php
x::error_log('Something bad happened.');
```