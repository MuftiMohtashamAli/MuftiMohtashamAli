import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { ConnectionState, TranscriptionItem } from '../types';
import { MODEL_NAME, SYSTEM_INSTRUCTION } from '../constants';
import { createPcmBlob, base64ToUint8Array, decodeAudioData } from '../utils/audioUtils';

export function useLiveAudio() {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [transcripts, setTranscripts] = useState<TranscriptionItem[]>([]);
  const [volume, setVolume] = useState<number>(0);
  
  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  
  // Nodes & Streams
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputGainNodeRef = useRef<GainNode | null>(null);
  
  // Session Management
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef<number>(0);
  
  // Internal State
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    if (!process.env.API_KEY) {
      console.error("API Key not found");
      setConnectionState(ConnectionState.ERROR);
      return;
    }

    try {
      setConnectionState(ConnectionState.CONNECTING);

      // Initialize Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // Setup Output Node
      outputGainNodeRef.current = outputAudioContextRef.current.createGain();
      outputGainNodeRef.current.connect(outputAudioContextRef.current.destination);

      // Setup Analyser for visualizer
      analyserRef.current = outputAudioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      outputGainNodeRef.current.connect(analyserRef.current);

      // Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Initialize Gemini Client
      const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config = {
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }, // 'Kore' is usually a good deep voice
          },
          systemInstruction: SYSTEM_INSTRUCTION,
          // Transcription config must be empty objects to enable, do not pass model name here
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      };

      // Connect to Live API
      sessionPromiseRef.current = client.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            if (!mountedRef.current) return;
            console.log("Session Opened");
            setConnectionState(ConnectionState.CONNECTED);

            // Start Input Stream
            if (!inputAudioContextRef.current) return;
            
            inputSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
            processorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processorRef.current.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              if (sessionPromiseRef.current) {
                sessionPromiseRef.current.then((session: any) => {
                  session.sendRealtimeInput({ media: pcmBlob });
                });
              }
              
              // Calculate volume for simple visualization of mic input if needed
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));
            };

            inputSourceRef.current.connect(processorRef.current);
            processorRef.current.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
             if (!mountedRef.current) return;

             // Handle Audio Output
             const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (audioData && outputAudioContextRef.current && outputGainNodeRef.current) {
                const ctx = outputAudioContextRef.current;
                
                // Sync timing
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

                try {
                  const audioBuffer = await decodeAudioData(
                    base64ToUint8Array(audioData),
                    ctx,
                    24000,
                    1
                  );
                  
                  const source = ctx.createBufferSource();
                  source.buffer = audioBuffer;
                  source.connect(outputGainNodeRef.current);
                  
                  source.addEventListener('ended', () => {
                    sourcesRef.current.delete(source);
                  });

                  source.start(nextStartTimeRef.current);
                  nextStartTimeRef.current += audioBuffer.duration;
                  sourcesRef.current.add(source);
                } catch (err) {
                  console.error("Error decoding audio", err);
                }
             }

             // Handle Interruption
             if (message.serverContent?.interrupted) {
               sourcesRef.current.forEach(source => {
                 try { source.stop(); } catch(e) {}
               });
               sourcesRef.current.clear();
               nextStartTimeRef.current = 0;
             }

             // Handle Transcription
             const isTurnComplete = message.serverContent?.turnComplete;
             const inputTx = message.serverContent?.inputTranscription?.text;
             const outputTx = message.serverContent?.outputTranscription?.text;

             if (inputTx || outputTx) {
               setTranscripts(prev => {
                  const newTranscripts = [...prev];
                  
                  if (inputTx) {
                    newTranscripts.push({ text: inputTx, sender: 'user', timestamp: new Date() });
                  }
                  if (outputTx) {
                    newTranscripts.push({ text: outputTx, sender: 'model', timestamp: new Date() });
                  }
                  return newTranscripts.slice(-50); // Keep last 50
               });
             }
          },
          onclose: () => {
            console.log("Session Closed");
            if (mountedRef.current) setConnectionState(ConnectionState.DISCONNECTED);
          },
          onerror: (err) => {
            console.error("Session Error", err);
            if (mountedRef.current) setConnectionState(ConnectionState.ERROR);
          }
        }
      });

    } catch (e) {
      console.error(e);
      setConnectionState(ConnectionState.ERROR);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (sessionPromiseRef.current) {
      const session = await sessionPromiseRef.current;
      session.close();
      sessionPromiseRef.current = null;
    }

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    
    // Stop output audio
    sourcesRef.current.forEach(source => {
        try { source.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setConnectionState(ConnectionState.DISCONNECTED);
    setTranscripts([]);
  }, []);

  return {
    connect,
    disconnect,
    connectionState,
    transcripts,
    analyser: analyserRef.current,
    volume
  };
}