import { useEffect, useMemo, useState } from 'react';
import { Building2, Plus, Sparkles } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

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
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      console.error(err);
      alert('Erreur lors du chargement des départements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'HR') {
      loadDepartments();
    }
  }, [userRole]);

  if (userRole !== 'HR') {
    return (
      <div className="p-6 text-center text-slate-600">
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
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-600 shadow-sm">
              <Sparkles size={14} />
              Structure organisationnelle
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Départements</h1>
            <p className="mt-1 text-sm text-slate-600">
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
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Nouveau département</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nom du département</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="ex. IT, RH, Marketing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Manager (user_id)
              </label>
              <input
                type="text"
                value={newManager}
                onChange={(e) => setNewManager(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {loading && (
        <p className="text-center text-slate-600">Chargement des départements…</p>
      )}

      {!loading && departments.length > 0 && filteredDepartments.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-slate-900">Aucun résultat trouvé</p>
          <p className="mt-2 text-sm text-slate-600">
            Essaie un autre mot-clé (nom, ID ou manager) ou réinitialise les filtres.
          </p>
        </div>
      )}

      {!loading && filteredDepartments.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredDepartments.map((dept) => (
            <div
              key={dept._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              {editId === dept._id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600">Nom</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">user_id</label>
                    <input
                      value={editManager}
                      onChange={(e) => setEditManager(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUpdate}
                      className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Sauver
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="flex-1 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-700">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-lg font-semibold text-slate-900">{dept.name}</h3>
                      <p className="mt-1 font-mono text-xs text-slate-500">{dept._id}</p>
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-800">Manager :</span> {dept.user_id}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditId(dept._id);
                        setEditName(dept.name);
                        setEditManager(dept.user_id);
                      }}
                      className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-medium text-white hover:bg-amber-600"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptToDelete(dept)}
                      className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-700"
                    >
                      Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={Boolean(deptToDelete)}
        onOpenChange={(open) => {
          if (!open) setDeptToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce département ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive{deptToDelete?.name ? ` : ${deptToDelete.name}` : ''}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deptToDelete) return;
                await handleDelete(deptToDelete._id);
                setDeptToDelete(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!loading && departments.length === 0 && !showAddForm && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-12">
          <div className="text-center">
            <p className="text-slate-600">Aucun département pour l’instant.</p>
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
    </div>
  );
}
