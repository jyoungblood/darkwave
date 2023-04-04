
var dw = {
  bs_modal: function(cfg){
    var modal_content = `

<div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="exampleModalLabel">Modal title</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        ${cfg.message}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>
<button type="button" class="btn btn-primary d-none" data-bs-toggle="modal" data-bs-target="#exampleModal">
  Launch modal
</button>

    `;
    
    if (document.getElementById("exampleModal-group")){
      document.getElementById("exampleModal-group").remove();
    }

    var g = document.createElement('div');
    g.setAttribute("id", "exampleModal-group");
    document.body.appendChild(g);

    document.getElementById("exampleModal-group").innerHTML = modal_content;

    // create element if it doesn't exist
    // update w/ current content

    document.querySelector('[data-bs-target="#exampleModal"]').click();
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
      dw.listener_clear_error();
      document.body.classList.remove('working');
      // fixit remove
      smoke.alert("Required information is missing.");
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





// new dw functions for 0.6.0

  edit_form: function(){
    return {
      validate: function(el, type){
        if (type == 'required'){
          if (el.value){
            el.classList.remove('is-invalid');
            el.nextElementSibling.innerHTML = '';
          }else{
            el.classList.add('is-invalid')
            el.nextElementSibling.innerHTML = 'Required';
          }
        }
      },
      save: function (cfg) {
        document.body.classList.add('working');
        // fixit validation
        var callback = cfg.callback ? cfg.callback : false;
        if (cfg.redirect){
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
      delete_confirm: function (cfg){
        document.querySelector('[data-container="delete"]').innerHTML = `
        <div class='mb-2'>${cfg.message ? cfg.message : 'Are you sure?'}</div>
        <button class='btn btn-danger' @click='delete_execute(${JSON.stringify(cfg)})'>Yes</button>
        &nbsp; 
        <button class='btn btn-secondary' @click='delete_cancel(${JSON.stringify(cfg)})'>Cancel</button>`;
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
  }

};