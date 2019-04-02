'use strict';

const jspack = require('jspack').jspack;

const pack = jspack.packTo;

function ShortBuffer(type, buf, requiredLength)
{
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

function TString (value) { this.value = value; }

TString.prototype = {
    typetag: 's',
    decode: function (data) {
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
    },
    encode: function (buf, pos) {
        var len = Math.ceil((this.value.length + 1) / 4.0) * 4;
        return pack('>' + len + 's', buf, pos, [ this.value ]);
    }
};


function TInt (value) { this.value = value; }

TInt.prototype = {
    typetag: 'i',
    decode: function (data) {
        if (data.length < 4) {
            throw new ShortBuffer('int', data, 4);
        }

        this.value = jspack.Unpack('>i', data.slice(0, 4))[0];
        return data.slice(4);
    },
    encode: function (buf, pos) {
        return pack('>i', buf, pos, [ this.value ]);
    }
};


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
    },
    encode: function (buf, pos) {
        return pack('>LL', buf, pos, this.value);
    }
};


function TFloat (value) { this.value = value; }
TFloat.prototype = {
    typetag: 'f',
    decode: function (data) {
        if (data.length < 4) {
            throw new ShortBuffer('float', data, 4);
        }

        this.value = jspack.Unpack('>f', data.slice(0, 4))[0];
        return data.slice(4);
    },
    encode: function (buf, pos) {
        return pack('>f', buf, pos, [ this.value ]);
    }
};


function TBlob (value) { this.value = value; }
TBlob.prototype = {
    typetag: 'b',
    decode: function (data) {
        const length = jspack.Unpack('>i', data.slice(0, 4))[0];
        const nextData = parseInt(Math.ceil((length) / 4.0) * 4) + 4;
        this.value = data.slice(4, length + 4);
        return data.slice(nextData);
    },
    encode: function (buf, pos) {
        const len = Math.ceil((this.value.length) / 4.0) * 4;
        return pack('>i' + len + 's', buf, pos, [len, this.value]);
    }
};


function TDouble (value) { this.value = value; }
TDouble.prototype = {
    typetag: 'd',
    decode: function (data) {
        if (data.length < 8) {
            throw new ShortBuffer('double', data, 8);
        }
        this.value = jspack.Unpack('>d', data.slice(0, 8))[0];
        return data.slice(8);
    },
    encode: function (buf, pos) {
        return pack('>d', buf, pos, [ this.value ]);
    }
};


function TTrue (value) { this.value = value; }
TTrue.prototype = {
    typetag: 'T',
    decode: function (data) {
        this.value = true;
        return data;
    },
    encode: function (buf, pos) {
        return pack('>T', buf, pos, [ true ]);
    }
};


function TFalse (value) { this.value = value; }
TFalse.prototype = {
    typetag: 'F',
    decode: function (data) {
        this.value = false;
        return data;
    },
    encode: function (buf, pos) {
        return pack('>F', buf, pos, [ false ]);
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
