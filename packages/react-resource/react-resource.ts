import type { Status } from "./types";

/**
 * @package
 */
export class ReactResource<T, Args extends Array<unknown>> {
  public status!: Status<T>;
  private fetcher: (...args: Args) => Promise<T>;

  private awaiter!: Promise<void>;
  private resolver!: () => void;
  private rejector!: () => void;

  constructor(args: (...args: Args) => Promise<T>) {
    this.init();
    this.fetcher = args;
  }

  reset() {
    this.init();
  }

  resolve(...args: Args) {
    if (this.status.type !== "wait") return;

    const promise = this.fetcher(...args);
    this.dispatch({ type: "pending", payload: promise });
    promise
      .then((data) => {
        this.dispatch({ type: "success", payload: data });
        this.resolver();
      })
      .catch((error) => {
        this.dispatch({ type: "error", payload: error });
        this.rejector();
      });
  }

  getData(): T {
    switch (this.status.type) {
      case "wait":
        throw this.awaiter;
      case "pending":
        throw this.status.payload;
      case "success":
        return this.status.payload;
      case "error":
        throw this.status.payload;
    }
  }

  private init() {
    this.awaiter = new Promise<void>((resolve, reject) => {
      this.resolver = resolve;
      this.rejector = reject;
    });
    this.dispatch({ type: "wait", payload: this.awaiter });
  }

  private dispatch(next: Status<T>) {
    this.status = next;
  }
}
