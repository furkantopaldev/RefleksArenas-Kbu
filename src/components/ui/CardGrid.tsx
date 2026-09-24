import React from 'react';
import { CardItem } from '../../types';
import { Star, Circle, Square, Triangle, Diamond, Heart, Flame } from 'lucide-react';

interface CardGridProps {
  cards: CardItem[];
  onTapCard: (cardId: string) => void;
  disabled?: boolean;
}

export const CardGrid: React.FC<CardGridProps> = ({ cards, onTapCard, disabled = false }) => {
  const isSixGrid = cards.length > 4;

  const renderShapeIcon = (shape?: string) => {
    switch (shape) {
      case 'star':
        return <Star className="w-12 h-12 md:w-16 md:h-16 fill-white text-white drop-shadow-md" />;
      case 'circle':
        return <Circle className="w-12 h-12 md:w-16 md:h-16 fill-white text-white drop-shadow-md" />;
      case 'square':
        return <Square className="w-12 h-12 md:w-16 md:h-16 fill-white text-white drop-shadow-md" />;
      case 'triangle':
        return <Triangle className="w-12 h-12 md:w-16 md:h-16 fill-white text-white drop-shadow-md" />;
      case 'diamond':
        return <Diamond className="w-12 h-12 md:w-16 md:h-16 fill-white text-white drop-shadow-md" />;
      case 'heart':
        return <Heart className="w-12 h-12 md:w-16 md:h-16 fill-white text-white drop-shadow-md" />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`grid gap-3 md:gap-4 w-full h-full max-w-lg mx-auto ${
        isSixGrid ? 'grid-cols-2 grid-rows-3' : 'grid-cols-2 grid-rows-2'
      }`}
    >
      {cards.map((card) => {
        return (
          <button
            key={card.id}
            type="button"
            disabled={disabled}
            onClick={() => onTapCard(card.id)}
            style={{
              backgroundColor: card.bgColor,
              borderColor: card.isBonus ? '#FBBF24' : 'rgba(255, 255, 255, 0.25)',
            }}
            className={`party-card relative flex flex-col items-center justify-center rounded-3xl border-4 shadow-xl transition-all select-none touch-manipulation cursor-pointer p-4 ${
              card.isBonus ? 'glow-gold scale-[1.02]' : 'hover:brightness-110 active:scale-95'
            } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {/* Bonus Indicator */}
            {card.isBonus && (
              <div className="absolute top-2 right-2 bg-yellow-400 text-purple-950 font-black text-xs md:text-sm px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-md animate-bounce-short">
                <Flame className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                2X BONUS
              </div>
            )}

            {/* Shape Icon */}
            {card.shape && <div className="mb-1">{renderShapeIcon(card.shape)}</div>}

            {/* Text / Stroop Label */}
            {card.label && (
              <span
                style={{ color: card.textColor || '#FFFFFF' }}
                className="font-black text-2xl md:text-3xl tracking-wider drop-shadow-lg"
              >
                {card.label}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
