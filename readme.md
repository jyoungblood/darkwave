# S L I M E

### Starter kit for building web applications with Slim PHP Framework

*(it's Slim ... enhanced)*

[⭐ Demo & Docs ⭐](https://slime.hxgf.io/)

## What's included?
- [Slim v4](https://www.slimframework.com/) (w/ [Slim PSR-7](https://github.com/slimphp/Slim-Psr7))
- Handlebars templating - [Lightncandy](https://github.com/zordius/lightnCandy)    


- Helpful abstraction libraries:

  - View rendering - [Slime Render](https://github.com/hxgf/slime-render)
  - Database handlers - [DB Kit](https://github.com/hxgf/dbkit)
  - Cookie handlers - [Cookie](https://github.com/hxgf/cookie)
  - Simple HTTP client - [HTTP Request](https://github.com/hxgf/http-request) 
  - Misc utility functions - [X-Utilities](https://github.com/hxgf/x-utilities)
    
- Minimal front-end boilerplate & utility library options - [scratch](https://github.com/hxgf/scratch)
    
- Simple organization - folders for css, js, images, templates, and controllers

- Blank CSS and JS placeholder files

- [settings.php](https://github.com/hxgf/slime/blob/master/settings.php) - helpful basic variables and settings

- [index.php](https://github.com/hxgf/slime/blob/master/index.php) - initialized Slim application w/ middleware, db connection, and default 404 configuration

- [.htaccess](https://github.com/hxgf/slime/blob/master/.htaccess) - routes all non-file urls to index, forces https, and uses gzip for static assets (if available)
- [.gitignore](https://github.com/hxgf/slime/blob/master/.gitignore) - ignores `/vendor`, `.vscode`, and `.DS_Store`






## Requirements
- Apache
- PHP >= 7.4
- PDO-compatible database (if using [DB handlers](https://github.com/hxgf/dbkit))





## Installation
Easy install with composer:
```
composer create-project hxgf/slime new-project-name
```




## Usage
See [controllers/index.php](https://github.com/hxgf/slime/blob/master/controllers/index.php) for an example of routing and template rendering.

See [templates/index.html](https://github.com/hxgf/slime/blob/master/templates/index.html) and [templates/_layouts/base.html](https://github.com/hxgf/slime/blob/master/templates/_layouts/base.html) for examples using handlebars and layouts.

Helpful resources:
- [Handlebars Cookbook](https://zordius.github.io/HandlebarsCookbook/)
- [Slim v4 Routing](https://www.slimframework.com/docs/v4/objects/routing.html)
- [DB Kit CRUD operations](https://github.com/hxgf/dbkit)
- [Tachyons Docs](https://tachyons.io/docs/)

Check out [slime-demo](https://github.com/hxgf/dbkit) to see examples of some cool stuff you can do with Slime!

---

Slime is heavily inspired by [STEREO](https://stereotk.com/), an older toolkit I've assembled and maintained, which has helped me to be very productive and make a decent living over the years. 

I hope these tools and the workflows they enable can help some of you as much as they've helped me : )




