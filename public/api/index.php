<?php
/**
 * Public-facing API proxy.
 *
 * When the app is served from the `public/` directory, requests to
 * `../api/index.php` resolve to `/api/index.php` in the browser.
 * This proxy forwards those requests to the actual backend API.
 */

require_once __DIR__ . '/../../api/index.php';
