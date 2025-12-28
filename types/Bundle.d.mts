export default Bundle;
/**
 * Represents an OSC bundle containing multiple messages or nested bundles.
 *
 * OSC bundles allow multiple messages to be sent together, optionally with
 * a timetag indicating when the bundle should be processed.
 *
 * @class
 *
 * @example
 * // Create a bundle without a timetag
 * const bundle = new Bundle(['/one', 1], ['/two', 2]);
 *
 * @example
 * // Create a bundle with a timetag
 * const bundle = new Bundle(10, ['/one', 1], ['/two', 2]);
 *
 * @example
 * // Nest bundles
 * const bundle1 = new Bundle(['/one', 1]);
 * const bundle2 = new Bundle(['/two', 2]);
 * bundle1.append(bundle2);
 */
declare class Bundle {
    /**
     * Create an OSC Bundle.
     *
     * @param {number} [timetag=0] - Optional timetag for the bundle. If the first argument
     *   is not a number, it will be treated as a message element and timetag will default to 0.
     * @param {...(Message|Bundle|Array)} elements - Messages or bundles to include.
     *   Arrays will be automatically converted to Message objects.
     *
     * @example
     * // Bundle without timetag
     * const bundle = new Bundle(['/test', 1], ['/test2', 2]);
     *
     * @example
     * // Bundle with timetag of 10
     * const bundle = new Bundle(10, ['/test', 1]);
     *
     * @example
     * // Bundle with Message objects
     * const msg1 = new Message('/one', 1);
     * const msg2 = new Message('/two', 2);
     * const bundle = new Bundle(msg1, msg2);
     */
    constructor(timetag?: number, ...elements: (Message | Bundle | any[])[]);
    oscType: string;
    timetag: number;
    elements: (Message | Bundle)[];
    /**
     * Append a message or bundle to this bundle.
     *
     * @param {Message|Bundle|Array} element - The message or bundle to append.
     *   Arrays will be automatically converted to Message objects.
     *
     * @example
     * const bundle = new Bundle();
     * bundle.append(['/test', 1]);
     * bundle.append(new Message('/test2', 2));
     *
     * @example
     * // Append a nested bundle
     * const bundle1 = new Bundle(['/one', 1]);
     * const bundle2 = new Bundle(['/two', 2]);
     * bundle1.append(bundle2);
     */
    append(element: Message | Bundle | any[]): void;
}
import Message from './Message.mjs';
//# sourceMappingURL=Bundle.d.mts.map