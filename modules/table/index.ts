import './table.css';
import tableIcon from '@fortawesome/fontawesome-free/svgs/solid/table.svg';
import addColumnBeforeIcon from '@fortawesome/fontawesome-free/svgs/solid/table-columns.svg';
import cellsIcon from '@fortawesome/fontawesome-free/svgs/solid/table-cells.svg';
import cellsLargeIcon from '@fortawesome/fontawesome-free/svgs/solid/table-cells-large.svg';
import addIcon from '@fortawesome/fontawesome-free/svgs/solid/plus.svg';
import trashIcon from '@fortawesome/fontawesome-free/svgs/solid/trash.svg';

import {DOMParser, NodeSpec, Schema} from 'prosemirror-model';
import {Dropdown} from 'prosemirror-menu';

import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  columnResizing,
  deleteColumn,
  deleteRow,
  deleteTable,
  fixTables,
  goToNextCell,
  isInTable,
  mergeCells,
  splitCell,
  tableEditing,
  tableNodes,
} from './table-package';
import {keymap} from 'prosemirror-keymap';
import {rowResizing} from './table-package/row-resizing';
import {item} from '../basic/menu';
import {ProseNextPlugin} from '../core/plugin.interface';
import {EditorState} from 'prosemirror-state';
import {createElement} from '../utils/create-element';

const template = `
  <table>
    <tr>
      <th colspan=3 data-colwidth="100,0,0">Wide header</th>
    </tr>
    <tr>
      <td>One</td>
      <td >Two Two</td>
      <td >Three</td>
    </tr>
    <tr>
      <td>Four</td>
      <td>Five</td>
      <td>Six</td>
    </tr>
  </table>
`;

function generateCreateTable(schema) {
  return function createTable(state, dispatch) {
    if (isInTable(state)) return false;
    if (dispatch) {
      const tr = state.tr.insert(
        0,
        DOMParser.fromSchema(schema).parse(createElement(template)).content
      );
      // console.log(state.tr)
      dispatch(tr);
    }
    return true;
  };
}

function genTableMenu(schema: Schema) {
  const tableMenu = [
    item('Insert column before', addColumnBefore, addColumnBeforeIcon),
    item('Insert column after', addColumnAfter, addColumnBeforeIcon),
    item('Delete column', deleteColumn, addColumnBeforeIcon),
    item('Insert row before', addRowBefore, addIcon),
    item('Insert row after', addRowAfter, addIcon),
    item('Delete row', deleteRow, trashIcon),
    item('Delete table', deleteTable, trashIcon),
    item('Merge cells', mergeCells, cellsLargeIcon),
    item('Split cell', splitCell, cellsIcon),
    item('Create table', generateCreateTable(schema), tableIcon),
    // item('Toggle header column', toggleHeaderColumn),
    // item('Toggle header row', toggleHeaderRow),
    // item('Toggle header cells', toggleHeaderCell),
    // item('Make cell green', setCellAttr('background', '#dfd')),
    // item('Make cell not-green', setCellAttr('background', null))
  ];
  return tableMenu;
}

function initTableState(state) {
  const fix = fixTables(state);
  if (fix) {
    state = state.apply(fix.setMeta('addToHistory', false));
  }
  return state;
}

function generateTableDropdown(schema) {
  return [new Dropdown(genTableMenu(schema), {label: 'Table'})];
}

export class TablePlugin implements ProseNextPlugin {
  getPlugins() {
    return [
      columnResizing(),
      rowResizing(),
      tableEditing(),
      keymap({
        Tab: goToNextCell(1),
        'Shift-Tab': goToNextCell(-1),
      }),
    ];
  }

  afterStateInit(state: EditorState) {
    return initTableState(state);
  }

  getNodes(): Record<string, NodeSpec> {
    return tableNodes({
      tableGroup: 'block',
      cellContent: 'block+',
      cellAttributes: {
        background: {
          default: null,
          getFromDOM(dom: any) {
            return dom.style.backgroundColor || null;
          },
          setDOMAttr(value, attrs) {
            if (value) {
              attrs.style = (attrs.style || '') + `background-color: ${value};`;
            }
          },
        },
      },
    }) as any;
  }

  getMarks() {
    return {};
  }

  getNodeViews() {
    return {};
  }

  getContextMenu(schema: Schema): any[] {
    return genTableMenu(schema);
  }
}
