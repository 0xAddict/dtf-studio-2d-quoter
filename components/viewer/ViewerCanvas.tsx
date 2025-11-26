import React, { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Upload } from 'lucide-react';
import type { ActiveTool } from './ViewerToolbar';

export interface ViewerCanvasHandle {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  controls: OrbitControls | null;
  triggerResize: () => void;
}

export interface ViewerCanvasProps {
  isDark: boolean;
  backgroundColor: string;
  activeTool: ActiveTool;
  hasModel: boolean;
  loading: boolean;
  isDragOver: boolean;
  onPointerDown?: (event: PointerEvent, raycaster: THREE.Raycaster, camera: THREE.PerspectiveCamera) => void;
  onSceneReady?: (refs: ViewerCanvasHandle) => void;
  pivotHelper?: THREE.Group;
  measurementHelpers?: THREE.Group;
}

/**
 * The main 3D canvas component that handles Three.js scene setup and rendering.
 * Separated from ModelViewer.tsx for better separation of concerns.
 */
export const ViewerCanvas = forwardRef<ViewerCanvasHandle, ViewerCanvasProps>(({
  isDark,
  backgroundColor,
  activeTool,
  hasModel,
  loading,
  isDragOver,
  onPointerDown,
  onSceneReady,
  pivotHelper,
  measurementHelpers,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const sceneInitializedRef = useRef(false);

  // Lights and grid refs for theme updates
  const lightsRef = useRef<{
    ambient?: THREE.AmbientLight;
    directional1?: THREE.DirectionalLight;
    directional2?: THREE.DirectionalLight;
    hemisphere?: THREE.HemisphereLight;
  }>({});
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  const triggerResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, []);

  // Expose refs to parent
  useImperativeHandle(ref, () => ({
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    controls: controlsRef.current,
    triggerResize,
  }), [triggerResize]);

  // Scene initialization
  useEffect(() => {
    if (!containerRef.current || sceneInitializedRef.current) return;

    const currentContainer = containerRef.current;

    const rafId = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      if (width === 0 || height === 0) {
        console.error('[ViewerCanvas] Container has invalid dimensions');
        return;
      }

      try {
        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(backgroundColor);
        sceneRef.current = scene;

        // Add helpers if provided
        if (measurementHelpers) {
          scene.add(measurementHelpers);
        }
        if (pivotHelper) {
          pivotHelper.visible = false;
          scene.add(pivotHelper);
        }

        // Create camera
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 2, 5);
        cameraRef.current = camera;

        // Create renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        currentContainer.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Setup lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 0.5 : 0.7);
        scene.add(ambientLight);
        lightsRef.current.ambient = ambientLight;

        const directionalLight1 = new THREE.DirectionalLight(0xffffff, isDark ? 0.7 : 0.9);
        directionalLight1.position.set(5, 10, 7.5);
        directionalLight1.castShadow = true;
        directionalLight1.shadow.mapSize.width = 2048;
        directionalLight1.shadow.mapSize.height = 2048;
        scene.add(directionalLight1);
        lightsRef.current.directional1 = directionalLight1;

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, isDark ? 0.3 : 0.5);
        directionalLight2.position.set(-5, 10, -7.5);
        scene.add(directionalLight2);
        lightsRef.current.directional2 = directionalLight2;

        const hemisphereLight = new THREE.HemisphereLight(
          isDark ? 0x4a5568 : 0xffffbb,
          isDark ? 0x1e293b : 0x080820,
          isDark ? 0.3 : 0.4
        );
        scene.add(hemisphereLight);
        lightsRef.current.hemisphere = hemisphereLight;

        // Create grid
        const gridHelper = new THREE.GridHelper(
          20,
          20,
          isDark ? 0x334155 : 0x444444,
          isDark ? 0x1e293b : 0x222222
        );
        scene.add(gridHelper);
        gridHelperRef.current = gridHelper;

        // Setup controls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 1;
        controls.maxDistance = 50;
        controlsRef.current = controls;

        // Animation loop
        const animate = () => {
          animationFrameId.current = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        // Resize observer
        const observer = new ResizeObserver(() => {
          requestAnimationFrame(() => {
            triggerResize();
          });
        });
        observer.observe(currentContainer);

        sceneInitializedRef.current = true;

        // Notify parent that scene is ready
        onSceneReady?.({
          scene,
          camera,
          renderer,
          controls,
          triggerResize,
        });

        console.log('[ViewerCanvas] Scene initialized successfully');
      } catch (error) {
        console.error('[ViewerCanvas] Error initializing scene:', error);
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [backgroundColor, isDark, pivotHelper, measurementHelpers, onSceneReady, triggerResize]);

  // Update lights and grid when theme changes
  useEffect(() => {
    if (!sceneInitializedRef.current || !lightsRef.current.ambient || !sceneRef.current) return;

    lightsRef.current.ambient.intensity = isDark ? 0.5 : 0.7;
    lightsRef.current.directional1!.intensity = isDark ? 0.7 : 0.9;
    lightsRef.current.directional2!.intensity = isDark ? 0.3 : 0.5;

    lightsRef.current.hemisphere!.color.setHex(isDark ? 0x4a5568 : 0xffffbb);
    lightsRef.current.hemisphere!.groundColor.setHex(isDark ? 0x1e293b : 0x080820);
    lightsRef.current.hemisphere!.intensity = isDark ? 0.3 : 0.4;

    // Update grid
    if (gridHelperRef.current) {
      sceneRef.current.remove(gridHelperRef.current);
      gridHelperRef.current.dispose();

      const newGrid = new THREE.GridHelper(
        20,
        20,
        isDark ? 0x334155 : 0x444444,
        isDark ? 0x1e293b : 0x222222
      );
      sceneRef.current.add(newGrid);
      gridHelperRef.current = newGrid;
    }
  }, [isDark]);

  // Update background color
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(backgroundColor);
    }
  }, [backgroundColor]);

  // Handle pointer events for tools
  useEffect(() => {
    const rendererEl = rendererRef.current?.domElement;
    if (!rendererEl || !onPointerDown) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (activeTool === 'none' || !cameraRef.current) return;

      const canvas = rendererEl;
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2();
      mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);

      onPointerDown(event, raycaster, cameraRef.current);
    };

    rendererEl.addEventListener('pointerdown', handlePointerDown);
    return () => {
      rendererEl.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [activeTool, onPointerDown]);

  return (
    <div ref={containerRef} className="flex-1 relative">
      {/* Empty State */}
      {!hasModel && !loading && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 pointer-events-none animate-fade-in">
          <div className="text-center p-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-20 h-20 mx-auto mb-4 opacity-20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">
              Drag & drop a 3D model here
            </p>
            <p className="text-sm mt-2 text-gray-400 dark:text-gray-500">
              or click Upload • Supported formats: STL, FBX
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/50 dark:bg-slate-950/50 backdrop-blur-sm animate-fade-in pointer-events-none">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 font-medium">Loading model...</p>
          </div>
        </div>
      )}

      {/* Drag Over State */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-indigo-600/20 dark:bg-indigo-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border-2 border-dashed border-indigo-500 dark:border-indigo-400">
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
              <p className="text-xl font-semibold text-gray-900 dark:text-white">Drop your 3D model here</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">STL or FBX files</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

ViewerCanvas.displayName = 'ViewerCanvas';
