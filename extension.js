// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var child_process = require('child_process');
var path = require('path');

/** RegEx for testing for hex colors */
var hexColorRegEx = /^[A-Fa-f0-9]{6}$/;

/** Regex for testing what to substitute in selection */
var substitutionRegex = /(\#?)([A-Fa-f0-9]{6})(;?)/;


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
var nativeColorPickerExtension = {

  activate: function (context) {
    var self = this;
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "nativecolorpicker" is now active!');

    var disposable = vscode.commands.registerCommand('extension.welcomeMessage', function () { 
      vscode.window.showInformationMessage('Native Color Picker Installed ...');
    });

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('extension.pickColor', function () {
        // The code you place here will be executed every time your command is executed

        // Open Native Color Picker
        self.pick();
    });

    context.subscriptions.push(disposable);
  },
  pick: function () {
    var pickPath = path.resolve(__dirname, './bin/osx_colorpicker');
    var child = this.child = child_process.spawn(
      pickPath,
      getStartColor()
    );

    var stdout = new Buffer(0);
    var stderr = new Buffer(0);

    child.stdout.on('data', function (buffer) {
      stdout = Buffer.concat([ stdout, buffer ]);
    });

    child.stderr.on('data', function (buffer) {
      stderr = Buffer.concat([ stderr, buffer ]);
    });

    child.stdout.on('close', function (err) {
      if (!err) {
        var editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // No open text editor
        }

        var sel = editor.selection;
        var selection = editor.document.getText(sel);
        var color = stdout.toString();

        if (color.length === 6) {
          var selLength = selection.length;

          if (selLength === 6) {
            color = color.toUpperCase();
          }
          else {
            color = "#" + color.toUpperCase();
          }

          if (selection.length === 0) {
            editor.edit(function(textEdit) {
              textEdit.insert(sel.start, color)
            });
          }
          else {
            editor.edit(function(textEdit) {
              textEdit.delete(sel);
              textEdit.insert(sel.start, color)
            });
          }
        }
      }
      else {
        editor.insertText("#");
        editor.insertText(stderr.toString());
        editor.insertText(";");
      }
    });
  }
};

/**
 * Is the selected color text valid. Currently only supports hexadecimal form.
 */
function isValidColor(text) {
  return hexColorRegEx.test(text);
}

/**
 * Returns the start color arguments for the OS X Color picker app, or
 * undefined, if no start color is selected in the editor.
 */
function getStartColor() {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
      return; // No open text editor
  }

  var sel = editor.selection;
  var selection = editor.document.getText(sel);

  if (selection.length === 7) {
    selection = selection.slice(1);
  }

  if (selection.length === 6) {
    return isValidColor(selection.toLowerCase()) ? [ '-startColor', selection.toLowerCase() ] : undefined;
  }
}


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "test" is now active!');

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('extension.pickColor', function () {
        // The code you place here will be executed every time your command is executed

        // Open Native Color Picker
        nativeColorPickerExtension.pick();
    });

    context.subscriptions.push(disposable);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
  if (nativeColorPickerExtension.child) {
    nativeColorPickerExtension.child.kill('SIGKILL');
  }
}

exports.deactivate = deactivate;