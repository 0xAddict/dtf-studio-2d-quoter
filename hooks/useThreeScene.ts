import { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface ThreeSceneRefs {
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  renderer: THREE.WebGLRenderer | null;
  controls: OrbitControls | null;
}

export interface UseThreeSceneOptions {
  isDark: boolean;
  backgroundColor: string;
  onReady?: (refs: ThreeSceneRefs) => void;
}

/**
 * Custom hook for managing the Three.js scene setup and lifecycle.
 * Handles scene initialization, camera setup, lighting, grid, and controls.
 */
export function useThreeScene(
  containerRef: React.RefObject<HTMLDivElement>,
  options: UseThreeSceneOptions
) {
  const { isDark, backgroundColor, onReady } = options;

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);

  // Lights and grid refs for theme updates
  const lightsRef = useRef<{
    ambient?: THREE.AmbientLight;
    directional1?: THREE.DirectionalLight;
    directional2?: THREE.DirectionalLight;
    hemisphere?: THREE.HemisphereLight;
  }>({});
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  /**
   * Initialize the Three.js scene
   */
  const initScene = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;

    const width = container.clientWidth;
    const height = container.clientHeight;

    if (width === 0 || height === 0) {
      console.error('[useThreeScene] Container has invalid dimensions');
      return false;
    }

    try {
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(backgroundColor);
      sceneRef.current = scene;

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
      container.appendChild(renderer.domElement);
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
          if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
          cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        });
      });
      observer.observe(container);

      setIsInitialized(true);

      // Notify parent that scene is ready
      onReady?.({
        scene,
        camera,
        renderer,
        controls,
      });

      console.log('[useThreeScene] Scene initialized successfully');

      return true;
    } catch (error) {
      console.error('[useThreeScene] Error initializing scene:', error);
      return false;
    }
  }, [backgroundColor, isDark, onReady, containerRef]);

  /**
   * Update lights and grid when theme changes
   */
  const updateTheme = useCallback((isDark: boolean) => {
    if (!lightsRef.current.ambient || !sceneRef.current) return;

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
  }, []);

  /**
   * Update background color
   */
  const updateBackgroundColor = useCallback((color: string) => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(color);
    }
  }, []);

  /**
   * Reset camera to default position
   */
  const resetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 2, 5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, []);

  /**
   * Save current camera view
   */
  const saveView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return null;

    return {
      position: cameraRef.current.position.toArray() as [number, number, number],
      target: controlsRef.current.target.toArray() as [number, number, number],
    };
  }, []);

  /**
   * Load a saved camera view
   */
  const loadView = useCallback((position: [number, number, number], target: [number, number, number]) => {
    if (!cameraRef.current || !controlsRef.current) return;

    cameraRef.current.position.fromArray(position);
    controlsRef.current.target.fromArray(target);
    controlsRef.current.update();
  }, []);

  /**
   * Trigger resize update (for when panel opens/closes)
   */
  const triggerResize = useCallback(() => {
    if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    cameraRef.current.aspect = width / height;
    cameraRef.current.updateProjectionMatrix();
    rendererRef.current.setSize(width, height);
  }, [containerRef]);

  /**
   * Cleanup function
   */
  const dispose = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (rendererRef.current.domElement.parentElement) {
        rendererRef.current.domElement.parentElement.removeChild(rendererRef.current.domElement);
      }
    }

    if (controlsRef.current) {
      controlsRef.current.dispose();
    }

    sceneRef.current = null;
    cameraRef.current = null;
    rendererRef.current = null;
    controlsRef.current = null;
    setIsInitialized(false);
  }, []);

  // Update theme when isDark changes
  useEffect(() => {
    if (isInitialized) {
      updateTheme(isDark);
    }
  }, [isDark, isInitialized, updateTheme]);

  // Update background color when it changes
  useEffect(() => {
    if (isInitialized) {
      updateBackgroundColor(backgroundColor);
    }
  }, [backgroundColor, isInitialized, updateBackgroundColor]);

  return {
    scene: sceneRef.current,
    camera: cameraRef.current,
    renderer: rendererRef.current,
    controls: controlsRef.current,
    isInitialized,

    // Actions
    initScene,
    updateTheme,
    updateBackgroundColor,
    resetCamera,
    saveView,
    loadView,
    triggerResize,
    dispose,

    // Refs for direct access
    sceneRef,
    cameraRef,
    rendererRef,
    controlsRef,
    lightsRef,
    gridHelperRef,
  };
}
