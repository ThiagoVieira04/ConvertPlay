import { Music, Film, Settings } from 'lucide-react';

export type Format = 'mp3' | 'mp4';

export type Mp3Quality = '128' | '192' | '256' | '320';
export type Mp4Quality = 'auto' | '360' | '480' | '720' | '1080';
export type Quality = Mp3Quality | Mp4Quality;

interface ConversionSettingsProps {
  format: Format;
  quality: Quality;
  onFormatChange: (format: Format) => void;
  onQualityChange: (quality: Quality) => void;
  itemCount: number;
  onConvert: () => void;
  isConverting: boolean;
}

const mp3Options: { value: Mp3Quality; label: string }[] = [
  { value: '128', label: '128 kbps — Compacto' },
  { value: '192', label: '192 kbps — Padrão' },
  { value: '256', label: '256 kbps — Alta qualidade' },
  { value: '320', label: '320 kbps — Máxima qualidade' },
];

const mp4Options: { value: Mp4Quality; label: string }[] = [
  { value: 'auto', label: 'Automático' },
  { value: '360', label: '360p — Baixa' },
  { value: '480', label: '480p — SD' },
  { value: '720', label: '720p — HD' },
  { value: '1080', label: '1080p — Full HD (quando disponível)' },
];

export function ConversionSettings({
  format,
  quality,
  onFormatChange,
  onQualityChange,
  itemCount,
  onConvert,
  isConverting,
}: ConversionSettingsProps) {
  const formatOptions = format === 'mp3' ? mp3Options : mp4Options;

  const handleFormatChange = (newFormat: Format) => {
    onFormatChange(newFormat);
    onQualityChange(newFormat === 'mp3' ? '192' : 'auto');
  };

  const buttonLabel = isConverting ? (
    <>
      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
      Preparando...
    </>
  ) : (
    <>
      {'INICIAR CONVERSÃO '}
      <span className="text-sm opacity-75">
        {`(${itemCount} ${itemCount === 1 ? 'vídeo' : 'vídeos'} • ${format.toUpperCase()} • ${
          format === 'mp3' ? `${quality} kbps` : `${quality}p`
        })`}
      </span>
    </>
  );

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in">
      <div className="p-6 bg-gray-900/50 border border-gray-800/50 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary-500/10 rounded-lg" aria-hidden="true">
            <Settings className="h-5 w-5 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white">Configurações de conversão</h3>
        </div>

        <fieldset className="mb-6">
          <legend className="block text-sm font-medium text-gray-400 mb-3">Formato</legend>
          <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Formato de saída">
            <button
              onClick={() => handleFormatChange('mp3')}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                format === 'mp3'
                  ? 'border-primary-500 bg-primary-500/10 text-white'
                  : 'border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-gray-600 hover:text-gray-300'
              }`}
              role="radio"
              aria-checked={format === 'mp3'}
            >
              <Music className="h-6 w-6" aria-hidden="true" />
              <div className="text-left">
                <div className="font-semibold">MP3</div>
                <div className="text-xs opacity-75">Áudio</div>
              </div>
            </button>

            <button
              onClick={() => handleFormatChange('mp4')}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                format === 'mp4'
                  ? 'border-primary-500 bg-primary-500/10 text-white'
                  : 'border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-gray-600 hover:text-gray-300'
              }`}
              role="radio"
              aria-checked={format === 'mp4'}
            >
              <Film className="h-6 w-6" aria-hidden="true" />
              <div className="text-left">
                <div className="font-semibold">MP4</div>
                <div className="text-xs opacity-75">Vídeo</div>
              </div>
            </button>
          </div>
        </fieldset>

        <fieldset className="mb-6">
          <legend className="block text-sm font-medium text-gray-400 mb-3">Qualidade</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label="Qualidade de saída">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => onQualityChange(option.value)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  quality === option.value
                    ? 'border-primary-500 bg-primary-500/10 text-white'
                    : 'border-gray-700/50 bg-gray-800/30 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                }`}
                role="radio"
                aria-checked={quality === option.value}
              >
                <span className="text-sm">{option.label}</span>
                {quality === option.value && (
                  <div className="w-2 h-2 bg-primary-400 rounded-full" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </fieldset>

        <button
          onClick={onConvert}
          disabled={isConverting}
          className="w-full py-4 bg-gradient-to-r from-primary-500 to-blue-600 hover:from-primary-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 disabled:shadow-none text-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          aria-label={isConverting ? 'Preparando conversão...' : `Iniciar conversão de ${itemCount} ${itemCount === 1 ? 'vídeo' : 'vídeos'} em ${format.toUpperCase()}`}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
