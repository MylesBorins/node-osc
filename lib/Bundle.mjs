import Message from './Message.mjs';

/**
 * Convert array to Message if needed
 * @private
 */
function sanitize(element) {
  if (element instanceof Array) element = new Message(element[0], ...element.slice(1));
  return element;
}

/**
 * OSC Bundle - A collection of OSC messages/bundles with an optional timetag
 * @class
 * @example
 * // Bundle without timetag (immediate execution)
 * const bundle = new Bundle(['/one', 1], ['/two', 2]);
 * 
 * // Bundle with timetag
 * const bundle = new Bundle(10, ['/one', 1], ['/two', 2]);
 * 
 * // Nested bundles
 * const outer = new Bundle(['/outer', 1]);
 * outer.append(new Bundle(5, ['/inner', 2]));
 */
class Bundle {
  /**
   * Create a new OSC Bundle
   * @param {number} [timetag] - Optional timetag (Unix timestamp). If first arg is not a number, defaults to 0 (immediate)
   * @param {...(Message|Array)} elements - Messages or arrays to include in the bundle
   */
  constructor(timetag, ...elements) {
    if (!(typeof timetag === 'number')) {
      elements.unshift(timetag);
      timetag = 0;
    }
    this.oscType = 'bundle';
    this.timetag = timetag;
    this.elements = elements.map(sanitize);
  }

  /**
   * Append a message or bundle to this bundle
   * @param {Message|Bundle|Array} element - The element to append
   */
  append(element) {
    this.elements.push(sanitize(element));
  }
}

export default Bundle;
