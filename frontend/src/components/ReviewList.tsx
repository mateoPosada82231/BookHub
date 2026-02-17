"use client";

import { Star, User } from "lucide-react";
import Image from "next/image";
import { Review } from "@/types";

interface ReviewListProps {
  reviews: Review[];
  loading?: boolean;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="review-star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          fill={star <= rating ? "#facc15" : "transparent"}
          stroke={star <= rating ? "#facc15" : "#525252"}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="review-card">
      <div className="review-card-header">
        <div className="review-author">
          <div className="review-avatar">
            {review.client_avatar_url ? (
              <Image
                src={review.client_avatar_url}
                alt={review.client_name}
                width={40}
                height={40}
                className="review-avatar-img"
                loading="lazy"
                style={{ objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="review-author-info">
            <span className="review-author-name">{review.client_name}</span>
            <span className="review-service">{review.service_name}</span>
          </div>
        </div>
        <div className="review-meta">
          <StarRating rating={review.rating} />
          <span className="review-date">{formatDate(review.created_at)}</span>
        </div>
      </div>
      {review.comment && (
        <p className="review-comment-text">{review.comment}</p>
      )}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="review-card review-skeleton">
      <div className="review-card-header">
        <div className="review-author">
          <div className="review-avatar skeleton-avatar"></div>
          <div className="review-author-info">
            <div className="skeleton-text skeleton-name"></div>
            <div className="skeleton-text skeleton-service"></div>
          </div>
        </div>
      </div>
      <div className="skeleton-text skeleton-comment"></div>
    </div>
  );
}

export function ReviewList({ reviews, loading }: ReviewListProps) {
  if (loading) {
    return (
      <div className="reviews-list">
        {[1, 2, 3].map((i) => (
          <ReviewSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="reviews-empty">
        <Star size={48} strokeWidth={1} />
        <h4>Aún no hay reseñas</h4>
        <p>Sé el primero en dejar una reseña después de tu cita</p>
      </div>
    );
  }

  return (
    <div className="reviews-list">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}

interface ReviewsSummaryProps {
  averageRating?: number;
  totalReviews: number;
}

export function ReviewsSummary({
  averageRating,
  totalReviews,
}: ReviewsSummaryProps) {
  return (
    <div className="reviews-summary">
      <div className="reviews-summary-rating">
        <Star size={32} fill="#facc15" stroke="#facc15" />
        <span className="reviews-avg">
          {averageRating ? averageRating.toFixed(1) : "—"}
        </span>
      </div>
      <div className="reviews-summary-info">
        <span className="reviews-count">
          {totalReviews} reseña{totalReviews !== 1 ? "s" : ""}
        </span>
        {totalReviews > 0 && (
          <div className="reviews-mini-stars">
            <StarRating rating={Math.round(averageRating || 0)} />
          </div>
        )}
      </div>
    </div>
  );
}
