import {imageLoadPlaceholderPlugin} from './image-placeholder';
import {EditorView} from 'prosemirror-view';
import {Schema} from 'prosemirror-model';
import {EditorState} from 'prosemirror-state';
import {FileUploader} from './models/file-uploader';

export function startImageUpload(
  view: EditorView,
  file: File,
  schema: Schema,
  uploadFile: FileUploader = defaultFileUpload
) {
  // A fresh object to act as the ID for this upload
  const id = {};

  // Replace the selection with a placeholder
  const tr = view.state.tr;
  if (!tr.selection.empty) tr.deleteSelection();
  tr.setMeta(imageLoadPlaceholderPlugin, {add: {id, pos: tr.selection.from}});
  view.dispatch(tr);

  uploadFile(file).then(
    url => {
      const pos = findPlaceholder(view.state, id);
      // If the content around the placeholder has been deleted, drop
      // the image
      if (pos == null) return;
      // Otherwise, insert it at the placeholder's position, and remove
      // the placeholder
      view.dispatch(
        view.state.tr
          // .replaceWith(pos, pos, schema.nodes.image.create({src: url}))
          .replaceWith(pos, pos, schema.nodes.resizableImage.create({src: url}))
          .setMeta(imageLoadPlaceholderPlugin, {remove: {id}})
      );
      // console.debug(view.state.toJSON());
    },
    () => {
      // On failure, just clean up the placeholder
      view.dispatch(tr.setMeta(imageLoadPlaceholderPlugin, {remove: {id}}));
    }
  );
}

function findPlaceholder(state: EditorState, id: object) {
  const decos = imageLoadPlaceholderPlugin.getState(state);
  const found = decos.find(null, null, spec => spec.id == id);
  return found.length ? found[0].from : null;
}

function defaultFileUpload(file: File): Promise<string> {
  const reader = new FileReader();
  return new Promise((accept, fail) => {
    reader.onload = () => accept(reader.result as string);
    reader.onerror = () => fail(reader.error);
    reader.readAsDataURL(file);
  });
}
