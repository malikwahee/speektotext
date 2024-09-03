import React, { useState, useRef } from 'react';

const Main = () => {
  const [transcript, setTranscript] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const startListeningAndRecording = async () => {
    try {
      // Request screen capture with audio
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: false,  // Not capturing video
        audio: true    // Capturing audio
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

      // Set up speech recognition if available
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

          setTranscript(finalTranscript + interimTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition has ended.');
        };

        recognitionRef.current.start();
      } else {
        console.warn('SpeechRecognition API not supported in this browser.');
      }
    } catch (error) {
      if (error.name === 'NotAllowedError') {
        alert('Permission to access screen or audio was denied. Please allow permissions and try again.');
      } else {
        console.error('Error accessing screen/audio:', error);
      }
    }
  };

  const stopListeningAndRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsRecording(false);
  };

  return (
    <div>
      <h1>Screen Audio Recorder with Live Captions</h1>
      <button onClick={isRecording ? stopListeningAndRecording : startListeningAndRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>

      {audioUrl && (
        <div>
          <h2>Recorded Audio:</h2>
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

export default Main;
