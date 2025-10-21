/* Type augmentation for browsers */
declare global {
  interface Window {
    SpeechRecognition?: any;  
    webkitSpeechRecognition?: any;
  }

  interface SpeechRecognition extends EventTarget {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives?: number;
    start: () => void;
    stop: () => void;
    onresult?: (event: SpeechRecognitionEvent) => void;
    onerror?: (event: any) => void;
    onend?: () => void;
    onstart?: () => void;
  }
}

import { useEffect, useRef, useState } from "react";
import { IconButton, Box, Paper, Typography, CircularProgress } from "@mui/material";
import { FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

type Props = {
  onTranscript: (text: string) => void;
  onError?: (err: Error | string) => void;
  onUnsupported?: () => void; // called when SpeechRecognition is not available (useful for iOS fallback)
  color?: string;
  size?: number;
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
};

export default function VoiceRecorder({
  onTranscript,
  onError,
  onUnsupported,
  color = "#F02430",
  size = 24,
  lang = "en-US",
  continuous = false,
  interimResults = true,
}: Props) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState<string>("");
  const [finalText, setFinalText] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // flag to indicate end was requested by user - prevents auto-restart logic if you add it later
  const stoppedByUserRef = useRef(false);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser.");
      if (typeof onUnsupported === "function") onUnsupported();
      return;
    }

    const recognition: SpeechRecognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    // onstart/onend are lifecycle hooks — do not overwrite start/stop methods
    recognition.onstart = () => {
      stoppedByUserRef.current = false;
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let final = finalText; // preserve previously committed final text

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0]?.transcript ?? "";
        if (res.isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // update states
      setInterimText(interim);
      if (final !== finalText) {
        setFinalText(final);
        // only call onTranscript for final results
        // you can call for interim by sending (interim, false) as well if desired
        onTranscript(final);
      }
    };

    recognition.onerror = (err: any) => {
      console.error("Speech recognition error:", err);
      setIsListening(false);
      // forward error
      if (onError) {
        const message = (err && err.error) || (err && err.message) || err;
        onError(message);
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      // commit any interim text as final if it exists (useful on some browsers)
      if (!finalText && interimText) {
        setFinalText(interimText);
        onTranscript(interimText);
        setInterimText("");
      }

      // if you want auto-restart behavior you can implement here (careful with loops)
    };

    recognitionRef.current = recognition;

    return () => {
      // cleanup: stop recognition and remove refs
      try {
        recognition.onresult = undefined;
        recognition.onend = undefined;
        recognition.onerror = undefined;
        recognition.onstart = undefined;
        recognition.stop();
      } catch (e) {
        /* ignore */
      }
      recognitionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTranscript, onError, onUnsupported, lang, continuous, interimResults]);

  const handleToggle = () => {
    // must be user gesture
    const rec = recognitionRef.current;
    if (!rec) {
      // not supported (or not initialized)
      if (onUnsupported) onUnsupported();
      return;
    }

    if (isListening) {
      stoppedByUserRef.current = true;
      try {
        rec.stop();
      } catch (e) {
        console.warn("Error stopping recognition", e);
      } finally {
        setIsListening(false);
      }
    } else {
      // reset interim state and start
      setInterimText("");
      // do not clear finalText automatically — keep previous transcript (optional change)
      try {
        rec.start();
        // setIsListening will be set in onstart handler
      } catch (e: any) {
        console.error("Error starting recognition:", e);
        setIsListening(false);
        if (onError) onError(e?.message ?? e);
      }
    }
  };

  return (
    <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <IconButton
        onClick={handleToggle}
        aria-label={isListening ? "Stop voice input" : "Start voice input"}
        size="small"
      >
        {isListening ? <FaMicrophoneSlash style={{ fontSize: size, color }} /> : <FaMicrophone style={{ fontSize: size, color }} />}
      </IconButton>

      {isListening && (
        <Paper
          elevation={6}
          sx={{
            position: "absolute",
            right: "calc(100% + 8px)",
            top: "50%",
            transform: "translateY(-50%)",
            minWidth: 200,
            maxWidth: 320,
            p: 1,
            display: "flex",
            gap: 1,
            alignItems: "center",
            zIndex: 1400,
          }}
        >
          <CircularProgress size={20} />
          <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Listening...
            </Typography>
            <Typography
              variant="caption"
              sx={{
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden",
                maxWidth: "260px",
              }}
            >
              {interimText || finalText || "Speak now"}
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
