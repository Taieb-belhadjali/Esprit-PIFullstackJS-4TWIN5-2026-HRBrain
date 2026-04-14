// Formulaire ajout utilisateur avec mot de passe auto-généré
import { useEffect, useState } from "react";
import { createEmployee } from "../../../api/employeeApi";
import API from "../../../api/api";
import { Copy, Check, RefreshCw } from "lucide-react";

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

export default function AddEmployeeModal({ open, onClose, onCreated, prefilledName, userRole }: Props) {
  const [form, setForm] = useState({
    name: "", email: "", password: generatePassword(), role: "EMPLOYEE",
    skills: [] as string[], departmentId: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
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
    if (!form.name || !form.email) { alert("Name and Email are required"); return; }
    if (form.role === "MANAGER" && !form.departmentId) { alert("Un département est obligatoire pour un Manager"); return; }
    if (file && !["application/pdf", "text/plain"].includes(file.type)) { alert("Only PDF or TXT files are allowed"); return; }

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
      alert(err.response?.data?.message || "Error creating user");
    }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">
            <div className="modal-header">
              <h5 className="modal-title">Add User</h5>
              <button className="btn-close" onClick={onClose} />
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">

                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input className="form-control" name="name" value={form.name} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" name="email" value={form.email} onChange={handleChange} required />
                </div>

                {/* Mot de passe auto-généré */}
                <div className="mb-3">
                  <label className="form-label">Mot de passe généré automatiquement</label>
                  <div className="input-group">
                    <input type="text" className="form-control font-monospace" value={form.password} readOnly />
                    <button type="button" className="btn btn-outline-secondary" onClick={copyPassword} title="Copier">
                      {copied ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" title="Regénérer"
                      onClick={() => setForm(prev => ({ ...prev, password: generatePassword() }))}>
                      <RefreshCw size={16} />
                    </button>
                  </div>
                  <small className="text-muted">Communiquez ce mot de passe à l'utilisateur — il devra le changer à la première connexion.</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select className="form-select" name="role" value={form.role} onChange={handleChange} required>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="MANAGER">Manager</option>
                    {userRole === 'SUPERADMIN' && <option value="HR">HR</option>}
                  </select>
                </div>

                {(form.role === "EMPLOYEE" || form.role === "MANAGER") && (
                  <div className="mb-3">
                    <label className="form-label">
                      Département
                      {form.role === "MANAGER" && <span className="text-danger"> *</span>}
                      {form.role === "EMPLOYEE" && <span className="text-muted fw-normal"> — optionnel</span>}
                    </label>
                    <select className="form-select" name="departmentId" value={form.departmentId}
                      onChange={handleChange} required={form.role === "MANAGER"}>
                      <option value="">-- Sélectionner un département --</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                )}

                {form.role === "EMPLOYEE" && (
                  <div className="mb-3">
                    <label className="form-label">Skills</label>
                    <div className="border rounded p-2" style={{ maxHeight: 180, overflowY: "auto" }}>
                      {skills.length === 0 ? <small className="text-muted">No skills found</small>
                        : skills.map(skill => (
                          <div key={skill._id} className="form-check">
                            <input className="form-check-input" type="checkbox" id={`skill-${skill._id}`}
                              checked={form.skills.includes(skill._id)} onChange={() => toggleSkill(skill._id)} />
                            <label className="form-check-label" htmlFor={`skill-${skill._id}`}>{skill.name}</label>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {form.role === "EMPLOYEE" && (
                  <div className="mb-3">
                    <label className="form-label">CV (PDF ou TXT) <span className="text-muted fw-normal">— optionnel</span></label>
                    <input type="file" accept="application/pdf,text/plain" className="form-control"
                      onChange={e => setFile(e.target.files?.[0] ?? null)} />
                    <small className="text-muted">Sans fichier, un CV sera généré automatiquement.</small>
                  </div>
                )}

              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      {open && <div className="modal-backdrop fade show" />}
    </>
  );
}
