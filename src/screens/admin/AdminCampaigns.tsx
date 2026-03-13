"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Upload, X } from "lucide-react";
import { toast } from "sonner";

const AdminCampaigns = () => {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", title_am: "", title_om: "", description: "", category: "general", goal_amount: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCampaigns(); }, []);

  const handleCreate = async () => {
    if (!form.title) {
      toast.error("Title is required");
      return;
    }
    
    setUploading(true);
    let imageUrl = null;
    
    try {
      // Upload image if provided
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const filePath = `campaigns/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("receipts")
          .upload(filePath, imageFile);
        
        if (uploadErr) {
          toast.error("Failed to upload image: " + uploadErr.message);
          setUploading(false);
          return;
        }
        
        const { data: urlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
      
      const { error } = await supabase.from("campaigns").insert({
        title: form.title,
        title_am: form.title_am || null,
        title_om: form.title_om || null,
        description: form.description || null,
        category: form.category,
        goal_amount: Number(form.goal_amount) || 0,
        image_url: imageUrl,
      });
      
      if (error) { toast.error(error.message); return; }
      toast.success("Campaign created");
      setShowForm(false);
      setForm({ title: "", title_am: "", title_om: "", description: "", category: "general", goal_amount: "" });
      setImageFile(null);
      setImagePreview(null);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (campaign: any) => {
    setEditingId(campaign.id);
    setForm({
      title: campaign.title || "",
      title_am: campaign.title_am || "",
      title_om: campaign.title_om || "",
      description: campaign.description || "",
      category: campaign.category || "general",
      goal_amount: String(campaign.goal_amount || ""),
    });
    setImagePreview(campaign.image_url || null);
    setShowForm(true);
  };

  const handleUpdate = async () => {
    if (!editingId || !form.title) {
      toast.error("Title is required");
      return;
    }
    
    setUploading(true);
    let imageUrl = imagePreview;
    
    try {
      // Upload new image if provided
      if (imageFile) {
        const ext = imageFile.name.split(".").pop();
        const filePath = `campaigns/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("receipts")
          .upload(filePath, imageFile);
        
        if (uploadErr) {
          toast.error("Failed to upload image: " + uploadErr.message);
          setUploading(false);
          return;
        }
        
        const { data: urlData } = supabase.storage
          .from("receipts")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }
      
      const { error } = await supabase.from("campaigns").update({
        title: form.title,
        title_am: form.title_am || null,
        title_om: form.title_om || null,
        description: form.description || null,
        category: form.category,
        goal_amount: Number(form.goal_amount) || 0,
        image_url: imageUrl,
      }).eq("id", editingId);
      
      if (error) { toast.error(error.message); return; }
      toast.success("Campaign updated");
      setShowForm(false);
      setEditingId(null);
      setForm({ title: "", title_am: "", title_om: "", description: "", category: "general", goal_amount: "" });
      setImageFile(null);
      setImagePreview(null);
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("campaigns").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Campaign status updated");
    fetchCampaigns();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Campaign deleted");
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
          <h3 className="font-heading font-semibold text-foreground">{editingId ? "Edit Campaign" : "Create Campaign"}</h3>
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
          
          {/* Image Upload */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Campaign Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("File must be under 5MB");
                    return;
                  }
                  setImageFile(file);
                  setImagePreview(URL.createObjectURL(file));
                }
              }}
            />
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-lg border border-border" />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-destructive text-destructive-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-lg p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/40 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Upload Campaign Image
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button onClick={editingId ? handleUpdate : handleCreate} disabled={uploading} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {uploading && <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />}
              {editingId ? "Update" : "Create"}
            </button>
            <button onClick={() => {
              setShowForm(false);
              setEditingId(null);
              setImageFile(null);
              setImagePreview(null);
            }} className="px-6 py-2.5 rounded-lg bg-secondary text-foreground text-sm">Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Title</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Category</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Goal</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Raised</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : campaigns.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No campaigns yet</td></tr>
            ) : (
              campaigns.map((c) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{c.title}</td>
                  <td className="px-6 py-4"><span className="text-xs px-2 py-1 rounded-full bg-primary/15 text-primary">{c.category}</span></td>
                  <td className="px-6 py-4 text-sm text-foreground">{Number(c.goal_amount).toLocaleString()} ETB</td>
                  <td className="px-6 py-4 text-sm text-primary font-medium">{Number(c.raised_amount).toLocaleString()} ETB</td>
                  <td className="px-6 py-4">
                    <select
                      value={c.status}
                      onChange={(e) => handleStatusChange(c.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded-full border border-border bg-secondary text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                      <option value="paused">Paused</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(c)} className="p-1.5 rounded hover:bg-primary/10 text-primary" title="Edit"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </div>
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

export default AdminCampaigns;

