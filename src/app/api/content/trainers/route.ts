import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const admin = createAdminClient();
    const slug = req.nextUrl.searchParams.get("slug");

    const fallbackTrainers = [
      {
        id: "33333333-3333-3333-3333-333333333301",
        name: "Ananya Kulkarni",
        slug: "ananya-kulkarni",
        bio: "Senior Vinyasa and Functional Movement teacher with 10+ years exploring yogic anatomy and mindful transitions.",
        story: "Ananya discovered yoga during her corporate years in Pune, finding in it an anchor of presence and deep physiological healing. Certified in Mysore and Rishikesh, her classes blend biomechanical alignment with poetic meditative rhythm.",
        specialties: ["Vinyasa Flow", "Asana Alignment", "Mobility & Restorative"],
        instagram_handle: "@ananya.yoga.pune",
        display_order: 1,
        media_urls: ["https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=800&auto=format&fit=crop"],
        is_active: true
      },
      {
        id: "33333333-3333-3333-3333-333333333302",
        name: "Rohan Deshmukh",
        slug: "rohan-deshmukh",
        bio: "Ashtanga practitioner and breathwork guide dedicated to traditional Mysore discipline and stillness.",
        story: "Born and raised in Pune, Rohan apprenticed under renowned Ashtanga masters. He combines rigorous classical technique with compassionate presence, helping practitioners find steady breath within demanding asanas.",
        specialties: ["Ashtanga Vinyasa", "Pranayama", "Bandhas & Breath"],
        instagram_handle: "@rohan.ashtanga",
        display_order: 2,
        media_urls: ["https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=800&auto=format&fit=crop"],
        is_active: true
      },
      {
        id: "33333333-3333-3333-3333-333333333303",
        name: "Maya Shenoy",
        slug: "maya-shenoy",
        bio: "Sound alchemist and Yin Yoga practitioner weaving quartz singing bowls, gongs, and meditative stillness.",
        story: "Maya blends sound therapy and myofascial yin release, holding grounding spaces where the nervous system naturally recalibrates. Her sound baths in Koregaon Park are a sanctuary of profound peace.",
        specialties: ["Yin Yoga", "Sound Bath", "Nervous System Reset"],
        instagram_handle: "@maya.sounds",
        display_order: 3,
        media_urls: ["https://images.unsplash.com/photo-1545205597-3d9d02c29597?q=80&w=800&auto=format&fit=crop"],
        is_active: true
      }
    ];

    if (slug) {
      const { data: trainer, error } = await admin
        .from("trainers")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (error || !trainer) {
        const foundFallback = fallbackTrainers.find((t) => t.slug === slug);
        if (foundFallback) {
          return NextResponse.json({
            success: true,
            trainer: {
              ...foundFallback,
              upcomingSessions: [
                {
                  id: "sess-sample-1",
                  room: "Main Shala (Oak Room)",
                  start_time: new Date(Date.now() + 86400000).toISOString(),
                  end_time: new Date(Date.now() + 86400000 + 3600000).toISOString(),
                  capacity: 16,
                  class_types: {
                    name: foundFallback.specialties[0] || "Vinyasa Flow",
                    duration_minutes: 60,
                    color_hex: "#C86D51"
                  }
                },
                {
                  id: "sess-sample-2",
                  room: "Main Shala (Oak Room)",
                  start_time: new Date(Date.now() + 86400000 * 2).toISOString(),
                  end_time: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
                  capacity: 16,
                  class_types: {
                    name: foundFallback.specialties[1] || "Pranayama & Alignment",
                    duration_minutes: 60,
                    color_hex: "#657E6B"
                  }
                }
              ]
            }
          });
        }
        return NextResponse.json({ error: "Trainer not found" }, { status: 404 });
      }

      // Fetch upcoming sessions taught by this trainer
      const { data: upcomingSessions } = await admin
        .from("class_sessions")
        .select(`
          id,
          room,
          start_time,
          end_time,
          capacity,
          class_types (name, duration_minutes, color_hex)
        `)
        .eq("trainer_id", trainer.id)
        .gte("start_time", new Date().toISOString())
        .neq("status", "cancelled")
        .order("start_time", { ascending: true })
        .limit(6);

      return NextResponse.json({
        success: true,
        trainer: {
          ...trainer,
          upcomingSessions: upcomingSessions || [],
        },
      });
    }

    const { data: trainers, error } = await admin
      .from("trainers")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !trainers || trainers.length === 0) {
      return NextResponse.json({ success: true, trainers: fallbackTrainers });
    }

    return NextResponse.json({ success: true, trainers: trainers || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
