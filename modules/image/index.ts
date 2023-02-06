import imgFileIcon from '@fortawesome/fontawesome-free/svgs/solid/file-image.svg';

import {Plugin} from 'prosemirror-state';
import {FootnoteView, resizableImage} from './resize-plugin';
import {imageLoadPlaceholderPlugin} from './image-placeholder';
import {FileUploader} from './models/file-uploader';
import {item} from '../basic/menu';
import {EditorView} from 'prosemirror-view';
import {startImageUpload} from './utils';
import {Node, Schema} from 'prosemirror-model';
import {ProseNextPlugin} from '../core/plugin.interface';
import {ProseNext} from '../core';

export class ImagePlugin implements ProseNextPlugin {
  private schema: Schema;
  private editorView: EditorView;

  getNodeViews() {
    return {
      resizableImage(node, view, getPos) {
        return new FootnoteView(node, view, getPos);
      },
    };
  }

  fileInput: HTMLInputElement;

  constructor(
    private options?: {
      fileUploader?: FileUploader;
    }
  ) {
    this.initFileInput();
    // this.menuFactory = (schema, cb) => generateImageUploadMenu(schema, cb, options?.fileUploader);
  }

  getPlugins(schema?: Schema): Plugin[] {
    return [imageLoadPlaceholderPlugin];
  }

  initFileInput() {
    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.addEventListener('change', e => {
      const currentView = this.editorView;
      if (
        currentView.state.selection.$from.parent.inlineContent &&
        (e.target as HTMLInputElement).files.length
      ) {
        startImageUpload(
          currentView,
          (e.target as HTMLInputElement).files[0],
          this.schema,
          this.options.fileUploader
        );
      }
      currentView.focus();
    });
  }

  getNodes() {
    return {
      resizableImage,
    };
  }

  getMarks() {
    return {};
  }

  getContextMenu() {
    return [item('Insert an image', this.getImage, imgFileIcon)];
  }

  // generateImageUploadMenu(
  //   schema: Schema,
  //   getViewCallback: () => {},
  //   fileUpload?: FileUploader
  // ) {
  //   return [new MenuItem({label: 'Image', run: this.getImage})];
  // }
  getImage = (state, dispatch) => {
    if (dispatch) {
      this.fileInput.click();
    }
    return true;
  };

  afterInit(instance: ProseNext) {
    this.schema = instance.schema;
    this.editorView = instance.editorView;
    instance.editorView.dom.addEventListener('paste', event => {
      const file = event.clipboardData.files[0];
      if (file && file.type.startsWith('image')) {
        startImageUpload(
          instance.editorView,
          file,
          instance.schema,
          this.options.fileUploader
        );
        event.preventDefault();
      }
    });
  }

  replaceImageUrlsAsync(
    getNewUrl: (node: Node) => Promise<string>
  ): Promise<void[]> {
    const images = this.extractImagesFromDoc();
    // console.log(images)
    return Promise.all(
      images.map(img => {
        return getNewUrl(img.node).then(src => {
          if (src !== img.node.attrs.src) {
            this.updateImageUrl(img.pos, src);
          }
        });
      })
    );
  }

  replaceImageUrls(getNewUrl: (node: Node) => string) {
    const images = this.extractImagesFromDoc();
    // console.log(images)
    images.forEach(img => {
      this.updateImageUrl(img.pos, getNewUrl(img.node));
    });
  }

  updateImageUrl(pos: number, newSrc: string): void {
    this.editorView.dispatch(
      this.editorView.state.tr
        .replaceWith(
          pos,
          pos + 1,
          this.schema.nodes.resizableImage.create({src: newSrc})
        )
        .setMeta('addToHistory', false)
    );
  }

  extractImagesFromDoc(): {
    node: Node;
    pos: number;
  }[] {
    const images: {
      node: Node;
      pos: number;
    }[] = [];
    const findImage = (content: Node, parentPos = 0) => {
      content &&
        content.forEach((node, offset, pos) => {
          if (node.type.name === 'resizableImage') {
            images.push({
              node,
              pos: parentPos,
            });
          }
          findImage(node, parentPos + 1);
          parentPos += node.nodeSize;
        });
    };
    findImage(this.editorView.state.doc);
    return images;
  }
}
