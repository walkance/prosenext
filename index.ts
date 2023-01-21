import {ImagePlugin} from './modules/image';
import {ContextMenuPlugin} from './modules/context-menu';
import {ProseNext} from './modules/core';
import {TablePlugin} from './modules/table';
import {BasePlugin} from './modules/basic';
import {PlaceholderPlugin} from './modules/placeholder/placeholder';

const elem = document.querySelector('#editor') as HTMLElement;
const proseNext = new ProseNext({
  dom: elem,
  doc: '<div></div>',
  // fromJSON: template,
  plugins: [
    new BasePlugin({invertEnter: true, allowRich: true}),
    new TablePlugin(),
    new ImagePlugin({}),
    new ContextMenuPlugin(),
    new PlaceholderPlugin({text: 'Enter some value'}),
  ],
  props: {
    dispatchTransaction: tr => {
      // console.debug('this.view', this.view);
      if (!proseNext.editorView.state) {
        return;
      }
      proseNext.editorView.updateState(proseNext.editorView.state.apply(tr));
      // console.debug('html', elem.innerHTML);
      // console.debug('json', proseNext.editorView.state.doc.toJSON());
      const json = proseNext.editorView.state.doc.toJSON();
      updateView(json);
    },
  },
});

setTimeout(() => {
  const json = proseNext.editorView.state.doc.toJSON();
  updateView(json);
});

const view = document.querySelector('#view');
function updateView(json: { [key: string]: any} ) {
  view.innerHTML = proseNext.getViewHTMLFromJson(json);
}
