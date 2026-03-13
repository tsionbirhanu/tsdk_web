import React from "react";

const ParchmentOverlay = () => (
  <div
    className="fixed inset-0 -z-10 pointer-events-none"
    style={{
      background:
        "linear-gradient(135deg, rgba(253,247,236,0.82) 0%, rgba(243,227,207,0.75) 50%, rgba(248,238,220,0.80) 100%)",
    }}
  />
);

export default ParchmentOverlay;
