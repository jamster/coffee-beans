(function() {
  var commands = new Commands();
  commands.fetch();
  var curr = commands.size();  // current command

  var output_node = document.getElementById('output');

  var editor = CodeMirror.fromTextArea(document.getElementById("input"), {
    mode: 'coffeescript',
    theme: 'idle',
    extraKeys: {
      "Shift-Enter": CodeMirror.commands.newlineAndIndent,
      "Enter": go,
      "Up": up,
      "Down": down,
      "Ctrl-Space": autocomplete
    }
  });

  editor.focus();

  globalize(_);

  $('#output').css({'max-height': $(window).height() - 130});
  $(window).bind("resize", function() {
    $('#output').css({'max-height': $(window).height() - 130});
  });

  function globalize(obj) {
    for (key in obj) {
      window[key] = obj[key];
    }
  };

  function autocomplete(cm) {
    CodeMirror.simpleHint(cm, CodeMirror.coffeescriptHint);
  }

  function up(cm) {
    if (curr > 0 && topline()) {
      curr -= 1;
      var command = commands.at(curr);
      editor.setValue(command.get('contents'));
    } else {
      CodeMirror.commands.goLineUp(cm);
    }
  };

  function down(cm) {
    if (curr < commands.size() && botline()) {
      curr += 1;
      if (curr != commands.size()) {
        var command = commands.at(curr);
        editor.setValue(command.get('contents'));
      } else {
        editor.setValue("");
      }
    } else {
      CodeMirror.commands.goLineDown(cm);
    }
  };
  
  function topline() {
    return coords().line == 0;
  };

  function botline() {
    var lines = editor.lineCount();
    return coords().line == lines - 1;
  };

  function coords() {
    var cursor = editor.cursorCoords();
    return editor.coordsChar(cursor);
  };

  function go() {
    var code = editor.getValue();
    editor.setValue("");

    var command = commands.create({
      contents: code
    });
    (new CommandView({
      model: command
    })).render();

    jscode = command.compile();

    if (jscode.type == "success") {
      // with underscore
      jscode = "with (_) {\n" + jscode.result + "}";
      try {
        var result = eval.call(null, jscode);

        if (!_.isUndefined(result)) { 
          // print result
          try { 
            output(result.toString());
          } catch (error) {
            output(result);
          }
        }
      } catch (error) {
        output_error("Javascript error: " + result);
      }
    } else if (jscode.type == "error") {
      output_error("CoffeeScript error: " + jscode.result.message);
    }

    curr = commands.size();
  };

  function output_print(txt, className) {
    var txt_node = document.createElement('div');
    txt_node.appendChild(document.createTextNode(txt));
    txt_node.className = className;
    output_node.appendChild(txt_node);
    $('#output').animate({scrollTop: $('#output')[0].scrollHeight}, 0);
  };

  window.output = function(result) {
    //var coffee_result = Js2coffee.build(result + "");
    output_print(result, "output");
  };

  function output_error(result) {
    output_print(result, "error");
  };

  var store = {
    code: 8
  };

  $("#store-code").on("click", function() {
    var code = editor.getValue();
    output_print("Saving...", "notice");
    localStorage.setItem("store.code" + store.code.length, code);
    
    output_print("Done", "notice");
  });
})();
