const model = {
  tsx: {
    index: Monaco.editor.createModel("", "typescript", Monaco.Uri.from({ path: "/index.tsx", scheme: "file" })),
    types: {
      index: Monaco.editor.createModel(
        "",
        "typescript",
        Monaco.Uri.from({ path: "/types/index.d.ts", scheme: "file" }),
      ),
    },
  },
};

export default model;
