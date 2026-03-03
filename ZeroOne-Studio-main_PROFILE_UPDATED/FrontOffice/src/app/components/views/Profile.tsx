import { useState } from 'react';
import { Mail, Briefcase, Calendar, Edit, Plus, Trash2 } from 'lucide-react';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface User {
  email: string;
  role: UserRole;
  name: string;
}

interface ProfileProps {
  user: User;
}

interface Certificate {
  id: string;
  title: string;
  issuer: string;
  date: string; // YYYY-MM
  url?: string;
}

interface Education {
  id: string;
  school: string;
  degree: string;
  field: string;
  start: string; // YYYY-MM
  end: string; // YYYY-MM | "Present"
}

const mockSkills = [
  { name: 'React', type: 'Know-How', level: 'Expert', progress: 95 },
  { name: 'TypeScript', type: 'Know-How', level: 'Expert', progress: 90 },
  { name: 'Communication', type: 'Soft Skill', level: 'Good', progress: 75 },
  { name: 'Team Leadership', type: 'Soft Skill', level: 'Good', progress: 70 },
];

const mockActivities = [
  {
    id: '1',
    title: 'Cloud Migration Training',
    status: 'In Progress',
    startDate: '2026-01-15',
    progress: 60,
  },
  {
    id: '2',
    title: 'Advanced React Patterns',
    status: 'Completed',
    startDate: '2025-11-20',
    progress: 100,
  },
];

