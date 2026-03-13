"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Calendar,
  Handshake,
  Coins,
  Users,
  TrendingUp,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import ParchmentOverlay from "@/components/ui/ParchmentOverlay";

import { cn } from "@/lib/utils";
import Image from "next/image";
import OfferingsSection from "@/components/OfferingsSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import Footer from "@/components/Footer";

const LandingPage: React.FC = () => {
  return (
    <div className="relative w-full min-h-screen overflow-hidden text-[#3b2411]">
      {/* Background */}
      <Image
        src="/assets/image.jpg"
        alt="Background"
        fill
        priority
        className="object-cover -z-20"
      />
      {/* Warm parchment overlay */}
      <ParchmentOverlay />

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Offerings Section */}
      <OfferingsSection />

      {/* How it works section */}
      <HowItWorksSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;
