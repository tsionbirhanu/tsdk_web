"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
  const { data: availableCampaignsCount = 0 } = useQuery({
    queryKey: ["available-campaigns-count"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("goal_amount, raised_amount, status");

      if (error) throw error;

      const available = (data || []).filter((campaign) => {
        const goal = Number(campaign.goal_amount || 0);
        const raised = Number(campaign.raised_amount || 0);
        const status = (campaign.status || "").toLowerCase();

        if (status === "paused") return false;
        if (goal > 0 && raised >= goal) return false;
        return true;
      });

      return available.length;
    },
  });

  const campaignBadge = availableCampaignsCount > 0 ? `${availableCampaignsCount}+` : "0";

  return (
    <main className="relative flex min-h-screen items-center justify-between w-full px-12 pt-24 gap-16">
      {/* Left Content (logo + flexible text) */}
      <div className="flex items-start gap-6 flex-1">
        {/* Logo Circle */}
        <div
          className="relative w-36 h-36 rounded-full overflow-hidden 
                          border-[1px] border-[#8b5829]/30 bg-[#6d4620] p-4 
                          flex-shrink-0 mt-2">
          <Image
            src="/assets/logo.png"
            alt="TSEDQ Logo"
            fill
            className="object-contain rounded-full"
            priority
          />
        </div>

        {/* Text */}
        <div className="flex-1 ml-12 md:ml-20 lg:ml-32">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-['Jomolhari'] text-6xl lg:text-7xl font-bold tracking-wide leading-tight">
            WELCOME TO TSEDQ
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-5 text-xl lg:text-2xl font-semibold leading-relaxed max-w-2xl">
            Empowering Orthodox Communities <br />
            Through Digitalized Faith Giving and Finance
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-6 text-base lg:text-lg text-[#4b2e18] leading-relaxed max-w-2xl">
            TSEDQ is a FaithTech platform that unifies donations, tithing, and
            community contributions using smart automation, blockchain
            transparency, and secure digital payments.
          </motion.p>

          {/* Primary hero actions */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-8 flex flex-col sm:flex-row gap-4">
            <motion.div
              animate={{ scale: [1, 1.04, 1], y: [0, -2, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              className="relative inline-block group">
              <span className="pointer-events-none absolute -inset-1 rounded-full border border-[#8b5829]/45 animate-ping" />
              <span className="pointer-events-none absolute -inset-1 rounded-full border border-[#8b5829]/35" />

              <Link href="/donate" className="relative block">
                <Button className="bg-[#8b5829] hover:bg-[#6d4620] text-white px-8 py-3 rounded-full shadow-md w-full sm:w-auto relative">
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 transition-transform duration-700 group-hover:rotate-[360deg]" />
                    Donate Now
                  </span>
                </Button>

                <span className="absolute -top-2 -right-2 rounded-full bg-white text-[#8b5829] text-[10px] font-bold px-2 py-0.5 shadow-sm border border-[#e6d6c4]">
                  {campaignBadge}
                </span>
              </Link>
            </motion.div>
            <Link href="#how-it-works">
              <Button
                variant="outline"
                className="bg-white/80 text-[#3b2411] border border-[#d8c7aa] hover:bg-[#8b5829] px-8 py-3 rounded-full w-full sm:w-auto mx-5">
                Learn More
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Right Cross Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        className="hidden lg:flex justify-end items-center pointer-events-none">
        <div className="relative w-[320px] h-[680px]">
          <Image
            src="/assets/2714933a256bdceb53779dcfd80f9ea1f839ed95.png"
            alt="Orthodox Cross"
            fill
            className="object-contain opacity-80 drop-shadow-[0_40px_80px_rgba(139,88,41,0.6)]"
            priority
          />
        </div>
      </motion.div>
    </main>
  );
};

export default HeroSection;
