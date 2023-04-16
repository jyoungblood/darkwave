# DW Utilities (PHP)

### A collection of utility functions to facilitate an efficient workflow with the [Darkwave](https://github.com/hxgf/darkwave) web application toolkit.



# Installation
These functions are included with Darkwave, but they can be installed and used as standalone functions in any project.


```
composer require hxgf/dw-utilities
```
```
use DW\dw;
require __DIR__ . '/vendor/autoload.php';
```

# Usage
## dw::authenticate()
Parses the JWT 'token' cookie and sets global authentication variables to be used by the rest of the application.
```php
dw::authenticate();
```
