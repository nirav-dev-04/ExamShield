type StompCallback = (message: { body: string }) => void;

class StompSubscription {
  id: string;
  destination: string;
  private client: MockStompClient;

  constructor(id: string, destination: string, client: MockStompClient) {
    this.id = id;
    this.destination = destination;
    this.client = client;
  }

  unsubscribe() {
    this.client.unsubscribe(this.destination, this.id);
  }
}

export class MockStompClient {
  private subscriptions: { [destination: string]: { [id: string]: StompCallback } } = {};
  private subCounter = 0;
  public connected = false;
  public onConnect?: () => void;
  public onDisconnect?: () => void;

  activate() {
    setTimeout(() => {
      this.connected = true;
      if (this.onConnect) {
        this.onConnect();
      }
    }, 150);
  }

  deactivate() {
    this.connected = false;
    if (this.onDisconnect) {
      this.onDisconnect();
    }
  }

  subscribe(destination: string, callback: StompCallback): StompSubscription {
    this.subCounter++;
    const id = `sub_${this.subCounter}`;
    if (!this.subscriptions[destination]) {
      this.subscriptions[destination] = {};
    }
    this.subscriptions[destination][id] = callback;
    return new StompSubscription(id, destination, this);
  }

  unsubscribe(destination: string, id: string) {
    if (this.subscriptions[destination]) {
      delete this.subscriptions[destination][id];
    }
  }

  publish({ destination, body }: { destination: string; body: string }) {
    if (this.subscriptions[destination]) {
      Object.values(this.subscriptions[destination]).forEach((cb) => {
        cb({ body });
      });
    }
  }
}

// Global shared mock STOMP client to cross-wire API and component updates in real time
export const mockStompInstance = new MockStompClient();
