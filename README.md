# claude-chat-monkey-exporter

A Monkey script to extract [Claude.ai](https://claude.ai/) discussion for archiving.

Script built using [ChatGPT](https://chatgpt.com/).

Tested with [ViolentMonkey](https://violentmonkey.github.io/) (open-source) extension.

Should work with legacy [GreaseMonkey](https://wiki.greasespot.net/Greasemonkey) but untested.

Or the close-source popular [TamperMonkey](https://www.tampermonkey.net/) but untested too.

## Limitations

Does not store artefacts.

## How to

- Install one of the above extensions in your browser
- Import the script into the extension
- Reload the target Claude tab for your conversation
- Open your developper tools to watch progress (F12 then `Console`)
- Activate all 4 levels (errors, warning, information, logs)
- Click on the monkey extension icon
- Click the menu item `Export conversation to Markdown`
- Watch the log and wait until completion
- Upon success, you auto-download a `.md` file !

## Example of log during processing

```text
...
[Claude Export] Starting... Claude Export to Markdown.user.js:145:15
[Claude Export] Found 90 copy buttons Claude Export to Markdown.user.js:156:15
[Claude Export] Capturing 1/90 Claude Export to Markdown.user.js:163:17
...
[Claude Export] Capturing 76/90 Claude Export to Markdown.user.js:163:17
[Claude Export] Skipping 76/90 Claude Export to Markdown.user.js:169:19
...
[Claude Export] Capturing 90/90 Claude Export to Markdown.user.js:163:17
[Claude Export] Done. Claude Export to Markdown.user.js:198:15
```

Here, the skipped messages at 76 is where there was no "text answer" (ie. only artefacts).
