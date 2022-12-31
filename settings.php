<?php

$GLOBALS['site_url'] = $_SERVER['HTTP_HOST'];

$GLOBALS['locals'] = [
  'year' => date('Y'),
  'site_url' => $GLOBALS['site_url'],
];