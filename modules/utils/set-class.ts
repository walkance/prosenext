export function setClass(
  element: HTMLElement,
  def: boolean,
  klass: string,
  selector?: string
) {
  setNgClass(element, {[klass]: def}, selector);
}

/** set classes to html elem from angular NgClass  */
export function setNgClass(
  element: HTMLElement,
  classes: Record<string, boolean>,
  selector?: string
) {
  const target: HTMLElement = selector
    ? element.querySelector(selector)
    : element;
  // console.debug(classes, target);
  Object.keys(classes).forEach(klass => {
    if (target) {
      if (classes[klass]) {
        target.classList.add(klass);
      } else {
        target.classList.remove(klass);
      }
    }
  });
}
