import { FolderArchive } from "lucide-react";

export default function PublicFrame({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center gap-3">
          <FolderArchive className="h-7 w-7 text-blue-400" />
          <div>
            <p className="font-bold leading-tight">Property Quest Turkey</p>
            <p className="text-xs text-slate-400">Secure client documents</p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}

export function LinkInvalid() {
  return (
    <PublicFrame title="This link is not valid" subtitle="It may have expired or been switched off. Please ask Property Quest Turkey for a new link.">
      <span />
    </PublicFrame>
  );
}
