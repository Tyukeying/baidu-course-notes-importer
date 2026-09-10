# Changelog

## 0.5.4

- Keep waiting for timestamped subtitle resources during the first combined import instead of stopping when unrelated plain text appears.
- Target the visible/clickable transcript tab and wait for its panel to load before scanning player and network resources.
- Reuse AI-note images by a stable source identity and binary content hash so rotating Baidu URL signatures do not create duplicate attachments.
- Treat missing subtitles as an explicit combined-import failure instead of silently requiring a second click.

## 0.5.3

- Restrict video/FCB imports to the active Web Viewer instead of guessing a background tab.
- Improve AI-note tab and linked panel detection; report extraction failure instead of creating an empty note.
- Reuse an already-open Markdown tab and keep the source video tab intact.
- Preserve all duplicate and existing notes; never trash or overwrite them when a fresh extraction is unavailable.
- Respect the “open video after import” setting and close only videos opened temporarily for subtitle extraction.
- Make folder-picker cancellation consistent and include video-page notes in URL matching.
- Prefer trusted subtitle tracks over noisy page-state candidates.

## 0.5.2

- Restore compatible AI-note panel discovery on Baidu video pages while filtering navigation/sidebar false positives.
- Open the AI-note tab before extracting its rendered content.
- Open imported or updated Markdown in a new tab instead of replacing the source video Web Viewer.

## 0.5.1

- Import a Baidu Netdisk AI note and its timestamped transcript into one Markdown note.
- Add FCB-page and desktop subtitle-cache import paths.
- Let the user choose the destination folder during import.
- Store downloaded AI-note images in a customizable child folder next to the imported note.
- Add ribbon commands for the import workflow.
- Keep `data.json` out of distribution packages so updates preserve local settings.
