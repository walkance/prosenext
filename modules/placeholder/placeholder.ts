import {ProseNextPlugin} from '../core/plugin.interface';
import {Plugin} from 'prosemirror-state';
import {Schema} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';
import './placeholder.css';

function placeholderIsEnable(view: EditorView) {
  if (view.state.doc.textContent) {
    return false;
  } else {
    const fragment = view.state.doc.content as any;
    // console.log(fragment);
    if (fragment.content) {
      return (
        fragment.content[0].type.name === 'paragraph' &&
        fragment.content[0].content.content.length === 0
      );
    } else {
      return true;
    }
  }
}

export default function placeholder(text: string) {
  const update = (view: EditorView) => {
    if (placeholderIsEnable(view)) {
      view.dom.setAttribute('data-placeholder', text);
    } else {
      view.dom.removeAttribute('data-placeholder');
    }
  };

  return new Plugin({
    view(view) {
      update(view);

      return {update};
    },
  });
}

export class PlaceholderPlugin implements ProseNextPlugin {
  constructor(private options: {text: string}) {}

  getContextMenu(schema?: Schema): any[] {
    return [];
  }

  getMarks(): any {
    return {};
  }

  getNodeViews(): any {
    return {};
  }

  getNodes(): any {
    return {};
  }

  getPlugins(schema?: Schema): Plugin[] {
    return [placeholder(this.options.text)];
  }
}
