"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, CheckCircle } from "lucide-react";
import type { MemberSkill } from "@/types/team-management";
import { createSkill, deleteSkill, verifySkill } from "../actions";

interface MemberSkillsProps {
  profileId: string;
  skills: MemberSkill[];
  canManage: boolean;
}

const PROFICIENCY_LEVELS = ["beginner", "intermediate", "advanced", "expert"];

export function MemberSkills({ profileId, skills, canManage }: MemberSkillsProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSkill, setNewSkill] = useState({
    skill_name: "",
    proficiency_level: "intermediate" as const,
    years_experience: "",
  });

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSkill({
      profile_id: profileId,
      skill_name: newSkill.skill_name,
      proficiency_level: newSkill.proficiency_level,
      years_experience: newSkill.years_experience ? parseFloat(newSkill.years_experience) : undefined,
    });
    setIsAddDialogOpen(false);
    setNewSkill({
      skill_name: "",
      proficiency_level: "intermediate",
      years_experience: "",
    });
    window.location.reload();
  };

  const handleDeleteSkill = async (id: string) => {
    await deleteSkill(id);
    window.location.reload();
  };

  const handleVerifySkill = async (id: string) => {
    await verifySkill(id);
    window.location.reload();
  };

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Skills</CardTitle>
            <CardDescription>
              Technical skills and expertise
            </CardDescription>
          </div>
          {canManage && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Skill
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Skill</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSkill} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="skill_name">Skill Name</Label>
                    <Input
                      id="skill_name"
                      value={newSkill.skill_name}
                      onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                      placeholder="e.g., React, Python, Project Management"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="proficiency_level">Proficiency Level</Label>
                    <Select
                      value={newSkill.proficiency_level}
                      onValueChange={(value: any) => setNewSkill({ ...newSkill, proficiency_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROFICIENCY_LEVELS.map((level) => (
                          <SelectItem key={level} value={level} className="capitalize">
                            {level}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="years_experience">Years of Experience (Optional)</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      step="0.1"
                      min="0"
                      value={newSkill.years_experience}
                      onChange={(e) => setNewSkill({ ...newSkill, years_experience: e.target.value })}
                      placeholder="e.g., 3.5"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Add Skill</Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No skills added yet.
          </p>
        ) : (
          <div className="space-y-3">
            {skills.map((skill) => (
              <div key={skill.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="capitalize">
                    {skill.proficiency_level}
                  </Badge>
                  <div>
                    <p className="font-medium">{skill.skill_name}</p>
                    {skill.years_experience && (
                      <p className="text-xs text-muted-foreground">
                        {skill.years_experience} years experience
                      </p>
                    )}
                  </div>
                  {skill.verified && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    {!skill.verified && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleVerifySkill(skill.id)}
                      >
                        Verify
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSkill(skill.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
