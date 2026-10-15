import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface FeedbackItem {
  id: string;
  user_name: string;
  user_email: string;
  target_type: "class_session" | "trainer" | "cafe_dish" | "studio_ambiance" | "general";
  target_title: string;
  rating: number; // 1 to 5
  sentiment: "positive" | "neutral" | "negative";
  tags: string[];
  comments: string;
  source: "app" | "web" | "qr_table";
  status: "pending" | "reviewed" | "resolved";
  created_at: string;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
}

let feedbackStore: FeedbackItem[] = [
  {
    id: "fb-001",
    user_name: "Pooja Hegde",
    user_email: "pooja.h@example.com",
    target_type: "class_session",
    target_title: "Yin Yoga & Sound Bath (Maya Shenoy)",
    rating: 5,
    sentiment: "positive",
    tags: ["Sound Healing", "Deep Relaxation", "Instructor Presence"],
    comments: "Maya's crystal bowl frequencies combined with the deep fascia stretches completely reset my nervous system after a chaotic week.",
    source: "app",
    status: "reviewed",
    created_at: "2026-10-14T19:30:00Z",
  },
  {
    id: "fb-002",
    user_name: "Aditya Roy",
    user_email: "aditya.r@example.com",
    target_type: "cafe_dish",
    target_title: "AM:PM Earth Bowl & Ceremonial Matcha",
    rating: 5,
    sentiment: "positive",
    tags: ["Flavor", "Fresh Produce", "Post-Practice Nutrition"],
    comments: "The turmeric tahini dressing on warm quinoa was phenomenal. Best healthy post-yoga brunch spot in Koregaon Park.",
    source: "qr_table",
    status: "reviewed",
    created_at: "2026-10-14T11:45:00Z",
  },
  {
    id: "fb-003",
    user_name: "Meera Sen",
    user_email: "meera.sen@example.com",
    target_type: "studio_ambiance",
    target_title: "Main Shala Temperature & Air Flow",
    rating: 2,
    sentiment: "negative",
    tags: ["Temperature", "Air Circulation"],
    comments: "The 7:00 AM Ashtanga class felt overly humid and stuffy toward the end of the standing series. Exhaust fans were off.",
    source: "app",
    status: "pending",
    created_at: "2026-10-13T08:15:00Z",
  },
  {
    id: "fb-004",
    user_name: "Karan Johar",
    user_email: "karan.j@example.com",
    target_type: "trainer",
    target_title: "Rohan Deshmukh (Ashtanga Mysore)",
    rating: 5,
    sentiment: "positive",
    tags: ["Adjustments", "Tradition", "Breathwork"],
    comments: "Rohan's hands-on adjustments in Marichyasana C were gentle, precise, and safe. High integrity teacher.",
    source: "web",
    status: "reviewed",
    created_at: "2026-10-12T10:00:00Z",
  },
  {
    id: "fb-005",
    user_name: "Tanvi Saxena",
    user_email: "tanvi.s@example.com",
    target_type: "general",
    target_title: "Waitlist Notification Speed",
    rating: 3,
    sentiment: "neutral",
    tags: ["Waitlist", "Booking Flow"],
    comments: "I was promoted from waitlist 30 minutes before class, but was already halfway across Pune. 2-hour cutoff would be better.",
    source: "app",
    status: "resolved",
    created_at: "2026-10-11T16:20:00Z",
    resolution_notes: "Adjusted member notification grace window in business settings and issued complimentary drop-in waiver.",
    resolved_by: "Vikram Nair (Operations Manager)",
    resolved_at: "2026-10-11T17:00:00Z",
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("target_type");
    const status = searchParams.get("status");
    const sentiment = searchParams.get("sentiment");

    let filtered = feedbackStore;
    if (targetType && targetType !== "all") {
      filtered = filtered.filter((f) => f.target_type === targetType);
    }
    if (status && status !== "all") {
      filtered = filtered.filter((f) => f.status === status);
    }
    if (sentiment && sentiment !== "all") {
      filtered = filtered.filter((f) => f.sentiment === sentiment);
    }

    const totalRatings = feedbackStore.reduce((acc, f) => acc + f.rating, 0);
    const avgRating = Number((totalRatings / feedbackStore.length).toFixed(2));
    const positiveCount = feedbackStore.filter((f) => f.rating >= 4).length;
    const csatPct = Number(((positiveCount / feedbackStore.length) * 100).toFixed(1));
    const pendingCount = feedbackStore.filter((f) => f.status === "pending").length;

    return NextResponse.json({
      success: true,
      feedback: filtered,
      metrics: {
        average_rating: avgRating,
        total_feedback_count: feedbackStore.length,
        csat_score_pct: csatPct,
        pending_review_count: pendingCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch customer feedback" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, resolution_notes, resolved_by } = body;

    const itemIndex = feedbackStore.findIndex((f) => f.id === id);
    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Feedback record not found" },
        { status: 404 }
      );
    }

    feedbackStore[itemIndex].status = status || "reviewed";
    if (resolution_notes) {
      feedbackStore[itemIndex].resolution_notes = resolution_notes;
      feedbackStore[itemIndex].resolved_by = resolved_by || "Admin Staff";
      feedbackStore[itemIndex].resolved_at = new Date().toISOString();
    }

    return NextResponse.json({
      success: true,
      feedback: feedbackStore[itemIndex],
      message: `Feedback status updated to '${status}'`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update feedback" },
      { status: 500 }
    );
  }
}
