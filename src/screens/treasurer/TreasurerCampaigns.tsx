"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TreasurerCampaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", title_am: "", title_om: "", description: "", category: "general", goal_amount: "" });

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    if (!form.title) { toast.error("Title is required"); return; }
    const { error } = await supabase.from("campaigns").insert({
      title: form.title,
      title_am: form.title_am || null,
      title_om: form.title_om || null,
      description: form.description || null,
      category: form.category,
      goal_amount: Number(form.goal_amount) || 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Campaign created");
    setShowForm(false);
    setForm({ title: "", title_am: "", title_om: "", description: "", category: "general", goal_amount: "" });
    fetchCampaigns();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Campaign Management</h1>
          <p className="text-sm text-muted-foreground">{campaigns.length} campaigns</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium gold-glow">
          <Plus className="w-4 h-4" /> New Campaign
        </button>
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">Create Campaign</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title (English)" className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground" />
            <input value={form.title_am} onChange={(e) => setForm({ ...form, title_am: e.target.value })} placeholder="áˆ­á‹•áˆµ (áŠ áˆ›áˆ­áŠ›)" className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground" />
            <input value={form.title_om} onChange={(e) => setForm({ ...form, title_om: e.target.value })} placeholder="Mata Duree (Oromiffa)" className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground" />
            <input value={form.goal_amount} onChange={(e) => setForm({ ...form, goal_amount: e.target.value })} placeholder="Goal Amount (ETB)" type="number" className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="general">General</option>
              <option value="education">Education</option>
              <option value="health">Health</option>
              <option value="building">Building</option>
            </select>
          </div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground" />
          <div className="flex gap-3">
            <button onClick={handleCreate} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Create</button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-lg bg-secondary text-foreground text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Title</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Category</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Goal</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Raised</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">No campaigns yet</td></tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{c.title}</td>
                  <td className="px-6 py-4"><span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary">{c.category}</span></td>
                  <td className="px-6 py-4 text-sm text-foreground">{Number(c.goal_amount).toLocaleString()} ETB</td>
                  <td className="px-6 py-4 text-sm text-primary font-medium">{Number(c.raised_amount).toLocaleString()} ETB</td>
                  <td className="px-6 py-4"><span className={`text-xs px-2 py-1 rounded-full ${c.status === "active" ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"}`}>{c.status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TreasurerCampaigns;

