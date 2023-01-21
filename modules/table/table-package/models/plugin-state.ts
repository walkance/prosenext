import {Draggin} from './draggin';

export interface PluginState {
  /** навели на край ячейи */
  activeHandle: number;
  activeRowHandle: number;
  dragging: Draggin;
  // MetaState
  setHandle: number;
  setDragging: Draggin;
}
