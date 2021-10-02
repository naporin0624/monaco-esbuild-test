export default new Promise<void>((resolve) => {
  const id = setInterval(() => {
    if (window.Monaco === undefined) return;

    clearInterval(id);
    resolve();
  }, 10);
});
