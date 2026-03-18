import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";

interface TopicStat {
  topic: string;
  count: number;
  avgRetrievalScore: number;
}

interface ArchetypeTopic {
  archetypeId: string;
  topic: string;
  count: number;
}

interface InsightsData {
  period: { days: number; since: string };
  totalConversations: number;
  topTopics: TopicStat[];
  contentGaps: TopicStat[];
  archetypeTopics: ArchetypeTopic[];
}

const TOPIC_LABELS: Record<string, string> = {
  "morning-routines": "Morning Routines",
  "bedtime-routines": "Bedtime Routines",
  "homework-school": "Homework & School",
  "emotional-regulation": "Emotional Regulation",
  meltdowns: "Meltdowns",
  "focus-attention": "Focus & Attention",
  "energy-impulse": "Energy & Impulse",
  "sensory-needs": "Sensory Needs",
  "social-skills": "Social Skills",
  "organization-planning": "Organization & Planning",
  "family-dynamics": "Family Dynamics",
  "discipline-behavior": "Discipline & Behavior",
  "understanding-adhd": "Understanding ADHD",
  medication: "Medication",
  "professional-help": "Professional Help",
  transitions: "Transitions",
  "self-care-parent": "Parent Self-Care",
  other: "Other",
};

const ARCHETYPE_LABELS: Record<string, string> = {
  koala: "Dreamy Koala",
  hummingbird: "Flash Hummingbird",
  tiger: "Fierce Tiger",
  meerkat: "Observing Meerkat",
  stallion: "Bold Stallion",
  fox: "Clever Fox",
  owl: "Keen Owl",
};

function formatTopic(topic: string): string {
  return TOPIC_LABELS[topic] || topic.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function ConversationInsights() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.get(`/api/admin/conversation-insights?days=${days}`);
      setData(result as InsightsData);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-harbor-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-harbor-text/50">
        No conversation data available yet.
      </div>
    );
  }

  const maxCount = data.topTopics.length > 0 ? data.topTopics[0].count : 1;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-harbor-text">
            Conversation Insights
          </h2>
          <p className="text-sm text-harbor-text/50 mt-1">
            {data.totalConversations} conversations in the last {days} days
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-harbor-text/10 text-sm bg-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={14}>Last 14 days</option>
          <option value={30}>Last 30 days</option>
          <option value={60}>Last 60 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Top Topics */}
      <div className="bg-white rounded-xl border border-harbor-text/10 p-5">
        <h3 className="text-sm font-semibold text-harbor-text mb-4">
          Most Asked Topics
        </h3>
        {data.topTopics.length === 0 ? (
          <p className="text-sm text-harbor-text/40">No data yet</p>
        ) : (
          <div className="space-y-3">
            {data.topTopics.map((topic) => (
              <div key={topic.topic}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-harbor-text font-medium">
                    {formatTopic(topic.topic)}
                  </span>
                  <span className="text-harbor-text/50">
                    {topic.count} questions
                    <span className="ml-2 text-xs text-harbor-text/30">
                      (avg score: {topic.avgRetrievalScore.toFixed(2)})
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-harbor-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-harbor-accent rounded-full transition-all"
                    style={{
                      width: `${(topic.count / maxCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content Gaps */}
      <div className="bg-white rounded-xl border border-harbor-text/10 p-5">
        <h3 className="text-sm font-semibold text-harbor-text mb-1">
          Content Gaps
        </h3>
        <p className="text-xs text-harbor-text/40 mb-4">
          Topics where the AI couldn't find enough knowledge base content
        </p>
        {data.contentGaps.length === 0 ? (
          <p className="text-sm text-harbor-text/40">
            No content gaps detected — great coverage!
          </p>
        ) : (
          <div className="space-y-2">
            {data.contentGaps.map((gap) => (
              <div
                key={gap.topic}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-red-50 border border-red-100"
              >
                <span className="text-sm font-medium text-red-700">
                  {formatTopic(gap.topic)}
                </span>
                <div className="text-right">
                  <span className="text-sm text-red-600">
                    {gap.count} unanswered
                  </span>
                  <span className="ml-2 text-xs text-red-400">
                    avg score: {gap.avgRetrievalScore.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topics by Archetype */}
      {data.archetypeTopics.length > 0 && (
        <div className="bg-white rounded-xl border border-harbor-text/10 p-5">
          <h3 className="text-sm font-semibold text-harbor-text mb-1">
            Topics by Archetype
          </h3>
          <p className="text-xs text-harbor-text/40 mb-4">
            What each child profile type asks about most
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(
              data.archetypeTopics.reduce(
                (acc, item) => {
                  const key = item.archetypeId || "unknown";
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(item);
                  return acc;
                },
                {} as Record<string, ArchetypeTopic[]>,
              ),
            ).map(([archetypeId, topics]) => (
              <div
                key={archetypeId}
                className="p-3 rounded-lg bg-harbor-bg/50 border border-harbor-text/5"
              >
                <h4 className="text-sm font-medium text-harbor-accent mb-2">
                  {ARCHETYPE_LABELS[archetypeId] || archetypeId}
                </h4>
                <div className="space-y-1">
                  {topics.slice(0, 5).map((t) => (
                    <div
                      key={`${archetypeId}-${t.topic}`}
                      className="flex justify-between text-xs text-harbor-text/60"
                    >
                      <span>{formatTopic(t.topic)}</span>
                      <span className="font-medium">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
