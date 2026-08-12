"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Star, MessageSquare, User, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { API_URL } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const RATING_LABELS = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notification, setNotification] = useState(null);
  const notificationTimeoutRef = useRef(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = window.setTimeout(() => {
      setNotification(null);
      notificationTimeoutRef.current = null;
    }, 4000);
  };

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      setFetching(true);
      const res = await fetch(`${API_URL}/api/v1/reviews/product/${productId}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } else {
        setReviews([]);
      }
    } catch (err) {
      console.error("Error loading reviews:", err);
      setReviews([]);
    } finally {
      setFetching(false);
    }
  }, [productId]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchReviews();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [fetchReviews]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const averageRating = reviews.length
    ? Number((reviews.reduce((acc, rev) => acc + Number(rev.rating || 0), 0) / reviews.length).toFixed(1))
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/v1/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ productId, rating, comment }),
      });

      const data = await res.json();

      if (data.success) {
        showNotification("success", data.message || "Thank you! Your review has been published.");
        setComment("");
        setRating(5);
        fetchReviews();
      } else {
        showNotification("error", data.message || "Failed to submit review. Please try again.");
      }
    } catch (error) {
      console.error("Review submission error:", error);
      showNotification("error", "You need to be logged in to leave a review.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-16 space-y-10 bg-white p-6 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100/50 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200/60 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Customer Feedback
            </span>
          </div>
          <h3 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2 tracking-tight">
            Reviews & Ratings
          </h3>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Real feedback from verified purchasers.
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/60">
            <div className="text-center">
              <span className="text-3xl font-black text-slate-900 leading-none">{averageRating}</span>
              <span className="text-xs text-slate-400 font-bold block mt-1">out of 5</span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="space-y-1">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${star <= Math.round(Number(averageRating))
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-200 fill-slate-100"
                      }`}
                  />
                ))}
              </div>
              <p className="text-xs font-bold text-slate-600">
                Based on {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
        )}
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${notification.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-900"
              : "bg-rose-50 border border-rose-200 text-rose-900"
            }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}
      {
        user ? (
          <form onSubmit={handleSubmit} className="p-6 bg-slate-50/80 rounded-2xl space-y-5 border border-slate-200/80 focus-within:border-slate-300 transition-all">
            <h4 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">Write a Review</h4>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-bold text-slate-600">Your Rating:</span>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 rounded-lg hover:bg-amber-100/50 focus:outline-none transition-all transform active:scale-90"
                  >
                    <Star
                      className={`w-6 h-6 transition-colors duration-150 ${star <= (hoverRating || rating)
                          ? "text-amber-400 fill-amber-400 drop-shadow-sm"
                          : "text-slate-300 fill-slate-100"
                        }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-black text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-200/50">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <textarea
                required
                rows="3"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like or dislike about this product? Share your honest experience..."
                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all resize-none placeholder:text-slate-400"
              ></textarea>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !comment.trim()}
                className="px-6 py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-3">
            <p className="text-xs font-semibold text-slate-600">
              Want to share your experience? Please login to write a review for this product.
            </p>
            <a
              href="/login"
              className="inline-block px-5 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Log In to Review
            </a>
          </div>
        )
      }
      <div className="space-y-4">
        {fetching ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" />
            <p className="text-xs font-semibold text-slate-400">Loading verified customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-12 text-center rounded-2xl border-2 border-dashed border-slate-200/80 p-8 space-y-3">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No reviews yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto font-medium">
              Be the first customer to review this product and help others make informed decisions.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reviews.map((rev) => (
              <div
                key={rev._id}
                className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 shadow-sm transition-all space-y-3 group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {rev.user?.name ? rev.user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-slate-900">{rev.user?.name || "Customer"}</p>
                        {rev.isVerifiedPurchase && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-extrabold px-2 py-0.5 rounded-full">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {new Date(rev.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${star <= rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-100"
                          }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed pl-1 sm:pl-12">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
