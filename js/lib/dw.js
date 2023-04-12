
var dw = {
  alert: function (message, cfg = {}) {
    cfg.content = message;
    this.modal(cfg);
    // console.log(cfg);
  },
  modal: function (cfg) {

    var fade = cfg.fade ? 'fade' : '';
    var blur = cfg.blur ? 'modal-blur' : '';
    var centered = cfg.centered ? 'modal-dialog-centered' : '';
    var scrollable = cfg.scrollable ? 'modal-dialog-scrollable' : '';

    var small = cfg.format == 'small' ? 'modal-sm' : '';
    var large = cfg.format == 'large' ? 'modal-lg' : '';
    var fullwidth = cfg.format == 'full-width' ? 'modal-full-width' : '';

    var modal_id = cfg.modal_id ? cfg.modal_id : 'modal' + Math.random().toString(36).slice(2, 7);

    var buttons = '';

    if (cfg.buttons){
      dw.button_callbacks = {};
      for (var i = 0; i < cfg.buttons.length; i++) {
        var button_color = 'primary';
        if (cfg.buttons[i].color){
          button_color = cfg.buttons[i].color;
        }
        if (cfg.buttons[i].callback){
          dw.button_callbacks[i] = cfg.buttons[i].callback;
        }
        buttons += `
          <button type="button" class="btn ${cfg.buttons[i].role == 'cancel' ? ' me-auto' : `btn-${button_color}`} ${cfg.buttons[i].class_extra}" ${cfg.buttons[i].close_modal ? `data-bs-dismiss="modal"` : ''} ${cfg.buttons[i].callback ? `onclick="dw.button_callbacks[${i}]()"` : ''}>${cfg.buttons[i].label}</button>
        `;
      }
    }

    var modal_content = `
    <div class="modal ${blur} ${fade}" id="${modal_id}" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog ${small} ${large} ${fullwidth} ${centered} ${scrollable}" role="document">
        <div class="modal-content">
        ${cfg.theme ? `<div class="modal-status bg-${cfg.theme}"></div>` : ''}
        ${cfg.format == 'small' ? '' : `
          ${ cfg.title ? `
            <div class="modal-header">
              <h5 class="modal-title ${cfg.modal_title_extra}">${cfg.title}</h5>
              ${cfg.no_x ? '' : `<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`}
            </div>`            
          : `
              ${cfg.no_x ? '' : `<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>`}
          `}`
          }
          <div class="modal-body ${cfg.modal_body_extra}">
          ${cfg.form ? '<form action="javascript:void(0);">' : ''}
            ${cfg.format == 'small' ? `
              <div class="modal-title">${cfg.title}</div>
              <div>${cfg.content}</div>
            `
            : cfg.content }

          ${cfg.form ? '</form>' : ''}
          </div>
          <div class="modal-footer">
            ${buttons}
          </div>
        </div>
      </div>
    </div>

    <a href="#" class="d-none" data-bs-toggle="modal" data-bs-target="#${modal_id}"></a>

`;


    if (document.getElementById(modal_id + "-group")) {
      document.getElementById(modal_id + "-group").remove();
    }

    var g = document.createElement('div');
    g.setAttribute("id", modal_id + "-group");
    document.body.appendChild(g);

    document.getElementById(modal_id + "-group").innerHTML = modal_content;

    // create element if it doesn't exist
    // update w/ current content

    document.querySelector('[data-bs-target="#' + modal_id + '"]').click();
  },
  api_request: function (cfg) {
    var data = cfg.data ? cfg.data : {};
    var request = new XMLHttpRequest();
    request.open('POST', cfg.url, true);
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        if (cfg.callback) {
          cfg.callback(JSON.parse(this.response));
        } else {
          if (cfg.debug) {
            console.log(JSON.parse(this.response));
          }
          return this.response;
        }
      } else {
        // Response error
      }
    };
    request.onerror = function () {
      // Connection error
    };
    var query = "";
    for (key in data) {
      query += encodeURIComponent(key) + "=" + encodeURIComponent(data[key]) + "&";
    }
    return request.send(query);
  },
  serialize: function (form) {
    var serialized = [];
    for (var i = 0; i < form.elements.length; i++) {
      var field = form.elements[i];
      if (!field.name || field.disabled || field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button') continue;
      if (field.type === 'select-multiple' || field.type === 'select') {
        for (var n = 0; n < field.options.length; n++) {
          if (!field.options[n].selected) continue;
          serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.options[n].value));
        }
      }
      else if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
        serialized.push(encodeURIComponent(field.name) + "=" + encodeURIComponent(field.value));
      }
    }
    return serialized.join('&');
  },
  listener_clear_error: function () {
    document.addEventListener('focusout', function (e) {
      var input = e.target;
      if (input.parentNode.classList.contains('error')) {
        if (input.value) {
          input.parentNode.classList.remove('error');
        }
      }
    });
  },
  form_append_quill: function (callback) {
    document.querySelectorAll('.quill-editor').forEach(function (editor, i) {
      document.querySelector('input[name="' + editor.getAttribute('data-target') + '"]').value = editor.querySelector('.ql-editor').innerHTML;
      // 								.replace(/<\/p><p>/g, '<br>').replace(/(<br>){2,}/g, '</p><p>')
    });
    callback();
  },



  // fixit validate everything (required fields AND unique/special validation)
  form_validate_required: function (callback) {
    var required_items = document.querySelectorAll('.required input, .required textarea, .required select');
    var valid = true;
    for (var i = 0; i < required_items.length; i++) {
      var input = required_items[i];
      if (!input.value) {
        // input.parentNode.classList.add('error');
        input.classList.add('is-invalid')
        input.nextElementSibling.innerHTML = 'Required';
        valid = false;
      }
    }
    if (valid) {
      // here's where we would remove the event listener if it mattered
      callback();
    } else {
      document.body.classList.remove('working');

      // fixit is this still needed?
      dw.listener_clear_error();

      // fixit remove
      // smoke.alert("Required information is missing.");
      // fixit new alert saying required information is missing
    }
  },






  // new functions from 0x00


  formbody_encode: function (data) {
    return Object.entries(data).map(([k, v]) => { return k + '=' + v }).join('&');
  },

  cookie_set: function (name, value, days = 365) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/";
  },

  cookie_get: function (name) {
    let value = `; ${document.cookie}`;
    let parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  },

  cookie_delete: function (name) {
    document.cookie = name + '=; Max-Age=0';
  },

  cookie_parse: function (str) {
    return str
      .split(';')
      .map(v => v.split('='))
      .reduce((acc, v) => {
        acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());
        return acc;
      }, {});
  },

  jwt_parse: function (token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  },

  api_xhr: function (cfg) {
    cfg.data = cfg.data || {};
    if (cfg.authenticated && this.cookie_get('auth_token')) {
      cfg.data.auth_token = this.cookie_get('auth_token');
    }
    var request = new XMLHttpRequest();
    request.open('POST', cfg.url, true);
    // request.withCredentials = true;
    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        if (cfg.callback) {
          cfg.callback(JSON.parse(this.response));
        } else {
          if (cfg.debug) {
            console.log(JSON.parse(this.response));
          }
          return this.response;
        }
      } else {
        // Response error
        alert(`Request error: ${this.response}`);
      }
    };
    request.onerror = function () {
      // Connection error
      alert(`Network error: ${this.response}`);
    };
    return request.send(this.formbody_encode(cfg.data));

  },

  api_fetch: function (cfg) {
    if (cfg.authenticated && this.cookie_get('auth_token')) {
      cfg.data.auth_token = this.cookie_get('auth_token');
    }
    let parameters = {
      method: cfg.method ? cfg.method : 'POST',
      headers: {
        'Content-type': cfg.json ? 'application/json' : 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json'
      }
    };
    if (cfg.method === 'GET') {
      let query_string = new URLSearchParams(cfg.data).toString();
      cfg.url = cfg.url + '?' + query_string;
    } else {
      parameters.body = cfg.json ? JSON.stringify(cfg.data) : this.formbody_encode(cfg.data);
    }
    return fetch(cfg.url, parameters).then(response => response.json()).catch(error => {
      alert(`Network error: ${error}`);
      console.log(error);
    });
  },







  // auth/input-related methods

  validate_input: function (cfg) {

    // fixit note which params are required

    // cfg.input
    // cfg.element
    // cfg.required
    // cfg.unique
    //     cfg.unique.collection
    //     cfg.unique.field
    //     cfg.unique.error_message


    if (cfg.unique) {
      var request_data = {
        collection: cfg.unique.collection,
        field: cfg.unique.field,
        value: cfg.element.value,
      };
      if (cfg.unique.exempt_id) {
        request_data.exempt_id = cfg.unique.exempt_id;
      }
      dw.api_request({
        url: '/api/validate-unique/',
        data: request_data,
        callback: function (r) {
          if (r.error) {
            dw.display_error(cfg.input, cfg.unique.error_message ? cfg.unique.error_message : 'Value must be unique');
            // cfg.element.focus();
          } else {
            dw.remove_error(cfg.input);
          }
        }
      });
    } else {
      if (cfg.required) {
        if (!cfg.element.value) {
          dw.display_error(cfg.input, 'Required');
          // cfg.element.focus();
        } else {
          dw.remove_error(cfg.input);
        }
      }
    }


  },
  remove_error: function (data_name) {
    document.querySelector('[data-validate="' + data_name + '"] .form-control').classList.remove('is-invalid');
    document.querySelector('[data-validate="' + data_name + '"] .invalid-feedback').innerHTML = '';
  },
  display_error: function (data_name, error_message) {
    document.querySelector('[data-validate="' + data_name + '"] .form-control').classList.add('is-invalid');
    document.querySelector('[data-validate="' + data_name + '"] .invalid-feedback').innerHTML = error_message;
  },





  // new dw functions for 0.6.0

  edit_form: function () {
    return {
      save: function (cfg) {
        document.body.classList.add('working');
        var callback = cfg.callback ? cfg.callback : false;
        if (cfg.redirect) {
          callback = function (r) {
            window.location.href = cfg.redirect;
          }
        }
        if (cfg.debug) {
          callback = function (r) {
            document.body.classList.remove('working');
            console.log(r);
          }
        }
        dw.form_validate_required(function () {
          dw.api_request({
            url: cfg.url,
            data: cfg.data,
            callback: callback
          });
        });
      },
      delete_confirm: function (cfg) {
        document.querySelector('[data-container="delete"]').innerHTML = `
        <div class='mb-2 fw-medium'>${cfg.message ? cfg.message : 'Are you sure?'}</div>
        <button class='btn btn-danger' @click='delete_execute(${JSON.stringify(cfg)})'>Yes</button>
        &nbsp; 
        <button class='btn' @click='delete_cancel(${JSON.stringify(cfg)})'>Cancel</button>`;
      },
      delete_execute: function (cfg) {
        document.body.classList.add('working');
        var callback = cfg.callback ? cfg.callback : false;
        if (cfg.redirect) {
          callback = function (r) {
            window.location.href = cfg.redirect;
          }
        }
        if (cfg.debug) {
          callback = function (r) {
            document.body.classList.remove('working');
            console.log(r);
          }
        }
        dw.api_request({
          url: cfg.url,
          data: cfg.data,
          callback: callback
        });
      },
      delete_cancel: function (cfg) {
        document.querySelector('[data-container="delete"]').innerHTML = `
          <button class='btn btn-outline-danger' @click='delete_confirm(${JSON.stringify(cfg)})'>Delete</button>
        `;
      }
    };
  },



};