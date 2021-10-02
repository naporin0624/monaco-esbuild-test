export const concurrent = async <T>(promises: (() => Promise<T>)[], concurrency = 3): Promise<T[]> => {
  const results: T[] = [];
  let currentIndex = 0;
  let chunks: (() => Promise<T>)[] = [];

  do {
    chunks = promises.slice(currentIndex, currentIndex + concurrency);
    Array.prototype.push.apply(results, await Promise.all(chunks.map((c) => c())));
    currentIndex += concurrency;
  } while (chunks.length > 0);
  return results;
};
