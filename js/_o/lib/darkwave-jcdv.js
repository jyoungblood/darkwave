
var dw = {
  api_request: function(cfg){
    var data = cfg.data ? cfg.data : {};
		var request = new XMLHttpRequest();		
		request.open('POST', cfg.url, true);
		request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
		request.onload = function () {
		    if (this.status >= 200 && this.status < 400) {			
			      if (cfg.callback){
			        cfg.callback(JSON.parse(this.response));
			      }else{
			        if (cfg.debug){
			          console.log(JSON.parse(this.response));
			        }
			        return this.response;
			      }
		    } else {
		        // Response error
		    }
		};
		request.onerror = function() {
		    // Connection error
		};	
		var query = "";
		for (key in data) {
		    query += encodeURIComponent(key)+"="+encodeURIComponent(data[key])+"&";
		}
		return request.send(query);
	},
	serialize: function (form) {
		var serialized = [];
		for (var i = 0; i < form.elements.length; i++) {	
			var field = form.elements[i];
			if (!field.name || field.disabled || field.type === 'file' || field.type === 'reset' || field.type === 'submit' || field.type === 'button') continue;
			if (field.type === 'select-multiple') {
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
	listener_clear_error: function(){
		document.addEventListener('focusout', function(e){
			var input = e.target;
			if (input.parentNode.classList.contains('error')){
				if (input.value){
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
	form_validate_required: function(callback){
		document.body.classList.add('working');	
		var required_items = document.querySelectorAll('.required input');
		var valid = true;
		for (var i = 0; i < required_items.length; i++) {
			var input = required_items[i];			
			if (!input.value){
				input.parentNode.classList.add('error');
				valid = false;
			}
		}
		if (valid){
			    // here's where we would remove the event listener if it mattered
			    callback();
		}else{
			dw.listener_clear_error();
			document.body.classList.remove('working');
			smoke.alert("Required information is missing.");
		}
	}
};