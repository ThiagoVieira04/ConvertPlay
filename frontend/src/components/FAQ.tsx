import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Quais plataformas são suportadas?',
    answer:
      'Atualmente suportamos YouTube, Vimeo e diversas outras plataformas populares. Estamos sempre adicionando novas plataformas para expandir nossa compatibilidade.',
  },
  {
    question: 'É necessário criar uma conta?',
    answer:
      'Não! Nosso serviço é totalmente gratuito e não requer registro. Basta colar a URL e começar a converter.',
  },
  {
    question: 'Quais formatos de áudio e vídeo são suportados?',
    answer:
      'Suportamos MP3, MP4, WAV, FLAC, AVI e muitos outros formatos. Você pode escolher a qualidade e o formato que melhor se adapta às suas necessidades.',
  },
  {
    question: 'Há limite de tamanho para os arquivos?',
    answer:
      'Para vídeos individuais, não há limite de duração. Para playlists, recomendamos no máximo 100 vídeos por processamento para garantir a melhor experiência.',
  },
  {
    question: 'Os arquivos ficam armazenados em seus servidores?',
    answer:
      'Não. Os arquivos são processados e entregues diretamente a você. Não armazenamos nenhum conteúdo em nossos servidores após a conclusão do download.',
  },
  {
    question: 'Posso converter playlists inteiras?',
    answer:
      'Sim! Cole a URL de qualquer playlist e nós processaremos todos os vídeos automaticamente, permitindo baixar individualmente ou em lote.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 sm:py-32 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-500/10 rounded-xl mb-4" aria-hidden="true">
            <HelpCircle className="h-6 w-6 text-primary-400" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Perguntas frequentes
            </span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Tire suas dúvidas sobre nossa plataforma.
          </p>
        </div>

        <div className="space-y-4" role="list" aria-label="Perguntas frequentes">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-button-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div
                key={index}
                className="border border-gray-800/50 rounded-xl overflow-hidden hover:border-gray-700/50 transition-colors duration-200"
                role="listitem"
              >
                <button
                  id={buttonId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left bg-gray-900/30 hover:bg-gray-900/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset transition-colors duration-200"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="font-medium text-white pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="p-5 pt-0 text-gray-400 text-sm leading-relaxed">{faq.answer}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
