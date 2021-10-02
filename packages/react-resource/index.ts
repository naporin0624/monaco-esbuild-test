import stringify from "fast-json-stable-stringify";
import { ReactResource } from "./react-resource";

export type Resource<Params extends Array<unknown>, T> = {
  read(...params: Params): T;
  reset(): void;
};

export function createResource<Params extends Array<unknown>, T>(
  args: (...params: Params) => Promise<T>,
): Resource<Params, T> {
  // eslint-disable-next-line @typescript-eslint/ban-types
  const cacheMap = new Map<"default" | (string & {}), ReactResource<T, Params>>();

  return {
    read(...params: Params) {
      const key = stringify(params);
      const cache = cacheMap.get(key);

      if (!cache) {
        const resource = new ReactResource(args);
        cacheMap.set(key, resource);
        resource.resolve(...params);
        return resource.getData();
      }

      return cache.getData();
    },
    reset() {
      cacheMap.clear();
    },
  };
}
