/**
 * @package
 */
export type Status<T> =
  | {
      type: "pending";
      payload: Promise<T>;
    }
  | {
      type: "success";
      payload: T;
    }
  | {
      type: "error";
      payload: Error;
    }
  | {
      type: "wait";
      payload: Promise<void>;
    };
