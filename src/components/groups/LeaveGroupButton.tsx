"use client";

import React, { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

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
import { leaveGroup } from "@/app/dashboard/groups/actions";

interface LeaveGroupButtonProps {
  groupId: string;
}

export function LeaveGroupButton({ groupId }: LeaveGroupButtonProps) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleLeave = () => {
    startTransition(async () => {
      const result = await leaveGroup(groupId);
      if (result.success) {
        toast.success("You have left the group successfully.");
        setOpen(false);
        router.push("/dashboard/groups");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to leave group. Please try again.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={pending}>
          <LogOut className="mr-2 h-4 w-4" />
          Leave Group
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave this group?</DialogTitle>
          <DialogDescription>
            You will lose access to all group resources including projects, problems, and discussions.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleLeave} disabled={pending} variant="destructive">
            {pending ? "Leaving..." : "Leave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
