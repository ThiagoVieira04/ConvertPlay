import { useParams } from 'react-router-dom';
import { JobProgress } from '@/components/JobProgress';
import { Header } from '@/components/Header';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export function JobPage() {
  const { jobId } = useParams<{ jobId: string }>();

  if (!jobId) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Header />
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-400">Job ID não fornecido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4 mb-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>
        <JobProgress jobId={jobId} />
      </main>
    </div>
  );
}
