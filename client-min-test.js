/// ohh hthat what easy

var client = new Client('localhost', 8080);
var msg = new Message('/address', 12, 2);
client.send(msg);

// you can also do it like
// client.send('/address', 1, 2);


