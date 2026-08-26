import { useState, useMemo } from 'react';
import { List, Clock, Film, CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PlaylistInfo } from '@/services/media';
import { PlaylistItem } from './PlaylistItem';

const ITEMS_PER_PAGE = 10;

interface PlaylistViewProps {
  playlist: PlaylistInfo;
  selectedItems: Set<string>;
  onSelectionChange: (items: Set<string>) => void;
}

function formatTotalDuration(items: { duration: number }[]): string {
  const totalSeconds = items.reduce((acc, item) => acc + item.duration, 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}

export function PlaylistView({ playlist, selectedItems, onSelectionChange }: PlaylistViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(playlist.items.length / ITEMS_PER_PAGE);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return playlist.items.slice(start, start + ITEMS_PER_PAGE);
  }, [playlist.items, currentPage]);

  const allVisibleSelected = paginatedItems.every((item) => selectedItems.has(item.id));
  const someVisibleSelected = paginatedItems.some((item) => selectedItems.has(item.id));

  const handleSelectAll = () => {
    const allIds = new Set(playlist.items.map((item) => item.id));
    onSelectionChange(allIds);
  };

  const handleClearSelection = () => {
    onSelectionChange(new Set());
  };

  const handleToggleVisible = () => {
    if (allVisibleSelected) {
      const newSelection = new Set(selectedItems);
      paginatedItems.forEach((item) => newSelection.delete(item.id));
      onSelectionChange(newSelection);
    } else {
      const newSelection = new Set(selectedItems);
      paginatedItems.forEach((item) => newSelection.add(item.id));
      onSelectionChange(newSelection);
    }
  };

  const handleToggleItem = (id: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    onSelectionChange(newSelection);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-6 p-6 bg-gray-900/50 border border-gray-800/50 rounded-2xl mb-6">
        <div className="flex-shrink-0 w-full sm:w-48 h-28 rounded-xl overflow-hidden bg-gray-800">
          <img
            src={playlist.thumbnail}
            alt={`Thumbnail da playlist: ${playlist.title}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white mb-2 truncate">{playlist.title}</h3>
          <div className="flex flex-wrap gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-primary-400" aria-hidden="true" />
              <span>{playlist.itemCount} vídeos</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary-400" aria-hidden="true" />
              <span>{formatTotalDuration(playlist.items)}</span>
            </div>
            <div className="flex items-center gap-2">
              <List className="h-4 w-4 text-primary-400" aria-hidden="true" />
              <span>YouTube</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 px-1">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors duration-200"
            aria-label="Selecionar todos os vídeos"
          >
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            Selecionar todos
          </button>
          <button
            onClick={handleClearSelection}
            disabled={selectedItems.size === 0}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors duration-200"
            aria-label="Limpar seleção"
          >
            <Square className="h-4 w-4" aria-hidden="true" />
            Limpar seleção
          </button>
        </div>

        <div className="text-sm text-gray-500" aria-live="polite">
          {selectedItems.size > 0 ? (
            <span>
              <span className="text-primary-400 font-medium">{selectedItems.size}</span> de{' '}
              {playlist.itemCount} selecionados
            </span>
          ) : (
            <span>Nenhum selecionado</span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <button
          className="w-full flex items-center gap-4 p-3 bg-gray-800/30 rounded-xl hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
          onClick={handleToggleVisible}
          aria-label={allVisibleSelected ? 'Desmarcar todos da página atual' : 'Marcar todos da página atual'}
        >
          <div
            className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
              allVisibleSelected
                ? 'bg-primary-500 border-primary-500'
                : someVisibleSelected
                  ? 'bg-primary-500/50 border-primary-500'
                  : 'border-gray-600'
            }`}
            aria-hidden="true"
          >
            {allVisibleSelected && (
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {someVisibleSelected && !allVisibleSelected && (
              <div className="w-2 h-2 bg-white rounded-sm" />
            )}
          </div>
          <span className="text-sm text-gray-400">
            {allVisibleSelected ? 'Desmarcar esta página' : 'Marcar esta página'}
          </span>
        </button>

        {paginatedItems.map((item) => (
          <PlaylistItem
            key={item.id}
            item={item}
            isSelected={selectedItems.has(item.id)}
            onToggle={handleToggleItem}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4 py-4" aria-label="Paginação">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors duration-200"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2" role="list">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => {
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .reduce<(number | 'ellipsis')[]>((acc, page, idx, arr) => {
                if (idx > 0) {
                  const prev = arr[idx - 1];
                  if (page - prev > 1) {
                    acc.push('ellipsis');
                  }
                }
                acc.push(page);
                return acc;
              }, [])
              .map((item, idx) =>
                item === 'ellipsis' ? (
                  <span key={`ellipsis-${idx}`} className="text-gray-600 px-1" aria-hidden="true">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      currentPage === item
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                    aria-label={`Página ${item}`}
                    aria-current={currentPage === item ? 'page' : undefined}
                  >
                    {item}
                  </button>
                ),
              )}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors duration-200"
            aria-label="Próxima página"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </nav>
      )}

      {totalPages > 1 && (
        <p className="text-center text-sm text-gray-500 mt-2" aria-live="polite">
          Página {currentPage} de {totalPages}
        </p>
      )}
    </div>
  );
}
