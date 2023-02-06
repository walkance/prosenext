import {
  DOMParser,
  DOMSerializer,
  Fragment,
  Node,
  Schema,
} from 'prosemirror-model';
import {ProseNextPlugin} from './plugin.interface';
import {EditorState, Plugin} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

/**
 * high level abstraction for proseMirror complex configuration
 */
export class ProseNext {
  editorView: EditorView;
  plugins: ProseNextPlugin[];
  schema: Schema;
  private state: EditorState;
  private doc?: Node;
  private readonly fromJSON?: {[key: string]: unknown};

  constructor(
    options: {
      /** root element */
      fromJSON?: {[key: string]: any};
      props?: {[key: string]: any};
      nativePlugins?: Plugin[];
      plugins: ProseNextPlugin[];
    } & (
      | {
          dom: HTMLElement;
          doc?: Node | string;
        }
      | {
          dom?: HTMLElement;
          doc: Node | HTMLElement | string;
        }
    )
  ) {
    this.fromJSON = options.fromJSON;
    this.plugins = options.plugins;
    let nodes;
    let marks;
    let nodeViews = {};
    // console.log(options.plugins);
    options.plugins.forEach(plugin => {
      nodes = {...nodes, ...plugin.getNodes()};
      marks = {...marks, ...plugin.getMarks()};
      nodeViews = {
        ...nodeViews,
        ...plugin.getNodeViews(),
      };
    });
    if (!options.nativePlugins) {
      options.nativePlugins = [];
    }

    // console.log(nodes, marks);

    this.schema = new Schema({
      nodes,
      marks,
    });

    // console.log(this.schema);

    this.doc = this.fromJSON
      ? this.schema.nodeFromJSON(this.fromJSON)
      : DOMParser.fromSchema(this.schema).parse(options.doc as any);
    // console.log(options.plugins.map(p => p.plugins).flatMap(d => d))
    this.state = EditorState.create({
      doc: this.doc,
      plugins: [
        ...options.nativePlugins,
        ...options.plugins.map(p => p.getPlugins(this.schema)).flatMap(d => d),
      ],
    });

    //hook
    options.plugins.forEach(p => {
      if (p.afterStateInit) {
        this.state = p.afterStateInit(this.state);
      }
    });

    this.editorView = new EditorView(options.dom, {
      ...options.props,
      state: this.state,
      nodeViews,
    });

    //hook
    options.plugins.forEach(p => {
      if (p.afterInit) {
        this.state = p.afterInit(this);
      }
    });
  }

  getJSONFromState(): Node {
    // console.log(this.editorView.state.doc);
    return this.editorView.state.doc.toJSON();
  }

  getHTMLFromState(): string {
    const content = this.editorView.state.doc.content;
    return this.contentToHTML(content);
  }

  getViewHTMLFromJson(json: object): string {
    const content = this.schema.nodeFromJSON(json).content;
    return this.contentToHTML(content);
  }

  private contentToHTML(content: Fragment): string {
    const div = document.createElement('div');
    const childWrap = document.createElement('div');
    div.appendChild(childWrap);
    childWrap.classList.add('ProseMirror', 'ProseMirror-setup-style');
    childWrap.appendChild(
      DOMSerializer.fromSchema(this.schema).serializeFragment(content)
    );
    return div.innerHTML;
  }

  isEmpty(): boolean {
    // console.debug(this.proseNext.doc);
    if (this.doc.textContent) {
      return false;
    } else {
      const fragment = this.doc.content as unknown as Node;
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

  focus(): void {
    if (this.editorView) {
      this.editorView.focus();
    }
  }

  clear(): void {
    if (this.editorView) {
      this.editorView.state.doc = DOMParser.fromSchema(this.schema).parse(
        document.createElement('div')
      );
      this.editorView.updateState(this.editorView.state);
    }
  }

  destroy(): void {
    this.editorView.destroy();
  }

  reset(input: HTMLElement): void {
    if (this.editorView) {
      this.doc = DOMParser.fromSchema(this.schema).parse(input);
      this.editorView.updateState(this.editorView.state);
      this.editorView.state.doc = this.doc;
    }
  }
}
