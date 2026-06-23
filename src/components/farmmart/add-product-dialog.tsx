"use client";

import { useEffect, useState } from "react";
import { api, CATEGORIES } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader2, Leaf, Sprout, ImagePlus, Tag, IndianRupee } from "lucide-react";
import { toast } from "sonner";

export interface ProductFormData {
  id?: string;
  name: string;
  category: string;
  description: string;
  price: string;
  unit: string;
  stock: string;
  imageUrl: string;
  location: string;
  organic: boolean;
  harvestDate: string;
  tags: string;
}

const EMPTY_FORM: ProductFormData = {
  name: "",
  category: "Vegetables",
  description: "",
  price: "",
  unit: "kg",
  stock: "",
  imageUrl: "",
  location: "",
  organic: false,
  harvestDate: "",
  tags: "",
};

interface ProductToEdit {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl: string;
  location: string;
  organic: boolean;
  harvestDate?: string | null;
  tags?: string | null;
}

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  /** Role of the active user — used to resolve the owner farmer id */
  role: string;
  /** Existing product to edit. When null/undefined, the dialog is in "create" mode */
  editProduct?: ProductToEdit | null;
  /** Called after a successful create/update */
  onSaved?: () => void;
}

export function AddProductDialog({
  open,
  onOpenChange,
  role,
  editProduct,
  onSaved,
}: AddProductDialogProps) {
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [farmerId, setFarmerId] = useState("");

  // Resolve the current user's id from /api/me based on the active role
  useEffect(() => {
    if (!open) return;
    api<{ user: { id: string } }>(`/api/me?role=${role}`)
      .then((d) => setFarmerId(d.user.id))
      .catch(() => {});
  }, [open, role]);

  // Populate the form when opening for edit, or reset when opening for create
  useEffect(() => {
    if (!open) return;
    if (editProduct) {
      setForm({
        id: editProduct.id,
        name: editProduct.name,
        category: editProduct.category,
        description: editProduct.description || "",
        price: String(editProduct.price),
        unit: editProduct.unit,
        stock: String(editProduct.stock),
        imageUrl: editProduct.imageUrl,
        location: editProduct.location,
        organic: editProduct.organic,
        harvestDate: editProduct.harvestDate || "",
        tags: editProduct.tags || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, editProduct]);

  const submit = async () => {
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.price || parseFloat(form.price) <= 0) {
      toast.error("A valid price is required");
      return;
    }
    if (!farmerId) {
      toast.error("Unable to resolve your farmer profile. Please retry.");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim(),
        price: parseFloat(form.price),
        unit: form.unit,
        stock: parseFloat(form.stock || "0"),
        imageUrl: form.imageUrl.trim(),
        location: form.location.trim(),
        organic: form.organic,
        harvestDate: form.harvestDate || null,
        tags: form.tags.trim(),
      };
      if (editProduct) {
        await api(`/api/products/${editProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Product updated successfully");
      } else {
        await api("/api/products", {
          method: "POST",
          body: JSON.stringify({ ...body, farmerId }),
        });
        toast.success("Your product is now live on FarmMart!");
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const isEdit = !!editProduct;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto fm-scroll max-w-lg"
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              {isEdit ? <Tag className="size-4" /> : <Sprout className="size-4" />}
            </span>
            {isEdit ? "Edit Product Listing" : "List a New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update your listing details and inventory levels."
              : "Fill in the details below to publish your produce on the FarmMart marketplace. Buyers across India will be able to discover and order from you."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Product name */}
          <div>
            <label className="text-sm font-medium">
              Product name <span className="text-destructive">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Organic Cherry Tomatoes"
              className="mt-1"
            />
          </div>

          {/* Category + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Unit</label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm({ ...form, unit: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["kg", "quintal", "dozen", "litre", "ton"].map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium flex items-center gap-1">
                <IndianRupee className="size-3.5" /> Price <span className="text-destructive">*</span>
              </label>
              <Input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Stock available</label>
              <Input
                type="number"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label className="text-sm font-medium flex items-center gap-1">
              <ImagePlus className="size-3.5" /> Image URL
            </label>
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://example.com/photo.jpg"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Paste a direct image link. Leave blank to use a default placeholder.
            </p>
          </div>

          {/* Location */}
          <div>
            <label className="text-sm font-medium">Farm location</label>
            <Input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g., Nashik, Maharashtra"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the variety, quality, harvest method, grading…"
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Harvest date + tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Harvest date</label>
              <Input
                type="month"
                value={form.harvestDate}
                onChange={(e) => setForm({ ...form, harvestDate: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tags (comma-separated)</label>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="organic, fresh, premium"
                className="mt-1"
              />
            </div>
          </div>

          {/* Organic toggle */}
          <label className="flex items-center gap-2 cursor-pointer rounded-lg border border-border/60 p-2.5">
            <input
              type="checkbox"
              checked={form.organic}
              onChange={(e) => setForm({ ...form, organic: e.target.checked })}
              className="size-4 rounded border-border"
            />
            <Leaf className="size-4 text-primary" />
            <span className="text-sm font-medium">Certified organic produce</span>
            {form.organic && (
              <Badge className="ml-auto gap-1 bg-primary/15 text-primary">
                <Leaf className="size-3" /> Organic
              </Badge>
            )}
          </label>

          {/* Submit */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving} className="flex-1 gap-2">
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sprout className="size-4" />
              )}
              {isEdit ? "Save changes" : "Publish listing"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
