# Changelog

## 0.5.6

- Associate an FCB document only with video navigation emitted by the same Web Viewer, preventing cross-course mappings when several Baidu tabs are open.
- Stop guessing that a lone open Baidu video belongs to the current FCB document when no exact evidence exists.
- Add a command to copy privacy-safe diagnostics for the most recent import, including stage, source, cue counts, candidate counts and retry results.
- Redact full URLs, authentication tokens, cookies and Baidu session identifiers from copied diagnostics.
- Index the selected attachment folder once per import and reject local/private-network image sources while preserving normal Baidu and BCE images.
- Collect and validate subtitles before committing FCB imports; newly created notes contain AI notes and subtitles in the first Vault write.
- Preserve duplicate notes without combining managed sections from different files, and report duplicate counts in diagnostics.
- Limit subtitle resource probing to explicit or recent fallback requests on Baidu-related domains.
- Rename the user-facing AI-note action from “sync” to “refresh” while retaining the existing command ID and settings compatibility.
- Show progress for each of the five bounded subtitle-detection attempts.
- Validate Baidu Web Viewer URLs by protocol, host and path instead of accepting lookalike URL text.
- Build video-page AI-note and subtitle sections together before one body update, and leave existing notes untouched when folder selection is cancelled.
- Normalize cross-device settings, discard invalid mappings, bound saved FCB/video associations, and prevent overlapping import commands.
- Track auto-opened videos by WebView instance, clear stale FCB navigation context, and reuse mappings by stable FCB identity after login parameters change.
- Validate image response status, MIME type and size before writing an attachment, so expired links cannot save an HTML error page as an image.
- Redact URLs and session credentials from console errors and user-facing failure messages as well as copied diagnostics.
- Read AI-note content across the main document, accessible frames and shadow roots with bounded retries before opening the transcript tab; stop before switching when no note exists, and restore the AI-note tab after subtitle extraction.

## 0.5.5

- Add repeatable release, syntax, bundle-load, and core behavior checks before deployment.
- Reject one-off partial cues instead of treating a single trusted cue as a complete timestamped transcript.
- Collect and validate video-page subtitles before creating or updating the AI note, so a subtitle failure leaves the Vault note untouched.
- Preserve an existing note unchanged when the optional subtitle fallback cannot find a complete transcript.

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
