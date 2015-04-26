'use strict';

let term = require('./lib/termkit.js')(process);

//TODO: options processing, should be require()'d in from config file
let b = {
  currentLine: '',
  posInCurrentLine: 0,
  isActive: true,
};

if (!term.isTTY()) {
  term.writeErr('Must run from a TTY process. Exiting.');
  process.exit(1);
}

term.setWindowTitle('b4sh v0.1');

term.listen(listenFn);

function listenFn(hex) {
  //TODO: eventually ditch ctrl-f and ctrl-d, just pass hex to
  //lineEditor() here

  //ctrl-f
  if (hex === '06') {
    term.write(hex + ' | ');
    launchVim();
    term.write('\n');
  //ctrl-d
  } else if (hex === '04') {
    term.write(hex + ' | ');
    launchTmux();
    term.write('\n');
  //anything else
  } else {
    lineEditor(hex);
  }
}

drawPrompt();

function lineEditor(hex) {
  //TODO: this part should be configurable, loaded via require() or something
  let key = hex2key(hex);

  //TODO: this part should be middleware based?
  //cb(key, updateDisplayCB, updateCurrentLineCB, next)
  if (key === 'CTRL_C') {
    term.setLastStatusCode(1);
    b.currentLine = '';
    b.posInCurrentLine = '';
    drawPrompt();
  } else if (key === 'CR') {
    execLine(b.currentLine);
  } else if (key === 'DEL') {
    if (b.posInCurrentLine > 0) {
      b.currentLine = b.currentLine.slice(0, b.currentLine.length - 1);
      term.sendEscChar('BACKSPACE');
      b.posInCurrentLine -= 1;
    }
  } else if (key === 'LEFT') {
    if (b.posInCurrentLine > 0) {
      term.sendEscChar('CURSOR_LEFT');
      b.posInCurrentLine -= 1;
    }
  } else if (key === 'RIGHT') {
    if (b.posInCurrentLine < b.currentLine.length) {
      term.sendEscChar('CURSOR_RIGHT');
      b.posInCurrentLine += 1;
    }
  } else {
    if (b.posInCurrentLine === b.currentLine.length) {
      b.currentLine += key;
      term.sendEscChar('NORMAL_MODE');
      term.write(key);
    } else {
      b.currentLine = b.currentLine.slice(0, b.posInCurrentLine) +
        key +
        b.currentLine.slice(b.posInCurrentLine);
      term.sendEscChar('INSERT_MODE');
      term.write(key);
    }
    b.posInCurrentLine += 1;
  }
}

//TODO: this should be middleware based, specified in config file and
//require()'d in
function execLine(line) {
  term.sendEscChar('NEWLINE');
  term.write(b.currentLine);
  term.sendEscChar('NEWLINE');

  if (line === 'exit') {
    return process.exit(0);
  } else if (line === '') {
    b.currentLine = '';
    b.posInCurrentLine = 0;
    term.setLastStatusCode(0);
    drawPrompt();
    return;
  }

  /*
  //NOTE: async childSpawn can be laggy in tmux. dunno why .. ?
  term.stopListen();
  term.childSpawn(line, [], () => {
    term.listen(listenFn);
    b.currentLine = '';
    b.posInCurrentLine = 0;
    drawPrompt();
  });
  */

  term.childSpawnSync(line, []);
  b.currentLine = '';
  b.posInCurrentLine = 0;
  drawPrompt();
}

//TODO: this should be configurable in options
function drawPrompt() {
  term.sendEscChar('NEWLINE');
  term.write('$ [' + term.getLastStatusCode() + '] > ');
}

term.onResize((h, w) => {
  term.write(`screen size has changed to ${h} x ${w} \(height x width\)!\n`);
});

function launchVim() {
  term.childSpawnSync('vim', []);
  drawPrompt();
}

function launchTmux() {
  //term.childSpawnSync('tmux', ['new', '-s', 'asdf']);
  term.childSpawnSync('bash', ['-c', 'tmux new -s asdf']);
  drawPrompt();
}

function launchBashCommand() {
  term.childSpawnSync('bash', ['-c', 'tmux new -s asdf']);
  drawPrompt();
}

