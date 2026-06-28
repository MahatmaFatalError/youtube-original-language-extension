# YouTube Original Language

Eine kleine Chrome/Firefox-WebExtension, die auf `youtube.com` versucht, Video-Titel und Beschreibungen immer in der Originalsprache anzuzeigen.

## Was sie macht

- läuft nur auf `www.youtube.com` und `m.youtube.com`
- markiert die Seite mit `translate="no"` und `notranslate`
- liest Originaltitel und Originalbeschreibung aus YouTubes eingebetteten Videodaten
- ersetzt sichtbare übersetzte Titel/Beschreibungen auf Watch-Seiten durch diese Originaldaten
- klickt sichtbare YouTube-Schaltflächen wie `Show original` / `Original anzeigen`, falls YouTube sie anbietet

## Einschränkung

YouTube stellt keine offizielle Browser-API für „niemals übersetzen“ bereit. Diese Erweiterung arbeitet deshalb bestmöglich mit den Daten und Bedienelementen, die YouTube auf der Seite ausliefert. Wenn YouTube die Originaldaten gar nicht an den Browser sendet oder das DOM ändert, kann ein Update nötig werden.

## Installation in Chrome

1. `chrome://extensions` öffnen.
2. `Entwicklermodus` aktivieren.
3. `Entpackte Erweiterung laden` klicken.
4. Diesen Ordner auswählen: `youtube-original-language-extension`.

## Installation in Firefox

1. `about:debugging#/runtime/this-firefox` öffnen.
2. `Temporäres Add-on laden...` klicken.
3. Die Datei `manifest.json` in diesem Ordner auswählen.

Firefox lädt temporäre Add-ons nach einem Browser-Neustart nicht automatisch neu.
