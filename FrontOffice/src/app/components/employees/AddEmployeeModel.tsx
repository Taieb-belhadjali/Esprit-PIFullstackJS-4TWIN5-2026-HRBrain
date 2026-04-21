// Formulaire ajout utilisateur avec mot de passe auto-généré
import { useEffect, useRef, useState } from "react";
import { createEmployee } from "../../../api/employeeApi";
import API from "../../../api/api";
import { Copy, Check, RefreshCw, X } from "lucide-react";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface Skill { _id: string; name: string; }
interface Department { _id: string; name: string; }

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  prefilledName?: string | null;
  userRole?: string;
}

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const MODAL_TITLE_ID = 'add-employee-title';

export default function AddEmployeeModal({ open, onClose, onCreated, prefilledName, userRole }: Props) {
  const [form, setForm] = useState({
    name: "", email: "", password: generatePassword(), role: "EMPLOYEE",
    skills: [] as string[], departmentId: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // WCAG 2.1.1 — focus trap: keeps focus inside modal, Escape closes it
  const dialogRef = useFocusTrap(open, onClose);

  useEffect(() => {
    if (!open) return;
    setError(null);
    API.get("/skills").then(r => setSkills(r.data || [])).catch(() => {});
    API.get("/departments").then(r => setDepartments(r.data || [])).catch(() => {});
    setForm(prev => ({ ...prev, password: generatePassword(), name: prefilledName ?? prev.name }));
  }, [open, prefilledName]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const toggleSkill = (id: string) =>
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(id) ? prev.skills.filter(s => s !== id) : [...prev.skills, id],
    }));

  const copyPassword = () => {
    navigator.clipboard.writeText(form.password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name || !form.email) {
      setError("Le nom et l'email sont obligatoires.");
      return;
    }
    if (form.role === "MANAGER" && !form.departmentId) {
      setError("Un département est obligatoire pour un Manager.");
      return;
    }
    if (file && !["application/pdf", "text/plain"].includes(file.type)) {
      setError("Seuls les fichiers PDF ou TXT sont acceptés.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("role", form.role);
      if (form.departmentId) formData.append("departmentId", form.departmentId);
      form.skills.forEach(id => formData.append("skills", id));
      if (file) formData.append("cv", file);

      await createEmployee(formData);
      onCreated();
      onClose();
      setForm({ name: "", email: "", password: generatePassword(), role: "EMPLOYEE", skills: [], departmentId: "" });
      setFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erreur lors de la création.");
    }
  };

  return (
    <>
      {/* WCAG 1.3.1 — backdrop non interactif masqué aux AT */}
      <div
        className="fixed inset-0 z-40 bg-black/50"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* WCAG 4.1.2 — role dialog + aria-modal + aria-labelledby */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={MODAL_TITLE_ID}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 id={MODAL_TITLE_ID} className="text-lg font-semibold text-foreground">
              Ajouter un utilisateur
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

          {/* WCAG 4.1.3 — erreurs annoncées via role="alert" */}
          {error && (
            <div role="alert" className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="p-5 space-y-4">

              {/* WCAG 1.3.1 — htmlFor associe chaque label à son input */}
              <div>
                <label htmlFor="add-name" className="block text-sm font-medium text-foreground mb-1">
                  Nom <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(obligatoire)</span>
                </label>
                <input
                  id="add-name"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
              </div>

              <div>
                <label htmlFor="add-email" className="block text-sm font-medium text-foreground mb-1">
                  Email <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(obligatoire)</span>
                </label>
                <input
                  id="add-email"
                  type="email"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  aria-required="true"
                />
              </div>

              {/* Mot de passe auto-généré */}
              <div>
                <label htmlFor="add-password" className="block text-sm font-medium text-foreground mb-1">
                  Mot de passe généré automatiquement
                </label>
                <div className="flex gap-2">
                  <input
                    id="add-password"
                    type="text"
                    className="flex-1 px-3 py-2 border border-input rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={form.password}
                    readOnly
                    aria-readonly="true"
                  />
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="px-3 py-2 border border-input rounded-lg hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label={copied ? "Mot de passe copié" : "Copier le mot de passe"}
                  >
                    {copied
                      ? <Check size={16} className="text-green-600" aria-hidden="true" />
                      : <Copy size={16} aria-hidden="true" />
                    }
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, password: generatePassword() }))}
                    className="px-3 py-2 border border-input rounded-lg hover:bg-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                    aria-label="Générer un nouveau mot de passe"
                  >
                    <RefreshCw size={16} aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Communiquez ce mot de passe à l'utilisateur — il devra le changer à la première connexion.
                </p>
              </div>

              <div>
                <label htmlFor="add-role" className="block text-sm font-medium text-foreground mb-1">
                  Rôle <span aria-hidden="true" className="text-destructive">*</span>
                  <span className="sr-only">(obligatoire)</span>
                </label>
                <select
                  id="add-role"
                  className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  required
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="MANAGER">Manager</option>
                  {userRole === 'SUPERADMIN' && <option value="HR">HR</option>}
                </select>
              </div>

              {(form.role === "EMPLOYEE" || form.role === "MANAGER") && (
                <div>
                  <label htmlFor="add-department" className="block text-sm font-medium text-foreground mb-1">
                    Département
                    {form.role === "MANAGER" && (
                      <><span aria-hidden="true" className="text-destructive"> *</span><span className="sr-only">(obligatoire)</span></>
                    )}
                    {form.role === "EMPLOYEE" && (
                      <span className="text-muted-foreground font-normal"> — optionnel</span>
                    )}
                  </label>
                  <select
                    id="add-department"
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    name="departmentId"
                    value={form.departmentId}
                    onChange={handleChange}
                    required={form.role === "MANAGER"}
                    aria-required={form.role === "MANAGER"}
                  >
                    <option value="">-- Sélectionner un département --</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
              )}

              {form.role === "EMPLOYEE" && (
                <fieldset>
                  <legend className="block text-sm font-medium text-foreground mb-1">Skills</legend>
                  <div
                    className="border border-input rounded-lg p-2 max-h-44 overflow-y-auto"
                    role="group"
                    aria-label="Sélection des skills"
                  >
                    {skills.length === 0
                      ? <p className="text-sm text-muted-foreground p-1">Aucun skill disponible</p>
                      : skills.map(skill => (
                        <label
                          key={skill._id}
                          className="flex items-center gap-2 px-2 py-1 rounded hover:bg-secondary cursor-pointer text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={form.skills.includes(skill._id)}
                            onChange={() => toggleSkill(skill._id)}
                            className="rounded focus:ring-2 focus:ring-primary"
                          />
                          {skill.name}
                        </label>
                      ))
                    }
                  </div>
                </fieldset>
              )}

              {form.role === "EMPLOYEE" && (
                <div>
                  <label htmlFor="add-cv" className="block text-sm font-medium text-foreground mb-1">
                    CV (PDF ou TXT) <span className="text-muted-foreground font-normal">— optionnel</span>
                  </label>
                  <input
                    id="add-cv"
                    type="file"
                    accept="application/pdf,text/plain"
                    className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-secondary file:text-foreground hover:file:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary"
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                    aria-describedby="cv-hint"
                  />
                  <p id="cv-hint" className="text-xs text-muted-foreground mt-1">
                    Sans fichier, un CV sera généré automatiquement.
                  </p>
                </div>
              )}

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
                Créer
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
