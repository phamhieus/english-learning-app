import React, { useState } from "react";
import { MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "../components/classNames";
import { VirtualConversationView } from "../features/virtual-conversation/components/VirtualConversationView";
import type { ConversationScenario } from "../features/virtual-conversation/types/virtualConversation.types";

const SCENARIOS: ConversationScenario[] = [
  {
    id: "daily-chat",
    title: "Daily Small Talk",
    description: "Chat about weather, hobbies, and everyday life",
    level: "beginner",
    openingLine:
      "Hi there! Nice to meet you. How has your day been so far? I'm curious — what do you usually do on weekends?",
  },
  {
    id: "job-interview",
    title: "Job Interview Practice",
    description: "Prepare for common English interview questions",
    level: "intermediate",
    openingLine:
      "Welcome! Thank you for coming in today. Could you start by telling me a little about yourself and your background?",
  },
  {
    id: "travel-abroad",
    title: "Traveling Abroad",
    description: "Handle real travel situations in English",
    level: "beginner",
    openingLine:
      "Welcome to the airport information desk! How can I help you today? Are you looking for your gate or do you need help with something else?",
  },
  {
    id: "academic-discussion",
    title: "Academic Discussion",
    description: "Express and defend opinions on complex topics",
    level: "advanced",
    openingLine:
      "Let's dive into an interesting topic today. Do you think social media has done more harm than good to modern society? I'd love to hear your perspective.",
  },
  {
    id: "restaurant-ordering",
    title: "At the Restaurant",
    description: "Order food and have natural conversations with staff",
    level: "beginner",
    openingLine:
      "Good evening! Welcome to our restaurant. Have you visited us before? Can I start you off with something to drink while you look at the menu?",
  },
  {
    id: "business-meeting",
    title: "Business Meeting",
    description: "Discuss projects, give updates, and handle Q&A",
    level: "intermediate",
    openingLine:
      "Good morning, everyone. Thanks for joining the call. Could you give us a quick update on how the project is progressing so far?",
  },
];

const LEVEL_STYLES = {
  beginner: {
    badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
    card: "hover:border-emerald-300 dark:hover:border-emerald-700",
  },
  intermediate: {
    badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
    card: "hover:border-amber-300 dark:hover:border-amber-700",
  },
  advanced: {
    badge: "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300",
    card: "hover:border-rose-300 dark:hover:border-rose-700",
  },
};

export default function VirtualConversation() {
  const [activeScenario, setActiveScenario] = useState<ConversationScenario | null>(null);

  if (activeScenario) {
    return (
      <div className="h-full flex flex-col">
        <button
          onClick={() => setActiveScenario(null)}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-6 pt-4 pb-2 shrink-0"
        >
          ← Back to scenarios
        </button>
        <VirtualConversationView scenario={activeScenario} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Virtual Conversation
          </h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-sm ml-[52px]">
          Practice real English conversations with an AI tutor. Speak naturally —
          the app listens and responds automatically.
        </p>
      </div>

      {/* Scenario grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SCENARIOS.map((scenario) => {
          const style = LEVEL_STYLES[scenario.level];
          return (
            <button
              key={scenario.id}
              onClick={() => setActiveScenario(scenario)}
              className={cn(
                "text-left p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700",
                "bg-white dark:bg-slate-900 shadow-sm",
                "transition-all duration-200 hover:shadow-md hover:scale-[1.015] active:scale-[0.99]",
                style.card
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-base leading-tight">
                  {scenario.title}
                </h3>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 leading-snug">
                {scenario.description}
              </p>
              <span
                className={cn(
                  "text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize",
                  style.badge
                )}
              >
                {scenario.level}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
