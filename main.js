import Meyda from 'meyda';

const recordMicBtn = document.getElementById('record-mic-btn');
const fileInput = document.getElementById('audioFile');
const audioPlayer = document.getElementById('audioPlayer');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
const modeBarBtn = document.getElementById('mode-bar');
const modeWaveBtn = document.getElementById('mode-wave');
const modeBrightnessBtn = document.getElementById('mode-brightness');
const modeChromaBtn = document.getElementById('mode-chroma');
const modeLoudnessBtn = document.getElementById('mode-loudness');
canvas.width = window.innerWidth * 0.8;
canvas.height = 300;

let micRecorder;
let recordingMic = false;
let visualizationMode = 'wave'; // 'bar' or 'wave'

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
    featureExtractors: ['rms', 'amplitudeSpectrum', 'spectralCentroid', 'chroma', 'loudness', 'spectralFlux'],
    callback: drawAudio
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
    featureExtractors: ['rms', 'amplitudeSpectrum', 'spectralCentroid', 'chroma', 'loudness', 'spectralFlux'],
    callback: drawAudio
  });

  analyzer.start();
};


function drawWave({rms, amplitudeSpectrum}) {
  
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const amplitude = rms * canvas.height/2; // Scaling factor for wave amplitude
  ctx.beginPath();

  ctx.moveTo(0, canvas.height / 2);
  for (let i = 0; i < canvas.width; i++) {
    const j = i/canvas.width
    const k = Math.floor(j**2*256**0.5)
    const ampSpectral = amplitudeSpectrum[k]
    // Generating a sine wave pattern
    const angle = (i / canvas.width) * 2 * Math.PI; // Normalizing the angle
    const sinValue = Math.sin(angle * 10); // Frequency of the wave
    const y = canvas.height / 2 + sinValue * amplitude *(1+ampSpectral) * (Math.sin(j*Math.PI));
    ctx.lineTo(i, y);
  }

  ctx.strokeStyle = '#558822';
  ctx.lineWidth = 2; // Width of the wave line
  ctx.stroke();
}
function drawSpectralCentroid({ spectralCentroid, amplitudeSpectrum }) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  for (let i = 0; i < canvas.width; i++) {
    const index = Math.floor((i / canvas.width) * amplitudeSpectrum.length);
    const amp = amplitudeSpectrum[index];
    const y = canvas.height / 2 + (amp * spectralCentroid);
    ctx.lineTo(i, y);
  }

  ctx.strokeStyle = 'orange';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawChroma({ chroma }) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const barWidth = canvas.width / chroma.length;
  chroma.forEach((value, i) => {
    const height = value * canvas.height;
    ctx.fillStyle = `hsl(${(i / chroma.length) * 360}, 100%, 50%)`;
    ctx.fillRect(i * barWidth, canvas.height - height, barWidth, height);
  });
}

function drawLoudness({ loudness }) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barWidth = canvas.width / loudness.specific.length;
  loudness.specific.forEach((value, i) => {
    const height = value * canvas.height;
    ctx.fillStyle = `rgb(${255 - (255 * i / loudness.specific.length)}, 100, 100)`;
    ctx.fillRect(i * barWidth, canvas.height - height, barWidth, height);
  });
}

function drawBar(rms) {
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const height = rms * canvas.height/2;
  const y = canvas.height / 2 - height / 2;

  ctx.fillStyle = '#558822';
  ctx.fillRect(0, y, canvas.width, height);
}

function drawAudio({ rms, amplitudeSpectrum, spectralCentroid, chroma, loudness }) {
  if (visualizationMode === 'bar') {
  drawBar(rms);
  } else if (visualizationMode === 'wave') {
    drawWave({rms, amplitudeSpectrum});
    } else if (visualizationMode === 'brightness') {
      drawSpectralCentroid({ spectralCentroid, amplitudeSpectrum })
      }else if (visualizationMode === 'chroma') {
        drawChroma({ chroma })
        }else if (visualizationMode === 'loudness') {
          drawLoudness({ loudness })
          }

}
  
  modeBarBtn.addEventListener('click', () => {
  visualizationMode = 'bar';
  });
  
  modeWaveBtn.addEventListener('click', () => {
    visualizationMode = 'wave';
  });
  modeBrightnessBtn.addEventListener('click', () => {
    visualizationMode = 'brightness';
  });
  modeChromaBtn.addEventListener('click', () => {
    visualizationMode = 'chroma';
  });
  modeLoudnessBtn.addEventListener('click', () => {
    visualizationMode = 'loudness';
  });
  
  window.onresize = () => {
  canvas.width = window.innerWidth * 0.8;
  };