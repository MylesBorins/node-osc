'use strict';

const jspack = require('jspack').jspack;

class ShortBuffer {
  constructor(type, buf, requiredLength) {
    this.type = 'ShortBuffer';
    let message = 'buffer [';
    for (let i = 0; i < buf.length; i++) {
      if (i) {
        message += ', ';
      }
      message += buf.charCodeAt(i);
    }
    message += `] too short for ${type}, ${requiredLength} bytes requiredLength`;
    this.message = message;
  }
}

class TString {
  constructor(value) {
    this.value = value;
    this.typetag = 's';
  }
  decode(data) {
    let end = 0;
    while (data[end] && end < data.length) {
      end++;
    }
    if (end === data.length) {
      throw Error('OSC string not null terminated');
    }
    this.value = data.toString('ascii', 0, end);
    const nextData = parseInt(Math.ceil((end + 1) / 4.0) * 4);
    return data.slice(nextData);
  }
}

class TInt {
  constructor(value) {
    this.value = value;
    this.typetag = 'i';
  }
  decode(data) {
    if (data.length < 4) {
      throw new ShortBuffer('int', data, 4);
    }
    this.value = jspack.Unpack('>i', data.slice(0, 4))[0];
    return data.slice(4);
  }
}

class TFloat {
  constructor(value) {
    this.value = value;
    this.typetag = 'f';
  }
  decode(data) {
    if (data.length < 4) {
      throw new ShortBuffer('float', data, 4);
    }

    this.value = jspack.Unpack('>f', data.slice(0, 4))[0];
    return data.slice(4);
  }
}

class TDouble {
  constructor(value) {
    this.value = value;
    this.typetag = 'd';
  }
  decode(data) {
    if (data.length < 8) {
      throw new ShortBuffer('double', data, 8);
    }
    this.value = jspack.Unpack('>d', data.slice(0, 8))[0];
    return data.slice(8);
  }
}

class TTrue {
  constructor(value) {
    this.value = value;
    this.typetag = 'T';
  }
  decode(data) {
    this.value = true;
    return data;
  }
}

class TFalse {
  constructor(value) {
    this.value = value;
    this.typetag = 'F';
  }
  decode(data) {
    this.value = false;
    return data;
  }
}

class TBlob {
  constructor(value) {
    this.value = value;
    this.typetag = 'b';
  }
  decode(data) {
    const length = jspack.Unpack('>i', data.slice(0, 4))[0];
    const nextData = parseInt(Math.ceil((length) / 4.0) * 4) + 4;
    this.value = data.slice(4, length + 4);
    return data.slice(nextData);
  }
}

function TTime (value) { this.value = value; }
TTime.prototype = {
    typetag: 't',
    decode: function (data) {
        if (data.length < 8) {
            throw new ShortBuffer('time', data, 8);
        }
        const raw = jspack.Unpack('>LL', data.slice(0, 8));
        const secs = raw[0];
        const fracs = raw[1];
        this.value = secs + fracs / 4294967296;
        return data.slice(8);
    }
};

module.exports = {
  TString,
  TInt,
  TTime,
  TFloat,
  TBlob,
  TDouble,
  TTrue,
  TFalse
};
