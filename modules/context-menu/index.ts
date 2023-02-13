import './context-menu.css';

import {MenuItem} from 'prosemirror-menu';
import {EditorView} from 'prosemirror-view';
import {ProseNextPlugin} from '../core/plugin.interface';
import {ProseNext} from '../core';
import {createElement} from '../utils';
import {Dropdown} from './dropdown/dropdown';

const template = `
<div class="dropdown-menu">
<div class="default-dropdown-container-inner">

</div>
</div>
`;

const rowFactory = ({text, customIcon, onClick}) => {
  const iconElem = customIcon ? customIcon.path : '';
  const elem = createElement(`<div class="dropdown-row">
            <div class="dropdown-row__dropdown-text">${iconElem}${text}</div></div>`);
  if (onClick) {
    elem.addEventListener('click', onClick);
  }
  return elem;
};

/** Plugin for context menu */
class ContextMenu {
  public elem;
  dropdown: Dropdown;
  trigger: HTMLElement;
  private listener = event => {
    if (!this.elem.contains(event.target)) {
      this.visible(false);
    }
  };

  constructor(private menu: MenuItem[], private editor: EditorView) {
    this.dropdown = new Dropdown({
      fixedDropdownContentWidth: 180,
    });
    this.elem = createElement(template);
    this.trigger = document.createElement('div');
    this.dropdown.elem.style.position = 'absolute';
    document.body.appendChild(this.dropdown.elem);
    this.dropdown.setSlotContent('dropdown__content', this.elem);
    this.dropdown.setSlotContent('dropdown__trigger', this.trigger);
    this.visible(false);
    editor.dom.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      this.visible(true, {
        top: e.clientY,
        left: e.clientX,
      });
    });
  }

  applyMenu(menu: MenuItem[], editor: EditorView) {
    this.elem.querySelector('.default-dropdown-container-inner').innerHTML = '';
    menu
      .filter(elem => elem.spec.run(editor.state, null, editor, event))
      .forEach(elem => {
        // console.log(this.elem)
        this.elem
          .querySelector('.default-dropdown-container-inner')
          .appendChild(
            rowFactory({
              customIcon: (elem.spec as any).customIcon,
              text: elem.spec.label,
              onClick: event => {
                elem.spec.run(editor.state, editor.dispatch, editor, event);
                this.visible(false);
              },
            })
          );
      });
  }

  visible(state: boolean, position?: {left: number; top: number}) {
    if (position) {
      this.dropdown.elem.style.left = position.left + 'px';
      this.dropdown.elem.style.top = position.top + 10 + 'px';
    }
    if (state) {
      this.dropdown.open();
    } else {
      this.dropdown.close();
    }
    this.applyMenu(this.menu, this.editor);
  }
}

export class ContextMenuPlugin implements ProseNextPlugin {
  getPlugins() {
    return [];
  }

  getMarks() {
    return {};
  }

  getNodes() {
    return {};
  }

  getNodeViews() {
    return {};
  }

  afterInit(instance: ProseNext) {
    new ContextMenu(
      instance.plugins
        .filter(p => p.getContextMenu)
        .map(p => p.getContextMenu(instance.schema))
        .flatMap(d => d),
      instance.editorView
    );
  }
}
