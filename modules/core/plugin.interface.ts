import {MarkSpec, Node, NodeSpec, Schema} from 'prosemirror-model';
import {EditorState, Plugin} from 'prosemirror-state';
import {ProseNext} from './index';
import {EditorView, NodeView} from 'prosemirror-view';
import {MenuItem} from 'prosemirror-menu';

/**
 * common high level way to add plugins
 */
export interface ProseNextPlugin {
  /** will be called after EditorView creation */
  afterInit?(instance: ProseNext);

  /** will be called before EditorView creation */
  afterStateInit?(state: EditorState);

  getNodes(): Record<string, NodeSpec>;

  getMarks(): Record<string, MarkSpec>;

  getNodeViews(): Record<
    string,
    (node: Node, view: EditorView, getPos: () => number) => NodeView
  >;

  /** provide used prosemirror plugins */
  getPlugins(schema?: Schema): Plugin[];

  getContextMenu?(schema?: Schema): MenuItem[];
}
