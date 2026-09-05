'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileAudio, CheckCircle, AlertCircle, Trash2, Play, Pause, ShieldCheck, Activity } from 'lucide-react';
import { AcousticFeatures } from '@/lib/types';
import { processAudioBlob } from '@/lib/audioConverter';

interface AudioUploaderProps {
  onAudioReady: (
    blob: Blob,
    fileName: string,
    transcript?: string,
    duration?: number,
    acoustics?: AcousticFeatures
  ) => void;
  onReset?: () => void;
  disabled?: boolean;
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({ onAudioReady, onReset, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [processedWavBlob, setProcessedWavBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [optionalTranscript, setOptionalTranscript] = useState<string>('');
  const [extractedMetrics, setExtractedMetrics] = useState<AcousticFeatures | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndProcessFile = async (file: File) => {
    setErrorMsg(null);
    onReset?.();

    // Max 25MB
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 25MB limit. Please provide a shorter recording.');
      return;
    }

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/m4a', 'audio/x-m4a', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/webm'];
    const hasValidExt = /\.(mp3|wav|m4a|aac|ogg|webm|mov)$/i.test(file.name);

    if (!validTypes.includes(file.type) && !hasValidExt) {
      setErrorMsg('Please upload a valid audio format (.mp3, .wav, .m4a, .aac, .webm, .ogg).');
      return;
    }

    if (audioUrl) URL.revokeObjectURL(audioUrl);
    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setAudioUrl(url);

    // Decode any audio format client-side into 16kHz mono WAV & compute all acoustic dimensions
    try {
      const { wavBlob, features } = await processAudioBlob(file);
      setProcessedWavBlob(wavBlob);
      setExtractedMetrics(features);
      const outName = file.name.replace(/\.[^/.]+$/, '') + '.wav';
      onAudioReady(wavBlob, outName, optionalTranscript || undefined, features.durationSec, features);
    } catch {
      // Fallback if client Web Audio context is unavailable
      onAudioReady(file, file.name, optionalTranscript || undefined);
    }
  };

  const handleTranscriptChange = (text: string) => {
    setOptionalTranscript(text);
    if (selectedFile) {
      const blobToSend = processedWavBlob || selectedFile;
      const nameToSend = processedWavBlob ? selectedFile.name.replace(/\.[^/.]+$/, '') + '.wav' : selectedFile.name;
      onAudioReady(
        blobToSend,
        nameToSend,
        text || undefined,
        extractedMetrics?.durationSec,
        extractedMetrics || undefined
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndProcessFile(file);
      // Reset input value so selecting the same file triggers change again
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setProcessedWavBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setIsPlaying(false);
    setErrorMsg(null);
    setOptionalTranscript('');
    setExtractedMetrics(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onReset?.();
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

  return (
    <div className="w-full space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.webm,.mov"
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />

      {!selectedFile ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 sm:p-10 rounded-2xl glass-panel-interactive cursor-pointer border-2 border-dashed transition-all ${
            dragActive
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-white/10 hover:border-indigo-500/50'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-slate-200 text-center">
            Click to upload or drag & drop an audio file
          </p>
          <p className="text-xs text-slate-400 mt-1.5 text-center">
            Supports MP3, WAV, M4A, AAC, WebM, OGG (Max 25MB)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between p-5 rounded-2xl glass-panel border border-indigo-500/30 gap-4">
            <div className="flex items-center space-x-3.5 w-full sm:w-auto">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                <FileAudio className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                    {selectedFile.name}
                  </p>
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
                <p className="text-xs text-slate-400">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  {extractedMetrics?.durationSec ? ` • ${extractedMetrics.durationSec}s` : ''} • Ready for analysis
                </p>
                {extractedMetrics && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] text-indigo-300">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                      Pitch: {extractedMetrics.estimatedPitchHz} Hz
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                      ZCR: {extractedMetrics.zeroCrossingRate}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                      Rhythm: {extractedMetrics.speechRhythmRatio}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2.5 self-end sm:self-auto">
              {audioUrl && (
                <button
                  onClick={togglePlayback}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Play'}</span>
                </button>
              )}

              <button
                onClick={handleRemove}
                className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-all"
                title="Remove File"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {audioUrl && (
                <audio
                  ref={audioPlayerRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              )}
            </div>
          </div>

          {/* Optional Transcript Input for maximum precision */}
          <div className="p-4 rounded-xl glass-panel border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">
                Spoken Transcript / Words (Optional)
              </label>
              <span className="text-[10px] text-slate-400">Enhances phonetic alignment</span>
            </div>
            <input
              type="text"
              value={optionalTranscript}
              onChange={(e) => handleTranscriptChange(e.target.value)}
              placeholder="e.g., 'G day mate, grab a cold tinny' or 'Bonjour, how are you doing today?'"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 flex items-center space-x-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* End-to-End User Audio Protection Guarantee */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-center space-x-2 text-[11px] text-slate-400 text-center">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-slate-300">Privacy & Security Hardened:</strong> Uploaded audio files are processed in-memory and immediately destroyed. We never retain, store, or sell user audio.
        </span>
      </div>
    </div>
  );
};
