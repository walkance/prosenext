export class SubSink {
  subs: {
    event: string;
    elem: HTMLElement | Document | Window;
    cb: (ev: unknown) => any;
  }[] = [];

  add(
    ...options: {
      elem: HTMLElement | Document | Window;
      event: string;
      cb: (ev: unknown) => any;
    }[]
  ) {
    options.forEach(o => {
      o.elem.addEventListener(o.event, o.cb);
    });
    this.subs.push(...options);
  }

  unsubscribe() {
    this.subs.forEach(obj => obj.elem.removeEventListener(obj.event, obj.cb));
    this.subs = [];
  }
}
