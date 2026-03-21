import { useState, useEffect } from "react";
import { updateEmployee } from "../../../api/employeeApi";

export default function EditEmployeeModal({
  employee,
  open,
  onClose,
  onUpdated
}: {
  employee: any;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "EMPLOYEE"
  });

  useEffect(() => {
    if (employee) {
      setForm({
        name: employee.name || "",
        email: employee.email || "",
        password: "", // keep empty unless changing
        role: employee.role || "EMPLOYEE"
      });
    }
  }, [employee]);

  if (!open || !employee) return null;

  const handleChange = (e:any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    try {
      await updateEmployee(employee.id, form);
      onUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update employee");
    }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">

            {/* HEADER */}
            <div className="modal-header">
              <h5 className="modal-title">Edit Employee</h5>
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
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={form.password || ""}
                    onChange={handleChange}
                    placeholder="Leave empty to keep current password"
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

              </div>

              {/* FOOTER */}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning">
                  Save Changes
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