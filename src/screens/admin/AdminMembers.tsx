"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, UserPlus, MoreHorizontal, Shield, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  member_since: number | null;
  created_at: string;
};

const AdminMembers = () => {
  const [members, setMembers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", email: "", member_since: "" });

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (data) setMembers(data);
    if (error) toast.error(error.message);
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, []);

  const filtered = members.filter(
    (m) =>
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (m.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (member: Profile) => {
    setEditingId(member.id);
    setEditForm({
      full_name: member.full_name || "",
      phone: member.phone || "",
      email: member.email || "",
      member_since: String(member.member_since || ""),
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    const { error } = await supabase.from("profiles").update({
      full_name: editForm.full_name,
      phone: editForm.phone || null,
      email: editForm.email || null,
      member_since: editForm.member_since ? Number(editForm.member_since) : null,
    }).eq("id", editingId);
    if (error) { toast.error(error.message); return; }
    toast.success("Member updated");
    setEditingId(null);
    fetchMembers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this member? This will also delete their user account.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Member deleted");
    fetchMembers();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{members.length} total members</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Name</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Email</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Phone</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Since</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Joined</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No members found</td></tr>
            ) : (
              filtered.map((m) => (
                <tr key={m.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4">
                    {editingId === m.id ? (
                      <input
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        className="px-2 py-1 rounded bg-secondary border border-border text-sm text-foreground w-32"
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-semibold text-primary">{m.full_name.slice(0, 2).toUpperCase() || "?"}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{m.full_name || "Unnamed"}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {editingId === m.id ? (
                      <input
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="px-2 py-1 rounded bg-secondary border border-border text-sm text-foreground w-40"
                      />
                    ) : (
                      m.email || "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {editingId === m.id ? (
                      <input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="px-2 py-1 rounded bg-secondary border border-border text-sm text-foreground w-32"
                      />
                    ) : (
                      m.phone || "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {editingId === m.id ? (
                      <input
                        type="number"
                        value={editForm.member_since}
                        onChange={(e) => setEditForm({ ...editForm, member_since: e.target.value })}
                        className="px-2 py-1 rounded bg-secondary border border-border text-sm text-foreground w-24"
                      />
                    ) : (
                      m.member_since || "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    {editingId === m.id ? (
                      <div className="flex gap-2">
                        <button onClick={handleSave} className="text-xs text-primary hover:underline">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground hover:underline">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(m)} className="p-1.5 rounded hover:bg-primary/10 text-primary" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(m.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminMembers;

