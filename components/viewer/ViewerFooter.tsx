import React from 'react';
import type { ActiveTool } from './ViewerToolbar';

export interface ViewerFooterProps {
  activeTool: ActiveTool;
  measurementDistance: number | null;
}

/**
 * Footer component for the 3D viewer with tool status and control hints.
 */
export const ViewerFooter: React.FC<ViewerFooterProps> = ({ activeTool, measurementDistance }) => {
  const getFooterContent = () => {
    switch (activeTool) {
      case 'measure':
        return (
          <span className="text-amber-500 dark:text-amber-400">
            <strong>Measuring:</strong>{' '}
            {measurementDistance
              ? `Distance: ${measurementDistance.toFixed(3)} units`
              : 'Click first point on model...'}
          </span>
        );
      case 'pivot':
        return (
          <span className="text-blue-600 dark:text-blue-400">
            <strong>Set Pivot:</strong> Click a point on the model to set the new orbit center.
          </span>
        );
      default:
        return (
          <span className="text-gray-700 dark:text-gray-300">
            <strong className="text-gray-900 dark:text-white">Controls:</strong>{' '}
            Left click + drag to rotate • Right click + drag to pan • Scroll to zoom
          </span>
        );
    }
  };

  return (
    <footer
      className="hidden md:block glass p-3 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-slate-700 text-center z-10"
      role="contentinfo"
    >
      {getFooterContent()}
    </footer>
  );
};

/**
 * Attribution footer component
 */
export const AttributionFooter: React.FC = () => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 py-2 px-4 text-center text-xs text-gray-400 dark:text-gray-600 bg-transparent pointer-events-none z-10">
      <p className="pointer-events-auto">
        3D Model Viewer Built By{' '}
        <a
          href="https://am8.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline"
        >
          AM8
        </a>
        , powered by{' '}
        <a
          href="https://alpha-performance.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors underline"
        >
          Alpha Performance
        </a>
      </p>
    </footer>
  );
};
