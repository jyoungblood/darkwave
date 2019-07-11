# 1.3.0
## Jun 2019


Greetings, dear ones, I am pleased to bring you the latest version of our beloved internet toolkit. The focus for this release is twofold: 1) removing that which is no longer useful and 2) making it easier than ever to achieve nice results.

May this release bring you joy and prosperity as you continue with your daily work.

And so it is:

- moved source repo to GitLab! - https://gitlab.com/hxgf/stereo
- new docs site, nice place to grow (thank you Docusaurus 😘) - http://docs.stereotk.com/
- upgraded Tachyons version - 4.11.2
- upgraded jQuery version - 3.4.1 😈
- cool generic default favicon (it's a white circle now)
- added favicons in various sizes for various platforms (in /images/favicons)
- .htaccess - rewrite url to serve primary favicon at /favicon.ico
- .htaccess - force SSL by default (if available)
- default responsive viewport: width=device-width, initial-scale=1
- updated breakpoints.css to match Tachyons media query breakpoints
- killed the boilerplate demo, moving to new examples section in docs
- app.css ✈️ styles.css
- /stereo/lib - new vendor folder for 3rd-party PHP libs (good place for stuff you want to add manually [not using composer], such as phmagick or simple_html_dom)
- updated license author (copyright + contact info)
- killed default monospace font
- now using changelog.md for any new features/fixes
- moved changelog.md and license.md to /stereo
- revised readme (streamlined demo/features, installation instructions)

---

# 1.2.0
## Feb 2017

Solidified release to support development of Darkwave CMS (and provide a better development experience in general)

Specific changes:
- upgrade tachyons version (4.6.1)
- update breakpoints (remove css variable breakpoints)
- all *_request() methods (http_request, api_request, etc) now default to array for second parameter (so 2nd param can just be blank if there's no data to send)
- move authentication from render_template to globally-available scope
- remove reference to jq sourcemap
- update email_send mailgun credentials (settings format changes for darkwave)
- fixed bug in db_find (show total number of rows derp)
- updated http_request (api/json/debug/etc) to allow force GET type request

---

# 1.1.0
## Aug 2016

STEREO is finally ready for prime time! Although it will continue to be updated with bug fixes and minor new features in the future, all of the core functionality is in place and shouldn't change ever again!

---

# 0.1.4
## Mar 2016

Past is prologue...