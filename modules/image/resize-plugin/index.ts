import {NodeSpec, Node} from 'prosemirror-model';
import {EditorView} from 'prosemirror-view';

export const resizableImage = {
  inline: true,
  attrs: {
    src: {},
    width: {default: '10em'},
    alt: {default: null},
    title: {default: null},
  },
  group: 'inline',
  draggable: true,
  parseDOM: [
    {
      priority: 51, // must be higher than the default image spec
      tag: 'span.prose-img-container',
      getAttrs(dom: HTMLElement) {
        const img = (dom as HTMLElement).querySelector('img');
        return {
          src: img.getAttribute('src'),
          title: img.getAttribute('title'),
          alt: img.getAttribute('alt'),
          width: img.getAttribute('width') || '10em',
        };
      },
    },
    {
      tag: 'img[src]',
      getAttrs(dom) {
        return {
          src: (dom as HTMLElement).getAttribute('src'),
          title: (dom as HTMLElement).getAttribute('title'),
          alt: (dom as HTMLElement).getAttribute('alt'),
          width: (dom as HTMLElement).getAttribute('width') || '10em',
        };
      },
    },
  ],
  /** not called every change */
  toDOM(node) {
    const attrs = {style: `width: ${node.attrs.width}`};
    // console.debug('toDOm', attrs);
    return ['img', {...node.attrs, ...attrs}];
  },
} as NodeSpec;

function getFontSize(element) {
  return parseFloat(getComputedStyle(element).fontSize);
}

export class FootnoteView {
  dom: HTMLElement;
  img: HTMLImageElement;
  handle: HTMLElement;

  constructor(node: Node, view: EditorView, getPos) {
    /*console.log(view);
        console.log(node);
        console.log(getPos);*/
    const outer = document.createElement('span');
    outer.classList.add('prose-img-container');
    outer.style.position = 'relative';
    outer.style.width = node.attrs.width;
    //outer.style.border = "1px solid blue"
    outer.style.display = 'inline-block';
    //outer.style.paddingRight = "0.25em"
    outer.style.lineHeight = '0'; // necessary so the bottom right arrow is aligned nicely

    const img = document.createElement('img');
    img.setAttribute('src', node.attrs.src);
    img.style.width = '100%';
    //img.style.border = "1px solid red"

    const handle = document.createElement('span');
    handle.style.position = 'absolute';
    handle.style.bottom = '0px';
    handle.style.right = '0px';
    handle.style.width = '10px';
    handle.style.height = '10px';
    handle.style.border = '3px solid black';
    handle.style.borderTop = 'none';
    handle.style.borderRadius = '2px';
    handle.style.borderLeft = 'none';
    handle.style.display = 'none';
    handle.style.cursor = 'nwse-resize';

    handle.onmousedown = function (e) {
      e.preventDefault();
      /*console.log(e);
            console.log(node);*/
      const startX = e.pageX;
      const startY = e.pageY;

      const fontSize = getFontSize(outer);

      let startWidth;
      try {
        startWidth = parseFloat(node.attrs.width.match(/(.+)em/)[1]);
      } catch (err) {
        /* eslint-disable no-console */
        console.warn('@prosenext: not properly saved image');
        startWidth = 10;
      }

      const onMouseMove = e => {
        const currentX = e.pageX;
        const currentY = e.pageY;

        const diffInPx = currentX - startX;
        const diffInEm = diffInPx / fontSize;

        outer.style.width = `${startWidth + diffInEm}em`;
      };

      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);

        // const tempPosition = getPos();
        // TODO fix selection after node transform
        const transaction = view.state.tr.setNodeMarkup(getPos(), null, {
          src: node.attrs.src,
          width: outer.style.width,
        });
        //const selection = view.state.tr.setSelection(tempSelection);

        view.dispatch(transaction);
        // const selection = NodeSelection.create(node, tempPosition);
        // console.log(selection);
        // const selectionTr = view.state.tr.setSelection(selection);
        // view.dispatch(selectionTr);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };

    outer.appendChild(handle);
    outer.appendChild(img);

    this.dom = outer;
    this.img = img;
    this.handle = handle;
  }

  selectNode() {
    this.img.classList.add('ProseMirror-selectednode');

    this.handle.style.display = '';
  }

  deselectNode() {
    this.img.classList.remove('ProseMirror-selectednode');

    this.handle.style.display = 'none';
  }
}
