"use client";

import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkspaceSwitcher() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2">
          <Building2 className="h-5 w-5" />
          <span className="hidden sm:inline">Community Lab</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Không gian làm việc</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Community Lab</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Tạo không gian làm việc</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
