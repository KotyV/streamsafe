import OBSWebSocket from 'obs-websocket-js';

export class ObsClient {
  private obs: OBSWebSocket;
  private connected = false;

  constructor() {
    this.obs = new OBSWebSocket();
  }

  async connect(url: string, password?: string): Promise<void> {
    try {
      await this.obs.connect(url, password || undefined);
      this.connected = true;
    } catch (err) {
      this.connected = false;
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.obs.disconnect();
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Show or hide an OBS source (scene item) to cover/uncover the screen.
   * Uses SetSceneItemEnabled from OBS WebSocket v5.
   */
  async setSourceVisible(
    sourceName: string,
    visible: boolean,
    sceneName?: string,
  ): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to OBS WebSocket');
    }

    // Get the current scene if none specified
    const targetScene =
      sceneName || (await this.getCurrentSceneName());

    // Find the scene item ID for the source
    const { sceneItems } = await this.obs.call('GetSceneItemList', {
      sceneName: targetScene,
    });

    const item = sceneItems.find(
      (i) => (i as Record<string, unknown>).sourceName === sourceName,
    );

    if (!item) {
      throw new Error(
        `Source "${sourceName}" not found in scene "${targetScene}". ` +
          `Create a source named "${sourceName}" in OBS (see README).`,
      );
    }

    const sceneItemId = (item as Record<string, unknown>).sceneItemId as number;

    await this.obs.call('SetSceneItemEnabled', {
      sceneName: targetScene,
      sceneItemId,
      sceneItemEnabled: visible,
    });
  }

  private async getCurrentSceneName(): Promise<string> {
    const { currentProgramSceneName } = await this.obs.call(
      'GetCurrentProgramScene',
    );
    return currentProgramSceneName;
  }

  onDisconnect(callback: () => void): void {
    this.obs.on('ConnectionClosed', () => {
      this.connected = false;
      callback();
    });
  }
}
