"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Phone, Mail, Calendar } from "lucide-react";
import { useRecentActivities } from "@/lib/queries/activities";

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
};

export default function ActivitiesPage() {
  const { user, loading } = useAuth();
  const { data: recentActivities = [], isLoading: activitiesLoading } = useRecentActivities();

  // Map activities to the format expected by this component
  const activities = recentActivities.map(activity => ({
    id: activity.id,
    type: activity.type,
    title: activity.title,
    client: activity.client_name || "Unknown",
    date: new Date(activity.created_at).toISOString().split('T')[0],
    completed: activity.completed || false,
  }));

  const [localActivities, setLocalActivities] = useState(activities);

  // Update local activities when data changes
  useEffect(() => {
    setLocalActivities(activities);
  }, [activities]);

  if (loading || activitiesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const toggleComplete = (id: string) => {
    setLocalActivities((prev) =>
      prev.map((activity) =>
        activity.id === id ? { ...activity, completed: !activity.completed } : activity
      )
    );
    // TODO: Update completion status in Supabase
  };

  const completedCount = localActivities.filter((a) => a.completed).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-6">
            <Link
              href="/dashboard"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activities</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {completedCount} of {localActivities.length} completed
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {localActivities.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
            <h3 className="font-semibold mb-2">No Activities Yet</h3>
            <p className="text-sm text-muted-foreground">
              Activities will appear here as you interact with clients and deals.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {localActivities.map((activity) => {
            const Icon = activityIcons[activity.type as keyof typeof activityIcons];
            return (
              <div
                key={activity.id}
                className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4 hover:shadow-md transition-shadow ${
                  activity.completed ? "opacity-60" : ""
                }`}
              >
                <button
                  onClick={() => toggleComplete(activity.id)}
                  className="flex-shrink-0"
                >
                  {activity.completed ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-400 dark:text-gray-600" />
                  )}
                </button>
                <div className="flex-shrink-0 p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3
                    className={`font-medium text-gray-900 dark:text-white ${
                      activity.completed ? "line-through" : ""
                    }`}
                  >
                    {activity.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.client}
                  </p>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(activity.date).toLocaleDateString()}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </main>
    </div>
  );
}
