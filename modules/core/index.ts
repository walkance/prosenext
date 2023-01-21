import {DOMParser, DOMSerializer, Node, Schema} from 'prosemirror-model';
import {ProseNextPlugin} from './plugin.interface';
import {EditorState, Plugin} from 'prosemirror-state';
import {EditorView} from 'prosemirror-view';

/**
 * high level abstraction for proseMirror complex configuration
 */
export class ProseNext {
  schema: Schema;
  state: EditorState;
  editorView: EditorView;
  doc?: Node;
  fromJSON?: { [ key: string] : unknown };
  plugins: ProseNextPlugin[];

  constructor(options: {
    /** root element */
    dom: HTMLElement;
    doc: Node | string;
    fromJSON?: { [ key: string] : any };
    props?: { [ key: string] : any };
    nativePlugins?: Plugin[];
    plugins: ProseNextPlugin[];
  }) {
    this.plugins = options.plugins;
    this.fromJSON = options.fromJSON;
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

  clear() {
    if (this.editorView) {
      this.editorView.state.doc = DOMParser.fromSchema(this.schema).parse(
        document.createElement('div')
      );
      this.editorView.updateState(this.editorView.state);
    }
  }

  getHTMLFromState(): string {
    const content = this.editorView.state.doc.content;
    return this.contentToHTML(content);
  }

  getViewHTMLFromJson(json: unknown): string {
    const content = this.schema.nodeFromJSON(json).content;
    return this.contentToHTML(content);
  }

  contentToHTML(content: any): string {
    const div = document.createElement('div');
    const childWrap = document.createElement('div');
    div.appendChild(childWrap);
    childWrap.classList.add('ProseMirror', 'ProseMirror-setup-style');
    childWrap.appendChild(
      DOMSerializer.fromSchema(this.schema).serializeFragment(content)
    );
    return div.innerHTML;
  }
}
