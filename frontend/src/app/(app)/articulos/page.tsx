"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { articulosApi } from "@/lib/api";
import type { Articulo, CreateArticuloDto } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Package, AlertTriangle, Power } from "lucide-react";
import { Pagination } from "@/components/Pagination";
import { toast } from "sonner";

const emptyForm = (): CreateArticuloDto => ({ marca: "", modelo: "", descripcion: "", stock: 0, stockMinimo: 0, precio: 0 });

export default function ArticulosPage() {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Articulo | null>(null);
  const [form, setForm] = useState<CreateArticuloDto>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Articulo | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setArticulos(await articulosApi.getAll({ search: search || undefined, lowStock: onlyLowStock || undefined }));
    } catch {
      toast.error("Error al cargar artículos");
    } finally {
      setLoading(false);
    }
  }, [search, onlyLowStock]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, onlyLowStock, pageSize]);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setOpen(true); };
  const openEdit = (a: Articulo) => {
    setEditing(a);
    setForm({ marca: a.marca, modelo: a.modelo, descripcion: a.descripcion ?? "", stock: a.stock, stockMinimo: a.stockMinimo, precio: a.precio });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.marca || !form.modelo) return;
    setSaving(true);
    try {
      const dto = { ...form, descripcion: form.descripcion || undefined };
      if (editing) {
        await articulosApi.update(editing.id, dto);
        toast.success("Artículo actualizado");
      } else {
        await articulosApi.create(dto);
        toast.success("Artículo creado");
      }
      setOpen(false);
      load();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (a: Articulo) => {
    try {
      await articulosApi.toggle(a.id);
      load();
    } catch {
      toast.error("Error al cambiar el estado");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await articulosApi.delete(deleteTarget.id);
      toast.success("Artículo eliminado");
      setDeleteTarget(null);
      load();
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const paginated = useMemo(
    () => articulos.slice((page - 1) * pageSize, page * pageSize),
    [articulos, page, pageSize]
  );

  const lowStockCount = articulos.filter((a) => a.stock <= a.stockMinimo).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Artículos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {articulos.length} registrados
            {lowStockCount > 0 && (
              <span className="text-amber-600 font-medium"> · {lowStockCount} con stock bajo</span>
            )}
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo Artículo
            </Button>
          } />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar artículo" : "Nuevo artículo"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label required>Marca</Label>
                  <Input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} placeholder="Bosch" />
                </div>
                <div className="space-y-1">
                  <Label required>Modelo</Label>
                  <Input value={form.modelo} onChange={(e) => setForm({ ...form, modelo: e.target.value })} placeholder="Filtro de aceite" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Descripción</Label>
                <Input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Opcional" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label required>Stock</Label>
                  <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label required>Stock mínimo</Label>
                  <Input type="number" value={form.stockMinimo} onChange={(e) => setForm({ ...form, stockMinimo: Number(e.target.value) })} />
                </div>
                <div className="space-y-1">
                  <Label required>Precio</Label>
                  <Input type="number" step="0.01" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
              <Button onClick={handleSave} disabled={saving || !form.marca || !form.modelo}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Listado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="Buscar por marca, modelo o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button
              size="sm"
              variant={onlyLowStock ? "default" : "outline"}
              onClick={() => setOnlyLowStock((v) => !v)}
              className="gap-1.5"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Stock bajo
            </Button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Cargando...</div>
          ) : articulos.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Package className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="text-sm text-muted-foreground">No hay artículos{search ? " que coincidan" : ""}</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Stock</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((a) => (
                    <TableRow key={a.id} className={`hover:bg-muted/60 ${!a.activo ? "opacity-50" : ""}`}>
                      <TableCell className="font-medium">{a.marca}</TableCell>
                      <TableCell>{a.modelo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.descripcion ?? "—"}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full text-xs font-medium ${
                          a.stock <= a.stockMinimo ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"
                        }`}>
                          {a.stock}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm">${a.precio.toLocaleString("es-AR")}</TableCell>
                      <TableCell className="text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          a.activo ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                        }`}>
                          {a.activo ? "Activo" : "Inactivo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => handleToggle(a)} title={a.activo ? "Desactivar" : "Activar"}>
                            <Power className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon-sm" onClick={() => openEdit(a)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon-sm"
                            onClick={() => setDeleteTarget(a)}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          <Pagination
            total={articulos.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <Dialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar artículo</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de eliminar <span className="font-semibold">{deleteTarget?.marca} {deleteTarget?.modelo}</span>?
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
