import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const offerings = [
  {
    title: "Donations",
    desc: "Every gift, large or small, helps preserve sacred traditions; join parish generosity.",
    img: "/assets/IMAGE3.png",
  },
  {
    title: "Aserat (Tithe)",
    desc: "Enter your income and TSEDQ calculates your faithful 10% tithe automatically.",
    img: "/assets/IMAGE4.png",
  },
  {
    title: "Selet (Vows)",
    desc: "Create and track sacred vows with flexible installments and friendly reminders easily.",
    img: "/assets/IMAGE1.jpg",
  },
  {
    title: "Gbir (Annual Contribution)",
    desc: "Manage yearly community gifts with clear status updates and payment history.",
    img: "/assets/IMAGE2.png",
  },
];

const OfferingsSection = () => (
  <section
    id="offerings"
    className="relative w-full py-28 px-6 bg-[#f3e3cf] text-[#3b2411]">
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6 }}
        className="text-center mb-16">
        <span className="inline-block bg-[#ffe599] text-[#3b2411] text-xs font-semibold tracking-wider px-4 py-1.5 rounded-full uppercase mb-5">
          What We Offer
        </span>
        <h2 className="font-['Jomolhari'] text-4xl md:text-5xl font-bold mb-6">
          Everything Your Community Needs
        </h2>
        <p className="text-lg max-w-2xl mx-auto text-[#4b2e18]">
          From weekly tithes to sacred vows — TSEDQ supports every spiritual
          financial act with care, transparency, and technology.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {offerings.map((card, i) => (
          <div
            key={i}
            className="group bg-white/20 backdrop-blur-lg border border-white/30 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-2">
            <div className="relative w-full h-48 mb-6 overflow-hidden rounded-xl">
              <Image
                src={card.img}
                alt={card.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
            <h3 className="text-lg font-semibold mb-3">{card.title}</h3>
            <p className="text-sm text-[#4b2e18] leading-relaxed mb-6">
              {card.desc}
            </p>
            <Button className="w-full bg-[#8b5829] hover:bg-[#6d4620] text-white rounded-full py-5 transition-all duration-300">
              Join
            </Button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default OfferingsSection;
