declare module "phoenix" {
  // Minimal typings for Phoenix JS client used in this project.
  // The package doesn't ship TS types in our setup.
  export class Socket {
    constructor(endPoint: string, opts?: any);
    connect(): void;
    channel(topic: string, params?: any): Channel;
  }

  export class Channel {
    join(): { receive: (status: string, cb: (resp?: any) => void) => any };
    leave(): any;
    on(event: string, cb: (payload: any) => void): any;
    off(event: string, cb?: (payload: any) => void): any;
    push(event: string, payload: any): any;
  }
}

