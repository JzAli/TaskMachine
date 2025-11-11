# AI Builder Dashboard

AI Builder Dashboard is a production-ready Electron desktop application that helps you manage AI project workspaces, connect Pipedream integrations, and orchestrate DeepSeek-powered automations from a single Task Board.

## Features

- **Workspace Orchestration** – Select a macOS base directory, bootstrap task workspaces, and watch folder updates in real time.
- **Pipedream Integrations** – Launch OAuth flows for Discord, Slack, Notion, Gmail, Google Drive, and GitHub. Tokens are stored securely in the macOS Keychain through `keytar`.
- **DeepSeek Task Board** – Draft prompts, choose between DeepSeek Chat and DeepSeek Code models, and generate files directly inside a workspace or execute API-centric automations.
- **Persistent Settings** – Theme preference, prompt drafts, and task history are saved to `~/.ai-builder/config.json`.
- **Keyboard Shortcuts** – `⌘+N` create workspace, `⌘+S` save prompt draft, `⌘+K` open the Quick Action Palette.

## Project Structure

```
ai-builder-dashboard/
  app/
    main/
      deepseekClient.js
      keychain.js
      main.js
      pipedreamConnections.js
      preload.js
      workspaceManager.js
    renderer/
      index.html
      src/
        components/
        pages/
        theme/
        App.jsx
        index.jsx
  electron-builder.yml
  package.json
  tailwind.config.cjs
  postcss.config.cjs
  vite.config.js
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Provide API credentials**
   - Set `DEEPSEEK_API_KEY` for DeepSeek requests.
   - (Optional) set `PIPEDREAM_CLIENT_ID` and `PIPEDREAM_CLIENT_SECRET` for OAuth.

3. **Run in development**
   ```bash
   npm run dev
   ```
   This concurrently starts the Vite dev server and the Electron process.

4. **Build production binaries**
   ```bash
   npm run build
   ```
   The command bundles the renderer via Vite and packages the macOS `.app` + `.dmg` using `electron-builder`.

## DeepSeek File Generation Format

To have the Task Board write files automatically, include fences in your AI instructions:

```
```file:generated_code/hello.js
console.log('Hello from AI Builder');
```
```

The application will parse every `file:` fence, create folders when necessary, and write the contents into the chosen workspace.

## Security Notes

- OAuth tokens are stored with the macOS Keychain via `keytar`.
- Application settings are stored locally on disk, never sent to external services.
- All network calls to DeepSeek and Pipedream require explicit API keys provided through environment variables.

## License

MIT © AI Builder Team
