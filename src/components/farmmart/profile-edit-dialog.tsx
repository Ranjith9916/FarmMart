"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User as UserIcon,
  MapPin,
  Phone,
  Mail,
  Truck,
  ShieldCheck,
  Loader2,
  Camera,
  Upload,
  X,
  Sprout,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}

export function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
  const { authUser, updateAuthUser } = useStore();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState(authUser?.name || "");
  const [phone, setPhone] = useState(authUser?.phone || "");
  const [location, setLocation] = useState(authUser?.location || "");
  const [avatar, setAvatar] = useState(authUser?.avatar || "");
  // Transporter fields
  const [vehicleType, setVehicleType] = useState(authUser?.vehicleType || "");
  const [vehicleNumber, setVehicleNumber] = useState(authUser?.vehicleNumber || "");
  const [licenseNumber, setLicenseNumber] = useState(authUser?.licenseNumber || "");
  const [capacity, setCapacity] = useState(authUser?.capacity || "");
  const [transportArea, setTransportArea] = useState(authUser?.transportArea || "");

  const isTransporter = authUser?.role === "TRANSPORTER";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { imageUrl: string };
      setAvatar(data.imageUrl);
      toast.success("Profile photo uploaded");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!authUser) return;
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    try {
      const data = await api<{ user: typeof authUser }>("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify({
          userId: authUser.id,
          name,
          phone,
          location,
          avatar,
          vehicleType,
          vehicleNumber,
          licenseNumber,
          capacity,
          transportArea,
        }),
      });
      updateAuthUser(data.user);
      toast.success("Profile updated successfully");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (!authUser) return null;

  const initials = authUser.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto fm-scroll max-w-lg" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <UserIcon className="size-4" />
            </span>
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your personal information and profile picture.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avatar / Profile Picture */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  className="size-20 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="grid size-20 place-items-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {initials}
                </div>
              )}
              {/* Upload overlay */}
              <label
                className={cn(
                  "absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-primary text-primary-foreground shadow-md cursor-pointer transition-transform hover:scale-110",
                  uploading && "opacity-50"
                )}
              >
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Camera className="size-3.5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
              {/* Remove button */}
              {avatar && (
                <button
                  onClick={() => setAvatar("")}
                  className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-destructive text-white shadow-sm hover:bg-destructive/90"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">{authUser.name}</div>
              <div className="text-xs text-muted-foreground">{authUser.email}</div>
              <Badge className="mt-1 gap-1 bg-primary/10 text-primary">
                {authUser.role}
              </Badge>
              <label className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs font-medium hover:border-primary/40 hover:bg-accent/40">
                <Upload className="size-3 text-primary" />
                Upload new photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1">
              <UserIcon className="size-3.5" /> Full Name <span className="text-destructive">*</span>
            </Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>

          {/* Email (read-only) */}
          <div>
            <Label className="mb-1.5 flex items-center gap-1">
              <Mail className="size-3.5" /> Email
            </Label>
            <Input value={authUser.email} disabled className="bg-secondary/50" />
            <p className="mt-1 text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          {/* Phone + Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1.5 flex items-center gap-1">
                <Phone className="size-3.5" /> Phone
              </Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 …" />
            </div>
            <div>
              <Label className="mb-1.5 flex items-center gap-1">
                <MapPin className="size-3.5" /> Location
              </Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, State" />
            </div>
          </div>

          {/* Transporter-specific fields */}
          {isTransporter && (
            <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Truck className="size-4" />
                Transport & Vehicle Details
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 text-xs">Vehicle Type</Label>
                  <Select value={vehicleType} onValueChange={setVehicleType}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select vehicle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mini Truck">Mini Truck (Tata Ace)</SelectItem>
                      <SelectItem value="Pickup">Pickup Truck</SelectItem>
                      <SelectItem value="Truck">Truck (6-wheeler)</SelectItem>
                      <SelectItem value="Large Truck">Large Truck (10-wheeler)</SelectItem>
                      <SelectItem value="Container">Container Truck</SelectItem>
                      <SelectItem value="Refrigerated">Refrigerated Van</SelectItem>
                      <SelectItem value="Tractor">Tractor + Trailer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-1 text-xs">Vehicle Number</Label>
                  <Input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                    placeholder="MH-12 AB 1234"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="mb-1 text-xs">License Number</Label>
                  <Input
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value.toUpperCase())}
                    placeholder="DL-0420190001234"
                  />
                </div>
                <div>
                  <Label className="mb-1 text-xs">Capacity (tons)</Label>
                  <Select value={capacity} onValueChange={setCapacity}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">Up to 0.5 ton</SelectItem>
                      <SelectItem value="1">1 ton</SelectItem>
                      <SelectItem value="3">3 tons</SelectItem>
                      <SelectItem value="5">5 tons</SelectItem>
                      <SelectItem value="10">10 tons</SelectItem>
                      <SelectItem value="15">15+ tons</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="mb-1 text-xs">Service Area</Label>
                <Input
                  value={transportArea}
                  onChange={(e) => setTransportArea(e.target.value)}
                  placeholder="e.g., Maharashtra, Gujarat"
                />
              </div>
            </div>
          )}

          {/* Save / Cancel */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 gap-2">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
