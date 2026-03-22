import React from "react";

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  skills?: Array<{ _id: string; name: string } | string>;
}

interface Props {
  open: boolean;
  employee: Employee | null;
  onClose: () => void;
}

export default function ViewEmployeeModal({ open, employee, onClose }: Props) {
  if (!open || !employee) return null;

  const skillNames = (employee.skills || []).map((skill) =>
    typeof skill === 'string' ? skill : skill.name,
  );

  // 🔹 ROLE COLOR HELPER
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "HR":
        return "badge bg-danger";
      case "MANAGER":
        return "badge bg-warning text-dark";
      default:
        return "badge bg-success";
    }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow">

            {/* HEADER */}
            <div className="modal-header">
              <h5 className="modal-title">Employee Details</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            {/* BODY */}
            <div className="modal-body">

              <div className="text-center mb-4">
                <div
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mx-auto"
                  style={{ width: 70, height: 70, fontSize: 24 }}
                >
                  {employee.name.charAt(0).toUpperCase()}
                </div>

                <h5 className="mt-2">{employee.name}</h5>

                {/* ✅ COLORED ROLE BADGE */}
                <span className={getRoleBadge(employee.role)}>
                  {employee.role}
                </span>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Email</label>
                <div className="form-control bg-light">{employee.email}</div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Employee ID</label>
                <div className="form-control bg-light">{employee.id}</div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Skills</label>
                <div className="form-control bg-light">
                  {skillNames.length > 0 ? skillNames.join(', ') : 'No skills assigned'}
                </div>
              </div>

            </div>

            {/* FOOTER */}
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>

          </div>
        </div>
      </div>

      {open && <div className="modal-backdrop fade show"></div>}
    </>
  );
}