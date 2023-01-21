import './context-menu.css';

import {MenuItem} from 'prosemirror-menu';
import {EditorView} from 'prosemirror-view';
import {ProseNextPlugin} from '../core/plugin.interface';
import {ProseNext} from '../core';
import {createElement} from '../utils/create-element';

const template = `
<div class="dropdown-menu">
<div class="default-dropdown-container-inner">

</div>
</div>
`;

const rowFactory = ({text, customIcon, onClick}) => {
  const iconElem = customIcon ? customIcon.path : '';
  const elem =
    createElement(`<div class="dropdown-action task-extras-dropdown-item event-details-dropdown-item">
<div class="event-details-dropdown-text">${iconElem}${text}</div></div>`);
  if (onClick) {
    elem.addEventListener('click', onClick);
  }
  return elem;
};

/** Plugin for context menu */
class ContextMenu {
  public elem;
  private listener = event => {
    if (!this.elem.contains(event.target)) {
      this.visible(false);
    }
  };

  constructor(private menu: MenuItem[], private editor: EditorView) {
    this.elem = createElement(template);
    this.visible(false);
    document.body.appendChild(this.elem);
    editor.dom.addEventListener('click', (e: MouseEvent) => {
      // e.preventDefault();
      this.visible(false);
    });
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

  stopListen() {
    document.removeEventListener('click', this.listener);
  }

  startListen() {
    this.stopListen();
    document.addEventListener('click', this.listener);
  }

  visible(state: boolean, position?: {left: number; top: number}) {
    this.elem.style.display = state ? 'flex' : 'none';
    this.applyMenu(this.menu, this.editor);
    if (state) {
      this.startListen();
    } else {
      this.stopListen();
    }
    if (position) {
      this.elem.style.left = 40 - this.elem.clientWidth + position.left + 'px';
      this.elem.style.top = position.top + 10 + 'px';
    }
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
