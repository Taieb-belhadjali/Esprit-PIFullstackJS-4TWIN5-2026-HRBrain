import React, { useState } from "react";
import { Download, AlertCircle } from "lucide-react";

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

export default function ViewEmployeeModal({ open, employee, onClose }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  if (!open || !employee) return null;

  const skillNames = (employee.skills || []).map((skill) =>
    typeof skill === 'string' ? skill : skill.name,
  );

  const handleDownloadCV = async () => {
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/users/${employee.id}/cv/download`
      );
      
      if (!response.ok) {
        throw new Error("Impossible de télécharger le fichier CV");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CV_${employee.name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "Erreur lors du téléchargement");
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  // ROLE COLOR HELPER
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

  // SKILL LEVEL COLOR
  const getSkillLevelColor = (skillName: string) => {
    const lowerName = skillName.toLowerCase();
    if (lowerName.includes('high')) return 'bg-success';
    if (lowerName.includes('medium')) return 'bg-info';
    if (lowerName.includes('low')) return 'bg-secondary';
    return 'bg-primary';
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow">

            {/* HEADER */}
            <div className="modal-header border-bottom">
              <h5 className="modal-title">Détails de l'Employé</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            {/* BODY */}
            <div className="modal-body">

              {/* PROFILE SECTION */}
              <div className="text-center mb-4 pb-3 border-bottom">
                <div
                  className="rounded-circle bg-gradient text-white d-flex align-items-center justify-content-center mx-auto mb-2"
                  style={{ 
                    width: 80, 
                    height: 80, 
                    fontSize: 32,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  }}
                >
                  {employee.name.charAt(0).toUpperCase()}
                </div>

                <h5 className="mt-3 mb-1">{employee.name}</h5>

                {/* ROLE BADGE */}
                <span className={getRoleBadge(employee.role)}>
                  {employee.role}
                </span>
              </div>

              {/* INFO SECTION */}
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small">Email</label>
                  <div className="form-control bg-light border-0">{employee.email}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold text-muted small">ID Employé</label>
                  <div className="form-control bg-light border-0">{employee.id}</div>
                </div>
              </div>

              {/* SKILLS SECTION */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  🎯 Compétences ({skillNames.length})
                </label>
                <div className="p-3 bg-light rounded">
                  {skillNames.length > 0 ? (
                    <div className="d-flex flex-wrap gap-2">
                      {skillNames.map((skill, idx) => (
                        <span 
                          key={idx} 
                          className={`badge ${getSkillLevelColor(skill)} text-white px-3 py-2`}
                          style={{ fontSize: '0.9rem' }}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-0">Aucune compétence assignée</p>
                  )}
                </div>
              </div>

              {/* ERROR MESSAGE */}
              {downloadError && (
                <div className="alert alert-warning d-flex align-items-center gap-2 mb-3">
                  <AlertCircle size={20} />
                  <span>{downloadError}</span>
                </div>
              )}

              {/* CV DOWNLOAD SECTION */}
              {employee.role === 'EMPLOYEE' && (
                <div className="alert alert-info border-0 bg-info bg-opacity-10">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <strong>📄 Fichier CV</strong>
                      <p className="text-muted small mb-0">Téléchargez le CV avec les compétences détectées</p>
                    </div>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={handleDownloadCV}
                      disabled={downloading}
                    >
                      <Download size={16} className="me-2" style={{ display: 'inline' }} />
                      {downloading ? 'Téléchargement...' : 'Télécharger'}
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* FOOTER */}
            <div className="modal-footer border-top">
              <button className="btn btn-secondary" onClick={onClose}>
                Fermer
              </button>
            </div>

          </div>
        </div>
      </div>

      {open && <div className="modal-backdrop fade show"></div>}
    </>
  );
}