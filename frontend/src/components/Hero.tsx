import { useState } from 'react';
import { Link, Loader2, Sparkles, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { analyzeMedia, type AnalyzeData, type PlaylistInfo, type VideoInfo } from '@/services/media';
import { createJob } from '@/services/jobs';
import { PlaylistView } from './PlaylistView';
import { ConversionSettings, type Format, type Quality } from './ConversionSettings';

export function Hero() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<Format>('mp3');
  const [quality, setQuality] = useState<Quality>('192');
  const [isConverting, setIsConverting] = useState(false);

  const handleAnalyze = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setError('Por favor, insira uma URL.');
      return;
    }

    try {
      const parsed = new URL(trimmedUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setError('Use um endereço HTTP ou HTTPS.');
        return;
      }
    } catch {
      setError('URL inválida. Insira um endereço completo.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSelectedItems(new Set());
    setFormat('mp3');
    setQuality('192');

    try {
      const response = await analyzeMedia(trimmedUrl);

      if (response.success && response.data) {
        setResult(response.data);

        if (response.data.type === 'playlist') {
          const allIds = new Set(response.data.items.map((item) => item.id));
          setSelectedItems(allIds);
        }
      } else {
        setError(response.error?.message || 'Erro ao analisar a URL.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao conectar com o servidor. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setResult(null);
    setSelectedItems(new Set());
    setError(null);
    setFormat('mp3');
    setQuality('192');
  };

  const handleConvert = async () => {
    if (!result) return;

    if (result.type === 'playlist' && selectedItems.size === 0) {
      setError('Selecione pelo menos um vídeo para converter.');
      return;
    }

    setIsConverting(true);
    setError(null);

    try {
      let items: { id: string; title: string; position: number }[] = [];

      if (result.type === 'video') {
        const video = result as VideoInfo;
        items = [{ id: video.id, title: video.title, position: 1 }];
      } else {
        const playlist = result as PlaylistInfo;
        items = playlist.items
          .filter((item) => selectedItems.has(item.id))
          .map((item) => ({ id: item.id, title: item.title, position: item.position }));
      }

      const response = await createJob({
        sourceUrl: url,
        type: result.type,
        items,
        format,
        quality,
      });

      if (response.success && response.data) {
        navigate(`/jobs/${response.data.jobId}`);
      } else {
        setError(response.error?.message || 'Erro ao criar job.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao criar job. Tente novamente.');
      }
    } finally {
      setIsConverting(false);
    }
  };

  const isPlaylist = result?.type === 'playlist';
  const isVideo = result?.type === 'video';
  const playlist = isPlaylist ? (result as PlaylistInfo) : null;
  const video = isVideo ? (result as VideoInfo) : null;

  const selectedCount = selectedItems.size;

  return (
    <section id="inicio" className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error && (
          <div className="max-w-2xl mx-auto mb-6 animate-fade-in" role="alert" aria-live="assertive">
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {isPlaylist && playlist ? (
          <div>
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded mb-6 transition-colors duration-200"
              aria-label="Voltar para entrada de URL"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              <span>Voltar</span>
            </button>

            <PlaylistView
              playlist={playlist}
              selectedItems={selectedItems}
              onSelectionChange={setSelectedItems}
            />

            <div className="mt-8">
              <ConversionSettings
                format={format}
                quality={quality}
                onFormatChange={setFormat}
                onQualityChange={setQuality}
                itemCount={selectedCount}
                onConvert={handleConvert}
                isConverting={isConverting}
              />
            </div>
          </div>
        ) : isVideo && video ? (
          <div className="animate-fade-in">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rounded mb-6 transition-colors duration-200"
              aria-label="Voltar para entrada de URL"
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
              <span>Voltar</span>
            </button>

            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-6">
                <CheckCircle className="h-8 w-8 text-green-400" aria-hidden="true" />
                <span className="text-2xl font-bold text-white">Vídeo encontrado</span>
              </div>

              <div className="max-w-md mx-auto p-6 bg-gray-900/50 border border-gray-800/50 rounded-2xl">
                <div className="w-48 h-28 mx-auto rounded-xl overflow-hidden bg-gray-800 mb-4">
                  <img
                    src={video.thumbnail}
                    alt={`Thumbnail: ${video.title}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-white font-medium mb-2">{video.title}</p>
                <p className="text-gray-500 text-sm">Vídeo individual</p>
              </div>
            </div>

            <ConversionSettings
              format={format}
              quality={quality}
              onFormatChange={setFormat}
              onQualityChange={setQuality}
              itemCount={1}
              onConvert={handleConvert}
              isConverting={isConverting}
            />
          </div>
        ) : (
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 border border-primary-500/20 rounded-full mb-8 animate-fade-in" aria-hidden="true">
              <Sparkles className="h-4 w-4 text-primary-400" />
              <span className="text-sm text-primary-300">Plataforma de conversão de mídia</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Converta seus vídeos e playlists
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-100">
              Uma maneira simples e organizada de processar seus conteúdos autorizados.
            </p>

            <div className="max-w-2xl mx-auto mb-6 animate-fade-in-up delay-200">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-blue-600 rounded-xl blur-lg opacity-50" aria-hidden="true" />
                <div className="relative flex flex-col sm:flex-row gap-3 bg-gray-900/80 backdrop-blur-xl p-3 rounded-xl border border-gray-700/50">
                  <div className="relative flex-1">
                    <Link className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" aria-hidden="true" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        setError(null);
                      }}
                      placeholder="Cole aqui a URL do vídeo ou playlist"
                      className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition-all duration-200"
                      onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                      disabled={isLoading}
                      aria-label="URL do vídeo ou playlist do YouTube"
                      aria-describedby={error ? 'url-error' : undefined}
                    />
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={isLoading || !url.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-primary-500 to-blue-600 hover:from-primary-600 hover:to-blue-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 disabled:shadow-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                    aria-label={isLoading ? 'Analisando URL...' : 'Analisar URL'}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                        Analisando...
                      </>
                    ) : (
                      'ANALISAR'
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-500 animate-fade-in-up delay-300">
              Suporte a vídeos individuais e playlists.
            </p>

            <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto animate-fade-in-up delay-400" role="list" aria-label="Estatísticas">
              <div className="text-center" role="listitem">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">100+</div>
                <div className="text-xs sm:text-sm text-gray-500">Formatos</div>
              </div>
              <div className="text-center" role="listitem">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">10x</div>
                <div className="text-xs sm:text-sm text-gray-500">Mais rápido</div>
              </div>
              <div className="text-center" role="listitem">
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1">100%</div>
                <div className="text-xs sm:text-sm text-gray-500">Gratuito</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
