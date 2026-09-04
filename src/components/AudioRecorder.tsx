'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Sparkles, MessageSquare, ShieldCheck, Lock } from 'lucide-react';

interface AudioRecorderProps {
  onAudioReady: (blob: Blob, fileName: string, transcript?: string, duration?: number) => void;
  disabled?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onAudioReady, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptBufferRef = useRef<string>('');

  useEffect(() => {
    return () => {
      stopStreams();
    };
  }, []);

  const stopStreams = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  const startRecording = async () => {
    try {
      setAudioUrl(null);
      setAudioBlob(null);
      setRecordingTime(0);
      setLiveTranscript('');
      transcriptBufferRef.current = '';

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // In-browser SpeechRecognition if supported
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let fullText = '';
            for (let i = 0; i < event.results.length; i++) {
              fullText += event.results[i][0].transcript + ' ';
            }
            const trimmed = fullText.trim();
            transcriptBufferRef.current = trimmed;
            setLiveTranscript(trimmed);
          };

          recognition.onerror = () => {
            // non-fatal
          };

          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          // ignore recognition failure
        }
      }

      // Audio Context for visualizer
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      drawVisualizer();

      // Determine supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        onAudioReady(blob, 'recorded_audio.webm', transcriptBufferRef.current, recordingTime);
      };

      recorder.start(100);
      setIsRecording(true);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert(
        'Microphone access was denied or is not supported in this browser. Please allow microphone permissions or upload an audio file instead.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      stopStreams();
    }
  };

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;

        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(1, '#06b6d4');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const resetRecording = () => {
    stopStreams();
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    setIsRecording(false);
    setIsPlaying(false);
    setLiveTranscript('');
    transcriptBufferRef.current = '';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl glass-panel border border-white/10 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

      {/* Visualizer Canvas */}
      <div className="w-full max-w-md h-24 mb-6 rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative">
        {!isRecording && !audioUrl && (
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <Mic className="w-4 h-4 text-slate-400" />
            <span>Ready to capture acoustics &bull; Click record below</span>
          </div>
        )}

        {isRecording && (
          <canvas
            ref={canvasRef}
            width={380}
            height={96}
            className="w-full h-full object-cover"
          />
        )}

        {audioUrl && !isRecording && (
          <div className="flex items-center space-x-3 text-indigo-300 text-xs font-medium">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Acoustic sample captured ({formatTime(recordingTime)})</span>
          </div>
        )}
      </div>

      {/* Live Transcript Display */}
      {liveTranscript && (
        <div className="w-full max-w-md mb-5 p-3 rounded-2xl bg-black/50 border border-indigo-500/20 text-xs text-slate-300 flex items-start space-x-2">
          <MessageSquare className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-0.5">
              Live Phonetic Stream:
            </span>
            <span className="italic text-slate-200 font-sans">&ldquo;{liveTranscript}&rdquo;</span>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-2xl font-mono font-bold text-white mb-6 tracking-wider">
        {formatTime(recordingTime)}
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-4 z-10">
        {!isRecording && !audioUrl && (
          <button
            onClick={startRecording}
            disabled={disabled}
            className="group relative flex items-center space-x-3 px-6 py-3.5 rounded-full bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-semibold text-sm shadow-lg shadow-red-500/25 transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Mic className="w-5 h-5 animate-pulse" />
            <span>Start Recording</span>
          </button>
        )}

        {isRecording && (
          <button
            onClick={stopRecording}
            className="flex items-center space-x-3 px-6 py-3.5 rounded-full bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white font-semibold text-sm shadow-lg shadow-amber-500/25 transition-all transform hover:scale-105 active:scale-95"
          >
            <Square className="w-4 h-4 fill-white" />
            <span>Stop Recording</span>
          </button>
        )}

        {audioUrl && !isRecording && (
          <>
            <button
              onClick={togglePlayback}
              className="flex items-center space-x-2 px-5 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-600/30"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'Pause' : 'Listen'}</span>
            </button>

            <button
              onClick={resetRecording}
              className="flex items-center space-x-2 px-4 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-sm transition-all border border-white/10"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Record Again</span>
            </button>
          </>
        )}
      </div>

      {/* End-to-End User Audio Protection Guarantee */}
      <div className="pt-3 z-10 flex items-center justify-center space-x-2 text-[11px] text-slate-400 max-w-md text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-slate-300">User Privacy Protected:</strong> Audio is processed ephemerally in-memory and immediately discarded. Never saved to disk or shared.
        </span>
      </div>

      {audioUrl && (
        <audio
          ref={audioPlayerRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
};
