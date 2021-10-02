import * as esbuild from "esbuild-wasm";

let initialized = false;

if (!initialized) {
  esbuild
    .initialize({
      worker: true,
      wasmURL: `https://unpkg.com/esbuild-wasm@${esbuild.version}/esbuild.wasm`,
    })
    .then(() => (initialized = true));
}

export default esbuild;
