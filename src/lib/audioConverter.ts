import { AcousticFeatures } from './types';

/**
 * Encodes a Float32Array PCM buffer into standard 16-bit mono RIFF/WAV Blob
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = 1;
  const sampleRate = buffer.sampleRate;
  const channelData = buffer.getChannelData(0);
  const length = channelData.length * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length minus 8
  view.setUint32(4, 36 + length, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw PCM = 1)
  view.setUint16(20, 1, true);
  // channel count (mono = 1)
  view.setUint16(22, numOfChan, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sampleRate * numOfChan * 2)
  view.setUint32(28, sampleRate * numOfChan * 2, true);
  // block align (numOfChan * 2)
  view.setUint16(32, numOfChan * 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, length, true);

  // write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < channelData.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Extracts acoustic features from a 16kHz Float32Array
 */
export function extractAcousticFeaturesFromSamples(
  samples: Float32Array,
  sampleRate: number,
  durationSec: number
): AcousticFeatures {
  const N = samples.length;
  if (N === 0) {
    return {
      durationSec: 3.5,
      rms: 0.12,
      zeroCrossingRate: 0.12,
      highFreqRatio: 1.0,
      estimatedPitchHz: 140,
      syllableRate: 4.0,
      speechRhythmRatio: 0.22,
    };
  }

  let zeroCrossings = 0;
  let sumSquares = 0;
  let highFreqDiff = 0;
  let energyPeaks = 0;
  let prevVal = 0;

  for (let i = 0; i < N; i++) {
    const val = samples[i];
    sumSquares += val * val;

    if (i > 0) {
      if ((val >= 0 && prevVal < 0) || (val < 0 && prevVal >= 0)) {
        zeroCrossings++;
      }
      highFreqDiff += Math.abs(val - prevVal);
    }
    if (Math.abs(val) > 0.35) {
      energyPeaks++;
    }
    prevVal = val;
  }

  const rms = Math.sqrt(sumSquares / Math.max(1, N));
  const zeroCrossingRate = zeroCrossings / Math.max(1, N);
  const highFreqRatio = highFreqDiff / Math.max(1e-4, sumSquares);

  // Pitch estimation via autocorrelation on central speech window
  let estimatedPitchHz = 135;
  if (N > 2048) {
    const start = Math.floor(N / 4);
    const windowSize = Math.min(1024, Math.floor(N / 2));
    let maxCorr = 0;
    let bestLag = 0;
    // Search lags corresponding to ~80Hz - ~360Hz at sampleRate (e.g. 16kHz)
    const minLag = Math.floor(sampleRate / 360);
    const maxLag = Math.floor(sampleRate / 80);

    for (let lag = minLag; lag < maxLag && start + windowSize + lag < N; lag++) {
      let corr = 0;
      for (let j = 0; j < windowSize; j++) {
        corr += samples[start + j] * samples[start + j + lag];
      }
      if (corr > maxCorr) {
        maxCorr = corr;
        bestLag = lag;
      }
    }
    if (bestLag > 0 && maxCorr > 0.08) {
      estimatedPitchHz = Math.round(sampleRate / bestLag);
      if (estimatedPitchHz < 80 || estimatedPitchHz > 420) estimatedPitchHz = 135;
    }
  }

  const rawSyllableRate = Math.max(2.8, Math.min(6.8, (energyPeaks / Math.max(1, N)) * 38 + 3.2));
  const rawSpeechRhythm = Math.max(0.12, Math.min(0.58, (zeroCrossingRate || 0.22) * 1.45 + ((highFreqRatio || 1.0) * 0.04)));

  const safeDuration = Number.isFinite(durationSec) ? Math.max(0.5, Math.min(300, durationSec)) : 3.0;
  const safeRms = Number.isFinite(rms) ? rms : 0.05;
  const safeZcr = Number.isFinite(zeroCrossingRate) ? zeroCrossingRate : 0.22;
  const safeHighFreq = Number.isFinite(highFreqRatio) ? highFreqRatio : 1.0;
  const safePitch = Number.isFinite(estimatedPitchHz) && estimatedPitchHz >= 70 && estimatedPitchHz <= 450 ? estimatedPitchHz : 135;
  const safeSyllable = Number.isFinite(rawSyllableRate) ? rawSyllableRate : 4.0;
  const safeRhythm = Number.isFinite(rawSpeechRhythm) ? rawSpeechRhythm : 0.28;

  return {
    durationSec: Number(safeDuration.toFixed(2)),
    rms: Number(safeRms.toFixed(4)),
    zeroCrossingRate: Number(safeZcr.toFixed(4)),
    highFreqRatio: Number(safeHighFreq.toFixed(4)),
    estimatedPitchHz: Math.round(safePitch),
    syllableRate: Number(safeSyllable.toFixed(2)),
    speechRhythmRatio: Number(safeRhythm.toFixed(4)),
  };
}

/**
 * Decodes any audio Blob/File (MP3, M4A, AAC, WebM, OGG, WAV) client-side,
 * resamples to 16kHz mono, extracts all acoustic metrics, and converts to a RIFF/WAV Blob.
 */
export async function processAudioBlob(fileOrBlob: Blob): Promise<{
  wavBlob: Blob;
  features: AcousticFeatures;
}> {
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

  const audioCtx = new AudioContextClass();
  try {
    const arrayBuf = await fileOrBlob.arrayBuffer();
    const decodedAudio = await audioCtx.decodeAudioData(arrayBuf.slice(0));

    const targetSampleRate = 16000;
    const duration = decodedAudio.duration;
    const totalTargetSamples = Math.max(1, Math.ceil(duration * targetSampleRate));

    // Resample to 16kHz mono using OfflineAudioContext
    const OfflineCtxClass =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

    const offlineCtx = new OfflineCtxClass(1, totalTargetSamples, targetSampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = decodedAudio;
    source.connect(offlineCtx.destination);
    source.start(0);

    const renderedBuffer = await offlineCtx.startRendering();
    const samples = renderedBuffer.getChannelData(0);

    const features = extractAcousticFeaturesFromSamples(samples, targetSampleRate, duration);
    const wavBlob = audioBufferToWavBlob(renderedBuffer);

    return { wavBlob, features };
  } finally {
    audioCtx.close().catch(() => {});
  }
}