export function Profile({ user }: ProfileProps) {
  // -----------------------------------
  // Front-only CRUD (localStorage)
  // -----------------------------------
  const CERT_KEY = 'hrbrain_certificates_v1';
  const EDU_KEY = 'hrbrain_education_v1';

  const safeJsonParse = <T,>(raw: string | null, fallback: T): T => {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  };

  const [certificates, setCertificates] = useState<Certificate[]>(
    safeJsonParse<Certificate[]>(localStorage.getItem(CERT_KEY), [])
  );

  const [education, setEducation] = useState<Education[]>(
    safeJsonParse<Education[]>(localStorage.getItem(EDU_KEY), [])
  );

  const persistCertificates = (next: Certificate[]) => {
    setCertificates(next);
    localStorage.setItem(CERT_KEY, JSON.stringify(next));
  };

  const persistEducation = (next: Education[]) => {
    setEducation(next);
    localStorage.setItem(EDU_KEY, JSON.stringify(next));
  };

  const uid = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [certForm, setCertForm] = useState<Omit<Certificate, 'id'>>({
    title: '',
    issuer: '',
    date: '',
    url: '',
  });

  const openCreateCert = () => {
    setEditingCert(null);
    setCertForm({ title: '', issuer: '', date: '', url: '' });
    setShowCertModal(true);
  };

  const openEditCert = (c: Certificate) => {
    setEditingCert(c);
    setCertForm({ title: c.title, issuer: c.issuer, date: c.date, url: c.url || '' });
    setShowCertModal(true);
  };

  const saveCert = () => {
    if (!certForm.title.trim() || !certForm.issuer.trim() || !certForm.date.trim()) return;

    if (editingCert) {
      persistCertificates(
        certificates.map((c) =>
          c.id === editingCert.id
            ? { ...c, ...certForm, url: certForm.url?.trim() || undefined }
            : c
        )
      );
    } else {
      persistCertificates([
        { id: uid('cert'), ...certForm, url: certForm.url?.trim() || undefined },
        ...certificates,
      ]);
    }

    setShowCertModal(false);
  };

  const deleteCert = (id: string) => {
    persistCertificates(certificates.filter((c) => c.id !== id));
  };

  const [showEduModal, setShowEduModal] = useState(false);
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);
  const [eduForm, setEduForm] = useState<Omit<Education, 'id'>>({
    school: '',
    degree: '',
    field: '',
    start: '',
    end: '',
  });

  const openCreateEdu = () => {
    setEditingEdu(null);
    setEduForm({ school: '', degree: '', field: '', start: '', end: '' });
    setShowEduModal(true);
  };

  const openEditEdu = (e: Education) => {
    setEditingEdu(e);
    setEduForm({ school: e.school, degree: e.degree, field: e.field, start: e.start, end: e.end });
    setShowEduModal(true);
  };

  const saveEdu = () => {
    if (!eduForm.school.trim() || !eduForm.degree.trim() || !eduForm.start.trim()) return;

    if (editingEdu) {
      persistEducation(education.map((e) => (e.id === editingEdu.id ? { ...e, ...eduForm } : e)));
    } else {
      persistEducation([{ id: uid('edu'), ...eduForm }, ...education]);
    }

    setShowEduModal(false);
  };

  const deleteEdu = (id: string) => {
    persistEducation(education.filter((e) => e.id !== id));
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Expert':
        return 'bg-green-100 text-green-700';
      case 'Good':
        return 'bg-blue-100 text-blue-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Low':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Knowledge':
        return 'bg-purple-100 text-purple-700';
      case 'Know-How':
        return 'bg-blue-100 text-blue-700';
      case 'Soft Skill':
        return 'bg-pink-100 text-pink-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl mb-2 text-gray-900">My Profile</h1>
        <p className="text-muted-foreground">View and manage your personal information</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-semibold">
              {user.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl mb-2 text-gray-900">{user.name}</h2>
              <div className="space-y-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  <span>{user.role}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined January 2022</span>
                </div>
              </div>
            </div>
          </div>
          <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">{mockSkills.length}</p>
            <p className="text-sm text-muted-foreground">Skills</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">{mockActivities.length}</p>
            <p className="text-sm text-muted-foreground">Activities</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-semibold text-gray-900">3.2</p>
            <p className="text-sm text-muted-foreground">Avg Skill Level</p>
          </div>
        </div>
      </div>

      {/* My Skills */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl text-gray-900">My Skills</h2>
          <button className="flex items-center gap-2 text-primary hover:underline">
            <Plus className="w-4 h-4" />
            Add Skill
          </button>
        </div>

        <div className="space-y-4">
          {mockSkills.map((skill, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-900">{skill.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(skill.type)}`}>
                    {skill.type}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getLevelColor(skill.level)}`}>
                    {skill.level}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">{skill.progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${skill.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Certificates + Education */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Certificates */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl text-gray-900">My Certificates</h2>
              <p className="text-sm text-muted-foreground"></p>
            </div>
            <button
              onClick={openCreateCert}
              className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {certificates.length === 0 ? (
              <div className="text-sm text-muted-foreground">No certificates yet.</div>
            ) : (
              certificates.map((c) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-border p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{c.title}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {c.issuer} • {c.date}
                    </div>
                    {c.url && (
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        View credential
                      </a>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEditCert(c)}
                      className="p-1.5 hover:bg-secondary rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteCert(c.id)}
                      className="p-1.5 hover:bg-secondary rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Education */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl text-gray-900">My Education</h2>
              <p className="text-sm text-muted-foreground"></p>
            </div>
            <button
              onClick={openCreateEdu}
              className="flex items-center gap-2 bg-primary text-white px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {education.length === 0 ? (
              <div className="text-sm text-muted-foreground">No education entries yet.</div>
            ) : (
              education.map((e) => (
                <div
                  key={e.id}
                  className="rounded-lg border border-border p-4 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{e.school}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {e.degree}{e.field ? ` • ${e.field}` : ''}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {e.start} → {e.end || 'Present'}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => openEditEdu(e)}
                      className="p-1.5 hover:bg-secondary rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => deleteEdu(e.id)}
                      className="p-1.5 hover:bg-secondary rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* My Activities */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-border">
        <h2 className="text-2xl mb-6 text-gray-900">My Activities</h2>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div
              key={activity.id}
              className="border border-border rounded-lg p-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{activity.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    Started: {new Date(activity.startDate).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    activity.status === 'Completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {activity.status}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-secondary rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      activity.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${activity.progress}%` }}
                  />
                </div>
                <span className="text-sm text-muted-foreground">{activity.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Certificates Modal */}
      {showCertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl mb-6 text-gray-900">
              {editingCert ? 'Edit Certificate' : 'Add Certificate'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">Title</label>
                <input
                  type="text"
                  value={certForm.title}
                  onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., CCNA, AWS SAA, Google Data Analytics"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Issuer</label>
                <input
                  type="text"
                  value={certForm.issuer}
                  onChange={(e) => setCertForm({ ...certForm, issuer: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Cisco, AWS, Coursera"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Date (YYYY-MM)</label>
                <input
                  type="month"
                  value={certForm.date}
                  onChange={(e) => setCertForm({ ...certForm, date: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Credential URL (optional)</label>
                <input
                  type="url"
                  value={certForm.url}
                  onChange={(e) => setCertForm({ ...certForm, url: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCertModal(false)}
                className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCert}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Education Modal */}
      {showEduModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h2 className="text-2xl mb-6 text-gray-900">
              {editingEdu ? 'Edit Education' : 'Add Education'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2 text-gray-700">School</label>
                <input
                  type="text"
                  value={eduForm.school}
                  onChange={(e) => setEduForm({ ...eduForm, school: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., ISET, INSAT, University of ..."
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Degree</label>
                <input
                  type="text"
                  value={eduForm.degree}
                  onChange={(e) => setEduForm({ ...eduForm, degree: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Bachelor, Engineering, Master"
                />
              </div>

              <div>
                <label className="block text-sm mb-2 text-gray-700">Field (optional)</label>
                <input
                  type="text"
                  value={eduForm.field}
                  onChange={(e) => setEduForm({ ...eduForm, field: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Networks, Cybersecurity, Software"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2 text-gray-700">Start</label>
                  <input
                    type="month"
                    value={eduForm.start}
                    onChange={(e) => setEduForm({ ...eduForm, start: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-gray-700">End</label>
                  <input
                    type="text"
                    value={eduForm.end}
                    onChange={(e) => setEduForm({ ...eduForm, end: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder='YYYY-MM or "Present"'
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEduModal(false)}
                className="flex-1 px-4 py-2 border border-input rounded-lg hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEdu}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
