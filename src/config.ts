import * as vscode from 'vscode';

export interface StreamSafeConfig {
  obsWebSocketUrl: string;
  obsWebSocketPassword: string;
  sensitivePatterns: string[];
  obsSourceName: string;
  obsSceneName: string;
  enabled: boolean;
  showNotifications: boolean;
}

export function getConfig(): StreamSafeConfig {
  const cfg = vscode.workspace.getConfiguration('streamsafe');
  return {
    obsWebSocketUrl: cfg.get<string>('obsWebSocketUrl', 'ws://localhost:4455'),
    obsWebSocketPassword: cfg.get<string>('obsWebSocketPassword', ''),
    sensitivePatterns: cfg.get<string[]>('sensitivePatterns', [
      '**/.env',
      '**/.env.*',
      '**/.env.local',
      '**/.env.production',
      '**/secrets.*',
      '**/credentials.*',
      '**/*.pem',
      '**/*.key',
    ]),
    obsSourceName: cfg.get<string>('obsSourceName', 'StreamSafe_Cover'),
    obsSceneName: cfg.get<string>('obsSceneName', ''),
    enabled: cfg.get<boolean>('enabled', true),
    showNotifications: cfg.get<boolean>('showNotifications', true),
  };
}
