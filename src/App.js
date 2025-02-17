import { useState, useEffect } from "react";
import "./App.css";

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
        setStream(newStream);

        const audioCtx = new (window.AudioContext ||
          window.webkitAudioContext)();
        await audioCtx.resume(); // Ensure AudioContext starts properly
        setAudioContext(audioCtx);

        console.log("Microphone access granted. AudioContext started.");

        const source = audioCtx.createMediaStreamSource(newStream);

        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 2048; // Higher resolution for frequency analysis
        setAnalyser(analyserNode);
        source.connect(analyserNode);

        processAudio(analyserNode, audioCtx.sampleRate); // Start real-time processing

        setIsListening(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
      }
    } else {
      console.log("Stopping microphone...");
      stream?.getTracks().forEach((track) => track.stop());

      if (audioContext) {
        audioContext.suspend().then(() => {
          audioContext.close();
        });
      }

      setStream(null);
      setAudioContext(null);
      setAnalyser(null);
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

/* --- HELPER FUNCTIONS --- */

// Process Audio in Real-Time
function processAudio(analyser, sampleRate) {
  const bufferLength = analyser.fftSize;
  const timeDomainData = new Float32Array(bufferLength);

  function analyze() {
    analyser.getFloatTimeDomainData(timeDomainData);

    // Compute loudness (RMS)
    let rms = Math.sqrt(
      timeDomainData.reduce((sum, sample) => sum + sample * sample, 0) /
        bufferLength
    );
    let dB = 20 * Math.log10(rms);

    console.log(`Audio Loudness: ${dB.toFixed(2)} dB`);

    if (dB < -50) {
      requestAnimationFrame(analyze);
      return;
    }

    // Get frequency using AutoCorrelation
    let detectedFrequency = autoCorrelate(timeDomainData, sampleRate);

    if (detectedFrequency > 0) {
      let noteNumber = frequencyToNoteNumber(detectedFrequency);
      let noteName = noteNumberToNoteName(noteNumber);
      console.log(
        `🎵 Detected Frequency: ${detectedFrequency.toFixed(
          2
        )} Hz -> Nearest Note: ${noteName}`
      );
    } else {
      console.log("Trying FFT-based detection...");
      detectedFrequency = getDominantFrequency(analyser, sampleRate);
      if (detectedFrequency > 0) {
        let noteNumber = frequencyToNoteNumber(detectedFrequency);
        let noteName = noteNumberToNoteName(noteNumber);
        console.log(
          `🎵 FFT-Based Frequency: ${detectedFrequency.toFixed(
            2
          )} Hz -> Nearest Note: ${noteName}`
        );
      } else {
        console.log("No valid frequency detected.");
      }
    }

    requestAnimationFrame(analyze); // Keep analyzing in real-time
  }

  analyze(); // Start analysis loop
}

// AutoCorrelation for Pitch Detection
function autoCorrelate(buffer, sampleRate) {
  let SIZE = buffer.length;
  let bestOffset = -1;
  let bestCorrelation = 0;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // Ignore silence

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
    let frequency = sampleRate / bestOffset;
    return frequency;
  }

  return -1;
}

// FFT-Based Pitch Detection
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
  return dominantFrequency > 20 ? dominantFrequency : -1; // Ignore sub-audible frequencies
}

// Convert frequency to MIDI note number
function frequencyToNoteNumber(frequency) {
  return Math.round(12 * Math.log2(frequency / 440) + 69);
}

// Convert MIDI note number to note name
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
