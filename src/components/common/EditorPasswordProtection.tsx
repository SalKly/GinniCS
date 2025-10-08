import React, { useState, useEffect } from "react";
import Image from "next/image";

const CORRECT_PASSWORD = "Ginni_CS25";
const STORAGE_KEY = "ginni_editor_auth";

interface EditorPasswordProtectionProps {
  children: React.ReactNode;
}

export function EditorPasswordProtection({ children }: EditorPasswordProtectionProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Check if already authenticated on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem(STORAGE_KEY);
    if (storedAuth === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (passwordInput.trim() === CORRECT_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, CORRECT_PASSWORD);
      setIsAuthenticated(true);
    } else {
      setError("Incorrect password. Please try again.");
      setPasswordInput("");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-purple-600 mb-4"></i>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show password screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4 p-6 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-xl">
              <div className="relative w-24 h-24">
                <Image src="/GA_Logo_On-purple.png" alt="Ginni Logo" fill className="object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Editor Access Required</h1>
            <p className="text-gray-600">Enter your password to access the form editor</p>
          </div>

          {/* Password Form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  <i className="fas fa-key mr-2 text-purple-600"></i>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-center text-lg font-bold tracking-widest"
                  placeholder="Enter password"
                  required
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-800 text-sm">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-lock-open"></i>
                  Access Editor
                </span>
              </button>
            </form>
          </div>

          {/* Security Note */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <i className="fas fa-shield-alt mr-1"></i>
            This editor is password protected
          </div>
        </div>
      </div>
    );
  }

  // Authenticated - show children
  return <>{children}</>;
}
