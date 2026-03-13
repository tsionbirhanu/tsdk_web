import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
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
            Through Digitalized Faith Giving & Finance
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
            <Link href="/auth">
              <Button className="bg-[#8b5829] hover:bg-[#6d4620] text-white px-8 py-3 rounded-full shadow-md w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button
                variant="outline"
                className="bg-white/80 text-[#3b2411] border border-[#d8c7aa] hover:bg-[#fdf7ec] px-8 py-3 rounded-full w-full sm:w-auto">
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
