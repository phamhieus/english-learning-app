import { useState, useEffect, useMemo } from 'react';
import { Mic, RotateCcw, Check, Volume2, Activity } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../components/classNames';
import { useSettings } from '../components/useSettings';
import { evaluateSpeaking, generateSpeakingTranscript } from '../services/ai';
import { addHistory } from '../services/storage';
import { useToast } from '../components/useToast';
import { useSpeechRecognition } from '../services/useSpeechRecognition';
import { VoiceReaderControls } from '../features/voice-reader/VoiceReaderControls';
import { splitVoiceReaderText } from '../features/voice-reader/voiceReaderText';
import { useVoiceReader } from '../features/voice-reader/useVoiceReader';

const SpeakingRecording = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const { error: showError, success: showSuccess } = useToast();
  const practice = location.state?.practice || { title: "General Practice", level: "Medium", type: "Paragraph" };
  const exam = (location.state?.exam as string) || '';
  const taskLabel = (location.state?.taskLabel as string) || 'Speaking';
  
  const [transcript, setTranscript] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [didAutoRead, setDidAutoRead] = useState(false);

  const speech = useSpeechRecognition();
  const recognizedText = speech.transcript + (speech.interimTranscript ? ' ' + speech.interimTranscript : '');
  const voiceSegments = useMemo(() => splitVoiceReaderText(transcript), [transcript]);
  const voiceReader = useVoiceReader({ exerciseId: `speaking-${practice.id ?? practice.title}` });

  useEffect(() => {
    if (!speech.isSupported) {
      showError("Speech Recognition is not supported in this browser.");
    }
  }, [speech.isSupported, showError]);

  useEffect(() => {
    const generateTranscript = async () => {
      try {
        const text = await generateSpeakingTranscript(settings, practice.title, practice.level, practice.type);
        setTranscript(text);
      } catch {
        setTranscript("We anticipate a significant increase in quarterly revenue due to the new marketing campaign.");
        showError("Failed to generate transcript via AI.");
      } finally {
        setIsLoading(false);
      }
    };
    generateTranscript();
  }, [practice.title, settings, practice.level, practice.type, showError]);

  useEffect(() => {
    setDidAutoRead(false);
  }, [practice.id, practice.title]);

  useEffect(() => {
    if (isLoading || didAutoRead || voiceSegments.length === 0) return;
    voiceReader.speakSegments(voiceSegments, { mode: 'sequence' });
    setDidAutoRead(true);
  }, [didAutoRead, isLoading, voiceReader, voiceSegments]);

  const toggleRecording = () => {
    if (speech.isListening) {
      speech.stop();
    } else {
      voiceReader.stop();
      document.querySelectorAll('audio').forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      speech.start();
    }
  };

  const handleReset = () => {
    if (speech.isListening) {
      speech.stop();
    }
    speech.reset();
    voiceReader.stop();
    document.querySelectorAll('audio').forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const handleEvaluate = async () => {
    if (speech.isListening) speech.stop();
    setIsEvaluating(true);
    try {
      const result = await evaluateSpeaking(settings, transcript, recognizedText);
      addHistory({ title: practice.title, type: practice.type, score: result.score, focus: 'Speaking' });
      showSuccess("Evaluation completed!");
      navigate('/speaking/result', { state: { result, recognizedText, transcript, practice } });
    } catch (e) {
      console.error(e);
      showError("Failed to evaluate speaking.");
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col animate-in slide-in-from-bottom-8 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium">
          ← Exit
        </button>
        <div className="flex gap-2 items-center">
          {exam && (
            <span className={cn(
              'px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider',
              exam === 'TOEIC' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
            )}>
              {exam}
            </span>
          )}
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full text-sm font-semibold">{taskLabel}</span>
        </div>
      </div>

      {(practice.image || practice.type?.toLowerCase().includes('picture')) && (
        <div className="mb-6 flex justify-center w-full shrink-0 relative">
          <img 
            src={practice.image || `https://loremflickr.com/800/450/${encodeURIComponent(practice.title.split(' ').slice(0,2).join(','))}?lock=${practice.id}`} 
            alt={practice.title} 
            className="w-full max-h-[400px] rounded-3xl shadow-lg object-cover" 
            onError={(e) => {
              if (e.currentTarget.src.includes('loremflickr')) {
                e.currentTarget.src = `https://picsum.photos/seed/${practice.id}/800/450`;
              } else {
                showError("Error loading image, please check the image link!");
              }
            }}
          />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center gap-12">
        
        {/* Target Card */}
        <div className="w-full glass-card rounded-3xl p-8 relative shadow-lg">
          <button
            onClick={() => voiceReader.speakSegments(voiceSegments, { mode: 'sequence' })}
            disabled={!voiceReader.canPlayAudio || isLoading}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-indigo-500 hover:scale-110 transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Volume2 className="w-5 h-5" />
          </button>
          
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">{practice.title}</h2>

          {!practice.image && (
            <p className="text-3xl font-medium leading-relaxed text-slate-800 dark:text-slate-200 pr-12">
              {isLoading ? (
                <span className="animate-pulse text-slate-400 text-xl">Generating practice text via Gemini...</span>
              ) : (
                voiceSegments.map((segment) => (
                  <span
                    key={segment.id}
                    className={cn(
                      'rounded-lg transition-colors',
                      voiceReader.activeSegmentId === segment.id && 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200'
                    )}
                  >
                    {segment.text}{' '}
                  </span>
                ))
              )}
            </p>
          )}
          {!isLoading && (
            <VoiceReaderControls
              className="mt-6"
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
          )}
        </div>

        {/* Live Audio Feedback */}
        <div className="h-24 flex items-center justify-center w-full">
          {speech.isListening ? (
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 4, 3, 2, 5, 3, 1].map((h, i) => (
                <div 
                  key={i} 
                  className="w-1.5 bg-indigo-50 rounded-full animate-pulse"
                  style={{ height: `${h * 12}px`, animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          ) : (
            <p className="text-slate-400 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Waiting for audio...
            </p>
          )}
        </div>

        {/* Live Recognized Text */}
        <div className="w-full max-w-2xl text-center min-h-[60px]">
          {recognizedText ? (
             <p className="text-xl text-slate-600 dark:text-slate-300 italic">"{recognizedText}"</p>
          ) : speech.isListening ? (
             <p className="text-lg text-slate-400 italic">Listening...</p>
          ) : (
             <p className="text-lg text-transparent">Placeholder</p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="shrink-0 flex items-center justify-center gap-6 mt-8">
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
            "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl relative group",
            speech.isListening 
              ? "bg-indigo-600 dark:bg-indigo-500 shadow-indigo-500/50 scale-110" 
              : "bg-white dark:bg-slate-800 border-2 border-indigo-100 dark:border-indigo-900 shadow-indigo-500/10 hover:scale-105",
            isEvaluating && "opacity-50 cursor-not-allowed"
          )}
        >
          {speech.isListening && <div className="absolute inset-0 rounded-full border-4 border-indigo-500 animate-ping opacity-75"></div>}
          <Mic className={cn("w-10 h-10", speech.isListening ? "text-white animate-pulse" : "text-indigo-500 dark:text-indigo-400")} />
        </button>

        <button 
          onClick={handleEvaluate}
          disabled={(!recognizedText && !speech.isListening) || isEvaluating}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center text-white transition-all shadow-lg",
            recognizedText || speech.isListening ? "bg-green-500 hover:bg-green-600 hover:scale-110 shadow-green-500/30" : "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
          )}
        >
          {isEvaluating ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Check className="w-6 h-6" />
          )}
        </button>
      </div>
      <p className="text-center text-sm font-medium text-slate-400 mt-6 pb-4">
        {isEvaluating ? "Evaluating your speaking..." : speech.isListening ? "Click to Stop" : "Click to Record"}
      </p>
    </div>
  );
};

export default SpeakingRecording;
