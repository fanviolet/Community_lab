"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, X, Plus, Globe, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { updateProfile, uploadAvatar, deleteAvatar, validateUsername, type UpdateProfileInput } from "@/lib/actions/update-profile";

const MAX_BIO_LENGTH = 200;

interface ProfileOverviewProps {
  profile: any;
}

interface UsernameValidationState {
  isValid: boolean;
  isAvailable: boolean;
  message: string;
  isValidating: boolean;
}

export function ProfileOverview({ profile }: ProfileOverviewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile?.avatar_url || null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Single state object for all form fields
  const [formData, setFormData] = useState<UpdateProfileInput>({
    display_name: profile?.display_name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    skills: profile?.skills || [],
    interests: profile?.interests || [],
    website: profile?.website || "",
    location: profile?.location || "",
  });
  
  const [originalData, setOriginalData] = useState<UpdateProfileInput>({ ...formData });
  const [isDirty, setIsDirty] = useState(false);
  
  const [skillInput, setSkillInput] = useState("");
  const [interestInput, setInterestInput] = useState("");
  
  // Username validation state
  const [usernameValidation, setUsernameValidation] = useState<UsernameValidationState>({
    isValid: true,
    isAvailable: true,
    message: "",
    isValidating: false,
  });
  
  const usernameValidationTimeout = useRef<NodeJS.Timeout | null>(null);

  // Check if form is dirty
  useEffect(() => {
    const isChanged = JSON.stringify(formData) !== JSON.stringify(originalData);
    setIsDirty(isChanged);
  }, [formData, originalData]);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Debounced username validation
  const performUsernameValidation = useCallback(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameValidation({
        isValid: username.length >= 3,
        isAvailable: true,
        message: username.length > 0 && username.length < 3 ? "Tên đăng nhập phải có ít nhất 3 ký tự" : "",
        isValidating: false,
      });
      return;
    }

    setUsernameValidation(prev => ({ ...prev, isValidating: true }));

    try {
      const result = await validateUsername(username);
      setUsernameValidation({
        isValid: result.valid,
        isAvailable: result.available ?? false,
        message: result.error || (result.available ? "Tên đăng nhập khả dụng" : ""),
        isValidating: false,
      });
    } catch {
      setUsernameValidation({
        isValid: true,
        isAvailable: true,
        message: "",
        isValidating: false,
      });
    }
  }, []);

  const handleUsernameChange = useCallback((value: string) => {
    // Clear previous timeout
    if (usernameValidationTimeout.current) {
      clearTimeout(usernameValidationTimeout.current);
    }

    // Update form data
    setFormData(prev => ({ ...prev, username: value }));

    // Debounce validation
    usernameValidationTimeout.current = setTimeout(() => {
      performUsernameValidation(value);
    }, 500);
  }, [performUsernameValidation]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const preview = URL.createObjectURL(file);
    setAvatarPreview(preview);
    setUploading(true);
    setError(null);

    try {
      const result = await uploadAvatar(file);
      if (result.error) {
        setError(result.error);
        setAvatarPreview(profile?.avatar_url || null);
      }
    } catch {
      setError("Có lỗi xảy ra khi tải lên avatar");
      setAvatarPreview(profile?.avatar_url || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setError(null);
    try {
      const result = await deleteAvatar();
      if (result.error) {
        setError(result.error);
      } else {
        setAvatarPreview(null);
      }
    } catch {
      setError("Có lỗi xảy ra khi xóa avatar");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await updateProfile(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage("Đã lưu thành công");
        setOriginalData({ ...formData });
        setIsDirty(false);
      }
    } catch {
      setError("Có lỗi xảy ra khi lưu hồ sơ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ ...originalData });
    setAvatarPreview(profile?.avatar_url || null);
    setIsDirty(false);
    setError(null);
    setSuccessMessage(null);
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills?.includes(skillInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        skills: [...(prev.skills || []), skillInput.trim()] 
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ 
      ...prev, 
      skills: (prev.skills || []).filter((s) => s !== skill) 
    }));
  };

  const addInterest = () => {
    if (interestInput.trim() && !formData.interests?.includes(interestInput.trim())) {
      setFormData(prev => ({ 
        ...prev, 
        interests: [...(prev.interests || []), interestInput.trim()] 
      }));
      setInterestInput("");
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({ 
      ...prev, 
      interests: (prev.interests || []).filter((i) => i !== interest) 
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isUsernameValid = !usernameValidation.message || (usernameValidation.isValid && usernameValidation.isAvailable);
  const showUsernameError = usernameValidation.message && !usernameValidation.isValidating;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle>Tổng quan hồ sơ</CardTitle>
          <CardDescription>
            Quản lý thông tin hồ sơ công khai của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback>
                  {getInitials(formData.display_name || "User")}
                </AvatarFallback>
              </Avatar>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleDeleteAvatar}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleAvatarChange}
                disabled={uploading}
                id="avatar-upload"
                className="hidden"
              />
              <Label htmlFor="avatar-upload">
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang tải lên...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Tải lên avatar
                      </>
                    )}
                  </span>
                </Button>
              </Label>
              <p className="text-xs text-muted-foreground">
                JPG, PNG hoặc WebP. Tối đa 5MB.
              </p>
            </div>
          </div>

          {/* Success/Error Messages */}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-700 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-name">Tên hiển thị *</Label>
              <Input
                id="display-name"
                value={formData.display_name}
                onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder="Nhập tên hiển thị của bạn"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Tên đăng nhập *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="Nhập tên đăng nhập của bạn"
                className={showUsernameError && !isUsernameValid ? "border-red-500" : ""}
              />
              <div className="flex items-center gap-1 text-xs">
                {usernameValidation.isValidating ? (
                  <span className="text-muted-foreground">Đang kiểm tra...</span>
                ) : showUsernameError ? (
                  <span className={isUsernameValid ? "text-green-600" : "text-red-600"}>
                    {usernameValidation.message}
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Dùng cho lượt đề cập và URL hồ sơ. Chỉ được chứa chữ cái, số, dấu gạch ngang và dấu gạch dưới.
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Giới thiệu</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, MAX_BIO_LENGTH) }))}
                placeholder="Hãy kể về bản thân bạn..."
                maxLength={MAX_BIO_LENGTH}
                rows={4}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Giới thiệu về bản thân</span>
                <span>{formData.bio?.length || 0}/{MAX_BIO_LENGTH}</span>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Kỹ năng</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="Thêm kỹ năng"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addSkill}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.skills || []).map((skill: string) => (
                <Badge key={skill} variant="secondary" className="gap-1">
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>Sở thích</Label>
            <div className="flex gap-2">
              <Input
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInterest())}
                placeholder="Thêm sở thích"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addInterest}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(formData.interests || []).map((interest: string) => (
                <Badge key={interest} variant="outline" className="gap-1">
                  {interest}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => removeInterest(interest)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Website
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://website-cua-ban.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Vị trí
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Thành phố, Quốc gia"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                "Lưu thay đổi"
              )}
            </Button>
            {isDirty && (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Hủy
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}