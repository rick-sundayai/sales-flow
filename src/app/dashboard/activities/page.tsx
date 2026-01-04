"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Phone, Mail, Calendar } from "lucide-react";

// Mock data for now - will connect to Supabase later
const mockActivities = [
  {
    id: "1",
    type: "call",
    title: "Follow-up call with Sarah",
    client: "Acme Corporation",
    date: "2024-12-06",
    completed: false,
  },
  {
    id: "2",
    type: "email",
    title: "Send proposal to Michael",
    client: "TechStart Inc",
    date: "2024-12-06",
    completed: true,
  },
  {
    id: "3",
    type: "meeting",
    title: "Product demo with Emily",
    client: "Growth Labs",
    date: "2024-12-07",
    completed: false,
  },
  {
    id: "4",
    type: "call",
    title: "Contract negotiation with Robert",
    client: "DataFlow Systems",
    date: "2024-12-07",
    completed: false,
  },
  {
    id: "5",
    type: "email",
    title: "Send invoice to Anna",
    client: "Quantum Solutions",
    date: "2024-12-05",
    completed: true,
  },
];

const activityIcons = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
};

export default function ActivitiesPage() {
  const { user, loading } = useAuth();
  const [activities, setActivities] = useState(mockActivities);

  if (loading) {
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
    setActivities((prev) =>
      prev.map((activity) =>
        activity.id === id ? { ...activity, completed: !activity.completed } : activity
      )
    );
  };

  const completedCount = activities.filter((a) => a.completed).length;

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
                {completedCount} of {activities.length} completed
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-3">
          {activities.map((activity) => {
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

        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> This page currently shows mock data. Connect to Supabase to see real activity data.
          </p>
        </div>
      </main>
    </div>
  );
}
