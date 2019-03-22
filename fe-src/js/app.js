
(function () {

  var _body = document.getElementsByTagName("body")[0],
    _vidWrap = document.getElementById("vid_wrap"),
    _vid =  document.getElementById("vid"),
    _track =  document.getElementById("track"),
    _trackLabel = document.getElementById('vtt_fileName'),
    _trackKind = document.getElementById('vtt_type'),
    _trackLang = document.getElementById('vtt_lang'),
    _URL = window.URL || window.webkitURL,
    reader,
    _submitButton = document.getElementById("vtt_submit"),
    _downloadLink = document.createElement('a'),
    _fileEditTextarea = document.getElementById("vtt_content"),
    _vtt_content,
    _current_time = '000:00:00.000',
    _current_timeDisplay = document.getElementById("current_time-display"),
    _transcriptTimeCodeRegEx = /(\d{2}\:\d{2}\:\d{2}\:\d{2})/
    ;

  function saveFile() {

    // @todo : check for validity?

    _downloadLink.setAttribute('href', 'data:text/vtt;charset=utf-8,' + encodeURIComponent(_fileEditTextarea.value));

    var label = _trackLabel.value.length >= 1 ? _trackLabel.value : 'myTrack',
      kind = _trackKind.value,
      lang = _trackLang.value;

    _downloadLink.setAttribute('download', label + '_' + kind + "-" + lang + ".vtt");
    _downloadLink.click();
  };

  _submitButton.addEventListener('click', function(e){

    nix(e);
    saveFile();

  });

  function zeroPad(num, size) {
    var s = "000000000" + num;
    return s.substr(s.length-size);
  }

  function currentTimeToTime(secondsDotMilliseconds) {

    var ms = secondsDotMilliseconds * 1000;
    var milliseconds = parseInt((ms%1000)/100),
      seconds = parseInt((ms/1000)%60),
      minutes = parseInt((ms/(1000*60))%60),
      hours = parseInt((ms/(1000*60*60))%24);

    hours = zeroPad(hours, 3);
    minutes = zeroPad(minutes, 2);
    seconds = zeroPad(seconds, 2);

    return hours + ":" + minutes + ":" + seconds + "." + milliseconds + '00';
  }

  function testVTT() {

    var pa = new WebVTTParser(),
      r = pa.parse(_fileEditTextarea.value, "subtitles/captions/descriptions"),
      wrap = document.getElementById("feedback_wrap"),
      ol = document.getElementById("feedback_list"),
      p = document.getElementById("feedback_status"),
      pre = document.getElementById("feedback_pre")
      ;

    ol.textContent = "";

    if (r.errors.length > 0) {
      if(_fileEditTextarea.value.length <= 0) {
        p.textContent = "nothing to validate";
        wrap.style.background = "HSLA(200, 100%, 40%, 1.00)";
        _fileEditTextarea.style.background = "HSLA(42, 100%, 81%, 1.00)";
        _submitButton.style.background = "HSLA(200, 100%, 40%, 1.00)";
        _submitButton.setAttribute('disabled', true);
      } else if (r.errors.length < 5) {
        p.textContent = "found some errors (" + r.errors.length + ")";
        wrap.style.background = "HSLA(200, 100%, 40%, 1.00)";
        _fileEditTextarea.style.background = "HSLA(42, 100%, 81%, 1.00)";
        _submitButton.style.background = "HSLA(200, 100%, 40%, 1.00)";
        _submitButton.setAttribute('disabled', true);
      } else {
        p.textContent = "Uh OH!";
        wrap.style.background = "HSLA(4, 56%, 43%, 1.00)";
        _fileEditTextarea.style.background = "pink";
        _submitButton.style.background = "HSLA(4, 56%, 43%, 1.00)";
        _submitButton.setAttribute('disabled', true);
      }
      for (var i = 0; i < r.errors.length; i++) {
        var error = r.errors[i],
          message = "Line " + error.line,
          li = document.createElement("li");
        if (error.col)
          message += ", column " + error.col;
        li.textContent = message + ": " + error.message;
        ol.appendChild(li);
      }
    } else {

      p.textContent = "Your WebVTT is valid!";
      wrap.style.background = "HSLA(142, 77%, 38%, 1.00)";
      _fileEditTextarea.style.background = "white";
      _submitButton.style.background = "HSLA(142, 77%, 38%, 1.00)";
      _submitButton.removeAttribute('disabled');

      var data = new Blob([_fileEditTextarea.value], {type: 'text/vtt'});
      var trackFileURL = _URL.createObjectURL(data);
      _track.src = trackFileURL;
      _vid.textTracks[0].mode = "showing";

    }

    var s = new WebVTTSerializer();
    pre.textContent = s.serialize(r.cues);
    _vtt_content = _fileEditTextarea.value;

  }
  window.testVTT = testVTT;
  testVTT();

  //
  //
  //

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
        reader = new FileReader();
        reader.onload = function(e) {
          _fileEditTextarea.value = e.target.result;
          testVTT();
        };
        reader.readAsText(file);
      } else if (ext === 'doc' || ext === 'docx') {
        // try to convert from transcript to vtt
        reader = new FileReader();
        reader.onload = function(e) {

          var txt = e.target.result;
          var lines = txt.split("\n"),
            cues = [],
            newValue = ['WEBVTT'],
            startOffset;

          lines.forEach(function(line) {
            if(line.search(_transcriptTimeCodeRegEx) >= 1) {

              var split = line.split(_transcriptTimeCodeRegEx),
                derp = [];

              split.forEach(function(s) {
                if(s.search(_transcriptTimeCodeRegEx) >= 0) {

                  var time = s.split(/\:/g),
                    startHour = time[0]*1,
                    offset = (startHour - 1) >= 0 ? 1 : 0;

                  startOffset = startOffset !== undefined ? startOffset : offset;

                  derp = [
                    [(startHour - startOffset), time[1]*1, time[2]*1, time[3]*1]
                  ];

                } else if(derp.length === 1 && s.search(/\x07/g) >= 0) {
                  var cue = s.split(/\x07/g);
                  if(cue.length <= 3 || cue[2] === undefined || cue[2].length <= 0 || cue[2] === "[END]")
                    return;
                  if(cue[2].trim() === 'END')
                    return;
                  var cleanCueContent = cue[2].replace(/[\u2018|\u2019|\uFFFD]/g, "'").replace(/[\u201C|\u201D]/g, '"'),
                    wordCount = cleanCueContent.split(" ").length;
                  derp.push(cleanCueContent);
                  derp.push(wordCount);
                  cues.push(derp);
                }
              });

            }
          });

          cues.forEach(function(c) {

            var content = c[1],
              start = c[0],
              startHr = start[0],
              startMin = start[1],
              startSec = start[2],
              startMil = start[3],
              endMilTime = zeroPad(startMil + '0', 3),
              startTime = zeroPad(startHr, 3) + ':' + zeroPad(startMin, 2) + ':' + zeroPad(startSec, 2) + '.' + endMilTime,
              wordCount = c[2],
              padSec = Math.round(wordCount * 0.35),
              endSec = startSec + (padSec >= 1 ? padSec : 1),
              endTime;

            if(endSec < 60) {
              endTime = zeroPad(startHr, 3) + ':' + zeroPad(startMin, 2) + ':' + zeroPad(endSec, 2) + '.' + endMilTime;
            } else {
              var addMin = Math.floor(endSec / 60);
              var endMin = startMin + addMin;
              if(endMin < 60) {
                endSec = endSec - (addMin * 60);
                endTime = zeroPad(startHr, 3) + ':' + zeroPad(endMin, 2) + ':' + zeroPad(endSec, 2) + '.' + endMilTime;
              } else {
                var addHrs = (endMin / 60);
                var endHrs = startHr + addHrs;
                endMin = endMin - (endMin * 60);
                endTime = zeroPad(endHrs, 3) + ':' + zeroPad(endMin, 2) + ':' + zeroPad(endSec, 2) + '.' + endMilTime;
              }
            }

            newValue.push(startTime + ' --> ' + endTime + "\n" + content);

          });


          _fileEditTextarea.value = newValue.join("\n\n");
          setTrackLabelFromFile(file);
          testVTT();

          _mb.show({
        		header: "FYI",
        		body: "<p>We had to guess on the end times for each cue.</p><p>You'll likely want to double check our guesses.</p>",
        		//footer: "footer content without markup, but this can take markup too.",
        		//addClass : "the_class_you_want_to_add_to_the_wrap or_classes",
        		showFor : 10000 // number of milliseconds to show the modal for, before hiding it automatically
        	});

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

  function showDroppableState(e) {
    nix(e);
    clearTimeout(hideDroppableStateTimer);
    _body.classList.add('state-droppable');
  }
  var hideDroppableStateTimer;
  function hideDroppableState(e) {
    nix(e);
    clearTimeout(hideDroppableStateTimer);
    hideDroppableStateTimer = setTimeout(function(){
      _body.classList.remove('state-droppable');
    }, 150);
  }

  _body.addEventListener('drag', showDroppableState);
  _body.addEventListener('dragstart', showDroppableState);
  _body.addEventListener('dragend', hideDroppableState);
  _body.addEventListener('dragover', showDroppableState);
  _body.addEventListener('dragenter', showDroppableState);
  _body.addEventListener('dragleave', hideDroppableState);
  _body.addEventListener('drop', function(e) {

    nix(e);
    hideDroppableState(e);
    var files = e.dataTransfer.files;

    if (files.length <= 0)
      return false;

    var i, count = files.length;
    for(i = 0; i < count; i++) {
      loadVTTfromFile(files[i]);
      loadVideoFromFile(files[i]);
    }

  });

  _fileEditTextarea.addEventListener('paste', function(e){
    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text');
    console.log('PASTED DATA! :::: ', pastedData.search(_transcriptTimeCodeRegEx), (pastedData.match(/\n/g)||[]).length, pastedData.split("\n"));
    //var lines = pastedData.split("\r");
    // setTimeout(function() {
    //   var pastedData = _fileEditTextarea.value;
    //   console.log('PASTED DATA! :::: ', pastedData.search(_transcriptTimeCodeRegEx), (pastedData.match(/\n/g)||[]).length);
    // }, 250);
  });

  //
  // video events
  //
  _vid.addEventListener('timeupdate', function(a,b,c){
    // always show the controls ...
    // _vid.setAttribute("controls","controls");
    _current_time = currentTimeToTime(_vid.currentTime);
    _current_timeDisplay.value = _current_time;

  }, false);

  window.addEventListener('trigger.save', function(e){
    saveFile();
  });

  //
  // init some tings
  //
  _tipzy.init();


})();
