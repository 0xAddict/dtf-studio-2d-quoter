import React from 'react';
import {
  RulerDimensionLine,
  Axis3d,
  Box,
  Rotate3d,
  Bookmark,
} from 'lucide-react';

export type ActiveTool = 'none' | 'measure' | 'pivot';

export interface ViewerToolbarProps {
  activeTool: ActiveTool;
  onToolSelect: (tool: ActiveTool) => void;
  isWireframe: boolean;
  onWireframeToggle: () => void;
  onResetCamera: () => void;
  onSaveView: () => void;
  modelColor: string;
  onModelColorChange: (color: string) => void;
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
}

/**
 * Floating toolbar for the 3D viewer with tool controls, view controls, and color pickers.
 * Follows Apple HIG design patterns with proper touch targets and accessibility.
 */
export const ViewerToolbar: React.FC<ViewerToolbarProps> = ({
  activeTool,
  onToolSelect,
  isWireframe,
  onWireframeToggle,
  onResetCamera,
  onSaveView,
  modelColor,
  onModelColorChange,
  backgroundColor,
  onBackgroundColorChange,
}) => {
  const handleToolSelect = (tool: ActiveTool) => {
    onToolSelect(activeTool === tool ? 'none' : tool);
  };

  return (
    <nav
      className="absolute top-4 left-2 md:left-4 glass rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden animate-fade-in z-10"
      role="toolbar"
      aria-label="Viewer tools"
    >
      <div className="flex flex-col divide-y divide-gray-200 dark:divide-slate-700">
        {/* Tools Section */}
        <div className="p-2 space-y-1">
          <ToolbarButton
            onClick={() => handleToolSelect('measure')}
            title="Measure Distance (M)"
            isActive={activeTool === 'measure'}
            activeClass="bg-amber-500 dark:bg-amber-400 text-white shadow-lg"
            ariaLabel="Activate measurement tool"
            ariaPressed={activeTool === 'measure'}
          >
            <RulerDimensionLine className="h-5 w-5" aria-hidden="true" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => handleToolSelect('pivot')}
            title="Set Pivot Point (P)"
            isActive={activeTool === 'pivot'}
            activeClass="bg-blue-500 dark:bg-blue-400 text-white shadow-lg"
            ariaLabel="Activate pivot point tool"
            ariaPressed={activeTool === 'pivot'}
          >
            <Axis3d className="h-5 w-5" aria-hidden="true" />
          </ToolbarButton>

          <ToolbarButton
            onClick={onWireframeToggle}
            title="Toggle Wireframe (W)"
            isActive={isWireframe}
            activeClass="bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg"
            ariaLabel="Toggle wireframe mode"
            ariaPressed={isWireframe}
          >
            <Box className="h-5 w-5" aria-hidden="true" />
          </ToolbarButton>
        </div>

        {/* View Controls */}
        <div className="p-2 space-y-1">
          <ToolbarButton
            onClick={onResetCamera}
            title="Reset Camera (R)"
            ariaLabel="Reset camera view"
          >
            <Rotate3d className="h-5 w-5" aria-hidden="true" />
          </ToolbarButton>

          <ToolbarButton
            onClick={onSaveView}
            title="Save Current View"
            ariaLabel="Save current camera view"
          >
            <Bookmark className="h-5 w-5" aria-hidden="true" />
          </ToolbarButton>
        </div>

        {/* Color Pickers */}
        <div className="p-2 space-y-2">
          <div className="flex items-center justify-center">
            <label htmlFor="model-color-picker" className="sr-only">
              Model Color
            </label>
            <input
              id="model-color-picker"
              type="color"
              value={modelColor}
              onChange={(e) => onModelColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              title="Model Color"
            />
          </div>
          <div className="flex items-center justify-center">
            <label htmlFor="bg-color-picker-toolbar" className="sr-only">
              Background Color
            </label>
            <input
              id="bg-color-picker-toolbar"
              type="color"
              value={backgroundColor}
              onChange={(e) => onBackgroundColorChange(e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              title="Background Color"
            />
          </div>
        </div>
      </div>
    </nav>
  );
};

interface ToolbarButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  isActive?: boolean;
  activeClass?: string;
  ariaLabel: string;
  ariaPressed?: boolean;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  onClick,
  title,
  children,
  isActive = false,
  activeClass = '',
  ariaLabel,
  ariaPressed,
}) => {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-full p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center group min-w-[44px] min-h-[44px] ${
        isActive
          ? activeClass
          : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
      }`}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
    >
      {children}
    </button>
  );
};

/**
 * Saved Views Panel component
 */
interface SavedViewsPanelProps {
  views: Array<{ name: string; position: [number, number, number]; target: [number, number, number] }>;
  onLoadView: (index: number) => void;
}

export const SavedViewsPanel: React.FC<SavedViewsPanelProps> = ({ views, onLoadView }) => {
  if (views.length === 0) return null;

  return (
    <aside
      className="hidden sm:block absolute top-4 right-4 glass rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl p-3 animate-fade-in z-10 max-w-xs"
      aria-label="Saved camera views"
    >
      <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Saved Views
      </h3>
      <ul className="space-y-1" role="list">
        {views.map((view, i) => (
          <li key={i}>
            <button
              onClick={() => onLoadView(i)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors min-h-[44px] flex items-center"
            >
              {view.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};

/**
 * Keyboard Shortcuts Help component
 */
export const KeyboardShortcutsHelp: React.FC = () => {
  const shortcuts = [
    { key: 'R', label: 'Reset' },
    { key: 'M', label: 'Measure' },
    { key: 'P', label: 'Pivot' },
    { key: 'W', label: 'Wireframe' },
  ];

  return (
    <div
      className="hidden md:block absolute bottom-4 left-4 glass text-gray-800 dark:text-gray-200 p-3 rounded-xl text-xs shadow-xl pointer-events-none border border-gray-200/50 dark:border-slate-700/50 max-w-[200px] animate-slide-up"
      role="note"
      aria-label="Keyboard shortcuts"
    >
      <div className="space-y-1 opacity-60 hover:opacity-100 transition-opacity">
        {shortcuts.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px] font-mono min-w-[20px] text-center">
              {key}
            </kbd>
            <span className="text-[11px]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
