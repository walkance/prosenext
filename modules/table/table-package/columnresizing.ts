import {EditorState, Plugin, PluginKey, Transaction} from 'prosemirror-state';
import {Decoration, DecorationSet, EditorView} from 'prosemirror-view';
import {cellAround, pointsAtCell, setAttr} from './util';
import {ProsemirrorTable} from './prosemirror-table';
import {TableView, updateColumns} from './tableview';
import {tableNodeTypes} from './schema';
import {PluginState} from './models/plugin-state';
import {Draggin} from './models/draggin';
import {Node} from 'prosemirror-model';
import {CellAttrs} from './models/cell-attrs';

export const key = new PluginKey('tableColumnResizing');

export function columnResizing({
  handleWidth = 5,
  cellMinWidth = 25,
  cellMinHeight = 10,
  View = TableView,
  lastColumnResizable = true,
} = {}) {
  const plugin = new Plugin({
    key,
    state: {
      init(_, state) {
        this.spec.props.nodeViews[tableNodeTypes(state.schema).table.name] = (
          node
          // view
        ) => new View(node, cellMinWidth, cellMinHeight); //, view);
        return new ResizeState(-1, null);
      },
      apply(tr, prev) {
        return prev.apply(tr);
      },
    },
    props: {
      attributes(state) {
        const pluginState = key.getState(state);
        return pluginState.activeHandle > -1
          ? {class: 'resize-column-cursor'}
          : null;
      },

      handleDOMEvents: {
        mousemove(view, event) {
          handleMouseMove(
            view,
            event,
            handleWidth,
            cellMinWidth,
            lastColumnResizable
          );
        },
        mouseleave(view) {
          handleMouseLeave(view);
        },
        mousedown(view, event) {
          handleMouseDown(view, event, cellMinWidth);
        },
      },

      decorations(state) {
        const pluginState: PluginState = key.getState(state);
        if (pluginState.activeHandle > -1) {
          return handleDecorations(state, pluginState.activeHandle);
        }
      },

      nodeViews: {},
    },
  });
  return plugin;
}

class ResizeState {
  constructor(private activeHandle: number, private dragging: Draggin) {}

  apply(tr: Transaction) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let state: ResizeState = this;
    const action: PluginState = tr.getMeta(key);
    if (action && action.setHandle != null)
      return new ResizeState(action.setHandle, null);
    if (action && action.setDragging !== undefined)
      return new ResizeState(state.activeHandle, action.setDragging);
    if (state.activeHandle > -1 && tr.docChanged) {
      let handle = tr.mapping.map(state.activeHandle, -1);
      if (!pointsAtCell(tr.doc.resolve(handle))) handle = null;
      state = new ResizeState(handle, state.dragging);
    }
    return state;
  }
}

function handleMouseMove(
  view: EditorView,
  event: MouseEvent,
  handleWidth: number,
  cellMinWidth: number,
  lastColumnResizable: boolean
) {
  const pluginState: PluginState = key.getState(view.state);

  if (!pluginState.dragging) {
    const target = domCellAround(event.target as HTMLElement);
    let cell = -1;
    if (target) {
      const {left, right} = target.getBoundingClientRect();
      if (event.clientX - left <= handleWidth)
        cell = edgeCell(view, event, 'left');
      else if (right - event.clientX <= handleWidth)
        cell = edgeCell(view, event, 'right');
    }

    if (cell != pluginState.activeHandle) {
      if (!lastColumnResizable && cell !== -1) {
        const $cell = view.state.doc.resolve(cell);
        const table = $cell.node(-1),
          map = ProsemirrorTable.get(table),
          start = $cell.start(-1);
        const col =
          map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;

        if (col == map.width - 1) {
          return;
        }
      }

      updateHandle(view, cell);
    }
  }
}

function handleMouseLeave(view: EditorView) {
  const pluginState: PluginState = key.getState(view.state);
  if (pluginState.activeHandle > -1 && !pluginState.dragging)
    updateHandle(view, -1);
}

function handleMouseDown(
  view: EditorView,
  event: MouseEvent,
  cellMinWidth: number
) {
  const pluginState: PluginState = key.getState(view.state);
  if (pluginState.activeHandle == -1 || pluginState.dragging) return false;

  const cell = view.state.doc.nodeAt(pluginState.activeHandle);
  const width = currentColWidth(
    view,
    pluginState.activeHandle,
    cell.attrs as CellAttrs
  );
  view.dispatch(
    view.state.tr.setMeta(key, {
      setDragging: {startX: event.clientX, startWidth: width},
    })
  );

  function finish(event) {
    window.removeEventListener('mouseup', finish);
    window.removeEventListener('mousemove', move);
    const pluginState: PluginState = key.getState(view.state);
    if (pluginState.dragging) {
      updateColumnWidth(
        view,
        pluginState.activeHandle,
        draggedWidth(pluginState.dragging, event, cellMinWidth)
      );
      view.dispatch(view.state.tr.setMeta(key, {setDragging: null}));
    }
  }

  function move(event: MouseEvent) {
    if (!event.which) return finish(event);
    const pluginState: PluginState = key.getState(view.state);
    const dragged = draggedWidth(pluginState.dragging, event, cellMinWidth);
    displayColumnWidth(view, pluginState.activeHandle, dragged, cellMinWidth);
  }

  window.addEventListener('mouseup', finish);
  window.addEventListener('mousemove', move);
  event.preventDefault();
  return true;
}

