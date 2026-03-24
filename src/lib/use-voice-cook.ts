"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { isTTSSupported, isSTTSupported, createRecognition, pickBestVoice } from "./speech-support";

interface VoiceCookCallbacks {
  stepText: string;
  tipText?: string | null;
  onNext: () => void;
  onPrev: () => void;
  onStartTimer: () => void;
  onPauseTimer: () => void;
  onResumeTimer: () => void;
}

interface VoiceCookReturn {
  isActive: boolean;
  toggle: () => void;
  sttSupported: boolean;
  ttsSupported: boolean;
  isListening: boolean;
  transcript: string;
  lastCommand: string;
  micError: string;
  repeatStep: () => void;
  cleanup: () => void;
}

function playConfirmationTone() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch {
    // Audio not supported
  }
}

/**
 * Split text into chunks at sentence boundaries, each ≤ maxLen characters.
 * This prevents Chrome's ~15-second utterance cutoff from clipping long steps.
 */
function chunkText(text: string, maxLen = 200): string[] {
  if (text.length <= maxLen) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.length > 0 ? chunks : [text];
}

function matchCommand(text: string): string | null {
  const lower = text.toLowerCase().trim();
  const cleaned = lower.replace(/[.,!?]/g, "").replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");
  const lastWord = words[words.length - 1];
  const firstWord = words[0];

  if (cleaned.includes("next step")) return "next";
  if (cleaned.includes("previous step") || cleaned.includes("go back") || cleaned.includes("step back")) return "back";
  if (cleaned.includes("read again") || cleaned.includes("say again") || cleaned.includes("repeat step")) return "repeat";
  if (cleaned.includes("start timer") || cleaned.includes("set timer")) return "start timer";
  if (cleaned.includes("pause timer") || cleaned.includes("stop timer")) return "pause";
  if (cleaned.includes("resume timer")) return "resume";

  const commandWords: Record<string, string> = {
    next: "next",
    back: "back",
    previous: "back",
    repeat: "repeat",
    stop: "stop",
    pause: "pause",
    resume: "resume",
    continue: "resume",
  };

  if (commandWords[lastWord]) return commandWords[lastWord];
  if (commandWords[firstWord]) return commandWords[firstWord];

  if (words.length <= 3) {
    for (const word of words) {
      if (commandWords[word]) return commandWords[word];
    }
  }

  return null;
}

