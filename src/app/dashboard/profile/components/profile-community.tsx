"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, CheckCircle, MessageSquare, Lightbulb, Clock } from "lucide-react";
import { getUserStatistics, getUserActivity } from "../actions";

export function ProfileCommunity() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsResult, activityResult] = await Promise.all([
        getUserStatistics(),
        getUserActivity(10),
      ]);

      if (statsResult.stats) {
        setStats(statsResult.stats);
      }

      if (activityResult.activities) {
        setActivities(activityResult.activities);
      }
    } catch (error) {
      console.error("Error loading community data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatActivityAction = (action: string) => {
    const actionMap: Record<string, string> = {
      login: "Logged in",
      task_completed: "Completed a task",
      pitch_submitted: "Submitted a pitch",
      review_completed: "Completed a review",
      mentorship_session: "Had a mentorship session",
      comment_posted: "Posted a comment",
      analysis_created: "Created an analysis",
      project_joined: "Joined a project",
      project_created: "Created a project",
    };

    return actionMap[action] || action;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Projects Joined"
          value={stats?.projects_joined || 0}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title="Projects Led"
          value={stats?.projects_led || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Problems Submitted"
          value={stats?.problems_created || 0}
          icon={Lightbulb}
          color="yellow"
        />
        <StatCard
          title="Tasks Completed"
          value={stats?.tasks_completed || 0}
          icon={CheckCircle}
          color="purple"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Reviews Completed"
          value={stats?.reviews_completed || 0}
          icon={MessageSquare}
          color="indigo"
        />
        <StatCard
          title="Comments Made"
          value={stats?.comments_count || 0}
          icon={MessageSquare}
          color="pink"
        />
        <StatCard
          title="Votes Cast"
          value={stats?.votes_cast || 0}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Recent Activity */}
      <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Your recent contributions and activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No recent activity
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0"
                >
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {activity.entity_type || "General"}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {formatActivityAction(activity.action)}
                    </p>
                    {activity.activity_description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {activity.activity_description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTime(activity.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    purple: "bg-purple-100 text-purple-600",
    indigo: "bg-indigo-100 text-indigo-600",
    pink: "bg-pink-100 text-pink-600",
    orange: "bg-orange-100 text-orange-600",
  };

  return (
    <Card className="border-0 bg-white shadow-sm ring-1 ring-black/5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
