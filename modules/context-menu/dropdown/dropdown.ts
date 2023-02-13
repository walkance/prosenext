import {DropdownDirectionInterface} from './models/dropdown-direction';
import {DropdownPositionInterface} from './models/dropdown-position';
import {createElement, setClass, setNgClass} from '../../utils';
import './dropdown.scss';
import template from './dropdown.html';
import {DropdownOptions} from './dropdown-options';
import {SubSink} from '../../utils/sub-sink';

export class Dropdown {
  private options: DropdownOptions;

  private content: HTMLElement;
  dropdownContent: HTMLElement;
  dropdownTrigger: HTMLElement;

  elem: HTMLElement;

  private _active = false;
  set active(state: boolean) {
    if (this._active !== state) {
      setClass(this.dropdownContent, state, 'dropdown--active');
      this._active = state;
    }
  }

  get active() {
    return this._active;
  }

  subSink = new SubSink();
  direction: DropdownDirectionInterface = {
    x: undefined,
    y: undefined,
  };
  dropdownPosition: DropdownPositionInterface;

  constructor(options?: DropdownOptions) {
    this.options = options || {};
    this.render(options);
    this.dropdownTrigger = this.elem.querySelector('.dropdown__trigger');
    this.dropdownContent = this.elem.querySelector('.dropdown__content');
    if (options.fixedDropdownContentWidth) {
      this.dropdownContent.style.width =
        options.fixedDropdownContentWidth + 'px';
    }
  }

  private emitEvent(event: string, payload?: unknown) {
    this.options.emit && this.options.emit(event, payload);
  }

  globalClickListener = event => {
    if (this.elem) {
      // console.debug('click', this.elem, event.target);
      if (
        !(
          this.dropdownContent.contains(event.target) ||
          this.dropdownTrigger?.contains(event.target)
        )
      ) {
        this.close();
      }
    }
  };

  startListen() {
    window.addEventListener('click', this.globalClickListener, true);
    this.subSink.add(
      {
        elem: document,
        event: 'wheel',
        cb: (event: WheelEvent) => {
          if (
            this.dropdownContent &&
            !this.dropdownContent.contains(event.target as HTMLElement)
          ) {
            this.close();
          }
        },
      },
      {elem: window, event: 'resize', cb: () => this.close()},
      {
        elem: document,
        event: 'keydown',
        cb: (event: KeyboardEvent) => {
          if (event.code === 'ArrowDown') {
            this.stopKeyboardEventPropagation(event);
            this.emitEvent('keyDownPressed');
          } else if (event.code === 'ArrowUp') {
            this.stopKeyboardEventPropagation(event);
            this.emitEvent('keyUpPressed');
          } else if (event.code === 'Enter') {
            this.stopKeyboardEventPropagation(event);
            this.emitEvent('keyEnterPressed');
          } else if (event.code === 'Escape') {
            this.stopKeyboardEventPropagation(event);
            this.emitEvent('keyEscapePressed');
            this.close();
          }
          // console.log(event);
        },
      }
    );
  }

  stopKeyboardEventPropagation(event: KeyboardEvent) {
    event.stopPropagation();
    event.stopImmediatePropagation();
    event.preventDefault();
  }

  close() {
    // console.log('close');
    this.active = false;
    window.removeEventListener('click', this.globalClickListener);
    this.subSink.unsubscribe();
    if (this.dropdownContent) {
      this.dropdownContent.classList.remove('dropdown-menu-visible');
    }
    this.emitEvent('dropdownClosed');
    this.direction.x = undefined;
    this.direction.y = undefined;
    this.updateDropdownPosition();
  }

  open() {
    // console.log('open', this);
    if (this.dropdownContent) {
      this.dropdownContent.classList.add('dropdown-menu-visible');
    }
    this.active = true;
    this.startListen();
    this.appendListToBody();
    this.fixPosition();
    this.emitEvent('dropdownOpened');
  }

  toggleDropdown(state?: boolean) {
    if (!this.options.disableDropdown) {
      if (state !== undefined) {
        this.active = !state;
      }
      if (!this.active) {
        this.open();
      } else {
        this.close();
      }
      // event.stopPropagation();
    }
  }

  defineUpOrDownCoords() {
    const menuElement = this.dropdownContent;
    const parentRect = this.elem.getBoundingClientRect();
    if (
      parentRect.top <
      window.innerHeight - (parentRect.top + parentRect.height)
    ) {
      menuElement.style.top = `${parentRect.top + parentRect.height + 4}px`;
      this.direction.y = 'bottom';
    } else {
      menuElement.style.top = 'auto';
      menuElement.style.bottom = `${
        window.innerHeight - parentRect.top + (this.options.fixedHeight || 4)
      }px`;
      this.direction.y = 'top';
    }
  }

