"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, CalendarDays, Edit } from "lucide-react";
import { toast } from "sonner";

const AdminEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", title_am: "", description: "", event_date: "", event_type: "service" });

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("church_events").select("*").order("event_date", { ascending: false });
    setEvents(data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleEdit = (event: any) => {
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      title_am: event.title_am || "",
      description: event.description || "",
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : "",
      event_type: event.event_type || "service",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    
    if (editingId) {
      const { error } = await supabase.from("church_events").update({
        title: form.title,
        title_am: form.title_am || null,
        description: form.description || null,
        event_date: form.event_date || null,
        event_type: form.event_type,
      }).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success("Event updated");
    } else {
      const { error } = await supabase.from("church_events").insert({
        title: form.title,
        title_am: form.title_am || null,
        description: form.description || null,
        event_date: form.event_date || null,
        event_type: form.event_type,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("Event created");
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", title_am: "", description: "", event_date: "", event_type: "service" });
    fetch();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const { error } = await supabase.from("church_events").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Event deleted");
    fetch();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Church Events</h1>
          <p className="text-sm text-muted-foreground">Manage services, holidays, and events</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium gold-glow">
          <Plus className="w-4 h-4" /> New Event
        </button>
      </div>

      {showForm && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-semibold text-foreground">{editingId ? "Edit Event" : "Create Event"}</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Event Title" className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground" />
            <input value={form.title_am} onChange={(e) => setForm({ ...form, title_am: e.target.value })} placeholder="á‹¨á‹áŒáŒ…á‰µ áˆ­á‹•áˆµ (áŠ áˆ›áˆ­áŠ›)" className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground" />
            <input type="datetime-local" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" />
            <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground">
              <option value="service">Service</option>
              <option value="holiday">Holiday</option>
              <option value="meeting">Meeting</option>
              <option value="festival">Festival</option>
            </select>
          </div>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={2} className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground" />
          <div className="flex gap-3">
            <button onClick={handleSave} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">{editingId ? "Update" : "Create"}</button>
            <button onClick={() => {
              setShowForm(false);
              setEditingId(null);
            }} className="px-6 py-2.5 rounded-lg bg-secondary text-foreground text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <p className="text-muted-foreground col-span-full text-center py-8">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-muted-foreground col-span-full text-center py-8">No events</p>
        ) : (
          events.map((e) => (
            <div key={e.id} className="glass-card rounded-xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary">{e.event_type}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(e)} className="p-1 rounded hover:bg-primary/10 text-primary" title="Edit"><Edit className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(e.id)} className="p-1 rounded hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              <h3 className="font-heading font-semibold text-foreground">{e.title}</h3>
              {e.title_am && <p className="text-sm text-muted-foreground font-ethiopic">{e.title_am}</p>}
              {e.event_date && <p className="text-xs text-muted-foreground">{new Date(e.event_date).toLocaleString()}</p>}
              {e.description && <p className="text-xs text-muted-foreground">{e.description}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminEvents;

