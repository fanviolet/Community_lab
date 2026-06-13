"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createMentorProfile } from "../actions";
import type { CreateMentorProfileInput } from "@/types/mentoring";

export function MentorProfileForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateMentorProfileInput>({
    expertise: [],
    bio: "",
    availability: "",
    years_experience: 0,
  });

  const [expertiseInput, setExpertiseInput] = useState("");

  const addExpertise = () => {
    if (expertiseInput.trim() && !formData.expertise.includes(expertiseInput.trim())) {
      setFormData({
        ...formData,
        expertise: [...formData.expertise, expertiseInput.trim()],
      });
      setExpertiseInput("");
    }
  };

  const removeExpertise = (index: number) => {
    setFormData({
      ...formData,
      expertise: formData.expertise.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await createMentorProfile(formData);
      router.push("/dashboard/mentoring");
    } catch (error) {
      console.error("Failed to create mentor profile:", error);
      alert("Failed to create mentor profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="expertise">Areas of Expertise *</Label>
        <div className="flex gap-2">
          <Input
            value={expertiseInput}
            onChange={(e) => setExpertiseInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addExpertise())}
            placeholder="Add an expertise area (e.g., React, Machine Learning)"
          />
          <Button type="button" onClick={addExpertise}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {formData.expertise.map((exp, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              {exp}
              <button
                type="button"
                onClick={() => removeExpertise(index)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          rows={4}
          placeholder="Tell us about yourself and your mentoring style"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="availability">Availability</Label>
        <Textarea
          id="availability"
          value={formData.availability}
          onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
          rows={2}
          placeholder="When are you available for mentoring sessions?"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="years_experience">Years of Experience</Label>
        <Input
          id="years_experience"
          type="number"
          min="0"
          value={formData.years_experience}
          onChange={(e) =>
            setFormData({
              ...formData,
              years_experience: parseInt(e.target.value) || 0,
            })
          }
          placeholder="Number of years"
        />
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting || formData.expertise.length === 0}>
          {isSubmitting ? "Creating..." : "Create Profile"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
