import { Subscription } from "rxjs";
import axios from "axios";
import axiosRetry from "axios-retry";
import { concurrent } from "~/utils/promise";

import type { languages } from "monaco-editor";

axiosRetry(axios, { retries: 3 });

type ModuleFile = {
  path: string;
  type: "file";
  contentType: string;
  integrity: string;
  lastModified: string;
  size: number;
};

type ModuleMeta = {
  path: string;
  type: "directory";
  files: (ModuleMeta | ModuleFile)[];
};

type PackageJSON = {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  types: string;
  typings: string;
};

/**
 * @package
 */

export class Installer {
  private packageMap: Map<string, Subscription> = new Map();
  private blackList = [];
  private extensions = [".ts", ".tsx"];

  constructor(private defaults: Pick<languages.typescript.LanguageServiceDefaults, "addExtraLib">) {}

  async install(packageName: string, version = "*"): Promise<void> {
    const target = `${packageName}@${version}`;
    const cache = localStorage.getItem(`monaco.installer.${target}`);

    if (this.packageMap.has(packageName)) return;

    if (cache) {
      const list: [path: string, content: string][] = JSON.parse(cache);
      this.apply(list);
      const packageJSON = JSON.parse(list.find(([path]) => path.endsWith("package.json"))?.[1] ?? "{}");
      await concurrent(
        this.dependencies(packageJSON).map(([name, version]) => {
          return () => this.install(name, version);
        }),
      );
      return;
    }

    const meta = await axios.get<ModuleMeta>(`https://unpkg.com/${target}/?meta`).then((res) => res.data);
    const packageJSONContent = await this.fetchFileContent(packageName, { path: "/package.json" });
    const packageJSON: PackageJSON = JSON.parse(packageJSONContent[1]);

    const typing = packageJSON.typings ?? packageJSON.types ?? "";
    const typingDirectory = typing.split("/").slice(0, -1).join("/");

    const files = this.pickLibFiles(meta.files).filter((file) => contain(typingDirectory, file.path));
    const fileContentResolver = files.map((file) => () => this.fetchFileContent(packageName, file));
    const fileContents = await concurrent(fileContentResolver, 20);
    const list: [path: string, content: string][] =
      fileContents.length > 0 ? [...fileContents, packageJSONContent] : [];
    localStorage.setItem(`monaco.installer.${target}`, JSON.stringify(list));

    const depsResolver = this.dependencies(packageJSON).map(([name, version]) => {
      return () => this.install(name, version);
    });
    await concurrent(depsResolver);

    this.packageMap.set(packageName, this.apply(list));
  }

  uninstall(packageName: string) {
    const subscription = this.packageMap.get(packageName);
    if (subscription === undefined) throw new Error(`${packageName} is not install`);

    subscription.unsubscribe();
    this.packageMap.delete(packageName);
  }

  private apply(deps: [path: string, content: string][]): Subscription {
    const subscription = new Subscription();
    deps.forEach(([fileName, content]) => {
      const disposable = this.defaults.addExtraLib(content, fileName);
      subscription.add(() => disposable.dispose());
    });
    return subscription;
  }

  private pickLibFiles(files: ModuleMeta["files"]): ModuleFile[] {
    const list: ModuleFile[] = [];
    files.forEach((file) => {
      switch (file.type) {
        case "directory": {
          list.push(...this.pickLibFiles(file.files));
          break;
        }
        case "file": {
          const extMatched = this.extensions.some((ext) => file.path.endsWith(ext));
          const inBlacklist = this.blackList.some((subStr) => file.path.includes(subStr));
          if (extMatched && !inBlacklist) list.push(file);
          break;
        }
      }
    });

    return list;
  }

  private async fetchFileContent(
    packageName: string,
    { path }: Pick<ModuleFile, "path">,
  ): Promise<[path: string, content: string]> {
    const { data } = await axios.get<string | Record<string, unknown>>(`https://unpkg.com/${packageName}${path}`);

    return [`file:///node_modules/${packageName}${path}`, typeof data === "string" ? data : JSON.stringify(data)];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dependencies(packageJSON: any) {
    const deps: [name: string, version: string][] = Object.entries(packageJSON?.dependencies ?? {});
    const dependencies: [name: string, version: string][] = deps.map(([name, version]) => {
      const typing = packageJSON?.devDependencies?.[`@types/${name}`];
      return typing ? [name, typing] : [name, version];
    });
    return dependencies;
  }
}

const contain = (parent: string, child: string): boolean => {
  const p = `/${parent}/`.replace("./", "/").replace("//", "/");
  const c = `/${child}/`.replace("./", "/").replace("//", "/");

  return c.startsWith(p);
};
