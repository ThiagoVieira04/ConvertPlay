import { Check } from 'lucide-react';
import type { PlaylistItem as PlaylistItemType } from '@/services/media';

interface PlaylistItemProps {
  item: PlaylistItemType;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PlaylistItem({ item, isSelected, onToggle }: PlaylistItemProps) {
  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 cursor-pointer group ${
        isSelected
          ? 'bg-primary-500/10 border border-primary-500/30'
          : 'bg-gray-900/30 border border-gray-800/50 hover:border-gray-700/50 hover:bg-gray-900/50'
      }`}
      onClick={() => onToggle(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(item.id);
        }
      }}
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`${item.title} - ${formatDuration(item.duration)}${isSelected ? ' (selecionado)' : ''}`}
      tabIndex={0}
    >
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          isSelected
            ? 'bg-primary-500 border-primary-500'
            : 'border-gray-600 group-hover:border-gray-500'
        }`}
        aria-hidden="true"
      >
        {isSelected && <Check className="h-4 w-4 text-white" />}
      </div>

      <span className="flex-shrink-0 w-8 text-sm text-gray-500 text-center font-medium" aria-hidden="true">
        {item.position}
      </span>

      <div className="flex-shrink-0 w-24 h-14 rounded-lg overflow-hidden bg-gray-800">
        <img
          src={item.thumbnail}
          alt={`Thumbnail: ${item.title}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
          {item.title}
        </p>
      </div>

      <span className="flex-shrink-0 text-sm text-gray-500 font-mono" aria-hidden="true">
        {formatDuration(item.duration)}
      </span>
    </div>
  );
}
