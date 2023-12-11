import Meyda from 'meyda';

const recordMicBtn = document.getElementById('record-mic-btn')
const fileInput = document.getElementById('audioFile');
const audioPlayer = document.getElementById('audioPlayer');
const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');

let recordingMic = false
recordMicBtn.addEventListener('click', function () {
  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    recordingMic = !!stream
    // console.log('You let me use your mic!', stream)
    const audioCtx = new AudioContext();
    const audioSource = audioCtx.createMediaStreamSource(stream);
    // // console.log('audioSource', audioSource)
    // WARN: DO NOT connect source (mic) to audio destination (speakers) because it can lead to feedback
    const analyzer = Meyda.createMeydaAnalyzer({
      "audioContext": audioCtx,
      "source": audioSource,
      "bufferSize": 512,
      "featureExtractors": ['rms'],
      "callback": features => drawMicAudioData(features)

    });
    analyzer.start();

  }
  start()
})

fileInput.addEventListener('change', function (e) {
  const file = e.target.files[0];
  const url = URL.createObjectURL(file);
  audioPlayer.src = url;
});

audioPlayer.onplay = () => {
  const audioCtx = new AudioContext();
  const source = audioCtx.createMediaElementSource(audioPlayer);
  
  // connect audio source to speakers
  source.connect(audioCtx.destination)
  const analyzer = Meyda.createMeydaAnalyzer({
    audioContext: audioCtx,
    source: source,
    bufferSize: 512,
    featureExtractors: ['rms'],
    callback: drawAudio
  });
  analyzer.start();
};

function drawAudio({rms}) {
  const w = canvas.width
  const h = canvas.height
  ctx.fillStyle = 'rgba(0,0,0,0.1)'
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#558822'
  ctx.beginPath()
  ctx.moveTo(0, h/2)
  ctx.lineTo(w, h/2);
  ctx.lineWidth = rms;
  ctx.closePath();
  ctx.stroke();
  // Visualization logic here, using 'rms' or other features
}

function drawMicAudioData(features){
  //console.log(features)
  drawAudio({ rms: features.rms })
}