import { Video, List, Layers, Music, Film, Sliders } from 'lucide-react';

const features = [
  {
    icon: Video,
    title: 'Vídeos individuais',
    description: 'Converta vídeos únicos de qualquer plataforma suportada.',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: List,
    title: 'Playlists',
    description: 'Processe playlists completas com apenas um clique.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Layers,
    title: 'Processamento em lote',
    description: 'Converta múltiplos arquivos simultaneamente.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    icon: Music,
    title: 'MP3',
    description: 'Extraia áudio de alta qualidade em formato MP3.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    icon: Film,
    title: 'MP4',
    description: 'Converta para MP4 com preservação de qualidade.',
    gradient: 'from-primary-500 to-blue-500',
  },
  {
    icon: Sliders,
    title: 'Controle de qualidade',
    description: 'Ajuste bitrate, resolução e outras configurações.',
    gradient: 'from-yellow-500 to-amber-500',
  },
];

export function Features() {
  return (
    <section id="recursos" className="py-20 sm:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900/50 to-gray-950 pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Recursos
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Tudo que você precisa para converter e gerenciar seus conteúdos de mídia.
          </p>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 list-none" aria-label="Recursos disponíveis">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="group relative p-6 bg-gray-900/30 border border-gray-800/50 rounded-2xl hover:border-gray-700/50 transition-all duration-300 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-1"
            >
              <div
                className={`w-12 h-12 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-4 opacity-80 group-hover:opacity-100 transition-opacity duration-300 shadow-lg`}
                aria-hidden="true"
              >
                <feature.icon className="h-6 w-6 text-white" />
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
