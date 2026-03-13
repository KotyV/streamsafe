import * as vscode from 'vscode';
import { ObsClient } from './obs-client';
import { SensitiveDetector } from './sensitive-detector';
import { getConfig } from './config';

let obsClient: ObsClient;
let detector: SensitiveDetector;
let statusBarItem: vscode.StatusBarItem;
let isCovering = false;
let sensitiveEditorsOpen = 0;

export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const config = getConfig();
  detector = new SensitiveDetector(config.sensitivePatterns);
  obsClient = new ObsClient();

  // Status bar
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBarItem.command = 'streamsafe.status';
  updateStatusBar('disconnected');
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Auto-connect to OBS
  if (config.enabled) {
    await connectToObs();
  }

  // Handle OBS disconnections
  obsClient.onDisconnect(() => {
    updateStatusBar('disconnected');
    if (config.showNotifications) {
      vscode.window.showWarningMessage(
        'StreamSafe: Connexion OBS perdue. Utilisez "StreamSafe: Reconnecter" pour rétablir.',
      );
    }
  });

  // Watch for file open/close
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      checkActiveEditor(editor);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((doc) => {
      if (detector.isSensitive(doc.uri.fsPath)) {
        sensitiveEditorsOpen++;
        showCover();
      }
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((doc) => {
      if (detector.isSensitive(doc.uri.fsPath)) {
        sensitiveEditorsOpen = Math.max(0, sensitiveEditorsOpen - 1);
        if (sensitiveEditorsOpen === 0) {
          hideCover();
        }
      }
    }),
  );

  // Watch for tab changes
  context.subscriptions.push(
    vscode.window.tabGroups.onDidChangeTabs(() => {
      recountSensitiveTabs();
    }),
  );

  // Watch for config changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('streamsafe')) {
        const newConfig = getConfig();
        detector.updatePatterns(newConfig.sensitivePatterns);
      }
    }),
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand('streamsafe.toggle', async () => {
      const cfg = vscode.workspace.getConfiguration('streamsafe');
      const current = cfg.get<boolean>('enabled', true);
      await cfg.update('enabled', !current, vscode.ConfigurationTarget.Global);
      if (!current) {
        await connectToObs();
        vscode.window.showInformationMessage('StreamSafe activé');
      } else {
        await hideCover();
        await obsClient.disconnect();
        updateStatusBar('disabled');
        vscode.window.showInformationMessage('StreamSafe désactivé');
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('streamsafe.reconnect', async () => {
      await connectToObs();
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('streamsafe.status', () => {
      const connected = obsClient.isConnected();
      const enabled = getConfig().enabled;
      vscode.window.showInformationMessage(
        `StreamSafe: ${enabled ? 'Activé' : 'Désactivé'} | ` +
          `OBS: ${connected ? 'Connecté' : 'Déconnecté'} | ` +
          `Protection: ${isCovering ? 'Active (écran masqué)' : 'Inactive'}`,
      );
    }),
  );

  // Check if current editor is already a sensitive file
  checkActiveEditor(vscode.window.activeTextEditor);
}

async function connectToObs(): Promise<void> {
  const config = getConfig();
  try {
    await obsClient.connect(config.obsWebSocketUrl, config.obsWebSocketPassword);
    updateStatusBar('connected');
    if (config.showNotifications) {
      vscode.window.showInformationMessage('StreamSafe: Connecté à OBS');
    }
  } catch {
    updateStatusBar('error');
    vscode.window.showErrorMessage(
      'StreamSafe: Impossible de se connecter à OBS WebSocket. ' +
        'Vérifiez qu\'OBS est lancé avec le WebSocket Server activé.',
    );
  }
}

function checkActiveEditor(editor: vscode.TextEditor | undefined): void {
  if (!editor) {
    return;
  }
  if (detector.isSensitive(editor.document.uri.fsPath)) {
    showCover();
  }
}

async function showCover(): Promise<void> {
  if (isCovering || !obsClient.isConnected()) {
    return;
  }
  const config = getConfig();
  if (!config.enabled) {
    return;
  }

  try {
    await obsClient.setSourceVisible(
      config.obsSourceName,
      true,
      config.obsSceneName || undefined,
    );
    isCovering = true;
    updateStatusBar('covering');
    if (config.showNotifications) {
      vscode.window.showWarningMessage(
        'StreamSafe: Fichier sensible détecté — écran masqué sur le stream',
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`StreamSafe: ${message}`);
  }
}

async function hideCover(): Promise<void> {
  if (!isCovering || !obsClient.isConnected()) {
    isCovering = false;
    return;
  }
  const config = getConfig();

  try {
    await obsClient.setSourceVisible(
      config.obsSourceName,
      false,
      config.obsSceneName || undefined,
    );
    isCovering = false;
    updateStatusBar('connected');
    if (config.showNotifications) {
      vscode.window.showInformationMessage(
        'StreamSafe: Plus de fichier sensible — écran visible sur le stream',
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`StreamSafe: ${message}`);
  }
}

function recountSensitiveTabs(): void {
  let count = 0;
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      if (
        tab.input instanceof vscode.TabInputText &&
        detector.isSensitive(tab.input.uri.fsPath)
      ) {
        count++;
      }
    }
  }

  sensitiveEditorsOpen = count;

  if (count === 0 && isCovering) {
    hideCover();
  } else if (count > 0 && !isCovering) {
    showCover();
  }
}

function updateStatusBar(
  state: 'connected' | 'disconnected' | 'covering' | 'error' | 'disabled',
): void {
  switch (state) {
    case 'connected':
      statusBarItem.text = '$(shield) StreamSafe';
      statusBarItem.tooltip = 'StreamSafe: Connecté à OBS — Prêt';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'disconnected':
      statusBarItem.text = '$(shield) StreamSafe (off)';
      statusBarItem.tooltip = 'StreamSafe: Déconnecté d\'OBS';
      statusBarItem.backgroundColor = undefined;
      break;
    case 'covering':
      statusBarItem.text = '$(eye-closed) StreamSafe ACTIF';
      statusBarItem.tooltip = 'StreamSafe: Écran masqué (fichier sensible ouvert)';
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.warningBackground',
      );
      break;
    case 'error':
      statusBarItem.text = '$(warning) StreamSafe';
      statusBarItem.tooltip = 'StreamSafe: Erreur de connexion OBS';
      statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.errorBackground',
      );
      break;
    case 'disabled':
      statusBarItem.text = '$(shield) StreamSafe (désactivé)';
      statusBarItem.tooltip = 'StreamSafe: Désactivé';
      statusBarItem.backgroundColor = undefined;
      break;
  }
}

export function deactivate(): void {
  if (obsClient) {
    obsClient.disconnect();
  }
}