export function useVoiceCook(callbacks: VoiceCookCallbacks): VoiceCookReturn {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [micError, setMicError] = useState("");

  const [ttsSupported, setTtsSupported] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);

  // Pre-warm: load voices as early as possible so they're ready when needed.
  useEffect(() => {
    const supported = isTTSSupported();
    setTtsSupported(supported);
    setSttSupported(isSTTSupported());
    if (supported) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;
  const isActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const transcriptTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const commandTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const chunkQueueRef = useRef<string[]>([]);
  const keepaliveRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const hadGoodVoiceRef = useRef(false);

  const clearKeepalive = useCallback(() => {
    if (keepaliveRef.current) {
      clearInterval(keepaliveRef.current);
      keepaliveRef.current = undefined;
    }
  }, []);

  const startKeepalive = useCallback(() => {
    clearKeepalive();
    keepaliveRef.current = setInterval(() => {
      const synth = window.speechSynthesis;
      if (synth.speaking) {
        synth.pause();
        synth.resume();
      }
    }, 10000);
  }, [clearKeepalive]);

  const speak = useCallback(
    (text: string) => {
      if (!ttsSupported) return;
      const synth = window.speechSynthesis;

      // Cancel any current speech and pending chunks
      synth.cancel();
      chunkQueueRef.current = [];
      clearKeepalive();

      const chunks = chunkText(text);

      // 50ms delay after cancel() — standard Chrome workaround for the
      // cancel-then-speak race condition where speak() silently fails.
      setTimeout(() => {
        const voices = synth.getVoices();
        const best = pickBestVoice(voices);
        if (best) hadGoodVoiceRef.current = true;

        const speakChunk = (index: number) => {
          if (index >= chunks.length || !isActiveRef.current) {
            isSpeakingRef.current = false;
            clearKeepalive();
            return;
          }

          const utterance = new SpeechSynthesisUtterance(chunks[index]);
          utterance.rate = 0.9;
          if (best) utterance.voice = best;

          utterance.onstart = () => {
            isSpeakingRef.current = true;
          };
          utterance.onend = () => {
            speakChunk(index + 1);
          };
          utterance.onerror = () => {
            isSpeakingRef.current = false;
            clearKeepalive();
          };

          synth.speak(utterance);

          // Start keepalive on first chunk to prevent Chrome background throttling
          if (index === 0) {
            startKeepalive();
          }
        };

        chunkQueueRef.current = chunks;
        speakChunk(0);
      }, 50);
    },
    [ttsSupported, clearKeepalive, startKeepalive],
  );

  const readStep = useCallback(() => {
    const { stepText, tipText } = callbacksRef.current;
    let text = stepText;
    if (tipText) text += `. Tip: ${tipText}`;
    speak(text);
  }, [speak]);

  const readStepRef = useRef<() => void>(() => {});
  readStepRef.current = readStep;

  // When voices load asynchronously, re-speak if voice mode is active
  // but only if we didn't already have a good voice selected.
  useEffect(() => {
    if (!ttsSupported) return;
    const handleVoices = () => {
      if (isActiveRef.current && !hadGoodVoiceRef.current) {
        readStep();
      }
    };
    window.speechSynthesis.addEventListener("voiceschanged", handleVoices);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", handleVoices);
  }, [ttsSupported, readStep]);

  const startSTT = useCallback(() => {
    if (!sttSupported || recognitionRef.current) return;
    const recognition = createRecognition();
    if (!recognition) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const last = event.results[event.results.length - 1];
      if (!last.isFinal) return;
      if (isSpeakingRef.current) return;

      const heard = last[0].transcript;
      setTranscript(heard);
      clearTimeout(transcriptTimerRef.current);
      transcriptTimerRef.current = setTimeout(() => setTranscript(""), 2000);

      const command = matchCommand(heard);
      if (command) {
        playConfirmationTone();
        setLastCommand(command);
        clearTimeout(commandTimerRef.current);
        commandTimerRef.current = setTimeout(() => setLastCommand(""), 2000);

        const cb = callbacksRef.current;
        switch (command) {
          case "next":
            cb.onNext();
            break;
          case "back":
            cb.onPrev();
            break;
          case "repeat":
            readStepRef.current();
            break;
          case "start timer":
            cb.onStartTimer();
            break;
          case "stop":
          case "pause":
            cb.onPauseTimer();
            break;
          case "resume":
            cb.onResumeTimer();
            break;
        }
      }
    };

    recognition.onend = () => {
      if (isActiveRef.current) {
        recognitionRef.current = null;
        setTimeout(() => {
          if (!isActiveRef.current || recognitionRef.current) return;
          const fresh = createRecognition();
          if (!fresh) return;
          fresh.onresult = recognition.onresult;
          fresh.onend = recognition.onend;
          fresh.onerror = recognition.onerror;
          recognitionRef.current = fresh;
          try {
            fresh.start();
          } catch {
            // Silently fail
          }
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      if (event.error === "not-allowed") {
        setMicError("Microphone access is needed for voice commands. Steps will still be read aloud.");
        setTimeout(() => setMicError(""), 5000);
      }
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
    }
  }, [sttSupported]);

  const stopSTT = useCallback(() => {
    if (recognitionRef.current) {
      isActiveRef.current = false;
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const toggle = useCallback(() => {
    if (isActive) {
      // --- Turn OFF ---
      setIsActive(false);
      isActiveRef.current = false;
      if (ttsSupported) {
        window.speechSynthesis.cancel();
        chunkQueueRef.current = [];
        clearKeepalive();
      }
      isSpeakingRef.current = false;
      hadGoodVoiceRef.current = false;
      stopSTT();
      setMicError("");
    } else {
      // --- Turn ON ---
      setIsActive(true);
      isActiveRef.current = true;

      // CRITICAL: speechSynthesis.speak() MUST be the very first browser API
      // call in this click handler.  Any prior AudioContext / getUserMedia /
      // SpeechRecognition call can consume the user-gesture activation on
      // iOS and mobile Chrome, causing speak() to silently do nothing.
      readStep();

      // Start STT after a short delay so it doesn't compete with the TTS
      // user-gesture activation.  SpeechRecognition handles its own
      // permissions — no need to gate it behind getUserMedia.
      if (sttSupported) {
        setTimeout(() => {
          if (isActiveRef.current) startSTT();
        }, 200);
      }
    }
  }, [isActive, ttsSupported, sttSupported, stopSTT, readStep, startSTT, clearKeepalive]);

  // Read step aloud on step change while active
  const prevStepText = useRef(callbacks.stepText);
  useEffect(() => {
    if (isActive && callbacks.stepText !== prevStepText.current) {
      readStep();
    }
    prevStepText.current = callbacks.stepText;
  }, [isActive, callbacks.stepText, readStep]);

  const cleanup = useCallback(() => {
    if (ttsSupported) {
      window.speechSynthesis.cancel();
      chunkQueueRef.current = [];
      clearKeepalive();
    }
    isSpeakingRef.current = false;
    hadGoodVoiceRef.current = false;
    stopSTT();
    setIsActive(false);
    isActiveRef.current = false;
    clearTimeout(transcriptTimerRef.current);
    clearTimeout(commandTimerRef.current);
  }, [ttsSupported, stopSTT, clearKeepalive]);

  return {
    isActive,
    toggle,
    sttSupported,
    ttsSupported,
    isListening,
    transcript,
    lastCommand,
    micError,
    repeatStep: readStep,
    cleanup,
  };
}
