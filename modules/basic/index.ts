import codeIcon from '@fortawesome/fontawesome-free/svgs/regular/file-code.svg';
import paragraphIcon from '@fortawesome/fontawesome-free/svgs/solid/paragraph.svg';
import headingIcon from '@fortawesome/fontawesome-free/svgs/solid/heading.svg';

import {DOMOutputSpec, MarkSpec, NodeSpec, Schema} from 'prosemirror-model';
import {MenuItem} from 'prosemirror-menu';
import {buildInputRules} from './inputrules';
import {keymap} from 'prosemirror-keymap';
import {buildKeymap} from './keymap';
import {
  baseKeymap,
  chainCommands,
  createParagraphNear,
  exitCode,
  liftEmptyBlock,
  newlineInCode,
  setBlockType,
  splitBlock,
  toggleMark,
} from 'prosemirror-commands';
import {dropCursor} from 'prosemirror-dropcursor';
import {gapCursor} from 'prosemirror-gapcursor';
import {history} from 'prosemirror-history';
import {Plugin} from 'prosemirror-state';
import {ProseNextPlugin} from '../core/plugin.interface';
import {item} from './menu';

const pDOM: DOMOutputSpec = ['p', 0],
  blockquoteDOM: DOMOutputSpec = ['blockquote', 0],
  hrDOM: DOMOutputSpec = ['hr'],
  preDOM: DOMOutputSpec = ['pre', ['code', 0]],
  brDOM: DOMOutputSpec = ['br'];

/// [Specs](#model.NodeSpec) for the nodes defined in this schema.
export const nodes = {
  /// NodeSpec The top level document node.
  doc: {
    content: 'block+',
  } as NodeSpec,

  /// A plain paragraph textblock. Represented in the DOM
  /// as a `<p>` element.
  paragraph: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{tag: 'p'}],
    toDOM() {
      return pDOM;
    },
  } as NodeSpec,

  /// The text node.
  text: {
    group: 'inline',
  } as NodeSpec,
};

export const richNodes = {
  /// A hard line break, represented in the DOM as `<br>`.
  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{tag: 'br'}],
    toDOM() {
      return brDOM;
    },
  } as NodeSpec,

  /// A blockquote (`<blockquote>`) wrapping one or more blocks.
  blockquote: {
    content: 'block+',
    group: 'block',
    defining: true,
    parseDOM: [{tag: 'blockquote'}],
    toDOM() {
      return blockquoteDOM;
    },
  } as NodeSpec,

  /// A horizontal rule (`<hr>`).
  horizontal_rule: {
    group: 'block',
    parseDOM: [{tag: 'hr'}],
    toDOM() {
      return hrDOM;
    },
  } as NodeSpec,

  /// A heading textblock, with a `level` attribute that
  /// should hold the number 1 to 6. Parsed and serialized as `<h1>` to
  /// `<h6>` elements.
  heading: {
    attrs: {level: {default: 1}},
    content: 'inline*',
    group: 'block',
    defining: true,
    parseDOM: [
      {tag: 'h1', attrs: {level: 1}},
      {tag: 'h2', attrs: {level: 2}},
      {tag: 'h3', attrs: {level: 3}},
      {tag: 'h4', attrs: {level: 4}},
      {tag: 'h5', attrs: {level: 5}},
      {tag: 'h6', attrs: {level: 6}},
    ],
    toDOM(node) {
      return ['h' + node.attrs.level, 0];
    },
  } as NodeSpec,

  /// A code listing. Disallows marks or non-text inline
  /// nodes by default. Represented as a `<pre>` element with a
  /// `<code>` element inside of it.
  code_block: {
    content: 'text*',
    marks: '',
    group: 'block',
    code: true,
    defining: true,
    parseDOM: [{tag: 'pre', preserveWhitespace: 'full'}],
    toDOM() {
      return preDOM;
    },
  } as NodeSpec,

  /// An inline image (`<img>`) node. Supports `src`,
  /// `alt`, and `href` attributes. The latter two default to the empty
  /// string.
  // image: {
  //     inline: true,
  //     attrs: {
  //         src: {},
  //         alt: {default: null},
  //         title: {default: null}
  //     },
  //     group: "inline",
  //     draggable: true,
  //     parseDOM: [{tag: "img[src]", getAttrs(dom: HTMLElement) {
  //             return {
  //                 src: dom.getAttribute("src"),
  //                 title: dom.getAttribute("title"),
  //                 alt: dom.getAttribute("alt")
  //             }
  //         }}],
  //     toDOM(node) { let {src, alt, title} = node.attrs; return ["img", {src, alt, title}] }
  // } as NodeSpec,
};

const emDOM: DOMOutputSpec = ['em', 0],
  strongDOM: DOMOutputSpec = ['strong', 0],
  codeDOM: DOMOutputSpec = ['code', 0];

