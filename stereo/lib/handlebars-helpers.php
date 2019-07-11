<?php

// transform string to lowercase
$engine->addHelper('lowercase', function($template, $context, $args, $source) {
  $parsed_args = $template->parseArguments($args);
  if (count($parsed_args) != 1) {
    throw new \InvalidArgumentException(
      '"lowercase" helper expects exactly one argument.'
    );
  }
  return strtolower($context->get($parsed_args[0]));
});



// escape quotes
$engine->addHelper('addslashes', function($template, $context, $args, $source) {
  $parsed_args = $template->parseArguments($args);
  if (count($parsed_args) != 1) {
    throw new \InvalidArgumentException(
      '"lowercase" helper expects exactly one argument.'
    );
  }
  return addslashes($context->get($parsed_args[0]));
});






// parse unix timestamp into human-readable date format (basically php's date())
$engine->addHelper('date', function($template, $context, $args, $source) {
  $parsed_args = $template->parseArguments($args);
  if (count($parsed_args) != 2) {
    throw new \InvalidArgumentException(
      '"date" helper expects exactly two arguments.'
    );
  }

	$time = $context->get($parsed_args[0]);

	if ($time == "now"){
		return date($context->get($parsed_args[1]));
	}else{
		return date($context->get($parsed_args[1]), $time);
	}

});





// transform time/date format (same as date, but it turns a string [like a js date object] into unix time first)
$engine->addHelper('date_transform', function($template, $context, $args, $source) {
  $parsed_args = $template->parseArguments($args);
  if (count($parsed_args) != 2) {
    throw new \InvalidArgumentException(
      '"date" helper expects exactly two arguments.'
    );
  }
	return date($context->get($parsed_args[1]), strtotime($context->get($parsed_args[0])));
});






// to_fixed
	// return given number calculated to given number of decimal places
	// {{to_fixed data.total}} 0.00
	// {{to_fixed data.total 4}} 0.0000
	// {{to_fixed data.total 0}} 0
$engine->addHelper('to_fixed', function($template, $context, $args, $source) {
	$parsed_args = $template->parseArguments($args);
	$precision = 2;
	if ($context->get($parsed_args[1]) == 0){
		$precision = 0;
	}
	if ($context->get($parsed_args[1])){
		$precision = $context->get($parsed_args[1]);
	}
	return number_format((float)$context->get($parsed_args[0]), $precision, '.', '');
});


	
// nl2br
	// transform line breaks to "<br />"
	// {{{nl2br data.description}}}
$engine->addHelper('nl2br', function($template, $context, $args, $source) {
	$parsed_args = $template->parseArguments($args);
	return nl2br($context->get($parsed_args[0]));
});




// in_array
	// return true(/false) if this item is(/is not) in the array
	// {{#in_array "green" data.colors_array}}it's in the array!{{else}}it's not in :({{/in_array}}
		// can be a csv string, too
$engine->addHelper('in_array', function($template, $context, $args, $source) {
  $parsed_args = $template->parseArguments($args);
		if (gettype($context->get($parsed_args[1])) == 'array'){
			$condition = (in_array($context->get($parsed_args[1]), $context->get($parsed_args[0])));
		}else{
			$condition = (in_array($context->get($parsed_args[1]), str_getcsv($context->get($parsed_args[0]))));
		}
  if ($condition) {
    $template->setStopToken('else');
    $buffer = $template->render($context);
    $template->setStopToken(false);
  } else {
    $template->setStopToken('else');
    $template->discard();
    $template->setStopToken(false);
    $buffer = $template->render($context);
  }
  return $buffer;
});



// if_either
	// return true if the first thing equals either the second or third thing
	// {{#if_either data.word "shit" "fuck"}}it's true :){{else}}it's false :({{/if_either}}
		// data.word = "shit" so this will be true
$engine->addHelper('if_either', function($template, $context, $args, $source) {
  $parsed_args = $template->parseArguments($args);
  $condition = ($context->get($parsed_args[0]) == $context->get($parsed_args[1]) || $context->get($parsed_args[0]) == $context->get($parsed_args[2]));
  if ($condition) {
    $template->setStopToken('else');
    $buffer = $template->render($context);
    $template->setStopToken(false);
  } else {
    $template->setStopToken('else');
    $template->discard();
    $template->setStopToken(false);
    $buffer = $template->render($context);
  }
  return $buffer;
});



// is
  // basic comparison operators
    // will also show if the first thing is contained within the second thing (even it's CSV)
		// {{#is data.word "==" shit}}yes :){{else}}no :({{/is}}
		// {{#is shit "in" data.word}}yes :){{else}}no :({{/is}}
			// 2nd param can beither array or csv
		// {{#is data.var_1 "typeof" data.var_2}}yes :){{else}}no :({{/is}}
$engine->addHelper('is', function($template, $context, $args, $source) {
  $parsed_args = $template->parseArguments($args);
	$l = $context->get($parsed_args[0]);
	$operator = $context->get($parsed_args[1]);
	$r = $context->get($parsed_args[2]);
	if ($operator == '=='){
		$condition = ($l == $r);
	}
	if ($operator == '==='){
		$condition = ($l === $r);
	}
	if ($operator == 'not' || $operator == '!='){
		$condition = ($l != $r);
	}	
	if ($operator == '<'){
		$condition = ($l < $r);
	}
	if ($operator == '>'){
		$condition = ($l > $r);
	}
	if ($operator == '<='){
		$condition = ($l <= $r);
	}
	if ($operator == '>='){
		$condition = ($l >= $r);
	}
	if ($operator == 'in'){
		if (gettype($r) == 'array'){
			$condition = (in_array($l, $r));
		}else{
			// expects a csv string
			$condition = (in_array($l, str_getcsv($r)));
		}
	}
	if ($operator == 'typeof'){
		$condition = (gettype($l) == gettype($r));
	}
  if ($condition) {
    $template->setStopToken('else');
    $buffer = $template->render($context);
    $template->setStopToken(false);
  } else {
    $template->setStopToken('else');
    $template->discard();
    $template->setStopToken(false);
    $buffer = $template->render($context);
  }
  return $buffer;
});




