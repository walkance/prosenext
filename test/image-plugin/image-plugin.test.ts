
import 'prosemirror-model';
import {ProseNext} from '../../modules/core';
import {ImagePlugin} from '../../modules/image';
import {describe, it, expect} from '@jest/globals';
import {html} from './img-html';
import {BasePlugin} from '../../modules/basic';

const template = {"type":"doc","content":[{"type":"paragraph","content":[{"type":"resizableImage","attrs":{"src":"http://localhost:8000/image.png","width":"10em","alt":"mural painting","title":null}}]}]};

describe('Image Plugin', () => {
  it('JSON initialization works', () => {
    const elem = document.createElement('div');
    const proseNext = new ProseNext({
      dom: elem,
      fromJSON: template,
      plugins: [
        new BasePlugin({invertEnter: true, allowRich: true}),
        new ImagePlugin({}),
      ],
    });
    expect(proseNext.getHTMLFromState()).toEqual(html)
  });

  it('HTML initialization works', () => {
    const elem = document.createElement('div');
    const node = document.createElement('div');
    node.innerHTML = html;
    const proseNext = new ProseNext({
      dom: elem,
      doc: node,
      plugins: [
        new BasePlugin({invertEnter: true, allowRich: true}),
        new ImagePlugin({}),
      ],
    });
    expect(proseNext.getJSONFromState()).toEqual(template)
  });
});
