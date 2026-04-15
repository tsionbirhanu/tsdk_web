"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole =
  | "admin"
  | "system_admin"
  | "teklay_bete_khnet"
  | "hagere_sebket"
  | "church_admin"
  | "treasurer"
  | "member";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  approval_status: "pending" | "approved" | "rejected";
  church_id?: string;
  approver_id?: string;
  rejection_reason?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  profile: UserProfile | null;
  approval_status: "pending" | "approved" | "rejected" | null;
  isApproved: boolean;
  hasRole: (role: AppRole) => boolean;
  isChurchAdmin: boolean;
  churchId: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  roles: [],
  profile: null,
  approval_status: null,
  isApproved: false,
  hasRole: () => false,
  isChurchAdmin: false,
  churchId: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        console.log("Profile fetched:", data);
        setProfile(data);
        // Set roles from profile.role
        if (data.role) {
          console.log("Setting role:", data.role);
          setRoles([data.role as AppRole]);
        }
      }
    } catch (err) {
      console.error("Exception fetching profile:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setRoles([]);
        setProfile(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setRoles([]);
        setProfile(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const hasRole = (role: AppRole) => {
    if (role === "member") return !!user;
    // Check against both roles array and profile role
    return roles.includes(role) || profile?.role === role;
  };

  const isChurchAdmin = roles.includes("church_admin");
  const churchId = profile?.church_id || null;
  const approval_status = profile?.approval_status || null;
  const isApproved = approval_status === "approved";

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        profile,
        approval_status,
        isApproved,
        hasRole,
        isChurchAdmin,
        churchId,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
