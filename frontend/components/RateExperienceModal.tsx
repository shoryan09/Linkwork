import { useState } from "react";
import api from "@/lib/api";

interface RateExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  clientId: string;
  onSuccess: () => void;
}

export default function RateExperienceModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  clientId,
  onSuccess,
}: RateExperienceModalProps) {
  const [ratings, setRatings] = useState({
    pay: 0,
    workingExperience: 0,
    professionalism: 0,
    likelyToWork: 0,
    recommendToFriends: 0,
    overall: 0,
  });
  const [comment, setComment] = useState("");
  const [hoveredRating, setHoveredRating] = useState<{ [key: string]: number }>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const ratingCategories = [
    { key: "pay", label: "Pay & Compensation" },
    { key: "workingExperience", label: "Working Experience" },
    { key: "professionalism", label: "Professionalism" },
    { key: "likelyToWork", label: "Likely to Work Again" },
    { key: "recommendToFriends", label: "Recommend to Friends" },
  ];

  const handleStarClick = (category: string, value: number) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate all ratings are filled
    if (ratings.overall === 0) {
      setError("Please provide an overall rating");
      return;
    }

    for (const category of ratingCategories) {
      if (ratings[category.key as keyof typeof ratings] === 0) {
        setError(`Please provide a rating for ${category.label}`);
        return;
      }
    }

    setSubmitting(true);

    try {
      await api.post("/reviews", {
        projectId,
        revieweeId: clientId,
        rating: ratings.overall,
        comment: comment.trim() || undefined,
        reviewType: "freelancer-to-client",
        detailedRatings: {
          pay: ratings.pay,
          workingExperience: ratings.workingExperience,
          professionalism: ratings.professionalism,
          likelyToWork: ratings.likelyToWork,
          recommendToFriends: ratings.recommendToFriends,
        },
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (category: string, currentValue: number) => {
    const displayValue = hoveredRating[category] !== undefined ? hoveredRating[category] : currentValue;

    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleStarClick(category, star)}
            onMouseEnter={() => setHoveredRating((prev) => ({ ...prev, [category]: star }))}
            onMouseLeave={() => setHoveredRating((prev) => ({ ...prev, [category]: undefined }))}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <svg
              className={`w-8 h-8 ${
                star <= displayValue
                  ? "text-yellow-400 fill-current"
                  : "text-gray-300 dark:text-gray-600"
              }`}
              fill={star <= displayValue ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600 dark:text-gray-400 self-center">
          {displayValue > 0 ? `${displayValue}/5` : ""}
        </span>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rate Your Experience</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{projectTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Detailed Ratings */}
          <div className="space-y-5">
            {ratingCategories.map((category) => (
              <div key={category.key}>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {category.label}
                </label>
                {renderStars(category.key, ratings[category.key as keyof typeof ratings] as number)}
              </div>
            ))}
          </div>

          {/* Overall Rating */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <label className="block text-lg font-bold text-gray-900 dark:text-white mb-3">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            {renderStars("overall", ratings.overall)}
          </div>

          {/* Optional Comment */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="Share your experience working with this client..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

