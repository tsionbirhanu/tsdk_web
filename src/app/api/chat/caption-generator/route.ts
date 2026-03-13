import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { campaignName, tone, platform } = await request.json();

    // In a real app, you would call your AI service here
    const captions = [
      `🚀 Exciting news about ${campaignName}! Our ${platform} campaign is here to make a difference. Stay tuned for updates and inspiring stories. #${campaignName.replace(/\s+/g, "")} #CampaignLaunch`,
      `✨ Join us in supporting ${campaignName}! We're sharing impactful moments and stories through our ${platform} platform. Every action counts. #Support${campaignName.replace(/\s+/g, "")} #MakeADifference`,
      `🌟 Discover the heart of ${campaignName} on ${platform}. We're building awareness and creating meaningful change together. #${campaignName.replace(/\s+/g, "")} #CommunityImpact`,
    ];

    return NextResponse.json({ captions });
  } catch (error) {
    console.error("Caption generator API error:", error);
    return NextResponse.json(
      { error: "Failed to generate captions" },
      { status: 500 },
    );
  }
}
