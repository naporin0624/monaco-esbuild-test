import React, { lazy, Suspense } from "https://cdn.esm.sh/react";
import ReactDOM from "https://cdn.esm.sh/react-dom";
import "reset-css";
import "./adapter/remoteCode";
import "./adapter/esbuild";

await import("./adapter/monaco").then((r) => r.default);

const App = lazy(() => import("./App"));
ReactDOM.render(
  <React.StrictMode>
    <Suspense fallback={null}>
      <App />
    </Suspense>
  </React.StrictMode>,
  document.getElementById("root"),
);

if (import.meta.hot) {
  import.meta.hot.decline();
}
