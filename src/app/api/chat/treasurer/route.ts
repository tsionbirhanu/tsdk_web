import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const TREASURER_SYSTEM_PROMPT_BASE = `You are the TSEDK financial assistant for the church treasurer. 
You have access to the church's full financial summary data (provided below). 
You may answer questions about: donation totals, campaign progress, Aserat overdue lists, Gbir compliance, Selet due dates, and member payment summaries. 
You may NOT modify any data. You may NOT generate social media captions. 
If asked to do something outside financial reporting, respond: 'That is outside my scope as the treasurer assistant.' 

You must respond in the same language the user writes in. Supported languages: Amharic (Ge'ez script), Afan Oromo (Latin script), English. Never mix languages. If the language is unclear, default to English. Format financial data clearly with numbers. Keep responses factual.`;

async function getTreasurerDataContext(supabase: any) {
  try {
    // Total donations per campaign
    const { data: campaigns } = await supabase
      .from("campaigns")
      .select("id, title, goal_amount, raised_amount, status");
    
    // Get donations per campaign
    const campaignDonations: Record<string, any> = {};
    if (campaigns) {
      for (const campaign of campaigns) {
        const { data: donations } = await supabase
          .from("donations")
          .select("amount, status")
          .eq("campaign_id", campaign.id)
          .eq("status", "verified");
        
        const total = donations?.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0) || 0;
        campaignDonations[campaign.id] = {
          campaign: campaign.title,
          totalDonations: total,
          count: donations?.length || 0,
        };
      }
    }

    // AseratBekurat: count of paid vs overdue per month
    const { data: allAserat } = await supabase
      .from("donations")
      .select("id, user_id, amount, status, created_at")
      .eq("type", "aserat");
    
    const aseratByMonth: Record<string, { paid: number; overdue: number }> = {};
    const currentDate = new Date();
    
    if (allAserat) {
      allAserat.forEach((record: any) => {
        const monthKey = new Date(record.created_at).toISOString().slice(0, 7); // YYYY-MM
        if (!aseratByMonth[monthKey]) {
          aseratByMonth[monthKey] = { paid: 0, overdue: 0 };
        }
        if (record.status === "verified") {
          aseratByMonth[monthKey].paid++;
        } else {
          const recordDate = new Date(record.created_at);
          const monthsDiff = (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
          if (monthsDiff > 1) {
            aseratByMonth[monthKey].overdue++;
          }
        }
      });
    }

    // Gbir: compliance count per year
    const { data: allGbir } = await supabase
      .from("donations")
      .select("id, user_id, status, created_at")
      .eq("type", "gbir");
    
    const gbirByYear: Record<string, { total: number; compliant: number }> = {};
    if (allGbir) {
      allGbir.forEach((record: any) => {
        const year = new Date(record.created_at).getFullYear().toString();
        if (!gbirByYear[year]) {
          gbirByYear[year] = { total: 0, compliant: 0 };
        }
        gbirByYear[year].total++;
        if (record.status === "verified") {
          gbirByYear[year].compliant++;
        }
      });
    }

    // Selet: upcoming due dates across all members
    const { data: allSelets } = await supabase
      .from("selets")
      .select("id, user_id, title, total_amount, paid_amount, status, created_at");
    
    const { data: userDeadlines } = await supabase
      .from("user_deadlines")
      .select("user_id, type, due_date")
      .eq("type", "selet")
      .gte("due_date", new Date().toISOString())
      .order("due_date", { ascending: true })
      .limit(20);

    // Members with overdue payments (name + amount only)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, full_name");
    
    const overdueMembers: Array<{ name: string; amount: number; type: string }> = [];
    
    // Check overdue Aserat
    if (allAserat && profiles) {
      const overdueAserat = allAserat.filter((r: any) => {
        if (r.status === "verified") return false;
        const recordDate = new Date(r.created_at);
        const monthsDiff = (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        return monthsDiff > 1;
      });
      
      overdueAserat.forEach((record: any) => {
        const profile = profiles.find((p: any) => p.user_id === record.user_id);
        if (profile) {
          overdueMembers.push({
            name: profile.full_name || "Unknown",
            amount: parseFloat(record.amount || 0),
            type: "Aserat",
          });
        }
      });
    }

    return {
      campaigns: campaigns || [],
      campaignDonations,
      aseratByMonth,
      gbirByYear,
      selets: allSelets || [],
      upcomingSeletDueDates: userDeadlines || [],
      overdueMembers: overdueMembers.slice(0, 50), // Limit to 50
    };
  } catch (error) {
    console.error("Error fetching treasurer data:", error);
    return {
      campaigns: [],
      campaignDonations: {},
      aseratByMonth: {},
      gbirByYear: {},
      selets: [],
      upcomingSeletDueDates: [],
      overdueMembers: [],
    };
  }
}

async function getUserRole(
  supabase: any,
  userId: string,
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    return data?.role || null;
  } catch (error) {
    console.error("Error fetching user role:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { message, sessionId: currentSessionId } = await req.json();
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = await getUserRole(supabase, user.id);
    if (userRole !== "treasurer") {
      return NextResponse.json(
        { error: "Only treasurers can access this endpoint" },
        { status: 403 },
      );
    }

    const sessionId = currentSessionId || crypto.randomUUID();
    const treasurerDataContext = await getTreasurerDataContext(supabase);
    const systemPromptWithData = `${TREASURER_SYSTEM_PROMPT_BASE}\n\nFinancial Data:\n${JSON.stringify(
      treasurerDataContext,
      null,
      2,
    )}`;

    // Fetch conversation history for this session (only treasurer's own sessions)
    const { data: history } = await supabase
      .from("chat_history")
      .select("role, content")
      .eq("user_id", user.id)
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const conversationHistory = (history || []).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));
    conversationHistory.push({ role: "user", content: message });

    const contents = conversationHistory.map((msg) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }],
    }));

    const geminiKey = process.env.GEMINI_API_KEY || process.env.Gemini_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "AI service not configured" },
        { status: 500 },
      );
    }

    const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPromptWithData }],
          },
          contents,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      return NextResponse.json(
        { error: "Failed to get response from AI" },
        { status: 500 },
      );
    }

    const data = await response.json();
    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content ||
      !data.candidates[0].content.parts ||
      !data.candidates[0].content.parts[0] ||
      !data.candidates[0].content.parts[0].text
    ) {
      console.error("Unexpected API response format:", data);
      return NextResponse.json(
        { error: "Invalid response format from AI" },
        { status: 500 },
      );
    }
    const reply = data.candidates[0].content.parts[0].text;

    // Generate session title from first message
    const sessionTitle =
      conversationHistory.length === 1 ? message.substring(0, 40) : undefined;

    // Save to chat history
    await supabase.from("chat_history").insert([
      {
        user_id: user.id,
        session_id: sessionId,
        role: "user",
        content: message,
        session_title: sessionTitle,
      },
      {
        user_id: user.id,
        session_id: sessionId,
        role: "assistant",
        content: reply,
      },
    ]);

    return NextResponse.json({ reply, sessionId });
  } catch (error) {
    console.error("Error in POST /api/chat/treasurer:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 },
    );
  }
}
