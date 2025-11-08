import React from "react";
import { useNavigate } from "react-router";

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/", { replace: true });
    // Clear search by navigating to home with a state
    window.dispatchEvent(new CustomEvent("clearSearch"));
  };

  return (
    <nav
      className={`animate-fade-in-down fixed top-0 left-0 z-50 -ms-2 w-auto transition-all duration-300`}
    >
      <div className="navbar-blur m-2 flex w-64 items-center justify-start rounded-r-2xl px-5 py-4 border border-white/10">
        <button
          onClick={handleLogoClick}
          className="group relative flex items-center gap-3 whitespace-nowrap transition-all duration-300 hover:scale-105 active:scale-95"
        >
          {/* Logo/Icon */}
          <div className="relative">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-500/30 to-blue-500/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-blue-500 shadow-lg shadow-purple-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-purple-500/50">
              <span className="text-2xl font-bold text-white drop-shadow-md">
                V
              </span>
            </div>
          </div>

          {/* Title */}
          <div className="relative">
            <h1 className="group-hover:text-light-100 text-2xl font-bold whitespace-nowrap text-white drop-shadow-lg transition-all duration-300">
              <span className="animate-fade-in-left inline-block">vault</span>
              <span className="text-gradient animate-pulse-glow ml-1 inline-block">
                Toon
              </span>
            </h1>
            {/* Underline effect on hover */}
            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transition-all duration-500 group-hover:w-full" />
          </div>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
