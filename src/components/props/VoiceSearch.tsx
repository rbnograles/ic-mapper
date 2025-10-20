/* voice-recorder.tsx */
/* Put this at the top of the file to satisfy TypeScript */
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: any) => void;
    onend: () => void;
  }
}

import { useState, useEffect, useRef } from 'react';
import { IconButton, Box, Paper, Typography, CircularProgress } from '@mui/material';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';

export default function VoiceRecorder({
  onTranscript,
  color = '#F02430', // fallback color
  size = 24,
}: {
  onTranscript: (text: string) => void;
  color?: string;
  size?: number;
}) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState<string>('');
  const [finalText, setFinalText] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser.');
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false; // false: auto-stop after user stops speaking
    recognition.interimResults = true; // important -> receive partial transcripts

    recognition.start = () => {
      setIsListening(true);
      setInterimText('');
      setFinalText('');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          final += res[0].transcript;
        } else {
          interim += res[0].transcript;
        }
      }

      if (interim) {
        setInterimText(interim);
      } else {
        setInterimText('');
      }

      if (final) {
        // Final transcript arrived
        setFinalText(final);
        setInterimText('');
        onTranscript(final);
      }
    };

    recognition.onerror = (err: any) => {
      console.error('Speech recognition error:', err);
      setIsListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      // onend is called when recognition stops (either manually or automatically)
      setIsListening(false);
      // If we have interimText but no finalText, treat interim as final on end
      if (!finalText && interimText) {
        onTranscript(interimText);
        setFinalText(interimText);
        setInterimText('');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTranscript]); // onTranscript stable in your usage; otherwise wrap in useCallback

  const handleToggle = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping recognition', e);
        setIsListening(false);
      }
    } else {
      try {
        // reset texts before starting
        setInterimText('');
        setFinalText('');
        recognitionRef.current.start();
      } catch (e) {
        console.error('Error starting recognition', e);
        setIsListening(false);
      }
    }
  };

  // UI: Icon button + floating "listening" box when active
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <IconButton
        onClick={handleToggle}
        aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
        size="small"
      >
        {isListening ? (
          <FaMicrophoneSlash style={{ fontSize: size, color }} />
        ) : (
          <FaMicrophone style={{ fontSize: size, color }} />
        )}
      </IconButton>

      {isListening && (
        <Paper
          elevation={6}
          sx={{
            position: 'absolute',
            right: 'calc(100% + 8px)', // place to the left of mic; adjust as needed
            top: '50%',
            transform: 'translateY(-50%)',
            minWidth: 200,
            maxWidth: 320,
            p: 1,
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            zIndex: 1400,
          }}
        >
          <CircularProgress size={20} />
          <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Listening...
            </Typography>
            <Typography
              variant="caption"
              sx={{
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                maxWidth: '260px',
              }}
            >
              {interimText || finalText || 'Speak now'}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
