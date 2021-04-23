import Message from './Message.mjs';
import { bundleWarning } from '#internal/warnings';

function sanitize(element) {
  if (element instanceof Array) element = new Message(element[0], ...element.slice(1));
  return element;
}

class Bundle {
  constructor(timetag, ...elements) {
    bundleWarning();
    if (!(typeof timetag === 'number')) {
      elements.unshift(timetag);
      timetag = 0;
    }
    this.timetag = timetag;
    this.elements = elements.map(sanitize);
  }

  append(element) {
    this.elements.push(sanitize(element));
  }
}

export default Bundle;
