var termkit = require( 'terminal-kit' );
var term = termkit.terminal;
var util = require('util');


term.windowTitle('booobs');
term.fullscreen(true);
term.moveTo(3, 10) ;
term('height: ' + term.height + ' width: ' + term.width);

/*
setTimeout(function() {
  term.clear();
  process.exit(0);
},2000);
*/

function terminate() {
    term.grabInput(false);
    //term.clear();
    term.moveTo(1, 1);
    term('thanks for using bish bash bosh!');
    process.exit(0);
}

term.grabInput();

term.on('key', function(name, matches, data) {
    term.eraseLineAfter();
    term.moveTo(3, 20);
    term.yellow('\'key\' event: ', name);
    term.saveCursor();
    term.moveTo(3, 21);
    term.red('\'key\' data: ', util.inspect(data));
    term.moveTo(3, 22);
    term.blue('\'key\' matches: ', util.inspect(matches));
    term.restoreCursor();

    if (matches.indexOf('CTRL_C') >= 0) {
      terminate();
    }
});

//term.clear() ;
//term.moveTo(3, 100) ;
//term('Hello world!\n') ;
//term.saveCursor();
//term.moveTo(5, 10) ;
//term.red('hi');
//term.restoreCursor();
//term('111111\n') ;
