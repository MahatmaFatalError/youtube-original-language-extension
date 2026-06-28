# YouTube Original Language

A small Chrome/Firefox WebExtension that tries to keep YouTube video titles and descriptions in their original language.

## What it does

- runs only on `www.youtube.com` and `m.youtube.com`
- marks the page with `translate="no"` and `notranslate`
- reads the original title and description from YouTube's embedded video data
- replaces visible translated titles/descriptions on watch pages with those original values
- clicks visible YouTube controls such as `Show original` / `Original anzeigen` when YouTube exposes them

## Limitation

YouTube does not provide an official browser API for "never translate this content." This extension therefore works best-effort with the data and controls YouTube exposes on the page. If YouTube does not send the original data to the browser, or changes its page structure, the extension may need an update.

## Chrome installation

1. Open `chrome://extensions`.
2. Enable `Developer mode`.
3. Click `Load unpacked`.
4. Select this folder: `youtube-original-language-extension`.

## Firefox installation

1. Open `about:debugging#/runtime/this-firefox`.
2. Click `Load Temporary Add-on...`.
3. Select the `manifest.json` file in this folder.

Firefox does not automatically reload temporary add-ons after a browser restart.
