import Meyda from 'meyda';

const recordMicBtn = document.getElementById('record-mic-btn');
const fileInput = document.getElementById('audioFile');
const audioPlayer = document.getElementById('audioPlayer');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth * 0.8;
canvas.height = 300;

let micRecorder;
let recordingMic = false;

function updateRecordMicBtnText(recording) {
  recordMicBtn.textContent = recording ? 'Stop Microphone' : 'Record Microphone';
}

async function startMicAndDrawAudio() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  recordingMic = !!stream;
  micRecorder = new MediaRecorder(stream);
  const audioCtx = new AudioContext();
  const audioSource = audioCtx.createMediaStreamSource(stream);

  const analyzer = Meyda.createMeydaAnalyzer({
    audioContext: audioCtx,
    source: audioSource,
    bufferSize: 512,
    featureExtractors: ['rms'],
    callback: features => drawAudio({ rms: features.rms })
  });

  analyzer.start();
}

function endMic() {
  micRecorder.stream.getAudioTracks().forEach(track => track.stop());
  recordingMic = false;
}

recordMicBtn.addEventListener('click', async () => {
  if (!recordingMic) {
    await startMicAndDrawAudio();
    updateRecordMicBtnText(true);
  } else {
    endMic();
    updateRecordMicBtnText(false);
  }
});

fileInput.addEventListener('change', e => {
  const file = e.target.files[0];
  const url = URL.createObjectURL(file);
  audioPlayer.src = url;
});

audioPlayer.onplay = () => {
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audioPlayer);
  source.connect(audioCtx.destination);

  const analyzer = Meyda.createMeydaAnalyzer({
    audioContext: audioCtx,
    source: source,
    bufferSize: 512,
    featureExtractors: ['rms'],
    callback: drawAudio
  });

  analyzer.start();
};

function drawAudio({ rms }) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const height = rms * 200; // Scale the height of the line with RMS value
  const y = canvas.height / 2 - height / 2;

  ctx.fillStyle = '#558822';
  ctx.fillRect(0, y, canvas.width, height);
}

window.onresize = () => {
  canvas.width = window.innerWidth * 0.8;
};