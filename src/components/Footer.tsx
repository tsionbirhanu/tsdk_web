import React from "react";
import Link from "next/link";

const footerLinks = {
  Platform: ["Features", "How It Works", "Campaigns", "Voice Assistant"],
  Community: ["About Us", "Partner Churches", "Impact Reports", "Blog"],
  Support: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"],
};

const Footer = () => (
  <footer className="bg-[#2b1608] text-[#f3e3cf] py-16">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-12 mb-12">
        {/* Brand */}
        <div>
          <h3 className="font-['Jomolhari'] text-2xl font-bold text-[#f3e3cf] mb-4">
            TSEDQ
          </h3>
          <p className="text-sm leading-relaxed text-[#f3e3cf]/90">
            Digitizing faithful giving for churches and communities — with
            transparency, trust, and technology.
          </p>
        </div>

        {/* Link Columns */}
        {Object.entries(footerLinks).map(([title, links]) => (
          <div key={title}>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-[#ffe599] mb-4">
              {title}
            </h4>
            <ul className="space-y-2">
              {links.map((link) => (
                <li key={link}>
                  <Link
                    href={
                      link === "Features"
                        ? "#offerings"
                        : link === "How It Works"
                          ? "#how-it-works"
                          : "/auth"
                    }
                    className="text-sm hover:text-[#ffe599] transition-colors">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-[#3b2411]/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#f3e3cf]/80">
        <p>
          © 2026 TSEDQ — FaithTech &amp; FinTech Platform. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