/// [Specs](#model.MarkSpec) for the marks in the schema.
export const marks = {
  /// A link. Has `href` and `title` attributes. `title`
  /// defaults to the empty string. Rendered and parsed as an `<a>`
  /// element.
  link: {
    attrs: {
      href: {},
      title: {default: null},
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs(dom: HTMLElement) {
          return {
            href: dom.getAttribute('href'),
            title: dom.getAttribute('title'),
          };
        },
      },
    ],
    toDOM(node) {
      const {href, title} = node.attrs;
      return [
        'a',
        {
          href,
          title,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
        0,
      ];
    },
  } as MarkSpec,

  /// An emphasis mark. Rendered as an `<em>` element. Has parse rules
  /// that also match `<i>` and `font-style: italic`.
  em: {
    parseDOM: [{tag: 'i'}, {tag: 'em'}, {style: 'font-style=italic'}],
    toDOM() {
      return emDOM;
    },
  } as MarkSpec,

  /// A strong mark. Rendered as `<strong>`, parse rules also match
  /// `<b>` and `font-weight: bold`.
  strong: {
    parseDOM: [
      {tag: 'strong'},
      // This works around a Google Docs misbehavior where
      // pasted content will be inexplicably wrapped in `<b>`
      // tags with a font-weight normal.
      {
        tag: 'b',
        getAttrs: (node: HTMLElement) =>
          node.style.fontWeight != 'normal' && null,
      },
      {
        style: 'font-weight',
        getAttrs: (value: string) =>
          /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
      },
    ],
    toDOM() {
      return strongDOM;
    },
  } as MarkSpec,

  /// Code font mark. Represented as a `<code>` element.
  code: {
    parseDOM: [{tag: 'code'}],
    toDOM() {
      return codeDOM;
    },
  } as MarkSpec,
};

/// This schema roughly corresponds to the document schema used by
/// [CommonMark](http://commonmark.org/), minus the list elements,
/// which are defined in the [`prosemirror-schema-list`](#schema-list)
/// module.
///
/// To reuse elements from this schema, extend or read from its
/// `spec.nodes` and `spec.marks` [properties](#model.Schema.spec).
export const schema = new Schema({nodes, marks});

export function basicSetup(options: {
  /// The schema to generate key bindings and menu items for.
  schema: Schema;

  /// Can be used to [adjust](#example-setup.buildKeymap) the key bindings created.
  mapKeys?: {[key: string]: string | false};

  /// Set to false to disable the menu bar.
  menuBar?: boolean;

  /// Set to false to disable the history plugin.
  history?: boolean;

  /// Set to false to make the menu bar non-floating.
  floatingMenu?: boolean;

  /// Can be used to override the menu content.
  menuContent?: MenuItem[][];
}) {
  const plugins = [
    buildInputRules(options.schema),
    keymap(buildKeymap(options.schema, options.mapKeys)),
    keymap(baseKeymap),
    dropCursor(),
    gapCursor(),
  ];
  if (options.menuBar !== false) {
    // plugins.push(menuBar({
    //     floating: options.floatingMenu !== false,
    //     content: options.menuContent || buildMenuItems(options.schema).fullMenu
    // }))
  }
  if (options.history !== false) plugins.push(history());

  return plugins.concat(
    new Plugin({
      props: {
        attributes: {class: 'ProseMirror-setup-style'},
      },
    })
  );
}

export class BasePlugin implements ProseNextPlugin {
  constructor(
    private options: {
      /** Use html features or just string format */
      allowRich: boolean;
      invertEnter: boolean;
    }
  ) {}

  getPlugins(schema: Schema) {
    return [
      ...basicSetup({schema}),
      keymap({
        Enter: this.options.invertEnter
          ? exitCode
          : chainCommands(
              newlineInCode,
              createParagraphNear,
              liftEmptyBlock,
              splitBlock
            ),
        'Shift-Enter': this.options.invertEnter
          ? chainCommands(
              newlineInCode,
              createParagraphNear,
              liftEmptyBlock,
              splitBlock
            )
          : exitCode,
      }),
    ];
  }

  getContextMenu(schema?: Schema): MenuItem[] {
    return [
      item('Mark as code', toggleMark(schema.marks.code), codeIcon),
      item('Mark as headings', setBlockType(schema.nodes.heading), headingIcon),
      item(
        'Mark as paragraph',
        setBlockType(schema.nodes.paragraph),
        paragraphIcon
      ),
    ];
  }

  getNodeViews() {
    return {};
  }

  getNodes() {
    return this.options.allowRich ? {...nodes, ...richNodes} : nodes;
  }

  getMarks() {
    return this.options.allowRich ? marks : {};
  }
}