//TODO: this should be configurable, basically how does your shell
//map the hex inputs to a key
function hex2key(hex) {
  switch (hex) {
    case '00': return 'NUL'; //Null char
    case '01': return 'SOH'; //Start of Heading
    case '02': return 'STX'; //Start of Text
    case '03': return 'CTRL_C'; //End of Text //ESC
    case '04': return 'EOT'; //End of Transmission
    case '05': return 'ENQ'; //Enquiry
    case '06': return 'ACK'; //Acknowledgment
    case '07': return 'BEL'; //Bell
    case '08': return 'BS';  //Back Space
    case '09': return 'HT';  //Horizontal Tab
    case '0a': return 'LF';  //Line Feed
    case '0b': return 'VT';  //Vertical Tab
    case '0c': return 'FF';  //Form Feed
    case '0d': return 'CR';  //Carriage Return
    case '0e': return 'SO';  //Shift Out / X-On
    case '0f': return 'SI';  //Shift In / X-Off
    case '10': return 'DLE'; //Data Line Escape
    case '11': return 'DC1'; //Device Control 1 (oft. XON)
    case '12': return 'DC2'; //Device Control 2
    case '13': return 'DC3'; //Device Control 3 (oft. XOFF)
    case '14': return 'DC4'; //Device Control 4
    case '15': return 'NAK'; //Negative Acknowledgement
    case '16': return 'SYN'; //Synchronous Idle
    case '17': return 'ETB'; //End of Transmit Block
    case '18': return 'CAN'; //Cancel
    case '19': return 'EM';  //End of Medium
    case '1a': return 'SUB'; //Substitute
    case '1b': return 'ESC'; //Escape
    case '1c': return 'FS';  //File Separator
    case '1d': return 'GS';  //Group Separator
    case '1e': return 'RS';  //Record Separator
    case '1f': return 'US';  //Unit Separator
    case '20': return ' '; //Space
    case '21': return '!'; //Exclamation mark
    case '22': return '"'; //Double quotes (or speech marks)
    case '23': return '#'; //Number
    case '24': return '$'; //Dollar
    case '25': return '%'; //Procenttecken
    case '26': return '&'; //&amp; Ampersand
    case '27': return '\''; //Single quote
    case '28': return '('; //Open parenthesis (or open bracket)
    case '29': return ')'; //Close parenthesis (or close bracket)
    case '2a': return '*'; //Asterisk
    case '2b': return '+'; //Plus
    case '2c': return ','; //Comma
    case '2d': return '-'; //Hyphen
    case '2e': return '.'; //Period, dot or full stop
    case '2f': return '/'; //Slash or divide
    case '30': return '0'; //Zero
    case '31': return '1'; //One
    case '32': return '2'; //Two
    case '33': return '3'; //Three
    case '34': return '4'; //Four
    case '35': return '5'; //Five
    case '36': return '6'; //Six
    case '37': return '7'; //Seven
    case '38': return '8'; //Eight
    case '39': return '9'; //Nine
    case '3a': return ':'; //Colon
    case '3b': return ';'; //Semicolon
    case '3c': return '<'; //&lt;  Less than (or open angled bracket)
    case '3d': return '='; //Equals
    case '3e': return '>'; //&gt;  Greater than (or close angled bracket)
    case '3f': return '?'; //Question mark
    case '40': return '@'; //At symbol
    case '41': return 'A'; //Uppercase A
    case '42': return 'B'; //Uppercase B
    case '43': return 'C'; //Uppercase C
    case '44': return 'D'; //Uppercase D
    case '45': return 'E'; //Uppercase E
    case '46': return 'F'; //Uppercase F
    case '47': return 'G'; //Uppercase G
    case '48': return 'H'; //Uppercase H
    case '49': return 'I'; //Uppercase I
    case '4a': return 'J'; //Uppercase J
    case '4b': return 'K'; //Uppercase K
    case '4c': return 'L'; //Uppercase L
    case '4d': return 'M'; //Uppercase M
    case '4e': return 'N'; //Uppercase N
    case '4f': return 'O'; //Uppercase O
    case '50': return 'P'; //Uppercase P
    case '51': return 'Q'; //Uppercase Q
    case '52': return 'R'; //Uppercase R
    case '53': return 'S'; //Uppercase S
    case '54': return 'T'; //Uppercase T
    case '55': return 'U'; //Uppercase U
    case '56': return 'V'; //Uppercase V
    case '57': return 'W'; //Uppercase W
    case '58': return 'X'; //Uppercase X
    case '59': return 'Y'; //Uppercase Y
    case '5a': return 'Z'; //Uppercase Z
    case '5b': return '['; //Opening bracket
    case '5c': return '\\'; //Backslash
    case '5d': return ']'; //Closing bracket
    case '5e': return '^'; //Caret - circumflex
    case '5f': return '_'; //Underscore
    case '60': return '`'; //Grave accent
    case '61': return 'a'; //Lowercase a
    case '62': return 'b'; //Lowercase b
    case '63': return 'c'; //Lowercase c
    case '64': return 'd'; //Lowercase d
    case '65': return 'e'; //Lowercase e
    case '66': return 'f'; //Lowercase f
    case '67': return 'g'; //Lowercase g
    case '68': return 'h'; //Lowercase h
    case '69': return 'i'; //Lowercase i
    case '6a': return 'j'; //Lowercase j
    case '6b': return 'k'; //Lowercase k
    case '6c': return 'l'; //Lowercase l
    case '6d': return 'm'; //Lowercase m
    case '6e': return 'n'; //Lowercase n
    case '6f': return 'o'; //Lowercase o
    case '70': return 'p'; //Lowercase p
    case '71': return 'q'; //Lowercase q
    case '72': return 'r'; //Lowercase r
    case '73': return 's'; //Lowercase s
    case '74': return 't'; //Lowercase t
    case '75': return 'u'; //Lowercase u
    case '76': return 'v'; //Lowercase v
    case '77': return 'w'; //Lowercase w
    case '78': return 'x'; //Lowercase x
    case '79': return 'y'; //Lowercase y
    case '7a': return 'z'; //Lowercase z
    case '7b': return '{'; //Opening brace
    case '7c': return '|'; //Vertical bar
    case '7d': return '}'; //Closing brace
    case '7e': return '~'; //Equivalency sign - tilde
    case '7f': return 'DEL'; //Delete
    case '1b5b41': return 'UP'; //Up arrow
    case '1b5b42': return 'DOWN'; //Down arrow
    case '1b5b44': return 'LEFT'; //Down arrow
    case '1b5b43': return 'RIGHT'; //Down arrow

    //leave this in, handy for prompting you to improve your keymap when
    //you hit a key thats not known
    default: return 'UNKNOWN(' + hex + ')';
  }
}
