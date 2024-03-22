# ▲▼ D A R K W A V E

### Web application development kit

DW is a "batteries-included" tool kit for quickly developing data-driven web applications. It's a pragmatic configuration of helpful libraries, light application boilerplate, and a turn-key solution for user authentication and management. It also establishes sensible conventions you can use to quickly build custom CRUD apps or SaaS projects to suit your individual needs.


## What's Included?

#### Core tools

- [Slim](https://slimframework.com/) - base PHP framework
- [Slime](https://slime.technology/) - Slim application scaffolding and rendering helpers
- [Handlebars](https://handlebarsjs.com/) - template rendering via [LightnCandy](https://github.com/zordius/lightncandy)
- [Bootstrap](https://getbootstrap.com/) - base UI framework
- [Tabler](https://tabler.io/) - Bootstrap-based UI kit
- [Alpine.js](https://alpinejs.dev/) - JS utility framework
- [htmx](https://htmx.org//) - utilities for AJAX, CSS transitions, websockets, SSE
- [DW Utilities (PHP)](https://github.com/jyoungblood/dw-utilities-php) - back-end utility functions for authentication, image conversion, etc.
- [DW Utilities (JS)](https://github.com/jyoungblood/dw-utilities-js) - front-end utility functions for authentication, modals, form handlers, etc.
- [php-image-resize](https://github.com/gumlet/php-image-resize) - GD-based image manipulation library
- [phpdotenv](https://github.com/vlucas/phpdotenv) - automatic .env variable loading
- [psr-jwt](https://github.com/RobDWaller/psr-jwt) - PSR-compliant JWT middleware



#### Optional included libraries

- [Dropzone](https://www.dropzone.dev/) - file uploader
- [Litepicker](https://litepicker.com/) - date picker
- [List.js](https://listjs.com/) - table sorter
- [TinyMCE](https://github.com/tinymce/tinymce) - WYSIWYG text editor


#### Boilerplate functionality

- Full authentication process (login, register, forgot/reset pw)
- Sample blank application starter frame
- User management system which also provides full-stack examples of how to use DW for CRUD operations, form handling, photo uploading, and more



## Requirements
- PHP >= 7.4 (8.1 recommended) compiled with GD
- MySQL (other PDO-compatible databases should work, but haven't been tested)
- Apache


## Installation
Use Composer for the easiest installation:
```
composer create-project jyoungblood/dw new-project-name
```

You could also [download the zip](https://github.com/jyoungblood/darkwave/archive/refs/tags/0.6.1.zip) with all the files, or clone this repository with GIT or Degit (`npx degit jyoungblood/darkwave`). If you do any of these, be sure to run `composer install` the files are on your system.


## Getting Started
Darkwave is designed to function in a LAMP environment, so we recommend developing on an actual web server (VPS or shared host).

Of course, it's still possible to develop your application locally with the common `php -S localhost:8080` command. Just make sure you also have a MySQL host running in your local environemt as well ([MAMP](https://www.mamp.info/), [DBngn](https://github.com/TablePlus/DBngin), etc).

Once your environemt is set up, visit the url for your site to initiate the configuration process. This will generate a `.env` file with your database connection and basic site info and create an "Admin" user for your application.

<sub>* Note that DW ships with a blank `.env` as part of the repository. It's required for the application to operate, but as a best practice we'd recommend adding this to the `.gitignore` before making your own repository with this codebase.</sub>

After configuration, log in with the newly-created admin account to see the boilerplate application frame and an introductory demo of DW's primary features. 



## Building with DW
The [official documentation](https://darkwave.ltd/docs) and [user guide](https://darkwave.ltd/guide) are perpetual works in progress and may not be completely ready for a while. In the mean time, take a look at the various pieces of the `users` section to see functional examples of how to manage data collections and perform CRUD operations with this tool kit:

- [controllers/users.php](https://github.com/jyoungblood/darkwave/blob/master/controllers/dw/users.php)
- [templates/dw/users-list.html](https://github.com/jyoungblood/darkwave/blob/master/templates/dw/users-list.html)
- [templates/dw/users-edit.html](https://github.com/jyoungblood/darkwave/blob/master/templates/dw/users-edit.html)

This section also provides examples of working with modals, input validation, image uploading and resizing, table sorting, and more. If you're looking for a "best practices" illustration of working with DW, this is a good place to start.

## Deployment
Deployment is intended to be very straightforward, just put the files in your production environment and you should be good to go. Aside from this, there are a few minor points worth considering:

- In your production `.env` file, set the `SITE_MODE` variable to "production"
- It's helpful to run the following commands to optimize your composer packages and CSS files:
  - `composer update --optimize-autoloader`
  - `purgecss --css css/lib/*.css --content "templates/**/*.hbs" --output css/build`
- For security purposes, the [.htaccess](https://github.com/jyoungblood/darkwave/blob/master/.htaccess) file has certain file extensions disabled from being served by default. If you need to enable any of them for your application (`.json`, for example), remember to be security conscious and deny access to specific files (`composer.json`, for example) to prevent leaking sensitive information.
- Further performance and security optimizations can be made, of course, but be careful not to let the optimizing get in the way of providing value for your users and customers :)

## Reference and Resources












#### DW / Core

- [DW docs](https://darkwave.ltd/docs)
- [DW field guide](https://darkwave.ltd/guide)
- [Slim 4 docs](https://www.slimframework.com/docs/v4/)
- [Slim 4 cheatsheet](https://blog.programster.org/slim-4-cheatsheet)
- [SLIME Render](https://github.com/jyoungblood/slime-render)
- [VPHP - DB Kit](https://github.com/jyoungblood/dbkit)
- [VPHP - X-Utilities](https://github.com/jyoungblood/x-utilities)
- [VPHP - HTTP Request](https://github.com/jyoungblood/http-request)
- [HBS Cookbook](https://zordius.github.io/HandlebarsCookbook/)
- [HBS Cheatsheet](https://gist.github.com/nessthehero/4ea763350fc93100f002)




#### Bootstrap / UI

- [HTML5 Cheatsheet](https://www.wpkube.com/html5-cheat-sheet/)
- [Bootstrap docs](https://getbootstrap.com/docs)
- [Bootstrap cheatsheet](https://bootstrap-cheatsheet.themeselection.com/)
- [Awesome Bootstrap](https://github.com/awesome-bootstrap-org/awesome-bootstrap)
- [Tabler docs](https://tabler.io/docs/)
- [Tabler components](https://preview.tabler.io/)

#### Colors

- [Reasonable Colors](https://reasonable.work/colors/)
- [Open Color](https://yeun.github.io/open-color/)


#### JS libraries

- [Alpine.js docs](https://alpinejs.dev/start-here)
- [Alpine Toolbox](https://www.alpinetoolbox.com/)
- [List.js docs](https://listjs.com/)
- [Dropzone docs](https://docs.dropzone.dev/)
- [Litepicker docs](https://litepicker.com/)
- [TinyMCE 6 docs](https://www.tiny.cloud/docs/tinymce/6/)

#### Icons

- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [Tabler Icons](https://tabler-icons.io/)
- [React Icons](https://react-icons.github.io/react-icons/)


#### Misc


- **Subnav** - When using the default base template and components, a subnav can be easily added using a simple PHP array. See the `/demo` section of the [index controller](https://github.com/jyoungblood/darkwave/blob/master/controllers/index.php) and the `subnav` section of the [base template](https://github.com/jyoungblood/darkwave/blob/master/templates/_layouts/base.html).

- **HBS helpers** - [Slime-render](https://github.com/jyoungblood/slime-render) provides a couple custom HBS helpers and makes it easy to add your own. See the `initialize_handlebars_helpers()` section of the [slime-render](https://github.com/jyoungblood/slime-render/blob/master/src/render.php) class for an example. The [HBS Cookbook](https://zordius.github.io/HandlebarsCookbook/) provides more information for building [simple](https://zordius.github.io/HandlebarsCookbook/0021-customhelper.html) and [block](https://zordius.github.io/HandlebarsCookbook/0022-blockhelper.html) custom helpers.

- **More BS components** - There are <em>A LOT</em> of Bootstrap components out there. The official [BS examples](https://getbootstrap.com/docs/5.3/examples/) and [BS cheatsheet](https://getbootstrap.com/docs/5.3/examples/cheatsheet/) are good places to start.

- **Customizing Tabler** - Tabler is designed to be easily customized with CSS variables added to the `:root` element. See the [Tabler docs](https://tabler.io/docs/getting-started/customize) for a customization example, and [tabler.css](https://github.com/tabler/tabler/blob/dev/dist/css/tabler.css) for the default variable names and values.

