--------
node-osc
--------

A very basic OSC client (so far) implementation based heavily on pyOSC_.


Relies on current trunk of node.js for the dgram library.

.. _pyOSC: https://trac.v2.nl/wiki/pyOSC

Example
-------

::
  
  var osc = require('osc');

  var client = osc.Client(10000, '127.0.0.1');
  client.sendSimple('/oscAddress', [200]);

  // slightly more complex
  var msg = osc.Message('/oscAddress');
  msg.append(200);
  msg.append(10);

  client.send(msg);

Licensing
---------

pyOSC looks to be GPL so I guess this is too. More formalities later on.
