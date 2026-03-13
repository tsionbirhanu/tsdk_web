import React, { useState } from "react";
import Link from "next/link";

const navigationLinks = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#offerings" },
  { label: "About", href: "#how-it-works" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="absolute top-6 left-1/2 z-30 flex h-14 w-[98%] max-w-7xl -translate-x-1/2 items-center rounded-full border border-[#5d3919]/20 bg-white/60 px-6 md:px-12 backdrop-blur-xl shadow-lg">
      {/* Logo */}
      <div className="font-['Jomolhari'] text-xl tracking-[0.2em]">TSEDQ</div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-10">
        {navigationLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="relative text-base lg:text-lg tracking-wider font-medium transition duration-300 hover:text-[#8b5829]
              after:absolute after:left-0 after:-bottom-1 after:h-[1.5px] after:w-0 after:bg-[#8b5829]
              after:transition-all after:duration-300 hover:after:w-full">
            {link.label}
          </a>
        ))}
      </nav>

      {/* Login Button (Desktop) */}
      <div className="hidden md:block ml-auto">
        <Link
          href="/auth"
          className="px-4 py-1 bg-[#8b5829] rounded-full  text-white font-medium hover:bg-[#6d4620] transition">
          Login
        </Link>
      </div>

      {/* Mobile Hamburger */}
      <div className="md:hidden ml-auto z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-8 h-8 flex flex-col justify-between items-center">
          <span
            className={`block h-[2px] w-8 bg-black transition-all duration-300 ${
              isOpen ? "rotate-45 translate-y-3.5" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-8 bg-black transition-all duration-300 ${
              isOpen ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-[2px] w-8 bg-black transition-all duration-300 ${
              isOpen ? "-rotate-45 -translate-y-3.5" : ""
            }`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-16 left-0 w-full bg-white shadow-lg flex flex-col items-center gap-6 py-6 md:hidden rounded-b-xl">
          {navigationLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-lg font-medium text-[#8b5829]">
              {link.label}
            </a>
          ))}
          <Link
            href="/auth"
            onClick={() => setIsOpen(false)}
            className="px-6 py-2 rounded-full border border-[#8b5829] text-[#8b5829] font-medium hover:bg-[#8b5829] hover:text-white transition">
            Login
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;
