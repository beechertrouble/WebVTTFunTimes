
var _submitButton = document.getElementById("vtt_submit"),
  _downloadLink = document.createElement('a'),
  _textArea = document.getElementById("vtt_content"),
  _vtt_content,
  _transcriptTimeCodeRegEx = /(\d{2}\:\d{2}\:\d{2}\:\d{2})/
  ;

_submitButton.addEventListener('click', function(e){

  _downloadLink.setAttribute('href', 'data:text/vtt;charset=utf-8,' + encodeURIComponent(_editArea.value));

  var label = _trackLabel.value.length >= 1 ? _trackLabel.value : 'myTrack',
    kind = _trackKind.value,
    lang = _trackLang.value;

  _downloadLink.setAttribute('download', label + '_' + kind + "-" + lang + ".vtt");
  _downloadLink.click();

});

function testVTT() {

  var pa = new WebVTTParser(),
    r = pa.parse(_textArea.value, "subtitles/captions/descriptions"),
    wrap = document.getElementById("feedback_wrap"),
    ol = document.getElementById("feedback_list"),
    p = document.getElementById("feedback_status"),
    pre = document.getElementById("feedback_pre")
    ;

  ol.textContent = "";

  if (r.errors.length > 0) {
    if(_textArea.value.length <= 0) {
      p.textContent = "nothing to validate";
      wrap.style.background = "HSLA(200, 100%, 40%, 1.00)";
      _textArea.style.background = "HSLA(42, 100%, 81%, 1.00)";
      _submitButton.style.background = "HSLA(200, 100%, 40%, 1.00)";
      _submitButton.setAttribute('disabled', true);
    } else if (r.errors.length < 5) {
      p.textContent = "found some errors (" + r.errors.length + ")";
      wrap.style.background = "HSLA(200, 100%, 40%, 1.00)";
      _textArea.style.background = "HSLA(42, 100%, 81%, 1.00)";
      _submitButton.style.background = "HSLA(200, 100%, 40%, 1.00)";
      _submitButton.setAttribute('disabled', true);
    } else {
      p.textContent = "Uh OH!";
      wrap.style.background = "HSLA(4, 56%, 43%, 1.00)";
      _textArea.style.background = "pink";
      _submitButton.style.background = "HSLA(4, 56%, 43%, 1.00)";
      _submitButton.setAttribute('disabled', true);
    }
    for (var i = 0; i < r.errors.length; i++) {
      var error = r.errors[i],
        message = "Line " + error.line,
        li = document.createElement("li")
      if (error.col)
        message += ", column " + error.col
      li.textContent = message + ": " + error.message
      ol.appendChild(li)
    }
  } else {
    p.textContent = "Your WebVTT is valid!";
    wrap.style.background = "HSLA(142, 77%, 38%, 1.00)";
    _textArea.style.background = "white";
    _submitButton.style.background = "HSLA(142, 77%, 38%, 1.00)";
    _submitButton.removeAttribute('disabled');

    var data = new Blob([_editArea.value], {type: 'text/vtt'});
    var trackFileURL = _URL.createObjectURL(data);
    _track.src = trackFileURL;
    _vid.textTracks[0].mode = "showing";

  }

  var s = new WebVTTSerializer();
  pre.textContent = s.serialize(r.cues);
  _vtt_content = _textArea.value;

}
window.testVTT = testVTT;
testVTT();

//
//
//

var _body = document.getElementsByTagName("body")[0],
  _vidWrap = document.getElementById("vid_wrap"),
  _vid =  document.getElementById("vid"),
  _track =  document.getElementById("track"),
  _trackLabel = document.getElementById('vtt_fileName'),
  _trackKind = document.getElementById('vtt_type'),
  _trackLang = document.getElementById('vtt_lang'),
  _URL = window.URL || window.webkitURL,
  _editArea = document.getElementById("vtt_content")
  ;

