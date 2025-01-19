import { Chord } from "./chord.js";

// Audio analyzer. Records audio and returns
// analysis of results.
//
// Event handlers:
//   onchord -> receives Chord objects found in audio
//   onpower -> receives total power of audio slices
export class AudioAnalyzer {
  constructor(context, worker) {
    this._context = context;
    this._worker = worker;
    this.onchord = null;
    this.onpower = null;

    // Listen for messages from the worker
    this._worker.onmessage = ({ data }) => {
      // If data is an array, it's a chord
      if (Array.isArray(data) && typeof this.onchord === "function") {
        this.onchord(new Chord(data));
      }
      // Otherwise, if numeric, it’s total power
      else if (typeof data === "number" && typeof this.onpower === "function") {
        this.onpower(data);
      }
    };
  }

  // Open a new AudioAnalyzer
  static async open() {
    const bufferSize = 4096;
    const timeStep = 100 - 1; // in ms

    // Create audio pipeline
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const context = new AudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const source = context.createMediaStreamSource(stream);
    const fft = context.createAnalyser();
    const processor = context.createScriptProcessor(bufferSize, 1, 1);

    // FFT settings
    fft.fftSize = bufferSize;
    fft.smoothingTimeConstant = 0.1;
    fft.minDecibels = -70;

    // Connect audio nodes
    source.connect(fft);
    fft.connect(processor);
    processor.connect(context.destination);

    // Buffer for FFT results
    const buffer = new Uint8Array(fft.frequencyBinCount);
    const hzPerBin = context.sampleRate / (2 * fft.frequencyBinCount);

    // Create the worker (ensure the path matches your project structure)
    const worker = new Worker(new URL("./workers/audioWorker.js", import.meta.url));

    // Send initial settings to the worker
    worker.postMessage({ hzPerBin });

    // Trigger analysis periodically
    let next = performance.now() - 1;
    processor.onaudioprocess = () => {
      fft.getByteFrequencyData(buffer);
      if (performance.now() > next) {
        worker.postMessage(buffer);
        next = performance.now() + timeStep;
      }
    };

    return new AudioAnalyzer(context, worker);
  }
}
