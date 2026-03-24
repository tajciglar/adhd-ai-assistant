import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { AdminStats } from "../../types/admin";

interface FeedbackItem {
  id: string;
  rating: number;
  createdAt: string;
  userId: string;
  message: {
    content: string;
    role: string;
    conversation: { title: string };
  };
}

export default function FeedbackDashboard({ stats }: { stats: AdminStats | null }) {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get("/api/admin/feedback")
      .then((data) => {
        setFeedback((data as { feedback: FeedbackItem[] }).feedback);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load feedback");
      })
      .finally(() => setLoading(false));
  }, []);

  const totalLikes = stats?.totalLikes ?? 0;
  const totalDislikes = stats?.totalDislikes ?? 0;
  const total = totalLikes + totalDislikes;
  const likeRate = total > 0 ? Math.round((totalLikes / total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-harbor-text/5">
          <p className="text-sm text-harbor-text/50 mb-1">Total Likes</p>
          <p className="text-2xl font-bold text-harbor-primary">{totalLikes}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-harbor-text/5">
          <p className="text-sm text-harbor-text/50 mb-1">Total Dislikes</p>
          <p className="text-2xl font-bold text-red-400">{totalDislikes}</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-harbor-text/5">
          <p className="text-sm text-harbor-text/50 mb-1">Approval Rate</p>
          <p className="text-2xl font-bold text-harbor-text">
            {total > 0 ? `${likeRate}%` : "—"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-harbor-text/5">
        <div className="p-4 border-b border-harbor-text/5">
          <h3 className="font-medium text-harbor-text">Recent Feedback</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-harbor-text/40">Loading...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">{error}</div>
        ) : feedback.length === 0 ? (
          <div className="p-8 text-center text-harbor-text/40">
            No feedback yet. Users can rate AI responses with thumbs up/down.
          </div>
        ) : (
          <div className="divide-y divide-harbor-text/5">
            {feedback.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-lg ${
                      item.rating === 1 ? "text-harbor-primary" : "text-red-400"
                    }`}
                  >
                    {item.rating === 1 ? "\u{1F44D}" : "\u{1F44E}"}
                  </span>
                  <span className="text-xs text-harbor-text/40">
                    {new Date(item.createdAt).toLocaleDateString()} &middot;{" "}
                    {item.message.conversation.title}
                  </span>
                </div>
                <p className="text-sm text-harbor-text/70 line-clamp-3">
                  {item.message.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
