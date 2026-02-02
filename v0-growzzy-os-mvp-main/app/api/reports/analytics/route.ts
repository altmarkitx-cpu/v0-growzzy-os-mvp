import { NextRequest, NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { createClient } from '@supabase/supabase-js';

// Prevent prerendering at build time
export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Check session from cookie
    const sessionCookie = req.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let user;
    try {
      user = JSON.parse(sessionCookie.value);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { dateFrom, dateTo } = await req.json();

    // Mock campaign data
    const campaigns = [
      {
        id: '1',
        name: 'Meta Campaign 1',
        platform: 'meta',
        impressions: 15000,
        clicks: 450,
        spend: 1200,
        revenue: 3600,
      },
      {
        id: '2',
        name: 'Google Campaign 1',
        platform: 'google',
        impressions: 20000,
        clicks: 600,
        spend: 1800,
        revenue: 5400,
      },
    ];

    // Calculate metrics
    const totalUsers = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const newUsers = Math.floor(totalUsers * 0.89);
    const totalSessions = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalPageviews = totalSessions * 3.89;
    const avgSessionDuration = '00:03:56';
    const pagesPerSession = 3.89;

    // Calculate YoY
    const previousCampaigns = campaigns.map(c => ({
      ...c,
      impressions: Math.floor(c.impressions * 0.85),
      clicks: Math.floor(c.clicks * 0.85),
    }));

    const prevUsers = previousCampaigns.reduce((sum, c) => sum + c.impressions, 0);
    const userGrowth = prevUsers > 0 ? (((totalUsers - prevUsers) / prevUsers) * 100).toFixed(1) : '0.0';

    // Traffic sources
    const trafficSources = [
      { source: 'Direct', sessions: totalSessions * 0.35, newSessionsPercent: 23, bounceRate: 45 },
      { source: 'Organic Search', sessions: totalSessions * 0.40, newSessionsPercent: 89, bounceRate: 32 },
      { source: 'Social Media', sessions: totalSessions * 0.15, newSessionsPercent: 56, bounceRate: 52 },
      { source: 'Referral', sessions: totalSessions * 0.10, newSessionsPercent: 41, bounceRate: 38 },
    ];

    // Age & Gender
    const ageGenderData = {
      '18-24': { male: 15, female: 12 },
      '25-34': { male: 28, female: 25 },
      '35-44': { male: 22, female: 20 },
      '45-54': { male: 18, female: 16 },
      '55-64': { male: 12, female: 14 },
      '65+': { male: 5, female: 8 },
    };

    // Generate PDF
    const pdf = new jsPDF('l', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Background
    pdf.setFillColor(245, 245, 230);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Header
    pdf.setFillColor(255, 255, 255);
    pdf.rect(10, 10, pageWidth - 20, 15, 'F');

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 102, 204);
    pdf.text('Website Analytics Report - KPI Dashboard', 15, 20);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text('Analytics data with traffic sources, demographics, and performance metrics', 15, 25);

    // KPI Cards
    const kpis = [
      { label: 'Users', value: totalUsers.toLocaleString(), change: `${userGrowth}%` },
      { label: 'New Users', value: newUsers.toLocaleString(), change: '12.5%' },
      { label: 'Sessions', value: totalSessions.toLocaleString(), change: '8.2%' },
      { label: 'Session Duration', value: avgSessionDuration, change: '9.9%' },
      { label: 'Pages/Session', value: pagesPerSession.toFixed(2), change: '3.1%' },
      { label: 'Pageviews', value: Math.floor(totalPageviews).toLocaleString(), change: '5.4%' },
    ];

    let xPos = 15;
    kpis.forEach((kpi) => {
      pdf.setFillColor(255, 255, 255);
      pdf.rect(xPos, 30, 43, 20, 'F');
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      pdf.rect(xPos, 30, 43, 20);

      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(kpi.label, xPos + 2, 35);

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text(kpi.value, xPos + 2, 42);

      pdf.setFontSize(8);
      pdf.setTextColor(0, 150, 0);
      pdf.text(`▲ ${kpi.change}`, xPos + 2, 48);

      xPos += 45;
    });

    // Charts placeholder
    pdf.setFillColor(255, 255, 255);
    pdf.rect(15, 55, 125, 70, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(15, 55, 125, 70);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Sessions & Pageviews', 20, 62);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('[Chart visualization would render here with jsPDF-AutoTable]', 20, 75);

    // Traffic table
    pdf.setFillColor(255, 255, 255);
    pdf.rect(15, 130, 130, 60, 'F');
    pdf.setDrawColor(200, 200, 200);
    pdf.rect(15, 130, 130, 60);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text('Traffic Sources', 20, 137);

    pdf.autoTable({
      startY: 142,
      head: [['Source', 'Sessions', '% New', 'Bounce Rate']],
      body: trafficSources.map((row) => [
        row.source,
        Math.floor(row.sessions).toLocaleString(),
        `${row.newSessionsPercent}%`,
        `${row.bounceRate}%`,
      ]),
      theme: 'plain',
      styles: { fontSize: 7 },
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
      margin: { left: 20 },
      tableWidth: 115,
    });

    // Footer
    pdf.setFontSize(7);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Report generated: ' + new Date().toLocaleDateString(), 15, pageHeight - 10);

    // Generate PDF output
    const pdfBase64 = pdf.output('datauristring');
    const fileName = `analytics-report-${Date.now()}.pdf`;

    // Save to Supabase (optional)
    try {
      await supabase.from('reports').insert({
        user_id: user.id,
        title: `Analytics Report ${new Date().toLocaleDateString()}`,
        type: 'analytics',
        date_from: new Date(dateFrom).toISOString(),
        date_to: new Date(dateTo).toISOString(),
        data: {
          kpis,
          trafficSources,
          ageGender: ageGenderData,
        },
        file_name: fileName,
      });
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      // Continue anyway - return PDF
    }

    return NextResponse.json({
      success: true,
      pdfBase64,
      fileName,
    });
  } catch (error: any) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
