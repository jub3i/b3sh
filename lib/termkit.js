'use strict';

var childProcess = require('child_process');

let proc;
let stdin;
let stdout;
let stderr;

let _lastStatusCode = null;
let _isListenSet = false;

module.exports = (process) => {
  proc = process;
  stdin = proc.stdin;
  stdout = proc.stdout;
  stderr = proc.stderr;

  let termkit = {
    setWindowTitle: setWindowTitle,
    write: write,
    writeErr: writeErr,
    getHeight: getHeight,
    getWidth: getWidth,
    isTTY: isTTY,
    listen: listen,
    onResize: onResize,
    childSpawnSync: childSpawnSync,
    getLastStatusCode: getLastStatusCode,
    sendEscChar: sendEscChar,
  };

  return termkit;
};

function setWindowTitle(title) {
  stdout.write('\x1b]2;' + title + '\x07');
}

function write(str) {
  stdout.write(str);
}

function writeErr(str) {
  stderr.write(str);
}

function getHeight() {
  return stdout.rows;
}

function getWidth() {
  return stdout.columns;
}

function isTTY() {
  return stdout.isTTY;
}

//cb(key) where key is hex keypress string
function listen(cb) {
  //only do init on stdin once
  if (!_isListenSet) {
    //without this, we would only get streams once enter is pressed
    stdin.setRawMode(true);

    //resume stdin in the parent process (node app won't quit all by itself
    //unless an error or process.exit() happens)
    stdin.resume();

    //i don't want binary, do you?
    stdin.setEncoding('hex');

    _isListenSet = true;
  }

  //on any data into stdin
  stdin.on('data', function(key) {
    return cb(key);
  });
}

//cb(height, width)
function onResize(cb) {
  stdout.on('resize', function() {
    return cb(stdout.rows, stdout.columns);
  });
}

function childSpawnSync(cmd, args) {
  let syncProc = childProcess.spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: proc.cwd(),
    env: proc.env,
  });
  _lastStatusCode = syncProc.status;
  return syncProc;
}

function getLastStatusCode() {
  return _lastStatusCode;
}

//TODO: https://www.npmjs.com/package/ansi-escape-codes
//write own or use this one?
function sendEscChar(chr) {
  switch (chr) {
    case 'DEL':
      write('\x1b[1P');
      break;
    case 'BACKSPACE':
      write('\x1b[D\x1b[1P');
      break;
    case 'NEWLINE':
      write('\x0d\x0a');
      break;
    default:
      break;
  }
}
