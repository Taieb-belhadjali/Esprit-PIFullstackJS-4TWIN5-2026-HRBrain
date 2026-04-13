import { useEffect, useMemo, useState } from 'react';
import { Building2, Plus, Sparkles, Edit2, Trash2 } from 'lucide-react';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type Department,
} from '../departments/departmentService';
import { DepartmentsFilters } from '../departments/DepartmentsFilters';
import { DepartmentsStats } from '../departments/DepartmentsStats';
import type { DepartmentSortBy } from '../departments/types';
import { useVoiceCommand } from '../voice/VoiceCommandContext';
import Pagination from '../ui/Pagination';

type UserRole = 'HR' | 'Manager' | 'Employee';

interface DepartmentsProps {
  userRole: UserRole;
}

export function Departments({ userRole }: DepartmentsProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newManager, setNewManager] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editManager, setEditManager] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<DepartmentSortBy>('name-asc');
  const [viewDept, setViewDept] = useState<Department | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const { pendingCommand, commandData, clearPendingCommand } = useVoiceCommand();

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'HR') {
      loadDepartments();
    }
  }, [userRole]);

  // Écouter les commandes vocales pour créer un département
  useEffect(() => {
    if (pendingCommand === 'create-department') {
      if (commandData?.name) {
        // L'item a déjà été créé par VoiceAssistant — juste recharger la liste
        loadDepartments();
      } else {
        // Ouvrir le formulaire si pas de nom
        setShowAddForm(true);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  // Écouter les commandes vocales pour modifier un département
  // VoiceAssistant a déjà effectué le PATCH — on rafraîchit seulement la liste
  useEffect(() => {
    if (pendingCommand === 'modify-department') {
      loadDepartments();
      clearPendingCommand();
    }
  }, [pendingCommand, clearPendingCommand]);

  // Écouter les commandes vocales pour supprimer un département
  // La suppression et confirmation sont gérées par VoiceAssistant — on rafraîchit juste la liste
  useEffect(() => {
    if (pendingCommand === 'delete-department') {
      loadDepartments();
      clearPendingCommand();
    }
  }, [pendingCommand, clearPendingCommand]);

  // Écouter les commandes vocales pour rechercher un département
  useEffect(() => {
    if (pendingCommand === 'search-department' || pendingCommand === 'filter-department') {
      if (commandData?.name) {
        setSearchTerm(commandData.name);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand]);

  // Écouter les commandes vocales pour afficher le détail d'un département
  useEffect(() => {
    if (pendingCommand === 'view-department') {
      if (commandData?.name && departments.length > 0) {
        const found = departments.find(
          (d) => d.name.toLowerCase() === commandData.name!.toLowerCase()
        ) || departments.find(
          (d) => d.name.toLowerCase().includes(commandData.name!.toLowerCase())
        );
        if (found) setViewDept(found);
      }
      clearPendingCommand();
    }
  }, [pendingCommand, commandData, clearPendingCommand, departments]);

  if (userRole !== 'HR') {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Accès réservé aux comptes RH.
      </div>
    );
  }

  const handleAdd = async () => {
    if (!newName.trim()) {
      alert('Saisis le nom du département');
      return;
    }
    if (!newManager.trim()) {
      alert("Saisis l'identifiant manager (user_id)");
      return;
    }
    try {
      await createDepartment({ name: newName.trim(), user_id: newManager.trim() });
      setNewName('');
      setNewManager('');
      setShowAddForm(false);
      await loadDepartments();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la création du département');
    }
  };

  const handleUpdate = async () => {
    if (!editId || !editName.trim()) {
      alert('Saisis le nom du département');
      return;
    }
    if (!editManager.trim()) {
      alert("Saisis l'identifiant manager (user_id)");
      return;
    }
    try {
      await updateDepartment(editId, {
        name: editName.trim(),
        user_id: editManager.trim(),
      });
      setEditId(null);
      setEditName('');
      setEditManager('');
      await loadDepartments();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer ce département ?')) return;
    try {
      await deleteDepartment(id);
      await loadDepartments();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la suppression');
    }
  };

  const filteredDepartments = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();

    const result = departments.filter((dept) => {
      if (!normalized) return true;
      const nameMatch = dept.name.toLowerCase().includes(normalized);
      const idMatch = dept._id.toLowerCase().includes(normalized);
      const managerMatch = (dept.user_id || '').toLowerCase().includes(normalized);
      return nameMatch || idMatch || managerMatch;
    });

    result.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' });
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name, 'fr', { sensitivity: 'base' });
      }
      return (a.user_id || '').localeCompare(b.user_id || '', 'fr', {
        sensitivity: 'base',
      });
    });

    return result;
  }, [departments, searchTerm, sortBy]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortBy]);

  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const paginatedDepartments = filteredDepartments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const uniqueManagersCount = useMemo(() => {
    const ids = departments
      .map((d) => d.user_id?.trim())
      .filter((id): id is string => Boolean(id));
    return new Set(ids).size;
  }, [departments]);

  return (
    <div className="p-6 space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-medium text-blue-600 shadow-sm">
              <Sparkles size={14} />
              Structure organisationnelle
            </div>
            <h1 className="mt-3 text-2xl font-bold text-foreground">Départements</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              CRUD des départements (MongoDB, collection <code className="text-xs">departments</code>).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition hover:bg-blue-700"
          >
            <Plus size={18} />
            Ajouter un département
          </button>
        </div>
      </div>

      <DepartmentsStats
        totalDepartments={departments.length}
        uniqueManagers={uniqueManagersCount}
        totalShown={filteredDepartments.length}
      />

      <DepartmentsFilters
        searchTerm={searchTerm}
        sortBy={sortBy}
        onSearchChange={setSearchTerm}
        onSortChange={setSortBy}
        onReset={() => {
          setSearchTerm('');
          setSortBy('name-asc');
        }}
      />

      {showAddForm && (
        <div className="rounded-2xl border border-slate-200 bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">Nouveau département</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Nom du département</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="ex. IT, RH, Marketing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">
                Manager (user_id)
              </label>
              <input
                type="text"
                value={newManager}
                onChange={(e) => setNewManager(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-foreground focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="identifiant ou référence manager"
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setNewName('');
                setNewManager('');
              }}
              className="rounded-lg border border-slate-300 bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-center text-muted-foreground">Chargement des départements…</p>
      )}

      {!loading && departments.length > 0 && filteredDepartments.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-card p-10 text-center">
          <p className="text-lg font-semibold text-foreground">Aucun résultat trouvé</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Essaie un autre mot-clé (nom, ID ou manager) ou réinitialise les filtres.
          </p>
        </div>
      )}

      {!loading && filteredDepartments.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {paginatedDepartments.map((dept) => (
            <div
              key={dept._id}
              className="group cursor-pointer bg-card rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden hover:border-blue-200"
            >
              <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />

              {editId === dept._id ? (
                <div className="p-5 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nom</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Manager (user_id)</label>
                    <input
                      value={editManager}
                      onChange={(e) => setEditManager(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleUpdate}
                      className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
                    >
                      Sauver
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-foreground hover:bg-slate-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">
                      {dept.name}
                    </h3>
                    <p className="text-xs text-blue-700 font-semibold mt-1">
                      Manager : {dept.user_id || '—'}
                    </p>
                    <p className="text-muted-foreground font-mono text-xs mt-2 truncate">{dept._id}</p>
                  </div>

                  <div className="flex gap-2 ml-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                    <button
                      type="button"
                      onClick={() => { setEditId(dept._id); setEditName(dept.name); setEditManager(dept.user_id); }}
                      className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-all hover:scale-110 active:scale-95"
                      title="Modifier"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(dept._id)}
                      className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 transition-all hover:scale-110 active:scale-95"
                      title="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredDepartments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {!loading && departments.length === 0 && !showAddForm && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12">
          <div className="text-center">
            <p className="text-muted-foreground">Aucun département pour l'instant.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus size={16} />
              Créer le premier département
            </button>
          </div>
        </div>
      )}

      {/* Modal détail département (commande vocale “afficher département X”) */}
      {viewDept && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setViewDept(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Département</p>
                  <h2 className="mt-0.5 text-2xl font-bold text-foreground">{viewDept.name}</h2>
                </div>
              </div>
              <button
                onClick={() => setViewDept(null)}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-slate-100"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-foreground">Identifiant</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{viewDept._id}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-foreground">Manager (user_id)</p>
                <p className="mt-1 text-foreground">{viewDept.user_id || 'Non défini'}</p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    setViewDept(null);
                    setEditId(viewDept._id);
                    setEditName(viewDept.name);
                    setEditManager(viewDept.user_id);
                  }}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-foreground hover:bg-slate-100"
                >
                  Modifier
                </button>
                <button
                  onClick={() => setViewDept(null)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
