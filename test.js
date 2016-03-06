var pty = require('pty.js');

var cols = process.stdout.columns;
var rows = process.stdout.rows;

var term = pty.spawn('vim', [], {
  name: 'xterm-color',
  cols: cols,
  rows: rows,
  cwd: process.env.HOME,
  env: process.env,
});

term.on('data', function(data) {
  process.stdout.write(data);
});

term.on('close', function() {
  process.stdin.removeListener('data', dataHandler);
  process.stdin.on('data', normalMode);
});

//without this, we would only get streams once enter is pressed
process.stdin.setRawMode(true);

//i don't want binary, do you?
//stdin.setEncoding('hex');

var dataHandler = function(data) {
  term.write(data);
};

var normalMode = function(data) {
  process.stdout.write(data);
};

process.stdin.on('data', dataHandler);

//
//term.write('ls\r');
//term.resize(100, 40);
//term.write('ls /\r');
//
//console.log(term.process);