function currentColWidth(
  view: EditorView,
  cellPos: number,
  {colspan, colwidth}: CellAttrs
) {
  const width = colwidth && colwidth[colwidth.length - 1];
  if (width) return width;
  const dom = view.domAtPos(cellPos);
  const node = dom.node.childNodes[dom.offset];
  let domWidth = (node as any).offsetWidth,
    parts = colspan;
  if (colwidth)
    for (let i = 0; i < colspan; i++)
      if (colwidth[i]) {
        domWidth -= colwidth[i];
        parts--;
      }
  return domWidth / parts;
}

function domCellAround(inputTarget: HTMLElement) {
  let target = inputTarget;
  while (target && target.nodeName != 'TD' && target.nodeName != 'TH')
    target = target.classList.contains('ProseMirror')
      ? null
      : (target.parentNode as HTMLElement);
  return target;
}

function edgeCell(view, event, side) {
  const found = view.posAtCoords({left: event.clientX, top: event.clientY});
  if (!found) return -1;
  const {pos} = found;
  const $cell = cellAround(view.state.doc.resolve(pos));
  if (!$cell) return -1;
  if (side == 'right') return $cell.pos;
  const map = ProsemirrorTable.get($cell.node(-1)),
    start = $cell.start(-1);
  const index = map.map.indexOf($cell.pos - start);
  // если первая ячейка, то -1, иначе получаем позицию предыдущего столбца
  return index % map.width == 0 ? -1 : start + map.map[index - 1];
}

function draggedWidth(
  dragging: Draggin,
  event: MouseEvent,
  cellMinWidth: number
) {
  const offset = event.clientX - dragging.startX;
  return Math.max(cellMinWidth, dragging.startWidth + offset);
}

function updateHandle(view: EditorView, value: number) {
  view.dispatch(view.state.tr.setMeta(key, {setHandle: value}));
}

function updateColumnWidth(view: EditorView, cell: number, width: number) {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    map = ProsemirrorTable.get(table),
    start = $cell.start(-1);
  const col =
    map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan - 1;
  const tr = view.state.tr;
  for (let row = 0; row < map.height; row++) {
    const mapIndex = row * map.width + col;
    // Rowspanning cell that has already been handled
    if (row && map.map[mapIndex] == map.map[mapIndex - map.width]) continue;
    const pos = map.map[mapIndex],
      {attrs} = table.nodeAt(pos);
    const index = attrs.colspan == 1 ? 0 : col - map.colCount(pos);
    if (attrs.colwidth && attrs.colwidth[index] == width) continue;
    const colwidth = attrs.colwidth
      ? attrs.colwidth.slice()
      : zeroes(attrs.colspan);
    colwidth[index] = width;
    tr.setNodeMarkup(start + pos, null, setAttr(attrs, 'colwidth', colwidth));
  }
  if (tr.docChanged) view.dispatch(tr);
}

function displayColumnWidth(
  view: EditorView,
  cell: number,
  width: number,
  cellMinWidth: number
) {
  const $cell = view.state.doc.resolve(cell);
  const table = $cell.node(-1),
    start = $cell.start(-1);
  const col =
    ProsemirrorTable.get(table).colCount($cell.pos - start) +
    $cell.nodeAfter.attrs.colspan -
    1;
  let dom = view.domAtPos($cell.start(-1)).node;
  while (dom.nodeName != 'TABLE') dom = dom.parentNode;
  updateColumns(
    table,
    dom.firstChild as Node & HTMLElement,
    dom,
    cellMinWidth,
    col,
    width
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
  const col = map.colCount($cell.pos - start) + $cell.nodeAfter.attrs.colspan;
  for (let row = 0; row < map.height; row++) {
    const index = col + row * map.width - 1;
    // For positions that are have either a different cell or the end
    // of the table to their right, and either the top of the table or
    // a different cell above them, add a decoration
    if (
      (col == map.width || map.map[index] != map.map[index + 1]) &&
      (row == 0 || map.map[index - 1] != map.map[index - 1 - map.width])
    ) {
      const cellPos = map.map[index];
      const pos = start + cellPos + table.nodeAt(cellPos).nodeSize - 1;
      const dom = document.createElement('div');
      dom.className = 'column-resize-handle';
      decorations.push(Decoration.widget(pos, dom));
    }
  }
  return DecorationSet.create(state.doc, decorations);
}
