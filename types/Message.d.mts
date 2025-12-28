export default Message;
/**
 * Represents an OSC message with an address and arguments.
 *
 * OSC messages consist of an address pattern (string starting with '/')
 * and zero or more arguments of various types.
 *
 * @class
 *
 * @example
 * // Create a message with constructor arguments
 * const msg = new Message('/test', 1, 2, 'hello');
 *
 * @example
 * // Create a message and append arguments
 * const msg = new Message('/test');
 * msg.append(1);
 * msg.append('hello');
 * msg.append(3.14);
 */
declare class Message {
    /**
     * Create an OSC Message.
     *
     * @param {string} address - The OSC address pattern (e.g., '/oscillator/frequency').
     * @param {...*} args - Optional arguments to include in the message.
     *
     * @example
     * const msg = new Message('/test');
     *
     * @example
     * const msg = new Message('/test', 1, 2, 3);
     *
     * @example
     * const msg = new Message('/synth', 'note', 60, 0.5);
     */
    constructor(address: string, ...args: any[]);
    oscType: string;
    address: string;
    args: any[];
    /**
     * Append an argument to the message.
     *
     * Automatically detects the type based on the JavaScript type:
     * - Integers are encoded as OSC integers
     * - Floats are encoded as OSC floats
     * - Strings are encoded as OSC strings
     * - Booleans are encoded as OSC booleans
     * - Arrays are recursively appended
     * - Objects with a 'type' property are used as-is
     *
     * @param {*} arg - The argument to append. Can be:
     *   - A primitive value (number, string, boolean)
     *   - An array of values (will be recursively appended)
     *   - An object with 'type' and 'value' properties
     *
     * @throws {Error} If the argument type cannot be encoded.
     *
     * @example
     * const msg = new Message('/test');
     * msg.append(42);           // Integer
     * msg.append(3.14);         // Float
     * msg.append('hello');      // String
     * msg.append(true);         // Boolean
     *
     * @example
     * // Append multiple values at once
     * msg.append([1, 2, 3]);
     *
     * @example
     * // Explicitly specify type
     * msg.append({ type: 'float', value: 42 });
     */
    append(arg: any): void;
}
//# sourceMappingURL=Message.d.mts.map