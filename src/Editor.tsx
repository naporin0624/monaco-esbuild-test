import React, { memo, useEffect, useRef, VFC } from "https://cdn.esm.sh/react";
import styled from "https://cdn.esm.sh/styled-components";

import type { editor, IKeyboardEvent } from "monaco-editor";

type Props = {
  factory: (el: HTMLElement) => editor.IStandaloneCodeEditor;
  onDidMount?: () => void;
  className?: string;
  onSave?: (event: IKeyboardEvent) => void;
};

const frame = (callback: (context: { dispose: () => void }) => void) => {
  let next = true;
  const context = {
    dispose() {
      next = false;
    },
  };

  const frame = () => {
    callback(context);
    if (next) requestAnimationFrame(frame);
  };
  frame();

  return context;
};

export const MountEditor: VFC<Props> = ({ factory, className, onDidMount, onSave }) => {
  const mount = useRef<HTMLDivElement>(null);
  const instance = useRef<editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!mount.current) return;

    const editor = factory(mount.current);
    instance.current = editor;
    const handler = () => editor.layout();

    window.addEventListener("resize", handler, false);

    const disposable = frame(({ dispose }) => {
      const el = mount.current?.querySelector(".monaco-editor");
      if (!el) return;
      onDidMount?.();
      dispose();
    });

    return () => {
      editor.dispose();
      window.removeEventListener("resize", handler);
      disposable.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory]);

  useEffect(() => {
    const editor = instance.current;
    if (!editor) return;

    const disposable = editor.onKeyDown((e) => {
      if (!e.ctrlKey || e.code !== "KeyS") return;
      onSave?.(e);
    });
    return () => {
      disposable.dispose();
    };
  }, [onSave]);

  return <EditorMountTarget ref={mount} className={className} />;
};

export default memo(MountEditor);

const EditorMountTarget = styled.div`
  height: 100%;
  width: 100%;
  overflow-y: hidden;
`;
