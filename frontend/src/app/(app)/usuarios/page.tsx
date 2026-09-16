"use client";

import { useEffect, useState, useCallback } from "react";
import { usersApi, mechanicsApi } from "@/lib/api";
import type { UserListItem, CreateUserDto } from "@/types";
import { SPECIALTY_OPTIONS } from "@/lib/mechanic-specialties";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, UserRound, Trash2, ShieldAlert, Pencil, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

const emptyForm = (): CreateUserDto => ({ username: "", password: "", role: "Employee" });

const roleLabel: Record<string, string> = {
  Owner: "Dueño",
  SuperAdmin: "SuperAdmin",
  Admin: "Administrador",
  Employee: "Empleado",
  Mechanic: "Mecánico",
};

const assignableRoles = [
  { value: "Admin", label: "Administrador" },
  { value: "Employee", label: "Empleado" },
  { value: "Mechanic", label: "Mecánico" },
];

// SPECIALTY_OPTIONS vive en @/lib/mechanic-specialties (compartido con el filtro
// de mecánicos disponibles por tipo de orden). "Otro" queda siempre al final acá
// y habilita un campo de texto libre para lo que no está en la lista.
const SPECIALTY_NONE = "__none__";
const SPECIALTY_OTHER = "__other__";

function SpecialtySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isKnown = SPECIALTY_OPTIONS.includes(value);
  // "mode" es estado propio (no derivado de `value` en cada render): así, al elegir
  // "Otro" con el campo todavía vacío, no colapsa de nuevo a "Sin especialidad".
  const [mode, setMode] = useState<"catalog" | "other">(value !== "" && !isKnown ? "other" : "catalog");
  const [customDraft, setCustomDraft] = useState(mode === "other" ? value : "");

  const selectValue = mode === "other" ? SPECIALTY_OTHER : value === "" ? SPECIALTY_NONE : value;

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={(v) => {
          if (!v) return;
          if (v === SPECIALTY_NONE) { setMode("catalog"); onChange(""); }
          else if (v === SPECIALTY_OTHER) { setMode("other"); onChange(customDraft); }
          else { setMode("catalog"); onChange(v); }
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            {(v: string) => {
              if (v === SPECIALTY_NONE) return "Sin especialidad";
              if (v === SPECIALTY_OTHER) return "Otro";
              return v;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SPECIALTY_NONE}>Sin especialidad</SelectItem>
          {SPECIALTY_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          <SelectItem value={SPECIALTY_OTHER}>Otro</SelectItem>
        </SelectContent>
      </Select>
      {mode === "other" && (
        <Input
          value={customDraft}
          onChange={(e) => { setCustomDraft(e.target.value); onChange(e.target.value); }}
          placeholder="Especificar especialidad"
          autoFocus
        />
      )}
    </div>
  );
}

// Roles que no se pueden borrar desde acá: el dueño y el superadmin de la plataforma
const undeletableRoles = new Set(["Owner", "SuperAdmin"]);

export default function UsuariosPage() {
  const [canManage, setCanManage] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateUserDto>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<UserListItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", specialty: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)tallertotal_role=([^;]*)/);
    const role = match ? decodeURIComponent(match[1]) : null;
    setCanManage(role === "Owner" || role === "SuperAdmin" || role === "Admin");
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await usersApi.getAll());
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (canManage) load(); }, [canManage, load]);

  const openCreate = () => { setForm(emptyForm()); setOpen(true); };

  const isMechanic = form.role === "Mechanic";
  const canSave = form.username && form.password.length >= 6 && (!isMechanic || !!form.name?.trim());

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await usersApi.create(form);
      toast.success("Usuario creado");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear el usuario");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: UserListItem) => {
    setEditTarget(u);
    setEditForm({ name: u.name ?? "", phone: u.phone ?? "", specialty: u.specialty ?? "" });
  };

  const handleSaveEdit = async () => {
    if (!editTarget?.mechanicId || !editForm.name.trim()) return;
    setSavingEdit(true);
    try {
      await mechanicsApi.update(editTarget.mechanicId, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || undefined,
        specialty: editForm.specialty.trim() || undefined,
      });
      toast.success("Mecánico actualizado");
      setEditTarget(null);
      load();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleToggle = async (u: UserListItem) => {
    if (!u.mechanicId) return;
    setTogglingId(u.id);
    try {
      await mechanicsApi.toggle(u.mechanicId);
      toast.success(u.isActive ? "Mecánico desactivado" : "Mecánico activado");
      load();
    } catch {
      toast.error("Error al cambiar estado");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.delete(deleteTarget.id);
      toast.success("Usuario eliminado");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  if (canManage === null) return null;

  if (!canManage) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-2">
        <ShieldAlert className="h-8 w-8 text-gray-300 mx-auto" />
        <p className="text-sm text-gray-500">Solo el dueño del taller puede gestionar usuarios</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-sm text-gray-500 mt-1">Usuarios con acceso al sistema</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo Usuario
            </Button>
          } />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo usuario</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label required>Usuario</Label>
                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="juan.perez" />
              </div>
              <div className="space-y-1">
                <Label required>Contraseña</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
              </div>
              <div className="space-y-1">
                <Label required>Rol</Label>
                <Select value={form.role} onValueChange={(v) => v && setForm({ ...form, role: v })}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => assignableRoles.find((r) => r.value === v)?.label ?? v}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {isMechanic && (
                <>
                  <div className="space-y-1">
                    <Label required>Nombre</Label>
                    <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Juan Pérez" />
                  </div>
                  <div className="space-y-1">
                    <Label>Teléfono</Label>
                    <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+54 9 291 ..." />
                  </div>
                  <div className="space-y-1">
                    <Label>Especialidad</Label>
                    <SpecialtySelect value={form.specialty ?? ""} onChange={(v) => setForm({ ...form, specialty: v })} />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
              <Button onClick={handleSave} disabled={saving || !canSave}>
                {saving ? "Guardando..." : "Crear"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Listado</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-sm text-gray-400">Cargando...</div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <UserRound className="h-8 w-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-400">No hay usuarios registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Usuario</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className={`hover:bg-gray-50 ${u.isActive === false ? "opacity-50" : ""}`}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {u.name ?? "—"}
                        {u.specialty && <span className="text-gray-400"> · {u.specialty}</span>}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{roleLabel[u.role] ?? u.role}</TableCell>
                      <TableCell>
                        {u.role === "Mechanic" && (
                          <Badge variant="outline" className={u.isActive ? "border-green-300 text-green-700 bg-green-50" : "border-gray-300 text-gray-500 bg-gray-50"}>
                            {u.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {u.role === "Mechanic" && (
                            <>
                              <Button
                                variant="ghost" size="icon-sm"
                                onClick={() => handleToggle(u)}
                                disabled={togglingId === u.id}
                                title={u.isActive ? "Desactivar" : "Activar"}
                                className="text-gray-400 hover:text-blue-600"
                              >
                                {u.isActive ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
                              </Button>
                              <Button variant="ghost" size="icon-sm" onClick={() => openEdit(u)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {!undeletableRoles.has(u.role) && (
                            <Button
                              variant="ghost" size="icon-sm"
                              onClick={() => setDeleteTarget(u)}
                              className="text-red-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            ¿Estás seguro de eliminar a <span className="font-semibold">{deleteTarget?.username}</span>? Perderá acceso al sistema.
          </p>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Eliminando..." : "Sí, eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar mecánico</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label required>Nombre</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Juan Pérez" autoFocus />
            </div>
            <div className="space-y-1">
              <Label>Teléfono</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="+54 9 291 555-0000" />
            </div>
            <div className="space-y-1">
              <Label>Especialidad</Label>
              <SpecialtySelect value={editForm.specialty} onChange={(v) => setEditForm({ ...editForm, specialty: v })} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
            <Button onClick={handleSaveEdit} disabled={savingEdit || !editForm.name.trim()}>
              {savingEdit ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
