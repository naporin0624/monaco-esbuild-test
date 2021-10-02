import { Installer } from "./installer";
import type { languages } from "monaco-editor";

const languageDefault: Pick<languages.typescript.LanguageServiceDefaults, "addExtraLib"> = {
  addExtraLib(content, filePath) {
    return window?.Monaco?.languages.typescript.typescriptDefaults.addExtraLib(content, filePath);
  },
};

export const installer = new Installer(languageDefault);
