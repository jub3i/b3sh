'use strict';

var childProcess = require('child_process');

let proc;
let stdin;
let stdout;
let stderr;

let lastStatusCode = 0;
let isListenSet = false;
let listenFn;
let childProc;

module.exports = (process) => {
  proc = process;
  stdin = proc.stdin;
  stdout = proc.stdout;
  stderr = proc.stderr;

  let termkit = {
    setWindowTitle: setWindowTitle,

    write: write,
    writeErr: writeErr,
    sendEscChar: sendEscChar,

    getHeight: getHeight,
    getWidth: getWidth,
    isTTY: isTTY,
    listen: listen,

    childSpawn: childSpawn,

    getLastStatusCode: getLastStatusCode,
    setLastStatusCode: setLastStatusCode,

    onResize: onResize,
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

let pipeFn = function pipeFn(data) {
  childProc.stdin.write(data);
};

function pipeStdinToChild() {
  stdin.removeListener('data', listenFn);
  stdin.on('data', pipeFn);
  stdin.setEncoding('utf8');
}

function unpipeStdinToChild() {
  stdin.removeListener('data', pipeFn);
  stdin.setEncoding('hex');
  stdin.on('data', listenFn);
}

//cb(hex) where key is hex string representing a keypress
function listen(cb) {
  //only do init on stdin once
  if (!isListenSet) {
    //without this, we would only get streams once enter is pressed
    stdin.setRawMode(true);

    //i don't want binary, do you?
    stdin.setEncoding('hex');

    isListenSet = true;

    listenFn = function _listenFn(hex) {
      return cb(hex);
    };
  }

  //on any data into stdin
  stdin.on('data', listenFn);
}

//cb(height, width)
function onResize(cb) {
  stdout.on('resize', function() {
    return cb(stdout.rows, stdout.columns);
  });
}

function childSpawn(cmd, args, cb) {
  let _err = null;

  childProc = childProcess.spawn(cmd, args, {
    stdio: ['pipe', stdout, stderr],
    //TODO: keep track of cwd and env stuff in shellState?
    cwd: proc.cwd(),
    env: proc.env,
  });

  //NOTE: stdin.pipe() doesn't seem to work, since the parent proc exits
  //when child proc exits, when piping this way, soln: use seperate listener
  //stdin.pipe(childProc.stdin);
  pipeStdinToChild();

  //childProc.on('exit', function(code) {
  //  console.log('childProc:exit', code);
  //});

  childProc.on('close', function(code) {
    setLastStatusCode(code);

    unpipeStdinToChild();

    return cb(_err);
  });

  childProc.on('error', function(err) {
    _err = err;
  });
}

function getLastStatusCode() {
  return lastStatusCode;
}

function setLastStatusCode(code) {
  lastStatusCode = code;
}

//TODO: https://www.npmjs.com/package/ansi-escape-codes
//write own or use one above?
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
