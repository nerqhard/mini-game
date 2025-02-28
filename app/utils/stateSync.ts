export class StateSync {
  private channel: BroadcastChannel;
  private storageKey: string;

  constructor(channelName: string, storageKey: string) {
    this.channel = new BroadcastChannel(channelName);
    this.storageKey = storageKey;
  }

  broadcast(action: string, data: any) {
    this.channel.postMessage({ action, data });
  }

  subscribe(callback: (action: string, data: any) => void) {
    this.channel.onmessage = (event) => {
      callback(event.data.action, event.data.data);
    };
  }

  saveState(state: any) {
    localStorage.setItem(this.storageKey, JSON.stringify(state));
  }

  loadState() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : null;
  }
}

export const gameStateSync = new StateSync('baucua-game', 'baucua-state'); 