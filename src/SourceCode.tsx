import React, { memo, Suspense, useMemo, VFC } from "https://cdn.esm.sh/react";
import { ErrorBoundary, FallbackProps } from "https://cdn.esm.sh/react-error-boundary";
import { createResource } from "react-resource";

type Props<T extends string> = {
  source: T;
};

type PickProps<T extends string> = T extends string & infer U
  ? U extends Record<string, unknown>
    ? U
    : Record<string, unknown>
  : Record<string, unknown>;

const resource = createResource(async (source: string) => {
  const blob = new Blob([source], { type: "text/javascript" });
  const src = URL.createObjectURL(blob);
  const Component: Promise<VFC> = await import(src).then((r) => r.default);
  return Component;
});

export const SourceCode = <T extends string>(props: Props<T> & PickProps<T>) => {
  return (
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <Suspense fallback={"loading"}>
        <Executer {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

export default memo(SourceCode);

const Executer = <T extends string>({ source, ...props }: Props<T> & PickProps<T>) => {
  const Component = useMemo(() => resource.read(source), [source]);

  return <Component {...props} />;
};

const FallbackComponent: VFC<FallbackProps> = ({ resetErrorBoundary }) => {
  const reset = () => {
    resetErrorBoundary();
    resource.reset();
  };

  return <button onClick={reset}>reset</button>;
};
