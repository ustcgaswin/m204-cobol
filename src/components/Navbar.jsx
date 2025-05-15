import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Code, Menu, X, Home } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md sticky top-0 z-20">
      {/* Removed 'container' class, kept 'px-4' for padding from viewport edges */}
      <div className="px-4"> 
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <Link to="/" className="flex items-center group">
            <div
              className="flex-shrink-0 bg-teal-800 bg-opacity-20 p-2 rounded-lg mr-3 group-hover:bg-opacity-30 transition-colors"
            >
              <Code size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight group-hover:text-teal-100 transition-colors">
                M204-Cobol Converter
              </span>
              <span className="hidden md:block text-xs text-teal-200">Transform legacy code efficiently</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="px-4 py-2 rounded-md text-sm font-medium text-teal-100 hover:bg-teal-500 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(false)} // Close menu on navigation
            >
              Dashboard
            </Link>
            {/* Add other desktop navigation links here if needed */}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-teal-100 hover:bg-teal-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-teal-500" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-teal-100 hover:bg-teal-500 hover:text-white transition-colors"
              onClick={() => setIsMenuOpen(false)} // Close menu on navigation
            >
              <Home size={18} className="mr-3" />
              Dashboard
            </Link>
            {/* Add other mobile navigation links here if needed */}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; // Corrected export statement