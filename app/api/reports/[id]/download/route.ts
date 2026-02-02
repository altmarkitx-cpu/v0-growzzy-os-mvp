import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ComprehensiveReportBuilder } from "@/lib/comprehensive-report-builder";
import type { ReportMetrics } from "@/lib/report-metrics";
import type { AIReportInsights } from "@/lib/report-insights";
import type { ActionPlan } from "@/lib/report-action-plan";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch report
    const { data: report, error: fetchError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    console.log("[v0] Downloading report:", params.id);

    // Parse stored data
    const metrics = JSON.parse(report.metrics) as ReportMetrics;
    const insights = JSON.parse(report.insights) as AIReportInsights;
    const actionPlan = JSON.parse(report.recommendations) as ActionPlan;

    // Generate report ID from stored data or create new one
    const reportId = `RPT-${new Date(report.generated_at).getFullYear()}-${params.id.substring(0, 6).toUpperCase()}`;

    // Build PDF
    const pdfBuilder = new ComprehensiveReportBuilder(metrics, insights, actionPlan, reportId);
    const pdfDoc = pdfBuilder.build();
    const pdfBuffer = pdfBuilder.getBuffer();

    console.log("[v0] PDF generated for download");

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${report.title.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("[v0] Download error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to download report" },
      { status: 500 }
    );
  }
}
