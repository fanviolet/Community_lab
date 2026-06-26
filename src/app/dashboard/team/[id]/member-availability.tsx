"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Clock } from "lucide-react";
import type { MemberAvailability } from "@/types/team-management";
import { createAvailability, deleteAvailability } from "../actions";

interface MemberAvailabilityProps {
  profileId: string;
  availability: MemberAvailability[];
  canManage: boolean;
}

const DAYS = [
  { value: 0, label: "Chủ nhật" },
  { value: 1, label: "Thứ hai" },
  { value: 2, label: "Thứ ba" },
  { value: 3, label: "Thứ tư" },
  { value: 4, label: "Thứ năm" },
  { value: 5, label: "Thứ sáu" },
  { value: 6, label: "Thứ bảy" },
];

export function MemberAvailability({
  profileId,
  availability,
  canManage,
}: MemberAvailabilityProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAvailability, setNewAvailability] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    timezone: "UTC",
    is_available: true,
  });

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    await createAvailability({
      profile_id: profileId,
      ...newAvailability,
    });
    setIsAddDialogOpen(false);
    setNewAvailability({
      day_of_week: 1,
      start_time: "09:00",
      end_time: "17:00",
      timezone: "UTC",
      is_available: true,
    });
    window.location.reload();
  };

  const handleDeleteAvailability = async (id: string) => {
    await deleteAvailability(id);
    window.location.reload();
  };

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Thời gian rảnh</CardTitle>
            <CardDescription>Lịch thời gian rảnh theo tuần</CardDescription>
          </div>
          {canManage && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm thời gian rảnh
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm thời gian rảnh</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddAvailability} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="day_of_week">Ngày trong tuần</Label>
                    <select
                      id="day_of_week"
                      value={newAvailability.day_of_week}
                      onChange={(e) =>
                        setNewAvailability({
                          ...newAvailability,
                          day_of_week: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 border rounded-md"
                      required
                    >
                      {DAYS.map((day) => (
                        <option key={day.value} value={day.value}>
                          {day.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="start_time">Giờ bắt đầu</Label>
                    <Input
                      id="start_time"
                      type="time"
                      value={newAvailability.start_time}
                      onChange={(e) =>
                        setNewAvailability({
                          ...newAvailability,
                          start_time: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_time">Giờ kết thúc</Label>
                    <Input
                      id="end_time"
                      type="time"
                      value={newAvailability.end_time}
                      onChange={(e) =>
                        setNewAvailability({
                          ...newAvailability,
                          end_time: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Múi giờ</Label>
                    <Input
                      id="timezone"
                      value={newAvailability.timezone}
                      onChange={(e) =>
                        setNewAvailability({
                          ...newAvailability,
                          timezone: e.target.value,
                        })
                      }
                      placeholder="UTC"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_available"
                      checked={newAvailability.is_available}
                      onCheckedChange={(checked) =>
                        setNewAvailability({
                          ...newAvailability,
                          is_available: checked,
                        })
                      }
                    />
                    <Label htmlFor="is_available">Sẵn sàng</Label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Thêm thời gian rảnh</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                    >
                      Hủy
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {availability.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Chưa thiết lập thời gian rảnh nào.
          </p>
        ) : (
          <div className="space-y-3">
            {availability.map((avail) => (
              <div
                key={avail.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">
                      {DAYS.find((d) => d.value === avail.day_of_week)?.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {avail.start_time} - {avail.end_time} ({avail.timezone})
                    </p>
                  </div>
                  {!avail.is_available && (
                    <Badge variant="secondary">Không rảnh</Badge>
                  )}
                </div>
                {canManage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteAvailability(avail.id)}
                  >
                    Xóa
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
