"use client";

import { Building, Globe, Users, Church } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const AdminChurch = () => {
  const [loading, setLoading] = useState(false);
  const [churchInfo, setChurchInfo] = useState({
    name: "Ethiopian Orthodox Tewahedo Church",
    name_am: "ኢትዮጵያ ኦርቶዶክስ ቴዋሕድ ቤተክርስትያን",
    address: "Addis Ababa, Ethiopia",
    phone: "+251 911 123 456",
  });

  useEffect(() => {
    // Load saved church info from a settings table or use defaults
    // For now, we'll use local storage or create a settings table
    const saved = localStorage.getItem("church_settings");
    if (saved) {
      try {
        setChurchInfo(JSON.parse(saved));
      } catch (e) {
        // Use defaults
      }
    }
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save to localStorage for now (can be migrated to a settings table later)
      localStorage.setItem("church_settings", JSON.stringify(churchInfo));
      toast.success("Church information saved successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save church information");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Church Management</h1>
        <p className="text-sm text-muted-foreground">Manage church information and settings</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/15"><Church className="w-5 h-5 text-primary" /></div>
            <h3 className="font-heading font-semibold text-foreground">Church Info</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Church Name</label>
              <input 
                value={churchInfo.name}
                onChange={(e) => setChurchInfo({ ...churchInfo, name: e.target.value })}
                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">የቤተክርስትያን ስም (አማርኛ)</label>
              <input 
                value={churchInfo.name_am}
                onChange={(e) => setChurchInfo({ ...churchInfo, name_am: e.target.value })}
                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Address</label>
              <input 
                value={churchInfo.address}
                onChange={(e) => setChurchInfo({ ...churchInfo, address: e.target.value })}
                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" 
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Phone</label>
              <input 
                value={churchInfo.phone}
                onChange={(e) => setChurchInfo({ ...churchInfo, phone: e.target.value })}
                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-sm text-foreground" 
              />
            </div>
            <button 
              onClick={handleSave}
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium gold-glow disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/15"><Users className="w-5 h-5 text-primary" /></div>
              <h3 className="font-heading font-semibold text-foreground">Leadership</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div>
                  <p className="text-sm font-medium text-foreground">Head Priest</p>
                  <p className="text-xs text-muted-foreground">Abune Mathias</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/50">
                <div>
                  <p className="text-sm font-medium text-foreground">Church Administrator</p>
                  <p className="text-xs text-muted-foreground">Ato Kebede Tessema</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">Treasurer</p>
                  <p className="text-xs text-muted-foreground">Ato Dawit Haile</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/15"><Globe className="w-5 h-5 text-primary" /></div>
              <h3 className="font-heading font-semibold text-foreground">Service Times</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Sunday Service</span><span className="text-foreground">6:00 AM - 10:00 AM</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Wednesday Prayer</span><span className="text-foreground">5:00 PM - 7:00 PM</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Saturday Kidase</span><span className="text-foreground">6:00 AM - 9:00 AM</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminChurch;

