'use strict';

var childProcess = require('child_process');

let proc;
let stdin;
let stdout;
let stderr;

let _lastStatusCode = 0;
let _isListenSet = false;
let _listenFn;

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
    stopListen: stopListen,
    onResize: onResize,
    childSpawnSync: childSpawnSync,
    childSpawn: childSpawn,
    getLastStatusCode: getLastStatusCode,
    setLastStatusCode: setLastStatusCode,
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

    //i don't want binary, do you?
    stdin.setEncoding('hex');

    _isListenSet = true;
  }

  //resume stdin in the parent process (node app won't quit all by itself
  //unless an error or process.exit() happens)
  //stdin.resume();

  _listenFn = (key) => {
    return cb(key);
  };

  //on any data into stdin
  stdin.on('data', _listenFn);
}

function stopListen() {
  stdin.removeListener('data', _listenFn);
}

//cb(height, width)
function onResize(cb) {
  stdout.on('resize', function() {
    return cb(stdout.rows, stdout.columns);
  });
}

function childSpawnSync(cmd, args) {
  let childProc = childProcess.spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: proc.cwd(),
    env: proc.env,
  });
  _lastStatusCode = childProc.status;
  return childProc;
}

function childSpawn(cmd, args, cb) {
  let childProc = childProcess.spawn(cmd, args, {
    stdio: 'inherit',
    cwd: proc.cwd(),
    env: proc.env,
  });

  let _isDone = false;

  childProc.on('close', function(code) {
    if (!_isDone) {
      _isDone = true;
      _lastStatusCode = code;
      return cb();
    }
  });

  childProc.on('error', function() {
    if (!_isDone) {
      _isDone = true;
      _lastStatusCode = 1;
      return cb();
    }
  });
}

function getLastStatusCode() {
  return _lastStatusCode;
}

function setLastStatusCode(code) {
  _lastStatusCode = code;
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
    case 'CURSOR_LEFT':
      write('\x1b[1D');
      break;
    case 'CURSOR_RIGHT':
      write('\x1b[1C');
      break;
    case 'INSERT_MODE':
      write('\x1b[4h');
      break;
    case 'NORMAL_MODE':
      write('\x1b[2h');
      break;
    default:
      break;
  }
}
