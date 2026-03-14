"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";

import AppHeader from "@/components/AppHeader";
import { useI18n, Language } from "@/lib/i18n";
import { User, Globe, Shield, LogOut, Loader2, Upload, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { toast } from "sonner";

import crossIcon from "@/assets/cross-icon.jpg";

const ProfilePage = () => {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editName, setEditName] = useState(false);
  const [editPhone, setEditPhone] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [phoneVal, setPhoneVal] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const updateProfile = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase.from("profiles").update(updates).eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(lang === "am" ? "á‰°á‰€á‹­áˆ¯áˆ!" : "Updated!");
      setEditName(false); setEditPhone(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const langOptions: { value: Language; label: string }[] = [
    { value: "en", label: "English" },
    { value: "am", label: "áŠ áˆ›áˆ­áŠ› (Amharic)" },
    { value: "om", label: "Afaan Oromoo" },
  ];

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `avatars/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("receipts")
        .upload(filePath, file);
      
      if (uploadErr) throw uploadErr;
      
      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(filePath);
      
      const { error } = await supabase.from("profiles").update({
        avatar_url: urlData.publicUrl,
      }).eq("user_id", user.id);
      
      if (error) throw error;
      toast.success("Avatar updated!");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/auth");
  };

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "?";

  return (
    <div>
      {/* <AppHeader title={t("profile.title")} /> */}
      <div className="px-4 py-4 space-y-5 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-primary/40">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" />
              ) : (
                <>
                  <Image src={crossIcon} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <span className="text-lg font-heading font-bold text-primary">{initials}</span>
                  </div>
                </>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
            />
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-primary text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
              title="Upload avatar"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
            </button>
          </div>
          <div>
            <h2 className="text-lg font-heading font-bold text-foreground">{profile?.full_name || "Member"}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        {/* Language */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-heading font-semibold text-foreground">{t("profile.language")}</h3>
          </div>
          <div className="space-y-2">
            {langOptions.map((opt) => (
              <button key={opt.value} onClick={() => setLang(opt.value)}
                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                  lang === opt.value ? "bg-primary text-primary-foreground border-primary gold-glow" : "bg-secondary text-foreground border-border hover:border-primary/30"
                }`}>{opt.label}</button>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <div className="glass-card rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-heading font-semibold text-foreground">{t("profile.personalInfo")}</h3>
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-muted-foreground">Name</span>
              {editName ? (
                <div className="flex items-center gap-2">
                  <input value={nameVal} onChange={(e) => setNameVal(e.target.value)}
                    className="px-2 py-1 rounded bg-secondary border border-border text-sm text-foreground w-40" />
                  <button onClick={() => updateProfile.mutate({ full_name: nameVal })}
                    className="text-xs text-primary font-medium">{t("common.save")}</button>
                </div>
              ) : (
                <button onClick={() => { setEditName(true); setNameVal(profile?.full_name || ""); }}
                  className="text-sm font-medium text-foreground hover:text-primary">{profile?.full_name || "Set name"}</button>
              )}
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-muted-foreground">Phone</span>
              {editPhone ? (
                <div className="flex items-center gap-2">
                  <input value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)}
                    className="px-2 py-1 rounded bg-secondary border border-border text-sm text-foreground w-40" />
                  <button onClick={() => updateProfile.mutate({ phone: phoneVal })}
                    className="text-xs text-primary font-medium">{t("common.save")}</button>
                </div>
              ) : (
                <button onClick={() => { setEditPhone(true); setPhoneVal(profile?.phone || ""); }}
                  className="text-sm font-medium text-foreground hover:text-primary">{profile?.phone || "Set phone"}</button>
              )}
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium text-foreground">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-sm text-muted-foreground">Member Since</span>
              <span className="text-sm font-medium text-foreground">{profile?.member_since || "â€”"}</span>
            </div>
          </div>
        </div>

        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/15 border border-accent/30 text-accent text-sm font-medium">
          <LogOut className="w-4 h-4" /> {lang === "am" ? "á‹áŒ£" : "Log Out"}
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;







