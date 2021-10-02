import { installer } from "~/utils/monaco";
import model from "./model";
import type { editor } from "monaco-editor";

let dependencies: string[] = [];
let instance: editor.IStandaloneCodeEditor | null = null;
Monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  jsx: Monaco.languages.typescript.JsxEmit.Preserve,
  target: Monaco.languages.typescript.ScriptTarget.ESNext,
  module: Monaco.languages.typescript.ModuleKind.ESNext,
  baseUrl: ".",
  paths: { "*": ["types/*"], "https://cdn.esm.sh/*": ["file:///node_modules/*", "file:///node_modules/@types/*"] },
  strict: true,
  moduleResolution: Monaco.languages.typescript.ModuleResolutionKind.NodeJs,
  allowSyntheticDefaultImports: true,
});

const setModel = (model: editor.ITextModel) => {
  instance?.setModel(model);
};

const factory = (el: HTMLElement) => {
  instance = Monaco.editor.create(el, {
    theme: "vs-dark",
    automaticLayout: true,
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
    model: model.tsx.index,
  });

  return instance;
};

const tsxEditor = {
  factory,
  setModel,
  format: () => {
    instance?.getAction("editor.action.formatDocument").run();
  },
  deps: {
    list: dependencies,
    install: (targets: string[]) => {
      dependencies.push(...targets);
      return Promise.all(targets.map((target) => installer.install(target)));
    },
    uninstall: (targets: string[]) => {
      dependencies = dependencies.filter((d) => !targets.includes(d));
      return targets.map((target) => installer.uninstall(target));
    },
  },
};

export default tsxEditor;
