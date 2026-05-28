import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
      <div className="text-center">
        <h1 className="text-8xl font-black text-slate-200 dark:text-slate-800 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page introuvable</h2>
        <p className="text-slate-500 mb-8">La page que vous cherchez n'existe pas.</p>
        <Link href="/" className="px-6 py-3 bg-[var(--accent)] text-white rounded-2xl font-bold hover:opacity-90 transition-all">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
