import { useEffect, useMemo, useState } from 'react';
import { Building2, Plus, Sparkles, Edit2, Trash2 } from 'lucide-react';
import {
  getDepartments, createDepartment, updateDepartment, deleteDepartment, type Department,
} from '../departments/departmentService';
import { DepartmentsFilters } from '../departments/DepartmentsFilters';
import { DepartmentsStats } from '../departments/DepartmentsStats';
import type { DepartmentSortBy } from '../departments/types';
import { useVoiceCommand } from '../voice/VoiceCommandContext';
import Pagination from '../ui/Pagination';
import API from '../../../api/api';

type UserRole = 'HR' | 'Manager' | 'Employee' | 'SUPERADMIN';
interface Manager { _id: string; name: string; email: string; }

export function Departments({ userRole }: { userRole: UserRole }) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newManagerIds, setNewManagerIds] = useState<string[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editManagerIds, setEditManagerIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<DepartmentSortBy>('name-asc');
  const [viewDept, setViewDept] = useState<Department | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { pendingCommand, commandData, clearPendingCommand } = useVoiceCommand();

  const loadDepartments = async () => {
    setLoading(true);
    try { setDepartments(await getDepartments()); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadManagers = async () => {
    try {
      const res = await API.get('/users');
      setManagers((res.data as any[]).filter(u => u.role === 'MANAGER'));
    } catch { setManagers([]); }
  };

  useEffect(() => {
    if (userRole === 'HR' || userRole === 'SUPERADMIN') {
      loadDepartments();
      loadManagers();
    }
  }, [userRole]);

  useEffect(() => {
    if (pendingCommand === 'create-department') {
      commandData?.name ? loadDepartments() : setShowAddForm(true);
      clearPendingCommand();
    }
    if (pendingCommand === 'modify-department' || pendingCommand === 'delete-department') {
      loadDepartments(); clearPendingCommand();
    }
    if ((pendingCommand === 'search-department' || pendingCommand === 'filter-department') && commandData?.name) {
      setSearchTerm(commandData.name); clearPendingCommand();
    }
    if (pendingCommand === 'view-department' && commandData?.name && departments.length > 0) {
      const found = departments.find(d => d.name.toLowerCase() === commandData.name!.toLowerCase())
        || departments.find(d => d.name.toLowerCase().includes(commandData.name!.toLowerCase()));
      if (found) setViewDept(found);
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand, departments]);

  if (userRole !== 'HR' && userRole !== 'SUPERADMIN') {
    return <div className="p-6 text-center text-slate-600">Accès réservé aux comptes RH.</div>;
  }

  const toggleManagerId = (id: string, list: string[], setList: (v: string[]) => void) =>
    setList(list.includes(id) ? list.filter(m => m !== id) : [...list, id]);

  const handleAdd = async () => {
    if (!newName.trim()) { alert('Saisis le nom du département'); return; }
    try {
      await createDepartment({ name: newName.trim(), managerIds: [] });
      setNewName(''); setShowAddForm(false);
      await loadDepartments();
    } catch { alert('Erreur lors de la création du département'); }
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) { alert('Saisis le nom du département'); return; }
    try {
      await updateDepartment(editId, { name: editName.trim() });
      setEditId(null); setEditName('');
      await loadDepartments();
    } catch { alert('Erreur lors de la mise à jour'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce département ?')) return;
    try { await deleteDepartment(id); await loadDepartments(); }
    catch { alert('Erreur lors de la suppression'); }
  };

  const getManagerNames = (dept: Department) => {
    const ids: string[] = Array.isArray(dept.managerIds) ? dept.managerIds : [];
    if (ids.length === 0) return '—';
    return ids.map(id => {
      const m = managers.find(mg => mg._id === id || (mg as any)._id?.toString() === id?.toString());
      return m ? m.name : id;
    }).join(', ');
  };

  const filteredDepartments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return [...departments]
      .filter(d => !q || d.name.toLowerCase().includes(q) || d._id.toLowerCase().includes(q))
      .sort((a, b) => sortBy === 'name-desc'
        ? b.name.localeCompare(a.name, 'fr', { sensitivity: 'base' })
        : a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
  }, [departments, searchTerm, sortBy]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginated = filteredDepartments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const ManagerCheckboxes = ({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) => (
    <div className="border rounded-lg p-2 max-h-40 overflow-y-auto bg-white">
      {managers.length === 0
        ? <p className="text-xs text-slate-400 p-1">Aucun manager disponible</p>
        : managers.map(m => (
          <label key={m._id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={selected.includes(m._id)}
              onChange={() => onToggle(m._id)}
              className="rounded"
            />
            <span className="font-medium text-slate-800">{m.name}</span>
            <span className="text-slate-400 text-xs">{m.email}</span>
          </label>
        ))
      }
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-600 shadow-sm">
              <Sparkles size={14} /> Structure organisationnelle
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Départements</h1>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700">
            <Plus size={18} /> Ajouter un département
          </button>
        </div>
      </div>

      <DepartmentsStats totalDepartments={departments.length} uniqueManagers={managers.length} totalShown={filteredDepartments.length} />
      <DepartmentsFilters searchTerm={searchTerm} sortBy={sortBy} onSearchChange={setSearchTerm} onSortChange={setSortBy} onReset={() => { setSearchTerm(''); setSortBy('name-asc'); }} />

      {/* Formulaire ajout */}
      {showAddForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Nouveau département</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nom du département *</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="ex. IT, RH, Marketing" />
          </div>
          <p className="text-xs text-slate-400">Les managers seront affectés à ce département lors de la création de leurs comptes.</p>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">Enregistrer</button>
            <button onClick={() => { setShowAddForm(false); setNewName(''); }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
          </div>
        </div>
      )}

      {loading && <p className="text-center text-slate-600">Chargement…</p>}

      {!loading && filteredDepartments.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginated.map(dept => (
              <div key={dept._id} className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden hover:border-blue-200">
                <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

                {editId === dept._id ? (
                  <div className="p-5 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Nom</label>
                      <input value={editName} onChange={e => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleUpdate} className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700">Sauver</button>
                      <button onClick={() => setEditId(null)} className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Annuler</button>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{dept.name}</h3>
                      <p className="text-xs text-blue-700 font-semibold mt-1">
                        Managers : {getManagerNames(dept)}
                      </p>
                      <p className="text-gray-400 font-mono text-xs mt-2 truncate">{dept._id}</p>
                    </div>
                    <div className="flex gap-2 ml-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditId(dept._id); setEditName(dept.name); }}
                        className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all hover:scale-110" title="Modifier">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDelete(dept._id)}
                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all hover:scale-110" title="Supprimer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filteredDepartments.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
        </>
      )}

      {!loading && departments.length === 0 && !showAddForm && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <p className="text-slate-600">Aucun département pour l'instant.</p>
          <button onClick={() => setShowAddForm(true)} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus size={16} /> Créer le premier département
          </button>
        </div>
      )}

      {/* Modal détail */}
      {viewDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewDept(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-700"><Building2 className="h-6 w-6" /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Département</p>
                  <h2 className="mt-0.5 text-2xl font-bold text-slate-900">{viewDept.name}</h2>
                </div>
              </div>
              <button onClick={() => setViewDept(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">✕</button>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Managers</p>
                <p className="mt-1 text-slate-800">{getManagerNames(viewDept)}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setViewDept(null); setEditId(viewDept._id); setEditName(viewDept.name); }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">Modifier</button>
                <button onClick={() => setViewDept(null)} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
