"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, Eye, Pencil, Trash2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type {
  RecommendedTool,
  RecommendedToolCategory,
  RecommendedToolInput,
} from "@/types/recommended-tools";
import { ToolCard } from "@/components/dashboard/recommended-tools/ToolCard";

const CATEGORY_OPTIONS: RecommendedToolCategory[] = [
  "AI",
  "Development",
  "Hosting",
  "Deployment",
  "Database",
  "Design",
  "Productivity",
  "Learning",
];

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "all" },
  { label: "Đang hoạt động", value: "active" },
  { label: "Tạm dừng", value: "inactive" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toDateTimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocal(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildDefaultForm(tool?: RecommendedTool): RecommendedToolInput {
  if (tool) {
    const { id, ...rest } = tool;
    return { id, ...rest };
  }

  return {
    slug: "",
    name: "",
    logo_url: "",
    description: "",
    category: "AI",
    destination_url: "",
    is_affiliate: false,
    is_sponsored: false,
    sponsor_name: "",
    sponsor_level: "",
    priority: 0,
    display_order: 0,
    start_date: null,
    end_date: null,
    is_active: true,
  };
}

export function RecommendedToolsAdminClient({
  initialTools,
}: {
  initialTools: RecommendedTool[];
}) {
  const [tools, setTools] = useState<RecommendedTool[]>(initialTools);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<RecommendedTool | undefined>();
  const [previewTool, setPreviewTool] = useState<RecommendedTool | null>(null);

  const filteredTools = useMemo(() => {
    const query = search.toLowerCase();
    return tools.filter((tool) => {
      const matchesQuery =
        tool.name.toLowerCase().includes(query) ||
        tool.slug.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" || tool.category === categoryFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? tool.is_active : !tool.is_active);

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [tools, search, categoryFilter, statusFilter]);

  const refreshTools = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("recommended_tools")
      .select("*")
      .order("priority", { ascending: false })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Không thể làm mới dữ liệu");
      return;
    }

    setTools((data ?? []) as RecommendedTool[]);
    toast.success("Đã làm mới danh sách");
  };

  const handleDelete = async (tool: RecommendedTool) => {
    const confirmed = window.confirm(
      `Xóa ${tool.name}? Hành động này không thể hoàn tác.`,
    );
    if (!confirmed) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("recommended_tools")
      .delete()
      .eq("id", tool.id);

    if (error) {
      toast.error("Không thể xóa công cụ");
      return;
    }

    setTools((prev) => prev.filter((item) => item.id !== tool.id));
    toast.success("Đã xóa công cụ");
  };

  const handleToggleActive = async (
    tool: RecommendedTool,
    nextValue: boolean,
  ) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("recommended_tools")
      .update({ is_active: nextValue })
      .eq("id", tool.id)
      .select("*")
      .single();

    if (error) {
      toast.error("Không thể cập nhật trạng thái");
      return;
    }

    setTools((prev) =>
      prev.map((item) =>
        item.id === tool.id ? (data as RecommendedTool) : item,
      ),
    );
  };

  const openCreateForm = () => {
    setEditingTool(undefined);
    setIsFormOpen(true);
  };

  const openEditForm = (tool: RecommendedTool) => {
    setEditingTool(tool);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Recommended Tools
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý đề xuất AI & công cụ cho bảng điều khiển.
        </p>
      </div>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Danh sách công cụ</CardTitle>
            <p className="text-sm text-muted-foreground">
              Duy trì nội dung, ưu tiên hiển thị và đối tác tài trợ.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={refreshTools}>
              <RefreshCw className="mr-2 size-4" />
              Làm mới
            </Button>
            <Button size="sm" onClick={openCreateForm}>
              <Plus className="mr-2 size-4" />
              Tạo công cụ
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full items-center gap-2 md:w-1/2">
              <Search className="size-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, slug hoặc mô tả"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {CATEGORY_OPTIONS.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Công cụ</th>
                  <th className="px-4 py-3 text-left font-medium">Danh mục</th>
                  <th className="px-4 py-3 text-left font-medium">Ưu tiên</th>
                  <th className="px-4 py-3 text-left font-medium">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredTools.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-muted-foreground"
                    >
                      Không có công cụ phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredTools.map((tool) => (
                    <tr key={tool.id} className="border-t border-border/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-9 rounded-lg border border-border/50 bg-muted/30 p-1">
                            {tool.logo_url ? (
                              <img
                                src={tool.logo_url}
                                alt={tool.name}
                                className="h-full w-full rounded-md object-contain"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                {tool.name.slice(0, 2)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {tool.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {tool.slug}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{tool.category}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">
                          Priority: {tool.priority}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Order: {tool.display_order}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={tool.is_active}
                            onCheckedChange={(value) =>
                              handleToggleActive(tool, value)
                            }
                          />
                          <span className="text-xs text-muted-foreground">
                            {tool.is_active ? "Đang hoạt động" : "Tạm dừng"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setPreviewTool(tool)}
                          >
                            <Eye className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditForm(tool)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(tool)}
                          >
                            <Trash2 className="size-4 text-rose-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ToolFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        tool={editingTool}
        onSaved={(tool) => {
          setTools((prev) => {
            const exists = prev.some((item) => item.id === tool.id);
            if (exists) {
              return prev.map((item) => (item.id === tool.id ? tool : item));
            }
            return [tool, ...prev];
          });
          setIsFormOpen(false);
        }}
      />

      <Dialog
        open={Boolean(previewTool)}
        onOpenChange={() => setPreviewTool(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Xem trước</DialogTitle>
            <DialogDescription>
              Widget hiển thị trên dashboard.
            </DialogDescription>
          </DialogHeader>
          {previewTool ? <ToolCard tool={previewTool} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ToolFormDialog({
  open,
  onOpenChange,
  tool,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool?: RecommendedTool;
  onSaved: (tool: RecommendedTool) => void;
}) {
  const [form, setForm] = useState<RecommendedToolInput>(
    buildDefaultForm(tool),
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = (nextTool?: RecommendedTool) => {
    setForm(buildDefaultForm(nextTool));
    setSlugTouched(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (nextOpen) {
      resetForm(tool);
    }
  };

  useEffect(() => {
    if (open) {
      resetForm(tool);
    }
  }, [open, tool]);

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : slugify(value),
    }));
  };

  const handleLogoUpload = async (file?: File) => {
    if (!file) return;

    const supabase = createClient();
    const fileExt = file.name.split(".").pop();
    const filePath = `${form.slug || "tool"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("recommended-tools")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast.error("Không thể tải logo lên");
      return;
    }

    const { data } = supabase.storage
      .from("recommended-tools")
      .getPublicUrl(filePath);
    setForm((prev) => ({ ...prev, logo_url: data.publicUrl }));
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.slug ||
      !form.destination_url ||
      !form.description
    ) {
      toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();

    const payload: RecommendedToolInput = {
      ...form,
      logo_url: form.logo_url ? form.logo_url : null,
      sponsor_name: form.is_sponsored ? form.sponsor_name : null,
      sponsor_level: form.is_sponsored ? form.sponsor_level : null,
      start_date: form.start_date,
      end_date: form.end_date,
    };

    const { data, error } = await supabase
      .from("recommended_tools")
      .upsert(payload)
      .select("*")
      .single();

    if (error || !data) {
      toast.error("Không thể lưu công cụ");
      setIsSaving(false);
      return;
    }

    toast.success("Đã lưu công cụ");
    onSaved(data as RecommendedTool);
    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {tool ? "Chỉnh sửa công cụ" : "Tạo công cụ"}
          </DialogTitle>
          <DialogDescription>
            Thiết lập thông tin hiển thị và liên kết chuyển hướng.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Tên công cụ *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(event) => handleNameChange(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={form.slug}
              onChange={(event) => {
                setSlugTouched(true);
                setForm((prev) => ({ ...prev, slug: event.target.value }));
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Mô tả *</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="category">Danh mục *</Label>
            <Select
              value={form.category}
              onValueChange={(value: RecommendedToolCategory) =>
                setForm((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="destination">Destination URL *</Label>
            <Input
              id="destination"
              value={form.destination_url}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  destination_url: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={form.logo_url ?? ""}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, logo_url: event.target.value }))
              }
            />
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => handleLogoUpload(event.target.files?.[0])}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Input
                id="priority"
                type="number"
                value={form.priority}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: Number(event.target.value),
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="display_order">Display Order</Label>
              <Input
                id="display_order"
                type="number"
                value={form.display_order}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    display_order: Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={toDateTimeLocal(form.start_date)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    start_date: fromDateTimeLocal(event.target.value),
                  }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={toDateTimeLocal(form.end_date)}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    end_date: fromDateTimeLocal(event.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <p className="text-sm font-medium">Affiliate</p>
                <p className="text-xs text-muted-foreground">
                  Theo dõi liên kết đối tác
                </p>
              </div>
              <Switch
                checked={form.is_affiliate}
                onCheckedChange={(value) =>
                  setForm((prev) => ({ ...prev, is_affiliate: value }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
              <div>
                <p className="text-sm font-medium">Sponsored</p>
                <p className="text-xs text-muted-foreground">
                  Gắn nhãn đối tác tài trợ
                </p>
              </div>
              <Switch
                checked={form.is_sponsored}
                onCheckedChange={(value) =>
                  setForm((prev) => ({ ...prev, is_sponsored: value }))
                }
              />
            </div>
          </div>

          {form.is_sponsored ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="sponsor_name">Sponsor Name</Label>
                <Input
                  id="sponsor_name"
                  value={form.sponsor_name ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      sponsor_name: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sponsor_level">Sponsor Level</Label>
                <Input
                  id="sponsor_level"
                  value={form.sponsor_level ?? ""}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      sponsor_level: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-lg border border-border/50 p-3">
            <div>
              <p className="text-sm font-medium">Active</p>
              <p className="text-xs text-muted-foreground">
                Hiển thị trên dashboard
              </p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(value) =>
                setForm((prev) => ({ ...prev, is_active: value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
