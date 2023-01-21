import {EditorState, Plugin, PluginKey, Transaction} from 'prosemirror-state';
import {Decoration, DecorationSet, EditorView} from 'prosemirror-view';
import {cellAround, pointsAtCell, setAttr} from './util';
import {ProsemirrorTable} from './prosemirror-table';
import {TableView, updateRows} from './tableview';
import {tableNodeTypes} from './schema';
import {PluginState} from './models/plugin-state';
import {Draggin} from './models/draggin';
import {Node} from 'prosemirror-model';
import {CellAttrs} from './models/cell-attrs';

export const key = new PluginKey('tableColumnResizing');

export function rowResizing({
  handleHeight = 4,
  cellMinWidth = 25,
  cellMinHeight = 10,
  View = TableView,
  lastRowResizable = true,
} = {}) {
  const plugin = new Plugin({
    key,
    state: {
      init(_, state) {
        this.spec.props.nodeViews[tableNodeTypes(state.schema).table.name] = (
          node
          // view
        ) => new View(node, cellMinWidth, cellMinHeight); //view);
        return new ResizeState(-1, null);
      },
      apply(tr, prev) {
        return prev.apply(tr);
      },
    },
    props: {
      attributes(state) {
        const pluginState: PluginState = key.getState(state);
        return pluginState.activeRowHandle > -1
          ? {class: 'resize-row-cursor'}
          : null;
      },

      handleDOMEvents: {
        mousemove(view, event) {
          handleMouseMove(
            view,
            event,
            handleHeight,
            cellMinHeight,
            lastRowResizable
          );
        },
        mouseleave(view) {
          handleMouseLeave(view);
        },
        mousedown(view, event) {
          handleMouseDown(view, event, cellMinHeight);
        },
      },

      decorations(state) {
        const pluginState: PluginState = key.getState(state);
        if (pluginState.activeRowHandle > -1) {
          return handleDecorations(state, pluginState.activeRowHandle);
        }
      },

      nodeViews: {},
    },
  });
  return plugin;
}

class ResizeState {
  constructor(private activeRowHandle: number, private dragging: Draggin) {}

  apply(tr: Transaction) {
    let state;
    const action: PluginState = tr.getMeta(key);
    if (action && action.setHandle != null)
      return new ResizeState(action.setHandle, null);
    if (action && action.setDragging !== undefined)
      return new ResizeState(this.activeRowHandle, action.setDragging);
    if (this.activeRowHandle > -1 && tr.docChanged) {
      let handle = tr.mapping.map(this.activeRowHandle, -1);
      if (!pointsAtCell(tr.doc.resolve(handle))) handle = null;
      state = new ResizeState(handle, this.dragging);
    }
    return state || this;
  }
}

function handleMouseMove(
  view: EditorView,
  event: MouseEvent,
  handleHeight: number,
  cellMinHeight: number,
  lastRowResizable: boolean
) {
  const pluginState: PluginState = key.getState(view.state);

  if (!pluginState.dragging) {
    const target = domCellAround(event.target as HTMLElement);
    let cell = -1;
    if (target) {
      // отличается код блин тут и в корне просмиррора, тут одна нода, а в edgeCells уже другая
      const {top, bottom} = target.getBoundingClientRect();
      // console.debug(event.clientY - top, bottom - event.clientY)
      if (event.clientY - top <= handleHeight) {
        cell = edgeCell(view, event, top, 'top');
      } else if (bottom - event.clientY <= handleHeight) {
        cell = edgeCell(view, event, top, 'bottom');
      }
    }

    if (cell != pluginState.activeRowHandle) {
      if (!lastRowResizable && cell !== -1) {
        const $cell = view.state.doc.resolve(cell);
        const table = $cell.node(-1),
          tableClass = ProsemirrorTable.get(table),
          start = $cell.start(-1);
        const rowNumber = tableClass.rowCount($cell.pos - start);
        if (rowNumber == tableClass.height - 1) {
          return;
        }
      }

      updateHandle(view, cell);
    }
  }
}

function handleMouseLeave(view: EditorView) {
  const pluginState: PluginState = key.getState(view.state);
  if (pluginState.activeRowHandle > -1 && !pluginState.dragging)
    updateHandle(view, -1);
}

function handleMouseDown(
  view: EditorView,
  event: MouseEvent,
  cellMinHeight: number
) {
  const pluginState: PluginState = key.getState(view.state);
  if (pluginState.activeRowHandle == -1 || pluginState.dragging) return false;

  const cell = view.state.doc.nodeAt(pluginState.activeRowHandle);
  const height = currentRowHeight(
    view,
    pluginState.activeRowHandle,
    cell.attrs as CellAttrs
  );
  view.dispatch(
    view.state.tr.setMeta(key, {
      setDragging: {startY: event.clientY, startHeight: height},
    })
  );

  function finish(event: MouseEvent) {
    window.removeEventListener('mouseup', finish);
    window.removeEventListener('mousemove', move);
    const pluginState: PluginState = key.getState(view.state);
    if (pluginState.dragging) {
      const newHeight = draggedHeight(
        pluginState.dragging,
        event,
        cellMinHeight
      );
      // console.debug('newHeight', newHeight);
      updateColumnHeight(view, pluginState.activeRowHandle, newHeight);
      view.dispatch(view.state.tr.setMeta(key, {setDragging: null}));
    }
  }

  function move(event: MouseEvent) {
    if (!event.which) return finish(event);
    const pluginState: PluginState = key.getState(view.state);
    const dragged = draggedHeight(pluginState.dragging, event, cellMinHeight);
    // console.debug('dragged', dragged);
    displayColumnHeight(
      view,
      pluginState.activeRowHandle,
      dragged,
      cellMinHeight
    );
  }

  window.addEventListener('mouseup', finish);
  window.addEventListener('mousemove', move);
  event.preventDefault();
  return true;
}

