"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type RoleEntry = { id: string; user_id: string; role: string; profile?: { full_name: string; email: string | null } };

const AdminRoles = () => {
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState<"admin" | "treasurer" | "member">("member");

  const fetchRoles = async () => {
    setLoading(true);
    const { data } = await supabase.from("user_roles").select("*, profiles:user_id(full_name, email)");
    setRoles((data || []).map((r: any) => ({ ...r, profile: r.profiles })));
    setLoading(false);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name, email");
    setProfiles(data || []);
  };

  useEffect(() => { fetchRoles(); fetchProfiles(); }, []);

  const handleAssign = async () => {
    if (!selectedUser) return;
    const { error } = await supabase.from("user_roles").insert({ user_id: selectedUser, role: selectedRole });
    if (error) { toast.error(error.message); return; }
    toast.success("Role assigned");
    fetchRoles();
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Role removed");
    fetchRoles();
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Role Management</h1>
        <p className="text-sm text-muted-foreground">Assign admin and treasurer roles to members</p>
      </div>

      {/* Assign Role */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-heading font-semibold text-foreground mb-4">Assign Role</h3>
        <div className="flex flex-wrap gap-3">
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground">
            <option value="">Select member...</option>
            {profiles.map((p) => (
              <option key={p.user_id} value={p.user_id}>{p.full_name || p.email || p.user_id}</option>
            ))}
          </select>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value as any)} className="px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground">
            <option value="admin">Admin</option>
            <option value="treasurer">Treasurer</option>
            <option value="member">Member</option>
          </select>
          <button onClick={handleAssign} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            <Plus className="w-4 h-4" /> Assign
          </button>
        </div>
      </div>

      {/* Roles Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Member</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Email</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Role</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : roles.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No roles assigned</td></tr>
            ) : (
              roles.map((r) => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{r.profile?.full_name || "Unknown"}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{r.profile?.email || "â€”"}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      r.role === "admin" ? "bg-accent/15 text-accent" :
                      r.role === "treasurer" ? "bg-primary/15 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      <Shield className="w-3 h-3 inline mr-1" />{r.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleRemove(r.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
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

export default AdminRoles;

