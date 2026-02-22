import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../../../convex/_generated/api";
import { generatePDFBuffer } from "../../../../../../../lib/export/generatePDF";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const analysis = await fetchQuery(api.analyses.getAnalysis, { id: id as any });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    if (analysis.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (analysis.status !== "complete" || !analysis.profile) {
      return NextResponse.json({ error: "Analysis not complete" }, { status: 400 });
    }

    const user = await fetchQuery(api.users.getUser, { clerkId: userId });

    if (!user || user.plan === "free") {
      return NextResponse.json(
        { error: "PDF export requires Creator or Team plan" },
        { status: 403 }
      );
    }

    const pdfBuffer = await generatePDFBuffer(analysis.profile as any);

    const slug = analysis.sourceValue.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="designprofiler-${slug}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF Export error:", error);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
