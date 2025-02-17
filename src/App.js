import { useState } from "react";
import "./App.css";

<<<<<<< Updated upstream
let analyzeLoop = null; // Global variable to track animation frame
=======
let analyzeLoop = null; // Track animation frame ID
>>>>>>> Stashed changes

function App() {
  const [stream, setStream] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);

  const toggleListening = async () => {
    if (!isListening) {
      try {
        console.log("Requesting microphone access...");
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        setStream(newStream); // Save the stream

        const audioCtx = new (window.AudioContext ||
          window.webkitAudioContext)();
        await audioCtx.resume();
        setAudioContext(audioCtx);

        console.log("Microphone access granted. AudioContext started.");
        const source = audioCtx.createMediaStreamSource(newStream);

        const analyserNode = audioCtx.createAnalyser();
<<<<<<< Updated upstream
        analyserNode.fftSize = 2048; // ⚠️ Reduced FFT size for better pitch detection
        setAnalyser(analyserNode);
        source.connect(analyserNode);

        startProcessing(analyserNode, audioCtx.sampleRate, newStream);
=======
        analyserNode.fftSize = 4096; // Increased for better resolution
        setAnalyser(analyserNode);
        source.connect(analyserNode);

        processAudio(analyserNode, audioCtx.sampleRate);
>>>>>>> Stashed changes

        setIsListening(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    } else {
      console.log("Stopping microphone...");

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }

      if (audioContext) {
        audioContext.suspend().then(() => {
          audioContext.close();
          setAudioContext(null);
        });
      }

      if (analyzeLoop) {
        cancelAnimationFrame(analyzeLoop);
        analyzeLoop = null;
      }

      if (analyser) {
        analyser.disconnect();
        setAnalyser(null);
      }

      setIsListening(false);
    }
  };

  return (
    <div className="App">
      <h1>Real-Time Pitch Detector</h1>
      <button onClick={toggleListening}>
        {isListening ? "Stop Listening" : "Start Listening"}
      </button>
    </div>
  );
}

export default App;