var nix = function(e){
    e.preventDefault();
    e.stopPropagation();
  },
  setTrackLabelFromFile = function(file) {

    if(_trackLabelModified)
      return false;

    var name = file.name,
      ext = "." + name.split('.').pop(),
      label = name.replace(ext, "");

    _trackLabel.value = label;

  },
  loadVideoFromFile = function(file) {
    var ext = file.name.split(".").pop();
    if (ext === 'mp4' || ext === 'webm' || ext === 'm4v' || ext === 'ogv' || ext === 'ogg') {
      var fileURL = _URL.createObjectURL(file);
      _vid.src = fileURL;
      _vidWrap.classList.add("hasVideo");
      setTrackLabelFromFile(file);
    }
  },
  setTrackFile = function(file) {
    var trackFileURL = _URL.createObjectURL(file);
    _track.src = trackFileURL;
    _vid.textTracks[0].mode = "showing";
  },
  loadVTTfromFile = function(file) {
    var ext = file.name.split(".").pop();
    if (ext === 'vtt' || ext === 'txt') {
      setTrackFile(file);
      setTrackLabelFromFile(file);
      var reader = new FileReader();
      reader.onload = function(e) {
        _editArea.value = e.target.result;
        testVTT();
      }
      reader.readAsText(file);
    } else if (ext === 'doc' || ext === 'docx') {
      // try to convert from transcript to vtt
      var reader = new FileReader();
      reader.onload = function(e) {

        var txt = e.target.result;
        var lines = txt.split("\n"),
          cleaned = ['WEBVTT'];

        lines.forEach(function(line) {
          if(line.search(_transcriptTimeCodeRegEx) >= 1) {

            var split = line.split(_transcriptTimeCodeRegEx),
              derp = [];

            split.forEach(function(s) {
              if(s.search(_transcriptTimeCodeRegEx) >= 0) {
                var time = s.split(/\:/g);
                derp = [time[0] + ':' + time[1] + ":" + time[2] + '.' + time[3] + "0 --> "];
              } else if(derp.length === 1 && s.search(/\x07/g) >= 0) {
                var cue = s.split(/\x07/g);
                if(cue.length <= 3 || cue[2] === undefined || cue[2].length <= 0 || cue[2] === "[END]")
                  return;
                if(cue[2].trim() === 'END')
                  return;
                derp.push(cue[2].replace(/[\u2018|\u2019|\uFFFD]/g, "'").replace(/[\u201C|\u201D]/g, '"'));
                cleaned.push(derp.join("\n"));
              }
            });

          }
        });

        _editArea.value = cleaned.join("\n\n");
        setTrackLabelFromFile(file);
        testVTT();

      };
      reader.readAsText(file);

    }
  }
  ;

var _trackLabelModified = false,
setLabelAsModified = function() {
  _trackLabelModified = true;
};
//_trackLabel.addEventListener('click', setLabelAsModified);
_trackLabel.addEventListener('change', setLabelAsModified);

_body.addEventListener('drag', nix);
_body.addEventListener('dragstart', nix);
_body.addEventListener('dragend', nix);
_body.addEventListener('dragover', nix);
_body.addEventListener('dragenter', nix);
_body.addEventListener('dragleave', nix);
_body.addEventListener('drop', function(e) {

  nix(e);
  var files = e.dataTransfer.files;

  if (files.length <= 0)
    return false;

  var i, count = files.length;
  for(i = 0; i < count; i++) {
    loadVTTfromFile(files[i]);
    loadVideoFromFile(files[i]);
  }

});

_textArea.addEventListener('paste', function(e){
  var clipboardData = e.clipboardData || window.clipboardData;
  var pastedData = clipboardData.getData('Text');
  console.log('PASTED DATA! :::: ', pastedData.search(_transcriptTimeCodeRegEx), (pastedData.match(/\n/g)||[]).length, pastedData.split("\n"));
  //var lines = pastedData.split("\r");
  // setTimeout(function() {
  //   var pastedData = _textArea.value;
  //   console.log('PASTED DATA! :::: ', pastedData.search(_transcriptTimeCodeRegEx), (pastedData.match(/\n/g)||[]).length);
  // }, 250);
});
