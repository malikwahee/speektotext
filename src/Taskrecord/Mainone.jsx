import React, { useState, useRef } from 'react';

const Mainone = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Must include video for the screen sharing prompt to appear
        audio: true, // Record the screen audio
      });

      const audioTrack = stream.getAudioTracks()[0];
      const audioOnlyStream = new MediaStream([audioTrack]);

      mediaRecorderRef.current = new MediaRecorder(audioOnlyStream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing screen/audio:', error);
      alert('Error accessing screen/audio. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  // Start speech recognition after audio is played
  const startSpeechRecognition = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript + ' ';
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        // Update the transcript with interim and final results
        setTranscript(finalTranscript + interimTranscript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      recognitionRef.current.onend = () => {
        console.log('Speech recognition service has stopped.');
      };

      recognitionRef.current.start();
    } else {
      console.warn('SpeechRecognition API not supported in this browser.');
    }
  };

  // Play audio and start transcription
  const handlePlayAudio = () => {
    const audio = new Audio(audioUrl);
    audio.play();
    startSpeechRecognition();
  };

  return (
    <div>
      <h1>Screen Audio Recorder with Live Captions</h1>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      {audioUrl && (
        <div>
          <h2>Recorded Audio:</h2>
          <button onClick={handlePlayAudio}>Play and Transcribe Audio</button>
          <audio controls src={audioUrl}></audio>
          <a href={audioUrl} download="recording.webm">Download Recording</a>
        </div>
      )}

      <div>
        <h2>Live Captions:</h2>
        <p>{transcript}</p>
      </div>
    </div>
  );
};

export default Mainone;
