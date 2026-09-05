"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateGroup } from "@/app/dashboard/groups/actions";

interface EditGroupDialogProps {
  groupId: string;
  initialName: string;
  initialSlug: string;
  initialDescription: string | null;
  initialIsPublic: boolean;
}

export function EditGroupDialog({
  groupId,
  initialName,
  initialSlug,
  initialDescription,
  initialIsPublic,
}: EditGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: initialName,
    slug: initialSlug,
    description: initialDescription || "",
    isPublic: initialIsPublic,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateGroup(
        groupId,
        formData.name,
        formData.slug,
        formData.description || null,
        formData.isPublic,
      );

      if (result.success) {
        toast.success("Group updated successfully!");
        setOpen(false);
      } else {
        toast.error(result.error || "Failed to update group");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Edit Group
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Group Settings</DialogTitle>
          <DialogDescription>
            Update group information and visibility settings.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Group Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-slug">Slug (URL-friendly)</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                placeholder="Describe your group's purpose..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={pending}
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="edit-isPublic"
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublic: checked })}
                disabled={pending}
              />
              <Label htmlFor="edit-isPublic" className="cursor-pointer">
                Public group (discoverable by others)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setFormData({
                  name: initialName,
                  slug: initialSlug,
                  description: initialDescription || "",
                  isPublic: initialIsPublic,
                });
              }}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || !formData.name.trim()}>
              {pending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
