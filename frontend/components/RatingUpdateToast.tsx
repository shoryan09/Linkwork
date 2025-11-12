import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { useAuth } from "@/context/AuthContext";

export default function RatingUpdateToast() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [ratingData, setRatingData] = useState<{ average: number; count: number } | null>(null);

  useEffect(() => {
    if (!user) return;

    const handleRatingUpdate = (data: { userId: string; rating: { average: number; count: number } }) => {
      // Only show toast if the rating update is for the current user (client who was rated)
      if (data.userId === user.id) {
        setRatingData(data.rating);
        setShow(true);

        // Auto-hide after 5 seconds
        setTimeout(() => {
          setShow(false);
        }, 5000);
      }
    };

    socket.on("rating:updated", handleRatingUpdate);

    return () => {
      socket.off("rating:updated", handleRatingUpdate);
    };
  }, [user?.id]);

  if (!show || !ratingData) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg shadow-2xl p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-lg">New Review Received! 🎉</h4>
            <p className="text-sm mt-1">
              A freelancer rated your service!
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-bold">{ratingData.average.toFixed(1)}</span>
              <span className="text-sm">
                ⭐ ({ratingData.count} review{ratingData.count > 1 ? "s" : ""})
              </span>
            </div>
          </div>
          <button
            onClick={() => setShow(false)}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

