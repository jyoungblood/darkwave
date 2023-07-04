# ▲▼ D A R K W A V E

### Web application development kit

DW is a "batteries-included" tool kit for quickly developing data-driven web applications. It's a pragmatic configuration of helpful libraries, light application boilerplate, and a turn-key solution for user authentication and management. It also establishes sensible conventions you can use to quickly build custom CRUD apps or SaaS projects to suit your individual needs.




## Requirements
- PHP >= 7.4 (8.1 recommended) compiled with GD
- MySQL (other PDO-compatible databases should work, but haven't been tested)
- Apache


## Installation
Composer is recommended for the easiest installation:
```
composer create-project hxgf/dw new-project-name
```

You could also [download the zip](https://github.com/hxgf/darkwave/archive/refs/tags/0.6.0.zip) with all the files, or clone this repository with GIT or Degit (`npx degit hxgf/darkwave`). If you do any of these, be sure to run `composer install` the files are on your system.


## Getting Started
Darkwave is designed to function in a LAMP environment, so we recommend developing on an actual web server (VPS, shared php host, etc)

Of course, it's still possible to develop your application locally with the common `php -S localhost:8080` command. Just make sure you also have a MySQL host running in your local environemt as well ([MAMP](https://www.mamp.info/), [DBngn](https://github.com/TablePlus/DBngin), etc).

Once you have your environemt set up, visit the url for your site to initiate the configuration process.

The configuration process will generate a `.env` file with your database connection and basic site info and create an "Admin" user for your application.

<sub>* Note that DW ships with a blank `.env` as part of the repository. It's required for the application to operate, but as a best practice we'd recommend adding this to the `.gitignore` before making your own repository with this codebase.</sub>

After configuration, log in with the newly-created admin account to see the boilerplate application frame and an introductory demo of DW's primary features. 



## Building with DW
The [official documentation](https://darkwave.ltd/docs) and [user guide](https://darkwave.ltd/guide) are perpetual works in progress and may not be completely ready for a while. In the mean time, take a look at the various pieces of the `users` section to see a functional example of managing data collections and CRUD operations with this toolkit:

- [controllers/users.php](https://github.com/hxgf/darkwave/blob/master/controllers/dw/users.php)
- [templates/dw/users-list.html](https://github.com/hxgf/darkwave/blob/master/templates/dw/users-list.html)
- [templates/dw/users-edit.html](https://github.com/hxgf/darkwave/blob/master/templates/dw/users-edit.html)

This section also provides examples of working with modals, input validation, image uploading and resizing, table sorting, and more. If you're looking for a "best practices" example of working with DW, this is a good place to start.

## Deployment
Deployment is intended to be pretty straightforward, just put the files in your production environment and you should be good to go. There are a few minor things worth considering:

- In your production `.env` file, set the `SITE_MODE` variable to "production"
- It's helpful to run the following commands to optimize your composer packages and css files
  - `composer update --optimize-autoloader`
  - `purgecss --css css/lib/*.css --content "pages/**/*.hbs" --output css/build`
- The [.htaccess](https://github.com/hxgf/darkwave/blob/master/.htaccess) file has certain file extensions disabled from being served by default for security purposes. If you need to enable any of them for your application (.json, for example), remember to be security conscious and deny access to specific files (composer.json) to prevent leaking sensitive information.
- Further performance and security optimizations can be made, of course, but be careful not to let the optimizing get in the way of providing value for your users and customers :)

## Reference and Resources


// fixit stopped here

core tools

              [Slim](https://slimframework.com/)</a> <span class="text-muted">- base PHP framework</span></li>
              [Slime](https://slime.technology/)</a> <span class="text-muted">- Slim application scaffolding and rendering helpers</span></li>
              [Handlebars](https://handlebarsjs.com/)</a> <span class="text-muted">- template rendering via [LightnCandy](https://github.com/zordius/lightncandy)</a></span></li>
              [Bootstrap](https://getbootstrap.com/)</a> <span class="text-muted">- base UI framework</span></li>
              [Tabler](https://tabler.io/)</a> <span class="text-muted">- Bootstrap-based UI kit</span></li>
              [Alpine.js](https://alpinejs.dev/)</a> <span class="text-muted">- JS utility framework</span></li>
              [htmx](https://htmx.org//)</a> <span class="text-muted">- utilities for AJAX, CSS transitions, websockets, SSE</span></li>
              [DW Utilities (PHP)](https://github.com/hxgf/dw-utilities-php)</a> <span class="text-muted">- back-end utility functions for authentication, image conversion, etc.</span></li>
              [DW Utilities (JS)](https://github.com/hxgf/dw-utilities-js)</a> <span class="text-muted">- front-end utility functions for authentication, modals, form handlers, etc.</span></li>
              [php-image-resize](https://github.com/gumlet/php-image-resize)</a> <span class="text-muted">- GD-based image manipulation library</span></li>
              [phpdotenv](https://github.com/vlucas/phpdotenv)</a> <span class="text-muted">- automatic .env variable loading</span></li>
              [psr-jwt](https://github.com/RobDWaller/psr-jwt)</a> <span class="text-muted">- PSR-compliant JWT middleware</span></li>



optional included

              [Dropzone](https://www.dropzone.dev/)</a> <span class="text-muted">- file uploader</span></li>
              [Litepicker](https://litepicker.com/)</a> <span class="text-muted">- date picker</span></li>
              [List.js](https://listjs.com/)</a> <span class="text-muted">- table sorter</span></li>
              [TinyMCE](https://github.com/tinymce/tinymce)</a> <span class="text-muted">- WYSIWYG text editor</span></li>


dw features

              <li class="mb-2">Full authentication process - [login](/login)</a>, [register](/register)</a>, [forgot pw](/forgot)</a></li>
              <li class="mb-2">Sample blank application starter <span class="text-muted">(you're looking at it)</span></li>
              [User management](/users)</a> system which also provides full-stack examples of how to use DW for CRUD operations, form handling, photo uploading, and more</li>





                <h3 class="mb-1">DW / Core</h3>
                [DW source](https://github.com/hxgf/darkwave)</a><br />
                [DW docs](https://darkwave.ltd/docs)</a><br />
                [DW field guide](https://darkwave.ltd/guide)</a><br />
                [Slim 4 docs](https://www.slimframework.com/docs/v4/)</a><br />
                [Slim 4 cheatsheet](https://blog.programster.org/slim-4-cheatsheet)</a><br />
                [SLIME Render](https://github.com/hxgf/slime-render)</a><br />
                [VPHP - DB Kit](https://github.com/hxgf/dbkit)</a><br />
                [VPHP - X-Utilities](https://github.com/hxgf/x-utilities)</a><br />
                [VPHP - HTTP Request](https://github.com/hxgf/http-request)</a><br />
                [HBS Cookbook](https://zordius.github.io/HandlebarsCookbook/)</a><br />
                [HBS Cheatsheet](https://gist.github.com/nessthehero/4ea763350fc93100f002)</a><br />




                <h3 class="mb-1">Bootstrap / UI</h3>
                [HTML5 Cheatsheet](https://www.wpkube.com/html5-cheat-sheet/)</a><br />
                [Bootstrap docs](https://getbootstrap.com/docs)</a><br />
                [Bootstrap cheatsheet](https://bootstrap-cheatsheet.themeselection.com/)</a><br />
                [Awesome Bootstrap](https://github.com/awesome-bootstrap-org/awesome-bootstrap)</a><br />
                [Tabler docs](https://tabler.io/docs/)</a><br />
                [Tabler components](https://preview.tabler.io/)</a><br /><br />
                <h3 class="mb-1">Colors</h3>
                [Reasonable Colors](https://reasonable.work/colors/)</a><br />
                [Open Color](https://yeun.github.io/open-color/)</a><br />


                <h3 class="mb-1">JS libraries</h3>
                [Alpine.js docs](https://alpinejs.dev/start-here)</a><br />
                [Alpine Toolbox](https://www.alpinetoolbox.com/)</a><br />
                [List.js docs](https://listjs.com/)</a><br />
                [Dropzone docs](https://docs.dropzone.dev/)</a><br />
                [Litepicker docs](https://litepicker.com/)</a><br />
                [TinyMCE 6 docs](https://www.tiny.cloud/docs/tinymce/6/)</a><br /><br />
                <h3 class="mb-1">Icons</h3>
                [Bootstrap Icons](https://icons.getbootstrap.com/)</a><br />
                [Tabler Icons](https://tabler-icons.io/)</a><br />
                [React Icons](https://react-icons.github.io/react-icons/)</a><br />



see index.html for ui components & resource links




              <li class="mb-2">
                <strong>Subnav</strong> <span class="text-muted">- When using the default base template and components,
                  a subnav can be easily added using a simple PHP array. See the <code>/demo</code> section of the [index controller](https://github.com/hxgf/darkwave/blob/master/controllers/index.php)</a> and the <code>subnav</code> section of the [base template](https://github.com/hxgf/darkwave/blob/master/templates/_layouts/base.html)</a>.</span>
              </li>
              <li class="mb-2">
                <strong>HBS helpers</strong> <span class="text-muted">- Slime-render provides a couple custom HBS helpers and makes it easy to add your own. See the <code>initialize_handlebars_helpers()</code> section of the [slime-render](https://github.com/hxgf/slime-render/blob/master/src/render.php)</a> class for an example. The [HBS Cookbook](https://zordius.github.io/HandlebarsCookbook/)</a> provides more information for building [simple](https://zordius.github.io/HandlebarsCookbook/0021-customhelper.html)</a> and [block](https://zordius.github.io/HandlebarsCookbook/0022-blockhelper.html)</a> custom helpers.</span>
              </li>
              <li class="mb-2">
                <strong>More BS components</strong> <span class="text-muted">- There are <em>A LOT</em> of Bootstrap components out there. The official [BS examples](https://getbootstrap.com/docs/5.3/examples/)</a> and [BS cheatsheet](https://getbootstrap.com/docs/5.3/examples/cheatsheet/"></a> are good places to start.</span>
              </li>
              <li class="mb-2">
                <strong>Customizing Tabler</strong> <span class="text-muted">- Tabler is designed to be easy to customized with css variables added to the <code>:root</code> element. See the [Tabler docs](https://tabler.io/docs/getting-started/customize)</a> for a customization example, and [tabler.css](https://github.com/tabler/tabler/blob/dev/dist/css/tabler.css)</a> for the default variable names and values.</span>
              </li>
