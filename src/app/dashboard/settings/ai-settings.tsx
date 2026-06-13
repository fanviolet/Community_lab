"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bot, Plus, Trash2, Star, Key } from "lucide-react";
import { getAISettings, createAISetting, updateAISetting, deleteAISetting, setDefaultAISetting } from "./actions";
import type { AISetting } from "@/types/system-settings";

interface AISettingsProps {
  canManage: boolean;
}

export function AISettings({ canManage }: AISettingsProps) {
  const [aiSettings, setAISettings] = useState<AISetting[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSetting, setNewSetting] = useState({
    provider: "openai" as const,
    model_name: "",
    api_key: "",
    api_endpoint: "",
    max_tokens: 2048,
    temperature: 0.7,
  });

  // This would be fetched from the server in a real implementation
  // For now, showing the UI structure

  return (
    <div className="space-y-6">
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Manage AI providers and models
              </CardDescription>
            </div>
            {canManage && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add AI Provider
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add AI Provider</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Select
                        value={newSetting.provider}
                        onValueChange={(value: any) => setNewSetting({ ...newSetting, provider: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="google">Google</SelectItem>
                          <SelectItem value="local">Local</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Model Name</Label>
                      <Input
                        value={newSetting.model_name}
                        onChange={(e) => setNewSetting({ ...newSetting, model_name: e.target.value })}
                        placeholder="gpt-4, claude-3, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={newSetting.api_key}
                        onChange={(e) => setNewSetting({ ...newSetting, api_key: e.target.value })}
                        placeholder="sk-..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>API Endpoint (Optional)</Label>
                      <Input
                        value={newSetting.api_endpoint}
                        onChange={(e) => setNewSetting({ ...newSetting, api_endpoint: e.target.value })}
                        placeholder="https://api.example.com"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button>Add Provider</Button>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {aiSettings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No AI providers configured yet.
              </p>
            ) : (
              aiSettings.map((setting) => (
                <div key={setting.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{setting.model_name}</p>
                        <p className="text-sm text-muted-foreground capitalize">{setting.provider}</p>
                      </div>
                    </div>
                    {setting.is_default && (
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={setting.is_enabled} disabled={!canManage} />
                    {canManage && (
                      <>
                        {!setting.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultAISetting(setting.id)}
                          >
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAISetting(setting.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Manage API keys for external services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            API keys are stored securely and used for AI and external service integrations.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