/**
 * todo скорее всего работает совсем неправильно
 */
function currentRowHeight(
  view: EditorView,
  cellPos: number,
  {colspan, rowheight}: CellAttrs
) {
  const height = rowheight && rowheight[rowheight.length - 1];
  if (height) return height;
  const dom = view.domAtPos(cellPos);
  const node = dom.node.childNodes[dom.offset];
  let domHeight = (node as HTMLElement).offsetHeight,
    parts = colspan;
  if (rowheight)
    for (let i = 0; i < colspan; i++)
      if (rowheight[i]) {
        domHeight -= rowheight[i];
        parts--;
      }
  return domHeight / parts;
}

function domCellAround(inputTarget: HTMLElement) {
  let target = inputTarget;
  while (target && target.nodeName != 'TD' && target.nodeName != 'TH')
    target = target.classList.contains('ProseMirror')
      ? null
      : (target.parentNode as HTMLElement);
  return target;
}

// function debugTextFromCell($cell) {
//   return ($cell.parent.content as any)?.content[0].content?.content[0]?.content
//     ?.content[0]?.text;
// }

/**
 * return -1 if row is last
 * @param view
 * @param event
 * @param top
 * @param side
 */
function edgeCell(view: EditorView, event, top, side: 'top' | 'bottom') {
  const found = view.posAtCoords({left: event.clientX, top: top});
  if (!found) return -1;
  const {pos} = found;
  const $cell = cellAround(view.state.doc.resolve(pos));
  if (!$cell) return -1;
  // console.log("edgeCell", side, $cell.pos, debugTextFromCell($cell));
  if (side == 'top') {
    return $cell.pos;
  }
  const table = ProsemirrorTable.get($cell.node(-1)),
    start = $cell.start(-1);
  // let index = table.map.indexOf($cell.pos - start)
  const rowNumber = table.rowCount($cell.pos - start);
  // console.log("edgeCell rowNumber", rowNumber, (rowNumber === (table.height - 1) ? rowNumber : rowNumber + 1));
  // console.log("edgeCell mapIndex", (rowNumber === (table.height - 1) ? rowNumber : rowNumber + 1));
  return (
    start +
    table.map[
      (rowNumber === table.height - 1 ? -1 : rowNumber + 1) * table.width
    ]
  );
}

function draggedHeight(
  dragging: Draggin,
  event: MouseEvent,
  cellMinHeight: number
) {
  const offset = event.clientY - dragging.startY;
  return Math.max(cellMinHeight, dragging.startHeight + offset);
}

function updateHandle(view: EditorView, value: number) {
  view.dispatch(view.state.tr.setMeta(key, {setHandle: value}));
}

function updateColumnHeight(view: EditorView, cell: number, height: number) {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    map = ProsemirrorTable.get(table),
    start = $cell.start(-1);
  const col =
    map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
  const tr = view.state.tr;
  for (let row = 0; row < map.height; row++) {
    const mapIndex = row * map.height + col;
    // Rowspanning cell that has already been handled
    if (row && map.map[mapIndex] == map.map[mapIndex - map.height]) continue;
    const pos = map.map[mapIndex],
      {attrs} = table.nodeAt(pos);
    const index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
    if (attrs.rowheight && attrs.rowheight[index] == height) continue;
    const rowheight = attrs.rowheight
      ? attrs.rowheight.slice()
      : zeroes(attrs.colspan);
    rowheight[index] = height;
    tr.setNodeMarkup(start + pos, null, setAttr(attrs, 'rowheight', rowheight));
  }
  if (tr.docChanged) view.dispatch(tr);
}

function displayColumnHeight(
  view: EditorView,
  cell: number,
  height: number,
  cellMinHeight: number
) {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    start = $cell.start(-1);
  const col =
    ProsemirrorTable.get(table).colCount($cell.pos - start) +
    $cell.nodeAfter.attrs.colspan -
    1;
  let dom = view.domAtPos($cell.start(-1)).node as Node & HTMLElement;
  while (dom.nodeName != 'TABLE') dom = dom.parentNode as Node & HTMLElement;
  updateRows(
    table,
    dom.firstChild as Node & HTMLElement,
    dom,
    cellMinHeight,
    col,
    height
  );
}

function zeroes(n: number) {
  const result = [];
  for (let i = 0; i < n; i++) result.push(0);
  return result;
}

function handleDecorations(state: EditorState, cell: number) {
  const decorations = [];
  const $cell = state.doc.resolve(cell);
  const table = $cell.node(-1),
    map = ProsemirrorTable.get(table),
    start = $cell.start(-1);
  const rowNumber = map.rowCount($cell.pos - start);
  // console.log('decorate rowNumber',rowNumber);
  // console.log('decorate $cell.pos', $cell.pos, cell);
  for (let col = 0; col < map.width; col++) {
    const index = rowNumber * map.width + col;
    // For positions that are have either a different cell or the end
    // of the table to their bottom, and either the top of the table or
    // a different cell above them, add a decoration
    if (
      (rowNumber == map.height || map.map[index] != map.map[index + 1]) &&
      (col == 0 || map.map[index - 1] != map.map[index - 1 - map.height])
    ) {
      const cellPos = map.map[index];
      const pos = start + cellPos + table.nodeAt(cellPos).nodeSize - 1;
      const dom = document.createElement('div');
      dom.className = 'row-resize-handle';
      decorations.push(Decoration.widget(pos, dom));
    }
  }
  return DecorationSet.create(state.doc, decorations);
}
