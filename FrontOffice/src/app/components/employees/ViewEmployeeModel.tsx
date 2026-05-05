import { useState } from "react";
import { Download, AlertCircle, X, Mail, IdCard, Briefcase } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  skills?: Array<{ _id: string; name: string } | string>;
  cv?: string;
}

interface Props {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
}

const roleStyle: Record<string, string> = {
  HR:       'bg-red-100 text-red-700',
  MANAGER:  'bg-yellow-100 text-yellow-700',
  EMPLOYEE: 'bg-green-100 text-green-700',
};

export default function ViewEmployeeModal({ open, employee, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  if (!open || !employee) return null;

  const skillNames = (employee.skills || []).map((s) =>
    typeof s === 'string' ? s : s.name,
  );

  const handleDownloadCV = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const token = (() => {
        try { const a = JSON.parse(localStorage.getItem('hrbrain_auth') || '{}'); return a?.token ?? ''; }
        catch { return ''; }
      })();
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/${employee.id}/cv/download`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} },
      );
      if (!res.ok) throw new Error('Impossible de télécharger le CV');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `CV_${employee.name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-emp-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border border-border overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 id="view-emp-title" className="text-lg font-semibold text-foreground">
              Détails de l'employé
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

            {/* Avatar + name */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                aria-hidden="true"
              >
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-xl font-bold text-foreground">{employee.name}</h3>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${roleStyle[employee.role] ?? 'bg-gray-100 text-gray-700'}`}>
                {employee.role}
              </span>
            </div>

            {/* Info fields */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="bg-secondary/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Mail size={13} /> Email
                </div>
                <p className="text-sm text-foreground font-medium truncate">{employee.email}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Briefcase size={13} /> Rôle
                </div>
                <p className="text-sm text-foreground font-medium">{employee.role}</p>
              </div>
              <div className="bg-secondary/50 rounded-xl px-4 py-3 sm:col-span-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <IdCard size={13} /> ID Employé
                </div>
                <p className="text-xs text-foreground font-mono break-all">{employee.id}</p>
              </div>
            </div>

            {/* Skills */}
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Compétences ({skillNames.length})
              </p>
              <div className="bg-secondary/50 rounded-xl p-3 min-h-[48px]">
                {skillNames.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {skillNames.map((skill, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucune compétence assignée</p>
                )}
              </div>
            </div>

            {/* CV download */}
            {employee.role === 'EMPLOYEE' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-blue-800">Fichier CV</p>
                  <p className="text-xs text-blue-600">Télécharger le CV avec les compétences détectées</p>
                </div>
                <button
                  onClick={handleDownloadCV}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0"
                >
                  <Download size={14} />
                  {downloading ? 'Chargement…' : 'Télécharger'}
                </button>
              </div>
            )}

            {/* Download error */}
            {downloadError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                <AlertCircle size={16} className="shrink-0" />
                {downloadError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-input text-sm font-medium text-foreground hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
