/** https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template */
export function createElement(html: string) {
  const template = document.createElement('template');
  html = html.trim();
  template.innerHTML = html;
  return template.content.firstChild as HTMLElement;
}
