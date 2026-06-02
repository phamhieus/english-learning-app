import React, { useMemo, useState, useEffect } from 'react';
import { Mic, RotateCcw, Check, Activity, Image, ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../components/classNames';
import { useSettings } from '../components/useSettings';
import { evaluatePictureDescription } from '../services/ai';
import { addHistory } from '../services/storage';
import { useToast } from '../components/useToast';
import { createSpeechRecognition, type SpeechRecognition } from '../services/speechRecognition';
import { VoiceReaderControls } from '../features/voice-reader/VoiceReaderControls';
import { splitVoiceReaderText } from '../features/voice-reader/voiceReaderText';
import { useVoiceReader } from '../features/voice-reader/useVoiceReader';

const PictureDescriptionPractice = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const { error: showError, success: showSuccess } = useToast();
  const practice = location.state?.practice || {
    id: 0,
    title: 'A scene from daily life',
    imageUrl: '',
    level: 'Medium',
    duration: '3 min',
    category: 'Daily Life',
  };

  const [isRecording, setIsRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [didAutoRead, setDidAutoRead] = useState(false);
  const recognitionRef = React.useRef<SpeechRecognition | null>(null);
  const promptText = `Describe everything you see in this picture. ${practice.title}`;
  const voiceSegments = useMemo(() => splitVoiceReaderText(promptText), [promptText]);
  const voiceReader = useVoiceReader({ exerciseId: `picture-${practice.id ?? practice.title}` });

  useEffect(() => {
    const recognition = createSpeechRecognition();
    if (recognition) {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTrans = '';
      recognition.onresult = (event) => {
        let interimTrans = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript + ' ';
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }
        setRecognizedText(finalTrans + interimTrans);
      };

      recognitionRef.current = recognition;
    } else {
      showError('Speech Recognition is not supported in this browser.');
    }
  }, [showError]);

  useEffect(() => {
    setDidAutoRead(false);
  }, [practice.id, practice.title]);

  useEffect(() => {
    if (didAutoRead || voiceSegments.length === 0) return;
    voiceReader.speakSegments(voiceSegments, { mode: 'sequence' });
    setDidAutoRead(true);
  }, [didAutoRead, voiceReader, voiceSegments]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setRecognizedText('');
      voiceReader.stop();
      document.querySelectorAll('audio').forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleEvaluate = async () => {
    if (isRecording) recognitionRef.current?.stop();
    setIsRecording(false);
    setIsEvaluating(true);
    try {
      const result = await evaluatePictureDescription(settings, practice.title, recognizedText);
      addHistory({
        title: practice.title,
        type: 'Picture Description',
        score: result.score,
        focus: 'Picture Description',
      });
      showSuccess('Evaluation completed!');
      navigate('/speaking/picture/result', { state: { result, recognizedText, practice, exam: settings.primaryExam } });
    } catch (e) {
      console.error(e);
      showError('Failed to evaluate description.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    if (isRecording) recognitionRef.current?.stop();
    setIsRecording(false);
    setRecognizedText('');
    voiceReader.stop();
    document.querySelectorAll('audio').forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2 items-center">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-sm font-semibold">
            Picture Description
          </span>
          <span
            className={cn(
              'px-3 py-1 rounded-full text-sm font-semibold',
              practice.level === 'Easy'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : practice.level === 'Medium'
                  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            {practice.level}
          </span>
        </div>
      </div>

      {/* Picture */}
      <div className="mb-6 shrink-0">
        <div className="relative rounded-3xl overflow-hidden shadow-lg bg-slate-100 dark:bg-slate-800">
          {imgError || !practice.imageUrl ? (
            <div className="w-full aspect-video max-h-[26rem] flex flex-col items-center justify-center gap-3">
              <Image className="w-16 h-16 text-slate-300 dark:text-slate-600" />
              <p className="text-slate-400 text-sm">Image not available</p>
            </div>
          ) : (
            <img
              src={practice.imageUrl}
              alt={practice.title}
              className="w-full aspect-video max-h-[26rem] object-contain"
              onError={() => setImgError(true)}
            />
          )}
        </div>
        <div className="mt-3 flex flex-col items-center gap-3">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 font-medium">
            {voiceSegments.map((segment) => (
              <span
                key={segment.id}
                className={cn(
                  'rounded-md transition-colors',
                  voiceReader.activeSegmentId === segment.id && 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200'
                )}
              >
                {segment.text}{' '}
              </span>
            ))}
          </p>
          <VoiceReaderControls
            supported={voiceReader.supported}
            globallyEnabled={voiceReader.globalVoiceReaderEnabled}
            muted={voiceReader.isTemporarilyMuted}
            onChange={voiceReader.setTemporarilyMuted}
            status={voiceReader.status}
            canPlay={voiceReader.canPlayAudio}
            onPlay={() => voiceReader.speakSegments(voiceSegments, { mode: 'sequence' })}
            onPause={voiceReader.pause}
            onResume={voiceReader.resume}
            onReplay={() => voiceReader.speakSegments(voiceSegments, { mode: 'sequence' })}
            onStop={voiceReader.stop}
          />
        </div>
      </div>

      {/* Live Audio Feedback */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <div className="h-16 flex items-center justify-center w-full">
          {isRecording ? (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 4, 3, 2, 5, 3, 1].map((h, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-indigo-500 rounded-full animate-pulse"
                  style={{ height: `${h * 10}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : (
            <p className="text-slate-400 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Tap the mic and start describing the picture
            </p>
          )}
        </div>

        {/* Live Recognized Text */}
        <div className="w-full max-w-2xl text-center min-h-[60px] px-4">
          {recognizedText ? (
            <p className="text-lg text-slate-600 dark:text-slate-300 italic leading-relaxed">
              "{recognizedText}"
            </p>
          ) : isRecording ? (
            <p className="text-lg text-slate-400 italic">Listening...</p>
          ) : null}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="shrink-0 flex items-center justify-center gap-6 mt-6">
        <button
          onClick={handleReset}
          className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
        >
          <RotateCcw className="w-6 h-6" />
        </button>

        <button
          onClick={toggleRecording}
          disabled={isEvaluating}
          className={cn(
            'w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative group',
            isRecording
              ? 'bg-indigo-600 dark:bg-indigo-500 shadow-indigo-500/50 scale-110'
              : 'bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900 shadow-indigo-500/10 hover:scale-105',
            isEvaluating && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isRecording && (
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-75" />
          )}
          <Mic
            className={cn(
              'w-10 h-10',
              isRecording ? 'text-white animate-pulse' : 'text-indigo-500 dark:text-indigo-400'
            )}
          />
        </button>

        <button
          onClick={handleEvaluate}
          disabled={(!recognizedText && !isRecording) || isEvaluating}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg',
            recognizedText || isRecording
              ? 'bg-green-500 hover:bg-green-600 hover:scale-110 shadow-green-500/30'
              : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed'
          )}
        >
          {isEvaluating ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-6 h-6" />
          )}
        </button>
      </div>
      <p className="text-center text-sm font-medium text-slate-400 mt-4 pb-4">
        {isEvaluating
          ? 'Evaluating your description...'
          : isRecording
            ? 'Click to Stop'
            : 'Click to Record'}
      </p>
    </div>
  );
};

export default PictureDescriptionPractice;
