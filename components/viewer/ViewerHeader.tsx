import React from 'react';
import { Upload } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import { UserMenu } from '../UserMenu';

export interface ViewerHeaderProps {
  isAuthenticated: boolean;
  showUploadButton: boolean;
  isPanelOpen: boolean;
  onPanelToggle: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  error: string;
  modelInfo: string;
}

/**
 * Header component for the 3D viewer with logo, upload button, and user controls.
 */
export const ViewerHeader: React.FC<ViewerHeaderProps> = ({
  isAuthenticated,
  showUploadButton,
  isPanelOpen,
  onPanelToggle,
  onFileUpload,
  loading,
  error,
  modelInfo,
}) => {
  return (
    <header className="glass border-b border-gray-200 dark:border-slate-700 z-20 animate-fade-in">
      <div className="flex justify-between items-center px-4 md:px-6 py-3">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-2 md:gap-3">
          <img
            src="/hexea.png"
            alt="Hexea Logo"
            className="h-7 md:h-8 w-auto transition-transform duration-300 hover:scale-110"
          />
          <h1 className="text-base md:text-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
            Hexea
          </h1>
        </div>

        {/* Center: Primary Action - Hidden on mobile and when not appropriate */}
        {showUploadButton && (
          <label className="hidden md:flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white px-5 py-2 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-offset-slate-900 text-sm font-medium min-h-[44px]">
            <Upload className="w-4 h-4" aria-hidden="true" />
            Upload Model
            <input
              type="file"
              accept=".stl,.fbx"
              onChange={onFileUpload}
              className="hidden"
              aria-label="Upload 3D model file"
            />
          </label>
        )}

        {/* Right: User Menu, Theme & Panel Toggle */}
        <div className="flex items-center gap-2">
          {isAuthenticated && <UserMenu />}
          <ThemeToggle />
          <button
            onClick={onPanelToggle}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isPanelOpen ? 'Close properties panel' : 'Open properties panel'}
            aria-expanded={isPanelOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {(loading || error || modelInfo) && (
        <div className="px-6 pb-3" role="status" aria-live="polite">
          {loading && (
            <div className="text-indigo-600 dark:text-indigo-400 flex items-center gap-2 text-sm animate-fade-in">
              <div
                className="w-3.5 h-3.5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"
                aria-hidden="true"
              />
              Loading model...
            </div>
          )}
          {error && (
            <div
              className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-sm animate-slide-up"
              role="alert"
            >
              <strong>Error:</strong> {error}
            </div>
          )}
          {modelInfo && !error && (
            <div className="text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg border border-green-200 dark:border-green-800 text-sm animate-slide-up">
              {modelInfo}
            </div>
          )}
        </div>
      )}
    </header>
  );
};

/**
 * Floating upload button for mobile devices
 */
export interface MobileUploadButtonProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  visible: boolean;
}

export const MobileUploadButton: React.FC<MobileUploadButtonProps> = ({ onFileUpload, visible }) => {
  if (!visible) return null;

  return (
    <label className="md:hidden fixed bottom-4 right-4 z-20 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white rounded-full cursor-pointer transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-offset-slate-900 animate-fade-in">
      <Upload className="w-6 h-6" aria-hidden="true" />
      <input
        type="file"
        accept=".stl,.fbx"
        onChange={onFileUpload}
        className="hidden"
        aria-label="Upload 3D model file"
      />
    </label>
  );
};
