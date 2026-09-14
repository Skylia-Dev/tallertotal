"use client";

import { useEffect, useState, useCallback } from "react";
import { usersApi } from "@/lib/api";
import type { UserListItem, CreateEmployeeDto } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Plus, UserRound, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

const emptyForm = (): CreateEmployeeDto => ({ username: "", password: "" });

const roleLabel: Record<string, string> = {
  Owner: "Dueño",
  Employee: "Empleado",
  Mechanic: "Mecánico",
};

export default function EmpleadosPage() {
  const [isOwner, setIsOwner] = useState<boolean | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateEmployeeDto>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserListItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)tallertotal_role=([^;]*)/);
    setIsOwner(match ? decodeURIComponent(match[1]) === "Owner" : false);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await usersApi.getAll());
    } catch {
      toast.error("Error al cargar empleados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (isOwner) load(); }, [isOwner, load]);

  const openCreate = () => { setForm(emptyForm()); setOpen(true); };

  const handleSave = async () => {
    if (!form.username || form.password.length < 6) return;
    setSaving(true);
    try {
      await usersApi.createEmployee(form);
      toast.success("Empleado creado");
      setOpen(false);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear el empleado");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await usersApi.delete(deleteTarget.id);
      toast.success("Empleado eliminado");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  if (isOwner === null) return null;

  if (!isOwner) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-2">
        <ShieldAlert className="h-8 w-8 text-gray-300 mx-auto" />
        <p className="text-sm text-gray-500">Solo el dueño del taller puede gestionar empleados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="text-sm text-gray-500 mt-1">Usuarios con acceso al sistema</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo Empleado
            </Button>
          } />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Nuevo empleado</DialogTitle>
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
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
              <Button onClick={handleSave} disabled={saving || !form.username || form.password.length < 6}>
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
                    <TableHead>Rol</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell className="text-sm text-gray-600">{roleLabel[u.role] ?? u.role}</TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString("es-AR")}</TableCell>
                      <TableCell className="text-right">
                        {u.role !== "Owner" && (
                          <Button
                            variant="ghost" size="icon-sm"
                            onClick={() => setDeleteTarget(u)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
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
            <DialogTitle>Eliminar empleado</DialogTitle>
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
    </div>
  );
}
