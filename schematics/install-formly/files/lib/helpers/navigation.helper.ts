const SCROLL_OFFSET = 0;

export function scrollToTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0);
  }
}

export function scrollToElement(element: Element, offsetTop = SCROLL_OFFSET) {
  if (typeof window !== 'undefined') {
    const y = (element.getBoundingClientRect() as DOMRect).y + offsetTop;
    window.scrollBy({top: y, left: 0});
  }
}
