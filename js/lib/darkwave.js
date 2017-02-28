
var darkwave = {

  api_request: function(cfg){
    var data = cfg.data ? cfg.data : {};
    return $.ajax({
      type: "POST",
      url: cfg.url,
      dataType: 'json',
      data: data
    }).fail(function(jqXHr, textStatus, errorThrown){
      var error_label = 'Can\'t connect to data server.';
      if (errorThrown != ''){
        error_label = 'Data server error:<br /><small>'+errorThrown+'</small>';
      }
      alert(error_label);
      console.log(errorThrown);
      $("body").removeClass('working');
    }).done(function(data) {
      if (cfg.callback){
        cfg.callback(data);
      }else{
        if (cfg.debug){
          console.log(data);
        }
        return data;
      }
    });
  },
	query_string: function(){
		var qs = document.location.search;
    qs = qs.split('+').join(' ');
    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
	}
};




$(function(){



	$('body').on({ blur: function(){
		$(this).parents('.error').removeClass('error');
		$(this).next('span').html('');
	}},".error input");



	$("form").on('submit', function(e){
		$("body").addClass('working');
		var valid = true;
	  $(".required input").each(function(){
	    if (!$(this).val()){
	      $(this).parents('.required').addClass('error');
	      valid = false;
	    }
	  }).promise().done(function(){
	    if (valid){
				if ($(".error").length == 0){
					return true;
				}else{
		      $("body").removeClass('working');
					e.preventDefault();
					e.stopPropagation();
				}
	    }else{
	      $("body").removeClass('working');
				e.preventDefault();
				e.stopPropagation();
	    }
	  });
	});









	$(document).on('submit','form.login',function(e){
    e.preventDefault();
    darkwave.api_request({
	    url: "/auth/login/process",
	    data: {
	      email: $("input[name='email']").val(),
	      password: $("input[name='password']").val(),
	      redirect: $("input[name='redirect']").val(),
	      website: $("input[name='website']").val(),
				ua: navigator.userAgent,
	      ip: $("input[name='ip']").val()
	    },
	    callback: function(r){
	      if (r.success){
					if (r.user_id){
						Cookies.set('user_id', r.user_id, { expires: 7300, path: '/' });
					}
					if (r.url_title){
						Cookies.set('url_title', r.url_title, { expires: 7300, path: '/' });
					}
					if (r.auth_token){
						Cookies.set('auth_token', r.auth_token, { expires: 7300, path: '/' });
					}
					if (r.admin_token){
						Cookies.set('admin_token', r.admin_token, { expires: 7300, path: '/' });
					}
					if (r.moderator_token){
						Cookies.set('moderator_token', r.moderator_token, { expires: 7300, path: '/' });
					}
	        if (r.redirect){
	          window.location.href = r.redirect;
	        }else{
	          window.location.href = '/';
	        }
	      }else{
	        if (r.error.email){
					  $("body").removeClass('working');
	          $(".validate-email").addClass("error");
	          $(".validate-email span").html(r.error.message);
	        }
	        if (r.error.password){
					  $("body").removeClass('working');
	          $(".validate-password").addClass("error");
	          $(".validate-password span").html(r.error.message);
	        }
	      }
	    }
    });
	});





  $(".validate input").on('blur', function(){
    var type = $(this).data('type');
    var ths = $(this);

    darkwave.api_request({
	    url: "/auth/validate-unique",
	    data: {
	      value: $(this).val(),
	      id: $(this).data('id'),
	      type: type,
	      user_id: Cookies.get('user_id')
	    },
	    callback: function(r){
	      if (r.error){
	        $(".validate-"+type).addClass('error');
	        ths.siblings('span').html(r.error_message);
	      }else{
	        $(".validate-"+type).removeClass('error');
	        ths.siblings('span').html('');
	      }
	    }
    });

  });



});
