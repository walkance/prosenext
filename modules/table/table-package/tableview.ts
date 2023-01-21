import {Node} from 'prosemirror-model';

export class TableView {
  dom = document.createElement('div');
  table: HTMLTableElement;
  colgroup: HTMLElement;
  contentDOM: HTMLElement;
  constructor(
    private node,
    private cellMinWidth: number,
    private cellMinHeight: number
  ) {
    this.dom.className = 'tableWrapper';
    this.table = this.dom.appendChild(document.createElement('table'));
    this.colgroup = this.table.appendChild(document.createElement('colgroup'));
    updateColumns(
      node,
      this.colgroup as Node & HTMLElement,
      this.table,
      cellMinWidth
    );
    this.contentDOM = this.table.appendChild(document.createElement('tbody'));
  }

  /** called at undo/redo and other external changes */
  update(node) {
    if (node.type != this.node.type) return false;
    this.node = node;
    updateColumns(
      node,
      this.colgroup as Node & HTMLElement,
      this.table,
      this.cellMinWidth
    );
    updateRows(
      node,
      this.colgroup as Node & HTMLElement,
      this.table,
      this.cellMinHeight
    );
    return true;
  }

  ignoreMutation(record) {
    return (
      record.type == 'attributes' &&
      (record.target == this.table || this.colgroup.contains(record.target))
    );
  }
}

export function updateColumns(
  node: Node,
  colgroup: Node & HTMLElement,
  table,
  cellMinWidth,
  overrideCol?,
  overrideValue?
) {
  let totalWidth = 0,
    fixedWidth = true;
  let nextDOM = colgroup.firstChild as Node & HTMLElement;
  const row = (node as any).firstChild as Node;
  for (let i = 0, col = 0; i < row.childCount; i++) {
    const {colspan, colwidth} = row.child(i).attrs;
    for (let j = 0; j < colspan; j++, col++) {
      const hasWidth =
        overrideCol == col ? overrideValue : colwidth && colwidth[j];
      const cssWidth = hasWidth ? hasWidth + 'px' : '';
      totalWidth += hasWidth || cellMinWidth;
      if (!hasWidth) fixedWidth = false;
      if (!nextDOM) {
        colgroup.appendChild(document.createElement('col')).style.width =
          cssWidth;
      } else {
        if (nextDOM.style.width != cssWidth) nextDOM.style.width = cssWidth;
        nextDOM = nextDOM.nextSibling as Node & HTMLElement;
      }
    }
  }

  while (nextDOM) {
    const after = nextDOM.nextSibling as Node & HTMLElement;
    nextDOM.parentNode.removeChild(nextDOM);
    nextDOM = after;
  }

  if (fixedWidth) {
    table.style.width = totalWidth + 'px';
    table.style.minWidth = '';
  } else {
    table.style.width = '';
    table.style.minWidth = totalWidth + 'px';
  }
}

export function updateRows(
  node: Node,
  colgroup: Node & HTMLElement,
  table,
  rowMinHeight,
  overrideCol?,
  overrideValue?
) {
  // console.debug('updateRows')
  let totalHeight = 0,
    fixedHeight = true;
  let nextDOM = colgroup.firstChild as Node & HTMLElement;
  const row = (node as any).firstChild as Node;
  for (let i = 0, col = 0; i < row.childCount; i++) {
    const {colspan, rowheight} = row.child(i).attrs;
    for (let j = 0; j < colspan; j++, col++) {
      const hasHeight =
        overrideCol == col ? overrideValue : rowheight && rowheight[j];
      const cssHeight = hasHeight ? hasHeight + 'px' : '';
      totalHeight += hasHeight || rowMinHeight;
      if (!hasHeight) fixedHeight = false;
      if (!nextDOM) {
        colgroup.appendChild(document.createElement('col')).style.height =
          cssHeight;
      } else {
        if (nextDOM.style.height != cssHeight) nextDOM.style.height = cssHeight;
        nextDOM = nextDOM.nextSibling as Node & HTMLElement;
      }
    }
  }

  while (nextDOM) {
    const after = nextDOM.nextSibling as Node & HTMLElement;
    nextDOM.parentNode.removeChild(nextDOM);
    nextDOM = after;
  }

  if (fixedHeight) {
    table.style.height = totalHeight + 'px';
    table.style.minHeight = '';
  } else {
    table.style.height = '';
    table.style.minHeight = totalHeight + 'px';
  }
}
