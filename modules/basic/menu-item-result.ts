import {Dropdown, MenuElement, MenuItem} from 'prosemirror-menu';

export type MenuItemResult = {
  /// A menu item to toggle the [strong mark](#schema-basic.StrongMark).
  toggleStrong?: MenuItem;

  /// A menu item to toggle the [emphasis mark](#schema-basic.EmMark).
  toggleEm?: MenuItem;

  /// A menu item to toggle the [code font mark](#schema-basic.CodeMark).
  toggleCode?: MenuItem;

  /// A menu item to toggle the [link mark](#schema-basic.LinkMark).
  toggleLink?: MenuItem;

  /// A menu item to insert an [image](#schema-basic.Image).
  insertImage?: MenuItem;

  /// A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).
  wrapBulletList?: MenuItem;

  /// A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).
  wrapOrderedList?: MenuItem;

  /// A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).
  wrapBlockQuote?: MenuItem;

  /// A menu item to set the current textblock to be a normal
  /// [paragraph](#schema-basic.Paragraph).
  makeParagraph?: MenuItem;

  /// A menu item to set the current textblock to be a
  /// [code block](#schema-basic.CodeBlock).
  makeCodeBlock?: MenuItem;

  /// Menu items to set the current textblock to be a
  /// [heading](#schema-basic.Heading) of level _N_.
  makeHead1?: MenuItem;
  makeHead2?: MenuItem;
  makeHead3?: MenuItem;
  makeHead4?: MenuItem;
  makeHead5?: MenuItem;
  makeHead6?: MenuItem;

  /// A menu item to insert a horizontal rule.
  insertHorizontalRule?: MenuItem;

  /// A dropdown containing the `insertImage` and
  /// `insertHorizontalRule` items.
  insertMenu: Dropdown;

  /// A dropdown containing the items for making the current
  /// textblock a paragraph, code block, or heading.
  typeMenu: Dropdown;

  /// Array of block-related menu items.
  blockMenu: MenuElement[][];

  /// Inline-markup related menu items.
  inlineMenu: MenuElement[][];

  /// An array of arrays of menu elements for use as the full menu
  /// for, for example the [menu
  /// bar](https://github.com/prosemirror/prosemirror-menu#user-content-menubar).
  fullMenu: MenuElement[][];
};
