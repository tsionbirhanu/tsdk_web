"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const CTASection = () => (
  <section className="py-24 bg-[#f3e3cf] relative overflow-hidden">
    {/* subtle radial glow */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,229,153,0.15),transparent_70%)]" />
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative z-10 max-w-3xl mx-auto px-6 text-center">
      <h2 className="font-['Jomolhari'] text-3xl md:text-4xl font-bold text-[#3b2411] mb-6">
        Ready to Give with Purpose?
      </h2>
      <p className="text-[#4b2e18] text-lg mb-8 leading-relaxed">
        Join thousands of believers who are honouring their commitments
        digitally — faithfully and freely.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/auth">
          <Button
            size="lg"
            className="bg-[#3b2411] text-white border border-[#3b2411] hover:bg-white hover:text-[#3b2411] px-10 py-3 rounded-full shadow-lg w-full sm:w-auto transition-colors duration-300">
            Create Free Account
          </Button>
        </Link>
        <Link href="/auth">
          <Button
            size="lg"
            variant="outline"
            className="bg-white text-[#3b2411] border border-[#3b2411] hover:bg-[#3b2411] hover:text-white px-10 py-3 rounded-full w-full sm:w-auto transition-colors duration-300">
            Sign In
          </Button>
        </Link>
      </div>
    </motion.div>
  </section>
);

export default CTASection;