  fixPosition() {
    const menuElement = this.dropdownContent;
    const parentRect = this.elem.getBoundingClientRect();
    const parentRectBottom =
      window.innerHeight - (parentRect.top + parentRect.height);
    if (this.options.priorityPosition) {
      if (this.options.priorityPosition.y === 'top') {
        if (this.options.maxHeight < parentRect.top) {
          menuElement.style.top = 'auto';
          menuElement.style.bottom = `${
            window.innerHeight -
            parentRect.top +
            (this.options.fixedHeight || 4)
          }px`;
          this.direction.y = 'top';
        } else {
          this.defineUpOrDownCoords();
        }
      } else if (this.options.priorityPosition.y === 'bottom') {
        if (this.options.maxHeight < parentRectBottom) {
          menuElement.style.top = `${parentRect.top + parentRect.height + 4}px`;
          this.direction.y = 'bottom';
        } else {
          this.defineUpOrDownCoords();
        }
      }
      if (this.options.priorityPosition.x === 'left') {
        if (this.options.maxWidth < parentRect.left) {
          menuElement.style.left = 'auto';
          menuElement.style.right = `${
            window.innerWidth -
            parentRect.right +
            (this.options.fixedWidth || 0)
          }px`;
          this.direction.x = 'left';
        } else {
          menuElement.style.right = 'auto';
          menuElement.style.left = `${parentRect.left}px`;
          this.direction.x = 'right';
        }
      } else if (this.options.priorityPosition.x === 'right') {
        if (this.options.maxWidth < window.innerWidth - parentRect.right) {
          menuElement.style.right = 'auto';
          menuElement.style.left = `${parentRect.left}px`;
          this.direction.x = 'right';
        } else {
          menuElement.style.left = 'auto';
          menuElement.style.right = `${
            window.innerWidth -
            parentRect.right +
            (this.options.fixedWidth || 0)
          }px`;
          this.direction.x = 'left';
        }
      }
    }
    if (!this.options.priorityPosition || !this.options.maxWidth) {
      if (parentRect.left > window.innerWidth - parentRect.right) {
        menuElement.style.left = 'auto';
        menuElement.style.right = `${
          window.innerWidth - parentRect.right + (this.options.fixedWidth || 0)
        }px`;
        this.direction.x = 'left';
      } else {
        menuElement.style.right = 'auto';
        menuElement.style.left = `${parentRect.left}px`;
        this.direction.x = 'right';
      }
      this.defineUpOrDownCoords();
    }
    this.updateDropdownPosition();
  }

  private updateDropdownPosition() {
    if (this.direction) {
      this.dropdownPosition = {
        'dropdown-menu-left-top':
          this.direction.x === 'left' && this.direction.y === 'top',
        'dropdown-menu-right-bottom':
          this.direction.x === 'right' && this.direction.y === 'bottom',
        'dropdown-menu-right-top':
          this.direction.x === 'right' && this.direction.y === 'top',
        // '': this.direction.x === undefined && this.direction.y === undefined,
      };
    }
    // console.debug(
    //   'this.dropdownPosition',
    //   this.dropdownPosition,
    //   this.dropdownContent &&
    //     this.dropdownContent.querySelector('.dropdown-menu-arrow')
    // );
    this.dropdownPosition &&
      this.dropdownContent &&
      setNgClass(
        this.dropdownContent,
        this.dropdownPosition as any,
        '.dropdown-menu-arrow'
      );
  }

  private appendListToBody() {
    const menuElement = this.dropdownContent;
    const parentSize = this.elem.getBoundingClientRect();
    if (!document.body.querySelector('#dropdowns')) {
      const rootContainer = document.createElement('div');
      rootContainer.id = 'dropdowns';
      document.body.appendChild(rootContainer);
    }
    document.body.querySelector('#dropdowns').append(this.dropdownContent);
    menuElement.style.position = 'absolute';
    this.fixPosition();
    // console.debug('parentSize.left', e, parentSize.left);
    menuElement.style['z-index'] = '100000';
    /** задание размера выпадающего элемента по размеру кнопки */
    //menuElement.style.width = `${parentSize.width}px`;
    //console.debug('menuElement', menuElement);
  }

  destroy() {
    this.subSink.unsubscribe();
    window.removeEventListener('click', this.globalClickListener);
    if (this.dropdownContent) {
      this.dropdownContent.remove();
    }
  }

  render(options?: DropdownOptions, isEditorMode?: boolean): HTMLElement {
    if (options) {
      this.options = options;
    }
    const shadow = document.createElement('div');
    if (this.options.textLabel) {
      shadow.appendChild(
        createElement(
          `<div class="dropdown-label">${this.options.textLabel}</div>`
        )
      );
    }
    this.content = createElement(template);
    if (this.options.minWidth) {
      (
        this.content.querySelector('.dropdown-menu') as HTMLElement
      ).style.minWidth = this.options.minWidth;
    }
    (this.content.querySelector('.dropdown__trigger') as HTMLElement).onclick =
      $event => this.toggleDropdown();
    this.dropdownPosition &&
      setNgClass(
        this.content,
        this.dropdownPosition as any,
        '.dropdown-menu-arrow'
      );
    // const shadow = wrap.attachShadow({ mode: "open" });
    // const style = document.createElement('style');
    // style.textContent = css as string;
    // shadow.appendChild(style);
    shadow.appendChild(this.content);
    this.elem = shadow as any;
    return this.elem;
  }

  setValue(key: string, value: any): void {}

  /** todo provide mini utils for this */
  setSlotContent(key: string, content: HTMLElement) {
    if (key === 'dropdown__trigger') {
      // console.log(this.elem.childNodes);
      this.elem
        .querySelector('div[data-select="dropdown__trigger"]')
        .replaceWith(content);
    }
    if (key === 'dropdown__content') {
      this.elem
        .querySelector('div[data-select="dropdown__content"]')
        .replaceWith(content);
    }
  }
}
