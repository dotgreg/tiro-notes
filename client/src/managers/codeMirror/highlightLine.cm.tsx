
export const highlightCurrentLine = (view) => {
    const { state } = view;
    const selection = state.selection.main;
    const line = state.doc.lineAt(selection.head);
    let lineNo = line.number;

    const currLine = view.state.doc.line(lineNo)

    const start = currLine.from
    const end = currLine.to

    view.dispatch({
        selection: {
          anchor: start,
          head: end,
        },
    });
    // console.log('line', line, selection);
  return true;
}

