"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Shield, AlertTriangle } from "lucide-react";
import { updateUserRole } from "../actions";

interface RoleManagementProps {
  userId: string;
  currentRole: string;
}

export function RoleManagement({ userId, currentRole }: RoleManagementProps) {
  const [selectedRole, setSelectedRole] = useState(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateRole = async () => {
    if (selectedRole === currentRole) return;

    setIsUpdating(true);
    try {
      await updateUserRole(userId, { role: selectedRole as any });
      window.location.reload();
    } catch (error) {
      console.error("Failed to update role:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Role Management
        </CardTitle>
        <CardDescription>
          Assign or change user role and permissions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="role">Current Role</Label>
          <div className="p-3 bg-muted/30 rounded-lg">
            <span className="font-medium capitalize">{currentRole}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-role">New Role</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger id="new-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="guest">Guest - Limited access</SelectItem>
              <SelectItem value="member">Member - Full community access</SelectItem>
              <SelectItem value="builder">Builder - Can create projects</SelectItem>
              <SelectItem value="expert">Expert - Can review and mentor</SelectItem>
              <SelectItem value="mentor">Mentor - Can guide and teach</SelectItem>
              <SelectItem value="leader">Leader - Can manage teams</SelectItem>
              <SelectItem value="admin">Admin - Full system access</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedRole !== currentRole && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Role Change Warning
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Changing roles will immediately affect the user's permissions and access.
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleUpdateRole}
          disabled={selectedRole === currentRole || isUpdating}
          className="w-full"
        >
          {isUpdating ? "Updating..." : "Update Role"}
        </Button>
      </CardContent>
    </Card>
  );
}
