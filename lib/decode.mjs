import { fromBuffer } from 'osc-min';

function decode(data) {
    const message = [];
    const decoded = fromBuffer(data);

    message.push(decoded.address);
    decoded.args.forEach(arg => {
      message.push(arg.value);
    });

    return message;
}

export default decode;
