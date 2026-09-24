import React, { useState, useEffect } from 'react';
import { GameTask, Player } from '../../types';
import { CardGrid } from '../ui/CardGrid';
import { Flame, Zap, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface PlayerGameProps {
  player: Player | null;
  currentTask: GameTask | null;
  timeRemaining: number;
  lastTapFeedback: {
    isCorrect: boolean;
    pointsDelta: number;
    newScore: number;
    combo: number;
  } | null;
  onTapCard: (taskId: string, cardId: string) => void;
}

export const PlayerGame: React.FC<PlayerGameProps> = ({
  player,
  currentTask,
  timeRemaining,
  lastTapFeedback,
  onTapCard,
}) => {
  const [isLocked, setIsLocked] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{
    text: string;
    isCorrect: boolean;
  } | null>(null);

  // Reset tap lock when task changes
  useEffect(() => {
    setIsLocked(false);
    setFeedbackToast(null);
  }, [currentTask?.id]);

  // Trigger feedback notification (3x shorter duration: ~220ms, non-blocking)
  useEffect(() => {
    if (lastTapFeedback) {
      setFeedbackToast({
        text: lastTapFeedback.isCorrect
          ? `+${lastTapFeedback.pointsDelta}`
          : `${lastTapFeedback.pointsDelta}`,
        isCorrect: lastTapFeedback.isCorrect,
      });

      // 3x shorter duration: 220ms instead of 700ms
      const timer = setTimeout(() => {
        setFeedbackToast(null);
      }, 240);

      // If wrong tap, unlock after 220ms so player can retry immediately!
      // If correct tap, remain locked until next task
      if (!lastTapFeedback.isCorrect) {
        const unlockTimer = setTimeout(() => {
          setIsLocked(false);
        }, 220);
        return () => {
          clearTimeout(timer);
          clearTimeout(unlockTimer);
        };
      } else {
        setIsLocked(true);
      }

      return () => clearTimeout(timer);
    }
  }, [lastTapFeedback]);

  const handleCardTap = (cardId: string) => {
    if (!currentTask || isLocked) return;
    setIsLocked(true);
    onTapCard(currentTask.id, cardId);
  };

  const combo = player?.combo || 0;
  const score = player?.score || 0;

  return (
    <div
      className={`flex-1 flex flex-col justify-between p-4 max-w-lg mx-auto w-full h-[100dvh] select-none transition-colors duration-150 ${
        feedbackToast && !feedbackToast.isCorrect ? 'shake-screen bg-red-950/30' : ''
      }`}
    >
      {/* Top Bar: Player Stats & Timer */}
      <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{player?.avatar || '⚡'}</span>
          <div>
            <span className="font-bold text-xs text-white/70 block leading-tight">
              {player?.name || 'Sen'}
            </span>
            <span className="font-black text-xl text-party-yellow flex items-center gap-1">
              <Zap className="w-4 h-4 fill-party-yellow" />
              {score}
            </span>
          </div>
        </div>

        {/* Combo Fire Indicator */}
        {combo >= 2 && (
          <div className="flex items-center gap-1 px-3 py-1 bg-red-500/30 border border-red-400/50 rounded-full text-red-300 font-black text-xs animate-bounce-short">
            <Flame className="w-4 h-4 fill-red-500 text-red-500" />
            {combo}x KOMBO
          </div>
        )}

        {/* Time Remaining */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-black/40 rounded-xl border border-white/15 text-white font-black text-base">
          <Clock className="w-4 h-4 text-party-yellow" />
          <span>{timeRemaining}s</span>
        </div>
      </div>

      {/* Center: Dynamic Task Header (NEVER COVERED, ALWAYS READABLE) */}
      {currentTask ? (
        <div className="my-3 text-center bg-white/5 border-2 border-party-yellow/40 rounded-3xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          {/* Top Row: Badge & Floating Feedback Toast */}
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-party-yellow px-2.5 py-0.5 bg-yellow-400/20 rounded-full inline-block">
              {currentTask.badgeText || 'GÖREV'}
            </span>

            {/* Non-blocking Toast Feedback Badge */}
            {feedbackToast && (
              <div
                className={`flex items-center gap-1 px-3 py-0.5 rounded-full font-black text-xs tracking-wider shadow-lg animate-pop ${
                  feedbackToast.isCorrect
                    ? 'bg-emerald-500 text-purple-950 glow-yellow'
                    : 'bg-red-500 text-white'
                }`}
              >
                {feedbackToast.isCorrect ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                {feedbackToast.text} PUAN
              </div>
            )}
          </div>

          {/* Prompt Text: ALWAYS 100% VISIBLE */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide drop-shadow-md">
            {currentTask.prompt}
          </h2>

          {currentTask.subPrompt && (
            <p className="text-xs sm:text-sm font-bold text-sky-300 mt-1">
              {currentTask.subPrompt}
            </p>
          )}
        </div>
      ) : (
        <div className="my-3 text-center py-6 text-white/50 font-bold">
          Sıradaki görev geliyor...
        </div>
      )}

      {/* Bottom: Interactive Touch Cards Grid */}
      <div className="flex-1 flex items-center justify-center min-h-[300px] mb-2">
        {currentTask && (
          <CardGrid
            cards={currentTask.cards}
            onTapCard={handleCardTap}
            disabled={isLocked}
          />
        )}
      </div>
    </div>
  );
};
