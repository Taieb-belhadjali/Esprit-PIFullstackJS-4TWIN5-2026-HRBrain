import { useState, useEffect } from "react";
import { updateEmployee } from "../../../api/employeeApi";
import { X } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

const MODAL_TITLE_ID = 'edit-employee-title';

export default function EditEmployeeModal({
  employee,
  open,
  onClose,
  onUpdated,
}: {
  employee: any;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "EMPLOYEE" });
  const [error, setError] = useState<string | null>(null);

  // WCAG 2.1.1 — focus trap
  const dialogRef = useFocusTrap(open, onClose);

  useEffect(() => {
    if (employee) {
      setForm({ name: employee.name || "", email: employee.email || "", password: "", role: employee.role || "EMPLOYEE" });
      setError(null);
    }
  }, [employee]);

  if (!open || !employee) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await updateEmployee(employee.id, form);
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Échec de la mise à jour. Veuillez réessayer.");
    }
  };

  return (
    <>
      {/* WCAG 1.3.1 — backdrop masqué aux AT */}
      <div className="fixed inset-0 z-40 bg-black/50" aria-hidden="true" onClick={onClose} />

      {/* WCAG 4.1.2 — role dialog + aria-modal + aria-labelledby */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={MODAL_TITLE_ID}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-border">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 id={MODAL_TITLE_ID} className="text-lg font-semibold text-foreground">
              Modifier l'employé
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Fermer la fenêtre"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* WCAG 4.1.3 — erreur annoncée */}
          {error && (
            <div role="alert" className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="p-5 space-y-4">

              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-foreground mb-1">Nom</label>
                <input
                  id="edit-name"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-foreground mb-1">Email</label>
                <input
                  id="edit-email"
                  type="email"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="edit-password" className="block text-sm font-medium text-foreground mb-1">
                  Nouveau mot de passe
                </label>
                <input
                  id="edit-password"
                  type="password"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Laisser vide pour conserver le mot de passe actuel"
                  aria-describedby="edit-password-hint"
                />
                <p id="edit-password-hint" className="text-xs text-muted-foreground mt-1">
                  Laisser vide pour conserver le mot de passe actuel.
                </p>
              </div>

              <div>
                <label htmlFor="edit-role" className="block text-sm font-medium text-foreground mb-1">Rôle</label>
                <select
                  id="edit-role"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="HR">HR</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>

            </div>

            {/* Footer */}
            <div className="flex gap-3 justify-end p-5 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