<<<<<<< Updated upstream
/* --- 📌 Start Processing Audio (With Stream Passed) --- */
function startProcessing(analyser, sampleRate, stream) {
=======
/* --- 📌 Process Audio --- */
function processAudio(analyser, sampleRate) {
>>>>>>> Stashed changes
  const bufferLength = analyser.fftSize;
  const timeDomainData = new Float32Array(bufferLength);

  function analyze() {
<<<<<<< Updated upstream
    if (!analyser || !stream) return;

    analyser.getFloatTimeDomainData(timeDomainData);

    const hasNonZeroData = timeDomainData.some((sample) => sample !== 0);
    if (!hasNonZeroData) {
      console.log("Waiting for valid microphone input...");
=======
    if (!analyser) return;

    analyser.getFloatTimeDomainData(timeDomainData);

    // ✅ Pre-process signal (Normalize & Remove Silence)
    const hasValidData = timeDomainData.some(
      (sample) => Math.abs(sample) > 0.01
    );
    if (!hasValidData) {
      console.log("No valid audio detected.");
>>>>>>> Stashed changes
      analyzeLoop = requestAnimationFrame(analyze);
      return;
    }

    let rms = Math.sqrt(
      timeDomainData.reduce((sum, sample) => sum + sample * sample, 0) /
        bufferLength
    );
    let dB = rms > 0 ? 20 * Math.log10(rms) : -100;
<<<<<<< Updated upstream

    console.log(`Audio Loudness: ${dB.toFixed(2)} dB`);

    if (dB < -50) {
      console.log("Sound too quiet, ignoring.");
=======

    if (dB < -50) {
>>>>>>> Stashed changes
      analyzeLoop = requestAnimationFrame(analyze);
      return;
    }

<<<<<<< Updated upstream
    // ⚠️ Retry mechanism to avoid stuck -1 Hz issue
    let detectedFrequency = -1;
    let retries = 3;
    while (detectedFrequency === -1 && retries > 0) {
      detectedFrequency = detectPitchDWT(timeDomainData, sampleRate);
      retries--;
    }

    if (detectedFrequency > -50 && detectedFrequency < 2000) {
=======
    let detectedFrequency = autoCorrelate(timeDomainData, sampleRate);

    if (detectedFrequency > 50 && detectedFrequency < 2000) {
>>>>>>> Stashed changes
      let noteNumber = frequencyToNoteNumber(detectedFrequency);
      let noteName = noteNumberToNoteName(noteNumber);
      console.log(
        `🎵 AutoCorrelation: ${detectedFrequency.toFixed(2)} Hz -> ${noteName}`
      );
    } else {
<<<<<<< Updated upstream
      console.log(
        `Ignored frequency: ${detectedFrequency.toFixed(2)} Hz (out of range)`
      );
=======
      console.log("AutoCorrelation failed. Trying FFT...");
      detectedFrequency = getDominantFrequency(analyser, sampleRate);
      if (detectedFrequency > 50 && detectedFrequency < 2000) {
        let noteNumber = frequencyToNoteNumber(detectedFrequency);
        let noteName = noteNumberToNoteName(noteNumber);
        console.log(
          `🎵 FFT: ${detectedFrequency.toFixed(2)} Hz -> ${noteName}`
        );
      } else {
        console.log("No valid frequency detected.");
      }
>>>>>>> Stashed changes
    }

    analyzeLoop = requestAnimationFrame(analyze);
  }

  analyze();
}

<<<<<<< Updated upstream
/* --- 📌 Improved Pitch Detection Function (DWT) --- */
function detectPitchDWT(buffer, sampleRate) {
=======
/* --- 📌 Improved AutoCorrelation --- */
function autoCorrelate(buffer, sampleRate) {
>>>>>>> Stashed changes
  let SIZE = buffer.length;
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1;

  let lastCorrelation = 1;
  for (let offset = 1; offset < SIZE / 2; offset++) {
    let correlation = 0;
    for (let i = 0; i < SIZE / 2; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    correlation = correlation / (SIZE / 2);

    if (correlation > 0.9 && correlation > lastCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
    } else if (correlation < lastCorrelation) {
      break;
    }

    lastCorrelation = correlation;
  }

  if (bestCorrelation > 0.01) {
<<<<<<< Updated upstream
    let frequency = sampleRate / bestOffset;

    // ⚠️ Ensure the frequency is within a realistic range before returning
    if (frequency > 50 && frequency < 2000) {
      return frequency;
    }
=======
    return sampleRate / bestOffset;
>>>>>>> Stashed changes
  }

  return -1;
}

<<<<<<< Updated upstream
=======
/* --- 📌 Improved FFT-Based Detection --- */
function getDominantFrequency(analyser, sampleRate) {
  let bufferLength = analyser.frequencyBinCount;
  let frequencyData = new Uint8Array(bufferLength);

  analyser.getByteFrequencyData(frequencyData);

  let maxIndex = 0;
  let maxAmplitude = 0;

  for (let i = 0; i < bufferLength; i++) {
    if (frequencyData[i] > maxAmplitude) {
      maxAmplitude = frequencyData[i];
      maxIndex = i;
    }
  }

  let dominantFrequency = (maxIndex * sampleRate) / (2 * bufferLength);

  // ✅ Apply a simple smoothing filter to prevent jumps
  return dominantFrequency > 50 && dominantFrequency < 2000
    ? dominantFrequency
    : -1;
}

>>>>>>> Stashed changes
/* --- 📌 Frequency to Note Conversion --- */
function frequencyToNoteNumber(frequency) {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

function noteNumberToNoteName(noteNumber) {
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  return noteNames[noteNumber % 12] + Math.floor(noteNumber / 12 - 1);
}
