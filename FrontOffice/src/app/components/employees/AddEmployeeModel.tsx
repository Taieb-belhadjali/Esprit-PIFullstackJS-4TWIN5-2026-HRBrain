import { useEffect, useState } from "react";
import { createEmployee } from "../../../api/employeeApi";
import axios from "axios";

interface Skill {
  _id: string;
  name: string;
}

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
    skills: [] as string[],
  });

  const [file, setFile] = useState<File | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const response = await axios.get("http://localhost:3000/skills");
        setSkills(response.data || []);
      } catch (error) {
        console.error("Failed to fetch skills:", error);
      }
    };

    if (open) {
      fetchSkills();
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleSkill = (skillId: string) => {
    setForm((prev) => {
      const exists = prev.skills.includes(skillId);
      return {
        ...prev,
        skills: exists
          ? prev.skills.filter((id) => id !== skillId)
          : [...prev.skills, skillId],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      alert("Name, Email and Password are required");
      return;
    }

    if (form.role === "EMPLOYEE") {
      if (!file) {
        alert("CV file (PDF or TXT) is required for employees");
        return;
      }

      const allowedTypes = ["application/pdf", "text/plain"];
      if (!allowedTypes.includes(file.type)) {
        alert("Only PDF or TXT files are allowed");
        return;
      }
    }

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("role", form.role);
      form.skills.forEach((skillId) => formData.append("skills", skillId));

      if (file) {
        formData.append("cv", file);
      }

      await createEmployee(formData);

      onCreated();
      onClose();

      setForm({
        name: "",
        email: "",
        password: "",
        role: "EMPLOYEE",
        skills: [],
      });
      setFile(null);
    } catch (err: any) {
      console.error("Failed to create employee:", err);
      alert(err.response?.data?.message || "Error creating employee");
    }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">
            <div className="modal-header">
              <h5 className="modal-title">Add Employee</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

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

                {form.role === "EMPLOYEE" && (
                  <div className="mb-3">
                    <label className="form-label">Skills</label>
                    <div className="border rounded p-2" style={{ maxHeight: 180, overflowY: "auto" }}>
                      {skills.length === 0 ? (
                        <small className="text-muted">No skills found</small>
                      ) : (
                        skills.map((skill) => (
                          <div key={skill._id} className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`skill-${skill._id}`}
                              checked={form.skills.includes(skill._id)}
                              onChange={() => toggleSkill(skill._id)}
                            />
                            <label className="form-check-label" htmlFor={`skill-${skill._id}`}>
                              {skill.name}
                            </label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {form.role === "EMPLOYEE" && (
                  <div className="mb-3">
                    <label className="form-label">Upload CV (PDF or TXT)</label>
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

      {open && <div className="modal-backdrop fade show"></div>}
    </>
  );
}