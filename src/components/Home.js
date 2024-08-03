import React, { useState, useRef } from 'react';
import { PitchDetector } from 'pitchy';

const INSTRUMENTS = {
  piano: 'triangle',
  guitar: 'sawtooth',
  flute: 'sine',
  violin: 'sawtooth',
  bass: 'square',
  synth: 'square',
};

function App() {
  const [instrument, setInstrument] = useState('piano');
  const [uploadedAudio, setUploadedAudio] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef(null);
  const oscillatorRef = useRef(null);
  const gainNodeRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedAudio(url);
      await convertMp3ToInstrument(file);
    }
  };

  const convertMp3ToInstrument = async (file) => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;

    const analyser = audioContextRef.current.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyser.connect(audioContextRef.current.destination);
    
    const pitchDetector = PitchDetector.forFloat32Array(analyser.fftSize);
    const input = new Float32Array(pitchDetector.inputLength);

    source.start();

    const processAudio = () => {
      analyser.getFloatTimeDomainData(input);
      const [pitch, clarity] = pitchDetector.findPitch(input, audioContextRef.current.sampleRate);
      if (pitch !== null && clarity > 0.8) { // Adjust the clarity threshold as needed
        playInstrumentSound(pitch);
      }
      if (source.playbackState === source.PLAYING_STATE) {
        requestAnimationFrame(processAudio);
      }
    };

    source.onended = () => {
      stopPlaying();
    };

    processAudio();
    setIsPlaying(true);
  };

  const playInstrumentSound = (pitch) => {
    if (!oscillatorRef.current) {
      oscillatorRef.current = audioContextRef.current.createOscillator();
      gainNodeRef.current = audioContextRef.current.createGain();

      oscillatorRef.current.type = INSTRUMENTS[instrument];
      oscillatorRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(audioContextRef.current.destination);

      oscillatorRef.current.start();
    }

    oscillatorRef.current.frequency.setValueAtTime(pitch, audioContextRef.current.currentTime);
    gainNodeRef.current.gain.setValueAtTime(0.5, audioContextRef.current.currentTime);
  };

  const stopPlaying = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current.disconnect();
      oscillatorRef.current = null;
    }
    setIsPlaying(false);
  };

  return (
    <div className="App">
      <h1>MP3 to Instrument Converter</h1>
      <input type="file" accept="audio/mp3" onChange={handleFileUpload} />
      <select value={instrument} onChange={(e) => setInstrument(e.target.value)}>
        {Object.keys(INSTRUMENTS).map((inst) => (
          <option key={inst} value={inst}>
            {inst.charAt(0).toUpperCase() + inst.slice(1)}
          </option>
        ))}
      </select>
      {uploadedAudio && (
        <div>
          <h2>Uploaded Audio:</h2>
          <audio src={uploadedAudio} controls />
        </div>
      )}
      <button onClick={stopPlaying} disabled={!isPlaying}>Stop Playing</button>
    </div>
  );
}

export default App;