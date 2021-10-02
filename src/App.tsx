import React, { memo, useCallback, useState, VFC } from "https://cdn.esm.sh/react";
import styled from "https://cdn.esm.sh/styled-components";
import MountEditor from "./Editor";
import * as esbuild from "esbuild-wasm";
import { SourceCode } from "./SourceCode";
import tsxEditor from "./editors/tsx";
import model from "./editors/model";

import type { IKeyboardEvent } from "monaco-editor";

const source = `import React, { useState } from "https://cdn.esm.sh/react";
import styled from "https://cdn.esm.sh/styled-components";
import { Button, Typography, Space } from "https://cdn.esm.sh/antd";

import "https://unpkg.com/antd/dist/antd.css"
import "https://cdn.esm.sh/reset.css"

const Component = () => {
  const [count, setCount] = useState(0);
  return (
    <Container>
      <Typography.Title>ESBuild & Monaco-Editor</Typography.Title>
      <Space>
        <Typography.Text>count: {count}</Typography.Text>
        <Button size="small" type="primary" onClick={() => setCount(c => c + 1)}>+</Button>
        <Button size="small" onClick={() => setCount(c => c - 1)}>-</Button>
      </Space>
    </Container>
  )
}

export default Component;


const Container = styled.div\`
  width: 100%;
  height: 100%;
  background: white;
  padding: 0.5rem 1rem;
  box-sizing: border-box;
  overflow-y: scroll;
\`;
`;

model.tsx.index.setValue(source);

const App: VFC = () => {
  const [result, setResult] = useState<esbuild.TransformResult | null>(null);
  const onDidMount = useCallback(() => {
    const deps = ["antd", "@types/react", "@types/styled-components"];
    tsxEditor.deps.install(deps);
    tsxEditor.format();
  }, []);
  const build = useCallback(async () => {
    const source = model.tsx.index.getValue();
    const result = await esbuild.transform(source, {
      format: "esm",
      loader: "tsx",
      target: "esnext",
    });
    result.code = result.code.replace(
      /from ["|'](https?:\/\/[\w/:%#\\$&\\?\\(\\)~\\.=\\+\\-]+)["|'];/g,
      `from "$1?bundle"`,
    );
    result.code = result.code.replace("react?bundle", "react");

    result.code = result.code.replace(
      /import ["|'](https?:\/\/[\w/:%#\\$&\\?\\(\\)~\\.=\\+\\-]+.css)["|'];/g,
      "window.loadcss('$1');",
    );
    setResult(result);
  }, []);
  const onSave = useCallback(
    (e: IKeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      tsxEditor.format();
      build();
    },
    [build],
  );

  return (
    <Container>
      <EditZone>
        <MountEditor factory={tsxEditor.factory} onDidMount={onDidMount} onSave={onSave} />
        <Build onClick={build}>build & run</Build>
      </EditZone>
      <Console>
        <Result>{result?.code && <SourceCode source={result?.code} />}</Result>
        <Log>
          <p>{result?.code}</p>
        </Log>
      </Console>
    </Container>
  );
};

export default memo(App);

const Container = styled.div`
  height: 100%;
  width: 100%;
`;
const Console = styled.div`
  height: 30%;
  width: 100%;
  display: flex;
  border-top: solid 1px white;
  box-sizing: border-box;
  background: #222222;
`;

const Result = styled.div`
  height: 100%;
  width: 60%;
  box-sizing: border-box;
  padding: 0.5rem;
  color: white;
`;
const Log = styled.div`
  & > p {
    white-space: pre-wrap;
    overflow-y: scroll;
    height: 100%;
    line-height: 1.2;
    letter-spacing: 1.2x;
  }
  border-left: solid 1px white;
  height: 100%;
  width: 40%;
  box-sizing: border-box;
  color: white;
  padding: 0.5rem;
`;

const EditZone = styled.div`
  height: 70%;
  width: 100%;
  position: relative;
`;
const Build = styled.button`
  outline: none;
  border: none;
  background: white;
  width: 124px;
  height: 32px;
  position: absolute;
  bottom: 24px;
  right: 24px;
  cursor: pointer;
`;
