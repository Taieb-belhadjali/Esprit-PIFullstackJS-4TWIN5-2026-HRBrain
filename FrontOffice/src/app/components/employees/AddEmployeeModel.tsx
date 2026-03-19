import { useState } from "react";
import { createEmployee } from "../../../api/employeeApi";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddEmployeeModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE",
  });

  const [file, setFile] = useState<File | null>(null);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation champs obligatoires
    if (!form.name || !form.email || !form.password) {
      alert("Name, Email and Password are required");
      return;
    }

    // Si EMPLOYEE → fichier obligatoire + PDF uniquement
    if (form.role === "EMPLOYEE") {
      if (!file) {
        alert("PDF file is required for employees");
        return;
      }

      if (file.type !== "application/pdf") {
        alert("Only PDF files are allowed");
        return;
      }
    }

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("role", form.role);

      if (file) {
        formData.append("cv", file); // ⚠️ Doit correspondre au backend
      }

      await createEmployee(formData);

      onCreated();
      onClose();

      // Reset form
      setForm({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
      });
      setFile(null);
    } catch (err: any) {
      console.error("Failed to create employee:", err);
      alert(err.response?.data?.message || "Error creating employee");
    }
  };

  return (
    <>
      {/* Modal */}
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">
            {/* HEADER */}
            <div className="modal-header">
              <h5 className="modal-title">Add Employee</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            {/* BODY */}
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    className="form-control"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select
                    className="form-select"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                  >
                    <option value="HR">HR</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                  </select>
                </div>

                {/* Upload CV uniquement si EMPLOYEE */}
                {form.role === "EMPLOYEE" && (
                  <div className="mb-3">
                    <label className="form-label">Upload CV (PDF only)</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="form-control"
                      onChange={(e) => {
                        if (e.target.files) {
                          setFile(e.target.files[0]);
                        }
                      }}
                      required
                    />
                  </div>
                )}
              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Backdrop */}
      {open && <div className="modal-backdrop fade show"></div>}
    </>
  );
}