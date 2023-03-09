<?php

$GLOBALS['site_url'] = $_SERVER['HTTP_HOST'];

$GLOBALS['locals'] = [
  'year' => date('Y'),
  'site_title' => $GLOBALS['site_title'],
  'site_code' => $GLOBALS['site_code'],
  'site_url' => $GLOBALS['site_url'],
  'auth' => @$GLOBALS['auth'],
  'user_id' => @$GLOBALS['user_id'],
  'is_admin' => @$GLOBALS['is_admin'],
];