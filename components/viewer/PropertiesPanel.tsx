import React from 'react';
import { Send, RefreshCw, X } from 'lucide-react';
import type { ModelStats } from '../../hooks/useModelLoader';

export interface PropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;

  // Material selection
  selectedMaterial: string;
  onMaterialChange: (material: string) => void;

  // Model data
  modelStats: ModelStats | null;
  modelScale: number;
  onScaleChange: (scale: number) => void;

  // Actions
  onRequestQuote: () => void;
  onRefreshModel: () => void;

  // Error state
  error?: string;
}

const MATERIALS = [
  { value: 'asa', label: 'ASA - Durable and weather-resistant (outdoor use)' },
  { value: 'tpu', label: 'TPU - Flexible rubber-like material' },
  { value: 'pla', label: 'PLA - Affordable (prototypes)' },
  { value: 'petg', label: 'PETG - Durable and tough (functional parts)' },
  { value: 'nylon-carbon', label: 'Nylon + carbon fiber - Extremely strong and lightweight' },
  { value: 'resin-standard', label: 'Resin - ABS-type (fine details)' },
  { value: 'resin-clear', label: 'Resin - Clear alternative' },
];

const MATERIAL_DESCRIPTIONS: Record<string, string> = {
  'asa': 'Durable and weather-resistant material, perfect for outdoor use.',
  'tpu': 'Flexible rubber-like material for flexible and soft parts.',
  'pla': 'Affordable and easy material for prototypes and visual models.',
  'petg': 'Durable and tough material, perfect for functional parts.',
  'nylon-carbon': 'Extremely strong and lightweight composite for technical and demanding parts.',
  'resin-standard': 'Best suited for fine detail prints. More durable ABS-type resin.',
  'resin-clear': 'Clear resin alternative for fine detail prints.',
};

/**
 * Properties panel component for the 3D viewer.
 * Displays material selection, model stats, and action buttons.
 */
export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  isOpen,
  onClose,
  selectedMaterial,
  onMaterialChange,
  modelStats,
  modelScale,
  onScaleChange,
  onRequestQuote,
  onRefreshModel,
  error,
}) => {
  const handleScaleChange = (value: number) => {
    const clamped = Math.min(300, Math.max(10, value));
    onScaleChange(clamped);
  };

  return (
    <aside
      className={`transition-all duration-300 ease-in-out glass flex-shrink-0 overflow-y-auto
        ${isOpen
          ? 'md:w-80 md:p-4 md:opacity-100 md:border-l md:border-gray-200 md:dark:border-slate-700 fixed md:relative inset-0 md:inset-auto w-full p-6 opacity-100 z-30 md:z-auto'
          : 'w-0 p-0 opacity-0 pointer-events-none border-0'
        }`}
      aria-hidden={!isOpen}
      aria-label="Model properties"
      role="complementary"
    >
      {isOpen && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              Model Properties
            </h2>
            {/* Close button - Only visible on mobile */}
            <button
              onClick={onClose}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close properties panel"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          {/* Material Selection */}
          <div className="mb-6 animate-fade-in relative">
            <label
              htmlFor="material-select"
              className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
            >
              Print Materials <span className="text-red-500" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <select
              id="material-select"
              value={selectedMaterial}
              onChange={(e) => onMaterialChange(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors min-h-[44px]"
              required
              aria-required="true"
            >
              <option value="">Select material...</option>
              {MATERIALS.map((material) => (
                <option key={material.value} value={material.value}>
                  {material.label}
                </option>
              ))}
            </select>

            {/* Material Description */}
            {selectedMaterial && (
              <div
                className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800"
                role="note"
              >
                <p className="text-xs text-indigo-700 dark:text-indigo-300">
                  {MATERIAL_DESCRIPTIONS[selectedMaterial]}
                </p>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div
              className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 animate-fade-in"
              role="alert"
            >
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Model Scale Control */}
          {modelStats && (
            <div className="mb-6 animate-fade-in">
              <label
                htmlFor="model-scale"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Model Size
              </label>
              <div className="space-y-2">
                <input
                  id="model-scale"
                  type="range"
                  min="10"
                  max="300"
                  value={modelScale}
                  onChange={(e) => handleScaleChange(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                  aria-valuemin={10}
                  aria-valuemax={300}
                  aria-valuenow={modelScale}
                  aria-valuetext={`${modelScale}%`}
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 dark:text-gray-400">10%</span>
                  <div className="flex items-center gap-2">
                    <label htmlFor="scale-input" className="sr-only">
                      Scale percentage
                    </label>
                    <input
                      id="scale-input"
                      type="number"
                      min="10"
                      max="300"
                      value={modelScale}
                      onChange={(e) => handleScaleChange(Number(e.target.value))}
                      className="w-16 px-2 py-1 text-center text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[32px]"
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400" aria-hidden="true">%</span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">300%</span>
                </div>
                <button
                  onClick={() => onScaleChange(100)}
                  className="w-full mt-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors min-h-[32px]"
                >
                  Reset to default size
                </button>
              </div>
            </div>
          )}

          {/* Model Statistics */}
          {modelStats ? (
            <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 md:whitespace-nowrap animate-fade-in">
              <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <strong className="block text-gray-600 dark:text-gray-400 text-xs mb-1">
                  Vertices
                </strong>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {modelStats.vertices.toLocaleString()}
                </span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                <strong className="block text-gray-600 dark:text-gray-400 text-xs mb-1">
                  Triangles
                </strong>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {modelStats.triangles.toLocaleString()}
                </span>
              </div>

              <div className="pt-2">
                <strong className="block text-gray-600 dark:text-gray-400 text-xs mb-2">
                  Original Dimensions
                </strong>
                <dl className="space-y-2 pl-2">
                  {['x', 'y', 'z'].map((axis) => (
                    <div key={axis} className="flex justify-between">
                      <dt className="text-gray-500 dark:text-gray-400 uppercase">{axis}:</dt>
                      <dd className="font-mono text-gray-900 dark:text-white">
                        {modelStats.dimensions[axis as keyof typeof modelStats.dimensions]}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
                <button
                  onClick={onRequestQuote}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl min-h-[48px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                  Request Quote
                </button>

                <button
                  onClick={onRefreshModel}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] min-h-[44px] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 dark:focus:ring-offset-slate-900"
                  title="Upload a different model while keeping your information"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Upload Different Model
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Your email and info will be saved
                </p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 dark:text-gray-500 italic md:whitespace-nowrap">
              No model loaded.
            </div>
          )}
        </>
      )}
    </aside>
  );
};
