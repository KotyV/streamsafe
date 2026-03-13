# StreamSafe

**Automatically protect your sensitive files while live streaming.**

StreamSafe detects when you open a `.env` file, private keys, or other sensitive files in VS Code and automatically enables an OBS source that covers your screen on the stream.

Never leak secrets on stream again.

---

## How It Works

```
.env file opened  --> StreamSafe detects --> OBS covers the screen
.env file closed  --> StreamSafe detects --> OBS uncovers the screen
```

StreamSafe communicates with OBS Studio via the **OBS WebSocket v5** protocol to toggle a cover source in your scene.

---

## Installation

### From the VS Code Marketplace

1. Open VS Code
2. `Ctrl+Shift+X` --> Search "StreamSafe"
3. Install

### From Source

```bash
git clone https://github.com/KotyV/streamsafe.git
cd streamsafe
npm install
npm run compile
```

Then in VS Code: press `F5` to launch in development mode.

---

## OBS Setup (required)

### Step 1: Enable WebSocket Server in OBS

1. Open **OBS Studio** (v28+ required for WebSocket v5)
2. Menu --> **Tools** --> **WebSocket Server Settings**
3. Check **Enable WebSocket Server**
4. Choose a port (default: `4455`)
5. Optional: set a password
6. Click **Apply**

### Step 2: Create the Cover Source

1. In your **streaming scene**, click **+** in the Sources panel
2. Choose **Image** (or **Color Source**)
3. Name the source: **`StreamSafe_Cover`** (this exact name)
4. Configure:
   - **Image**: choose a cover image (e.g. "BRB", logo, black screen)
   - **Color Source**: pick an opaque color
5. Resize the source to cover the **entire screen**
6. **Hide the source** (click the eye icon) -- StreamSafe will enable it automatically

> **Important**: The source must be **above** your screen/window capture in the OBS source list (it covers them when enabled).

### Step 3: Configure StreamSafe in VS Code

Open VS Code settings (`Ctrl+,`) and search "StreamSafe":

| Setting | Default | Description |
|---------|---------|-------------|
| `streamsafe.obsWebSocketUrl` | `ws://localhost:4455` | OBS WebSocket URL |
| `streamsafe.obsWebSocketPassword` | *(empty)* | WebSocket password |
| `streamsafe.obsSourceName` | `StreamSafe_Cover` | OBS source name to toggle |
| `streamsafe.obsSceneName` | *(empty = active scene)* | Target OBS scene |
| `streamsafe.sensitivePatterns` | `.env`, `.pem`, etc. | Sensitive file glob patterns |
| `streamsafe.enabled` | `true` | Enable/disable StreamSafe |
| `streamsafe.showNotifications` | `true` | Show VS Code notifications |

Or in `settings.json`:

```json
{
  "streamsafe.obsWebSocketUrl": "ws://localhost:4455",
  "streamsafe.obsWebSocketPassword": "your_password",
  "streamsafe.obsSourceName": "StreamSafe_Cover",
  "streamsafe.sensitivePatterns": [
    "**/.env",
    "**/.env.*",
    "**/secrets.*",
    "**/*.pem",
    "**/*.key"
  ]
}
```

---

## Default Detected Files

| Pattern | Example |
|---------|---------|
| `**/.env` | `.env` |
| `**/.env.*` | `.env.local`, `.env.production` |
| `**/secrets.*` | `secrets.json`, `secrets.yaml` |
| `**/credentials.*` | `credentials.json` |
| `**/*.pem` | `private-key.pem` |
| `**/*.key` | `server.key` |
| `**/*secret*` | `my-secret-config.json` |
| `**/*password*` | `password-list.txt` |

You can add your own patterns in the settings.

---

## Commands

| Command | Description |
|---------|-------------|
| `StreamSafe: Toggle` | Enable/disable StreamSafe |
| `StreamSafe: Reconnect to OBS` | Reconnect after a disconnection |
| `StreamSafe: Show Status` | View current status |

Access via `Ctrl+Shift+P` --> type "StreamSafe".

---

## Status Bar

StreamSafe displays an indicator in the VS Code status bar:

| Icon | State |
|------|-------|
| `$(shield) StreamSafe` | Connected, ready |
| `$(shield) StreamSafe (off)` | Disconnected from OBS |
| `$(eye-closed) StreamSafe ACTIVE` | Screen covered (sensitive file open) |
| `$(warning) StreamSafe` | Connection error |

---

## Tech Stack

- **TypeScript** -- Typed codebase
- **VS Code API** -- Editor events
- **obs-websocket-js v5** -- OBS communication
- **minimatch** -- File pattern matching

---

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch

# Launch in VS Code (F5)
# --> Opens an Extension Development Host window

# Lint
npm run lint

# Package as .vsix
npm run package
```

---

## Publishing

```bash
# Install vsce
npm install -g @vscode/vsce

# Login
vsce login KotyV

# Publish
vsce publish
```

Requires an [Azure DevOps Personal Access Token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

---

## License

MIT

Made with caffeine in Marseille. For Charlie.
