
var _submitButton = document.getElementById("vtt_submit"),
  _downloadLink = document.createElement('a'),
  _vtt_content;

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
    textarea = document.getElementById("vtt_content"),
    r = pa.parse(textarea.value, "subtitles/captions/descriptions"),
    wrap = document.getElementById("feedback_wrap"),
    ol = document.getElementById("feedback_list"),
    p = document.getElementById("feedback_status"),
    pre = document.getElementById("feedback_pre")
    ;

  ol.textContent = "";

  if (r.errors.length > 0) {
    if(textarea.value.length <= 0) {
      p.textContent = "nothing to validate";
      wrap.style.background = "HSLA(200, 100%, 40%, 1.00)";
      textarea.style.background = "HSLA(42, 100%, 81%, 1.00)";
      _submitButton.style.background = "HSLA(200, 100%, 40%, 1.00)";
      _submitButton.setAttribute('disabled', true);
    } else if (r.errors.length == 1) {
      p.textContent = "please continue...";
      wrap.style.background = "HSLA(200, 100%, 40%, 1.00)";
      textarea.style.background = "HSLA(42, 100%, 81%, 1.00)";
      _submitButton.style.background = "HSLA(200, 100%, 40%, 1.00)";
      _submitButton.setAttribute('disabled', true);
    } else if (r.errors.length < 5) {
      p.textContent = "Not bad, keep at it!";
      wrap.style.background = "HSLA(200, 100%, 40%, 1.00)";
      textarea.style.background = "HSLA(42, 100%, 81%, 1.00)";
      _submitButton.style.background = "HSLA(200, 100%, 40%, 1.00)";
      _submitButton.setAttribute('disabled', true);
    } else {
      p.textContent = "Uh OH!";
      wrap.style.background = "HSLA(4, 56%, 43%, 1.00)";
      textarea.style.background = "pink";
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
    textarea.style.background = "white";
    _submitButton.style.background = "HSLA(142, 77%, 38%, 1.00)";
    _submitButton.removeAttribute('disabled');

    var data = new Blob([_editArea.value], {type: 'text/vtt'});
    var trackFileURL = _URL.createObjectURL(data);
    _track.src = trackFileURL;
    _vid.textTracks[0].mode = "showing";

  }

  var s = new WebVTTSerializer();
  pre.textContent = s.serialize(r.cues);
  _vtt_content = textarea.value;

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
    if (ext === 'vtt') {
      setTrackFile(file);
      setTrackLabelFromFile(file);
      var reader = new FileReader();
      reader.onload = function(e) {
        _editArea.value = e.target.result;
        testVTT();
      }
      reader.readAsText(file);
    } else if (ext === 'txt') {
      // try to convert from transcript to vtt
      var reader = new FileReader();
      reader.onload = function(e) {
        var txt = e.target.result;
        console.log('@todo: convert transcript to VTT', txt);
        _editArea.value = txt;
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
