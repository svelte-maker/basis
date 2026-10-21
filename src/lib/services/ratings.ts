import type { User } from "@prisma/client";
import { basisRating, gradeFor, isProvisional, type Grade } from "@/lib/rating/grades";

export type RatingView = { rating: number; grade: Grade; provisional: boolean; rd: number };

export function ratingOf(u: Pick<User, "glickoRating" | "glickoRd" | "practicePoints" | "ratedContests">): RatingView {
  const rating = basisRating(u.glickoRating, u.practicePoints);
  return { rating, grade: gradeFor(rating, u.ratedContests), provisional: u.ratedContests > 0 && isProvisional(u.glickoRd), rd: Math.round(u.glickoRd) };
}
