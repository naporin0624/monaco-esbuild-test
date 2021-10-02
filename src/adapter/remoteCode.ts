window.remoteCodeFactory = async (callback) => {
  const styled = await import("styled-components");
  const React = await import("react");
  const deps = {
    React,
    styled: styled.default,
  };

  const context = {};
  const remoteCode = callback(deps, context);
  await remoteCode.setup();

  return remoteCode.component;
};
