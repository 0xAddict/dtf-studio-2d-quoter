import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { WelcomeModal } from './WelcomeModal';
import { EmailVerificationModal } from './EmailVerificationModal';
import { QuoteRequestModal } from './QuoteRequestModal';
import { Upload, Rotate3d, Bookmark, RulerDimensionLine, Axis3d, Box, Send, RefreshCw } from 'lucide-react';

type ActiveTool = 'none' | 'measure' | 'pivot';

const createPivotHelper = () => {
    const group = new THREE.Group();
    const axes = new THREE.AxesHelper(0.5);
    const sphereGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.9 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(axes);
    group.add(sphere);
    return group;
};

export default function ModelViewer() {
  const { isDark } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const currentModelRef = useRef<THREE.Object3D | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelInfo, setModelInfo] = useState('');

  // Feature states
  const [isWireframe, setIsWireframe] = useState(false);
  const [modelColor, setModelColor] = useState('#6366f1');
  const [backgroundColor, setBackgroundColor] = useState(isDark ? '#0f172a' : '#f0f4f8');
  const [savedViews, setSavedViews] = useState<{ name: string; position: [number, number, number]; target: [number, number, number] }[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(() => {
    // Start with panel closed on mobile (< 768px)
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });
  const [modelStats, setModelStats] = useState<{ vertices: number; triangles: number; dimensions: { x: string; y: string; z: string; } } | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string>('');
  const [modelScale, setModelScale] = useState<number>(100);
  const baseScaleRef = useRef<number>(1);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [currentFileName, setCurrentFileName] = useState<string>('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Tool state
  const measurementHelpersRef = useRef<THREE.Group>(new THREE.Group());
  const pivotHelperRef = useRef<THREE.Group>(createPivotHelper());
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  const [measurementInfo, setMeasurementInfo] = useState<{ points: THREE.Vector3[], distance: number | null }>({ points: [], distance: null });

  // Modal and flow states
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [isSampleMode, setIsSampleMode] = useState(false);

  // Refs for lights and grid to update on theme change
  const sceneInitializedRef = useRef(false);
  const lightsRef = useRef<{
    ambient?: THREE.AmbientLight;
    directional1?: THREE.DirectionalLight;
    directional2?: THREE.DirectionalLight;
    hemisphere?: THREE.HemisphereLight;
  }>({});
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);

  // Update background color when theme changes
  useEffect(() => {
    setBackgroundColor(isDark ? '#0f172a' : '#f0f4f8');
  }, [isDark]);

  // Scene setup - only initialize after welcome modal is dismissed
  useEffect(() => {
    // Don't initialize while welcome modal is open
    if (showWelcomeModal) {
      console.log('[SCENE INIT] Welcome modal is open, waiting to initialize');
      return;
    }

    console.log('[SCENE INIT] Effect triggered. sceneInitialized:', sceneInitializedRef.current);

    if (!containerRef.current) {
      console.warn('[SCENE INIT] No container ref, aborting');
      return;
    }

    if (sceneInitializedRef.current) {
      console.log('[SCENE INIT] Scene already initialized, skipping');
      return; // Prevent re-initialization
    }

    const currentContainer = containerRef.current;

    // Wait for next frame to ensure DOM is laid out after modal closes
    const rafId = requestAnimationFrame(() => {
      if (!containerRef.current) return;

      // Ensure container has valid dimensions before initializing Three.js
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      console.log('[SCENE INIT] Container dimensions:', width, 'x', height);
      console.log('[SCENE INIT] Container element:', containerRef.current);
      console.log('[SCENE INIT] Container offsetParent:', containerRef.current.offsetParent);

      if (width === 0 || height === 0) {
        console.error('[SCENE INIT] ❌ Container STILL has invalid dimensions after modal closed!');
        console.log('[SCENE INIT] Container computed style:', window.getComputedStyle(containerRef.current));
        return;
      }

      console.log('[SCENE INIT] ✓ Valid dimensions detected, starting initialization...');

      try {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(backgroundColor);
        sceneRef.current = scene;
        scene.add(measurementHelpersRef.current);
        pivotHelperRef.current.visible = false;
        scene.add(pivotHelperRef.current);

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.set(0, 2, 5);
        cameraRef.current = camera;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;
        currentContainer.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Lighting setup - adjusted for dark mode
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

        const gridHelper = new THREE.GridHelper(
          20,
          20,
          isDark ? 0x334155 : 0x444444,
          isDark ? 0x1e293b : 0x222222
        );
        scene.add(gridHelper);
        gridHelperRef.current = gridHelper;

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 1;
        controls.maxDistance = 50;
        controlsRef.current = controls;

        const animate = () => {
          animationFrameId.current = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
        };
        animate();

        const observer = new ResizeObserver(() => {
          requestAnimationFrame(() => {
            if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
            cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
          });
        });
        observer.observe(currentContainer);

        // Mark scene as successfully initialized
        sceneInitializedRef.current = true;
        console.log('[SCENE INIT] ✅ Three.js scene initialized successfully!');
        console.log('[SCENE INIT] Canvas element:', renderer.domElement);
        console.log('[SCENE INIT] Canvas parent:', renderer.domElement.parentElement);
        console.log('[SCENE INIT] Canvas dimensions:', renderer.domElement.width, 'x', renderer.domElement.height);
        console.log('[SCENE INIT] Canvas style:', renderer.domElement.style.cssText);
      } catch (error) {
        console.error('[SCENE INIT] ❌ Error initializing Three.js scene:', error);
      }
    });

    // Cleanup function
    return () => {
      console.log('[SCENE INIT] Cleanup called');
      cancelAnimationFrame(rafId);
    };
  }, [showWelcomeModal, backgroundColor, isDark]); // Re-run when modal closes, theme or background changes

  // Update lights and grid when theme changes (without recreating scene)
  useEffect(() => {
    // Only run if all lights are initialized
    if (!lightsRef.current.ambient || !lightsRef.current.directional1 ||
        !lightsRef.current.directional2 || !lightsRef.current.hemisphere) {
      return;
    }

    lightsRef.current.ambient.intensity = isDark ? 0.5 : 0.7;
    lightsRef.current.directional1.intensity = isDark ? 0.7 : 0.9;
    lightsRef.current.directional2.intensity = isDark ? 0.3 : 0.5;

    lightsRef.current.hemisphere.color.setHex(isDark ? 0x4a5568 : 0xffffbb);
    lightsRef.current.hemisphere.groundColor.setHex(isDark ? 0x1e293b : 0x080820);
    lightsRef.current.hemisphere.intensity = isDark ? 0.3 : 0.4;
    if (gridHelperRef.current && sceneRef.current) {
      // Remove old grid and create new one with updated colors
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

  // Effect for pointer events
  useEffect(() => {
    const rendererEl = rendererRef.current?.domElement;
    if (!rendererEl) return;

    const handlePointerDown = (event: PointerEvent) => {
        if (activeTool === 'none' || !currentModelRef.current || !rendererRef.current || !cameraRef.current) return;

        const canvas = rendererEl;
        const rect = canvas.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((event.clientX - rect.left) / canvas.clientWidth) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / canvas.clientHeight) * 2 + 1;

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObject(currentModelRef.current, true);

        if (intersects.length > 0) {
            const intersectionPoint = intersects[0].point;

            if (activeTool === 'measure') {
                setMeasurementInfo(prev => {
                    let newPoints = [...prev.points, intersectionPoint];
                    let newDistance: number | null = null;

                    if (newPoints.length > 2) {
                        newPoints = [intersectionPoint];
                    }

                    while(measurementHelpersRef.current.children.length > 0){
                        measurementHelpersRef.current.remove(measurementHelpersRef.current.children[0]);
                    }

                    newPoints.forEach(p => {
                        const geometry = new THREE.SphereGeometry(0.05, 16, 16);
                        const material = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.9 });
                        const sphere = new THREE.Mesh(geometry, material);
                        sphere.position.copy(p);
                        measurementHelpersRef.current.add(sphere);
                    });

                    if (newPoints.length === 2) {
                        newDistance = newPoints[0].distanceTo(newPoints[1]);
                        const material = new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 3, transparent: true, opacity: 0.9 });
                        const geometry = new THREE.BufferGeometry().setFromPoints(newPoints);
                        const line = new THREE.Line(geometry, material);
                        measurementHelpersRef.current.add(line);
                    }

                    return { points: newPoints, distance: newDistance };
                });
            } else if (activeTool === 'pivot') {
                if (controlsRef.current) {
                    controlsRef.current.target.copy(intersectionPoint);
                    pivotHelperRef.current.position.copy(intersectionPoint);
                    pivotHelperRef.current.visible = true;
                    setActiveTool('none');
                }
            }
        }
    };

    rendererEl.addEventListener('pointerdown', handlePointerDown);
    return () => {
        rendererEl.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [activeTool]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(backgroundColor);
    }
  }, [backgroundColor]);

  // Trigger resize when panel opens/closes
  useEffect(() => {
    // Wait for CSS transition to complete (300ms)
    const timer = setTimeout(() => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [isPanelOpen]);

  const updateMaterialProperties = useCallback((object: THREE.Object3D) => {
    const newColor = new THREE.Color(modelColor);
    object.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhongMaterial) {
            material.wireframe = isWireframe;
            material.color.copy(newColor);
          }
        });
      }
    });
  }, [isWireframe, modelColor]);

  useEffect(() => {
    if (currentModelRef.current) {
      updateMaterialProperties(currentModelRef.current);
    }
  }, [isWireframe, modelColor, updateMaterialProperties]);

  // Apply scale changes to the model
  useEffect(() => {
    if (currentModelRef.current && baseScaleRef.current) {
      const newScale = baseScaleRef.current * (modelScale / 100);
      currentModelRef.current.scale.setScalar(newScale);

      // Recalculate position to keep model on the grid
      const box = new THREE.Box3().setFromObject(currentModelRef.current);
      currentModelRef.current.position.y -= box.min.y;
    }
  }, [modelScale]);

  const removeCurrentModel = useCallback(() => {
    if (currentModelRef.current && sceneRef.current) {
        sceneRef.current.remove(currentModelRef.current);
        currentModelRef.current.traverse((object: any) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach((material: any) => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
        currentModelRef.current = null;
        setModelStats(null);
        setModelInfo('');
        setModelScale(100);
        baseScaleRef.current = 1;
        setCurrentFileName('');
        while(measurementHelpersRef.current.children.length > 0){
            measurementHelpersRef.current.remove(measurementHelpersRef.current.children[0]);
        }
        setMeasurementInfo({ points: [], distance: null });
        pivotHelperRef.current.visible = false;
        if(controlsRef.current) controlsRef.current.target.set(0,0,0);
    }
  }, []);

  const centerAndScaleModel = useCallback((object: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Center the model at origin (0, 0, 0)
    object.position.sub(center);
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4 / maxDim;
    object.scale.multiplyScalar(scale);
    object.updateMatrixWorld(true);

    // Store the base scale for later adjustments
    baseScaleRef.current = scale;

    // After scaling, recalculate and ensure model sits on the grid floor (y = 0)
    const newBox = new THREE.Box3().setFromObject(object);
    const newCenter = newBox.getCenter(new THREE.Vector3());

    // Ensure X and Z are centered at 0
    object.position.x -= newCenter.x;
    object.position.z -= newCenter.z;
    // Place the bottom of the model on the grid (y = 0)
    object.position.y -= newBox.min.y;

    return { size, scale };
  }, []);

  const calculateModelStats = useCallback((object: THREE.Object3D, originalSize: THREE.Vector3) => {
    let vertices = 0;
    let triangles = 0;
    object.traverse(child => {
        if ((child as THREE.Mesh).isMesh) {
            const geom = (child as THREE.Mesh).geometry;
            if (geom) {
                vertices += geom.attributes.position.count;
                triangles += (geom.index ? geom.index.count / 3 : geom.attributes.position.count / 3);
            }
        }
    });
    setModelStats({
        vertices,
        triangles: Math.round(triangles),
        dimensions: {
            x: originalSize.x.toFixed(3),
            y: originalSize.y.toFixed(3),
            z: originalSize.z.toFixed(3),
        }
    });
  }, []);

  const loadModel = useCallback((file: File, loader: STLLoader | FBXLoader, parser: (data: ArrayBuffer | string) => THREE.Object3D | THREE.BufferGeometry) => {
    setLoading(true);
    setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) throw new Error("File could not be read.");

        let object: THREE.Object3D;
        const parsedData = parser(result as ArrayBuffer);

        if (parsedData instanceof THREE.BufferGeometry) {
            const material = new THREE.MeshPhongMaterial({
                color: modelColor,
                specular: 0x111111,
                shininess: 200,
                wireframe: isWireframe,
            });
            object = new THREE.Mesh(parsedData, material);
        } else {
            object = parsedData;
        }

        object.traverse(child => {
            if ((child as THREE.Mesh).isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        removeCurrentModel();

        const { size } = centerAndScaleModel(object);
        updateMaterialProperties(object);

        if (sceneRef.current) sceneRef.current.add(object);
        currentModelRef.current = object;

        // Set pivot point to center of model (origin after centering)
        if (controlsRef.current) {
          controlsRef.current.target.set(0, 0, 0);
          pivotHelperRef.current.position.set(0, 0, 0);
          pivotHelperRef.current.visible = true;
        }

        setModelInfo(`${file.name.split('.').pop()?.toUpperCase()} Model loaded: ${file.name}`);
        calculateModelStats(object, size);

      } catch (err: any) {
        setError(`Error loading model: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => { setLoading(false); setError('Error reading file'); };
    reader.readAsArrayBuffer(file);
  }, [modelColor, isWireframe, removeCurrentModel, centerAndScaleModel, updateMaterialProperties, calculateModelStats]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    removeCurrentModel();
    setError('');
    setCurrentFileName(file.name);
    setCurrentFile(file);

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'stl') {
      loadModel(file, new STLLoader(), (data) => new STLLoader().parse(data as ArrayBuffer));
    } else if (extension === 'fbx') {
      loadModel(file, new FBXLoader(), (data) => new FBXLoader().parse(data as ArrayBuffer, ''));
    } else {
      setError('Unsupported file format. Please upload STL or FBX files.');
      setCurrentFileName('');
      setCurrentFile(null);
    }
    event.target.value = '';
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the main container
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension !== 'stl' && extension !== 'fbx') {
      setError('Unsupported file format. Please upload STL or FBX files.');
      return;
    }

    removeCurrentModel();
    setError('');
    setCurrentFileName(file.name);
    setCurrentFile(file);

    if (extension === 'stl') {
      loadModel(file, new STLLoader(), (data) => new STLLoader().parse(data as ArrayBuffer));
    } else if (extension === 'fbx') {
      loadModel(file, new FBXLoader(), (data) => new FBXLoader().parse(data as ArrayBuffer, ''));
    }
  }, [loadModel, removeCurrentModel]);

  const resetCamera = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 2, 5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      pivotHelperRef.current.visible = false;
    }
  }, []);

  const saveCurrentView = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;
    const name = `View ${savedViews.length + 1}`;
    setSavedViews([...savedViews, {
        name,
        position: cameraRef.current.position.toArray(),
        target: controlsRef.current.target.toArray(),
    }]);
  }, [savedViews]);

  const loadView = useCallback((index: number) => {
    if (!cameraRef.current || !controlsRef.current || !savedViews[index]) return;
    const view = savedViews[index];
    cameraRef.current.position.fromArray(view.position);
    controlsRef.current.target.fromArray(view.target);
    pivotHelperRef.current.position.fromArray(view.target);
    pivotHelperRef.current.visible = !(new THREE.Vector3().fromArray(view.target).equals(new THREE.Vector3(0,0,0)));
  }, [savedViews]);

  const handleRefreshModel = useCallback(() => {
    // Clear current model
    removeCurrentModel();

    // Reset model-related states (but keep user info)
    setCurrentFileName('');
    setCurrentFile(null);
    setModelStats(null);
    setSelectedMaterial('');
    setModelScale(100);
    setError('');
    setModelInfo('');

    // Reset camera
    resetCamera();

    // Note: userName and userEmail are preserved
  }, [removeCurrentModel, resetCamera]);

  const handleToolSelect = (tool: ActiveTool) => {
    setActiveTool(prev => prev === tool ? 'none' : tool);
  };

  const getFooterText = () => {
    switch(activeTool) {
        case 'measure':
            return <span className="text-amber-500 dark:text-amber-400"><strong>Measuring:</strong> {measurementInfo.distance ? `Distance: ${measurementInfo.distance.toFixed(3)} units` : 'Click first point on model...'}</span>;
        case 'pivot':
            return <span className="text-blue-600 dark:text-blue-400"><strong>Set Pivot:</strong> Click a point on the model to set the new orbit center.</span>;
        default:
            return <span className="text-gray-700 dark:text-gray-300"><strong className="text-gray-900 dark:text-white">Controls:</strong> Left click + drag to rotate • Right click + drag to pan • Scroll to zoom</span>;
    }
  };

  // Modal handlers
  const handleGetQuote = () => {
    setShowWelcomeModal(false);
    setShowEmailModal(true);
  };

  const handleTrySample = () => {
    setShowWelcomeModal(false);
    setIsSampleMode(true);
    loadSampleModel();
  };

  const handleEmailVerified = (name: string, email: string) => {
    setUserName(name);
    setUserEmail(email);
    setShowEmailModal(false);
    // User is now verified and can use the full interface
  };

  const loadSampleModel = () => {
    // Create a simple sample STL cube programmatically
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshPhongMaterial({
      color: modelColor,
      specular: 0x111111,
      shininess: 200,
      wireframe: isWireframe,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.castShadow = true;
    cube.receiveShadow = true;

    removeCurrentModel();

    const box = new THREE.Box3().setFromObject(cube);
    const size = box.getSize(new THREE.Vector3());

    if (sceneRef.current) sceneRef.current.add(cube);
    currentModelRef.current = cube;

    // Set pivot point to center of model
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      pivotHelperRef.current.position.set(0, 0, 0);
      pivotHelperRef.current.visible = true;
    }

    setModelInfo('Sample model loaded: Cube');
    calculateModelStats(cube, size);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement) return;

      switch(e.key.toLowerCase()) {
        case 'r':
          resetCamera();
          break;
        case 'm':
          handleToolSelect('measure');
          break;
        case 'p':
          handleToolSelect('pivot');
          break;
        case 'w':
          setIsWireframe(prev => !prev);
          break;
        case 'escape':
          setActiveTool('none');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [resetCamera]);

  return (
    <div
      className="w-full h-screen flex bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 bg-indigo-600/20 dark:bg-indigo-500/20 backdrop-blur-sm flex items-center justify-center pointer-events-none animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border-2 border-dashed border-indigo-500 dark:border-indigo-400">
            <div className="text-center">
              <Upload className="w-16 h-16 mx-auto mb-4 text-indigo-600 dark:text-indigo-400" />
              <p className="text-xl font-semibold text-gray-900 dark:text-white">Drop your 3D model here</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">STL or FBX files</p>
            </div>
          </div>
        </div>
      )}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Clean Minimal Header */}
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

                {/* Center: Primary Action - Hidden on mobile and in sample mode */}
                {!showWelcomeModal && !isSampleMode && (
                  <label className="hidden md:flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white px-5 py-2 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-offset-slate-900 text-sm font-medium">
                      <Upload className="w-4 h-4" aria-hidden="true" />
                      Upload Model
                      <input
                        type="file"
                        accept=".stl,.fbx"
                        onChange={handleFileUpload}
                        className="hidden"
                        aria-label="Upload 3D model file"
                      />
                  </label>
                )}

                {/* Right: Theme & Panel Toggle */}
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <button
                      onClick={() => setIsPanelOpen(!isPanelOpen)}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-all duration-200 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      aria-label={isPanelOpen ? 'Close properties panel' : 'Open properties panel'}
                      aria-expanded={isPanelOpen}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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
                      <div className="w-3.5 h-3.5 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                      Loading model...
                    </div>
                  )}
                  {error && (
                    <div className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-sm animate-slide-up" role="alert">
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

        {/* 3D Viewport */}
        <div ref={containerRef} className="flex-1 relative">
            {/* Empty State */}
            {!currentModelRef.current && !loading && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600 pointer-events-none animate-fade-in">
                    <div className="text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 mx-auto mb-4 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1} aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">Drag & drop a 3D model here</p>
                        <p className="text-sm mt-2 text-gray-400 dark:text-gray-500">or click Upload • Supported formats: STL, FBX</p>
                    </div>
                </div>
            )}

            {/* Left Toolbar - Floating */}
            <div className="absolute top-4 left-2 md:left-4 glass rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl overflow-hidden animate-fade-in z-10">
                <div className="flex flex-col divide-y divide-gray-200 dark:divide-slate-700">
                    {/* Tools Section */}
                    <div className="p-2 space-y-1">
                        <button
                          onClick={() => handleToolSelect('measure')}
                          title="Measure Distance (M)"
                          className={`w-full p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center group ${
                            activeTool === 'measure'
                              ? 'bg-amber-500 dark:bg-amber-400 text-white shadow-lg'
                              : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                          }`}
                          aria-label="Activate measurement tool"
                          aria-pressed={activeTool === 'measure'}
                        >
                            <RulerDimensionLine className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleToolSelect('pivot')}
                          title="Set Pivot Point (P)"
                          className={`w-full p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center group ${
                            activeTool === 'pivot'
                              ? 'bg-blue-500 dark:bg-blue-400 text-white shadow-lg'
                              : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                          }`}
                          aria-label="Activate pivot point tool"
                          aria-pressed={activeTool === 'pivot'}
                        >
                            <Axis3d className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => setIsWireframe(!isWireframe)}
                          title="Toggle Wireframe (W)"
                          className={`w-full p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center group ${
                            isWireframe
                              ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-lg'
                              : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300'
                          }`}
                          aria-label="Toggle wireframe mode"
                          aria-pressed={isWireframe}
                        >
                            <Box className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>

                    {/* View Controls */}
                    <div className="p-2 space-y-1">
                        <button
                          onClick={resetCamera}
                          title="Reset Camera (R)"
                          className="w-full p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                          aria-label="Reset camera view"
                        >
                            <Rotate3d className="h-5 w-5" aria-hidden="true" />
                        </button>
                        <button
                          onClick={saveCurrentView}
                          title="Save Current View"
                          className="w-full p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300"
                          aria-label="Save current camera view"
                        >
                            <Bookmark className="h-5 w-5" aria-hidden="true" />
                        </button>
                    </div>

                    {/* Color Pickers */}
                    <div className="p-2 space-y-2">
                        <div className="flex items-center justify-center">
                            <input
                              id="model-color-picker"
                              type="color"
                              value={modelColor}
                              onChange={(e) => setModelColor(e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-slate-700"
                              title="Model Color"
                              aria-label="Choose model color"
                            />
                        </div>
                        <div className="flex items-center justify-center">
                            <input
                              id="bg-color-picker-toolbar"
                              type="color"
                              value={backgroundColor}
                              onChange={(e) => setBackgroundColor(e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer border-2 border-gray-200 dark:border-slate-700"
                              title="Background Color"
                              aria-label="Choose background color"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Toolbar - Saved Views (only show if views exist) - Hidden on small mobile */}
            {savedViews.length > 0 && (
              <div className="hidden sm:block absolute top-4 right-4 glass rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl p-3 animate-fade-in z-10 max-w-xs">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Saved Views</h3>
                  <div className="space-y-1">
                      {savedViews.map((view, i) => (
                        <button
                          key={i}
                          onClick={() => loadView(i)}
                          className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 transition-colors"
                        >
                          {view.name}
                        </button>
                      ))}
                  </div>
              </div>
            )}

            {/* Keyboard Shortcuts Help - Bottom Left - Hidden on mobile */}
            <div className="hidden md:block absolute bottom-4 left-4 glass text-gray-800 dark:text-gray-200 p-3 rounded-xl text-xs shadow-xl pointer-events-none border border-gray-200/50 dark:border-slate-700/50 max-w-[200px] animate-slide-up">
                <div className="space-y-1 opacity-60 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px] font-mono min-w-[20px] text-center">R</kbd>
                    <span className="text-[11px]">Reset</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px] font-mono min-w-[20px] text-center">M</kbd>
                    <span className="text-[11px]">Measure</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px] font-mono min-w-[20px] text-center">P</kbd>
                    <span className="text-[11px]">Pivot</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-700 rounded text-[10px] font-mono min-w-[20px] text-center">W</kbd>
                    <span className="text-[11px]">Wireframe</span>
                  </div>
                </div>
            </div>

            {/* Mobile Upload FAB - Bottom Right - Only visible on mobile and not in sample mode */}
            {!showWelcomeModal && !isSampleMode && !isPanelOpen && (
              <label className="md:hidden fixed bottom-4 right-4 z-20 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white rounded-full cursor-pointer transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-offset-slate-900 animate-fade-in">
                  <Upload className="w-6 h-6" aria-hidden="true" />
                  <input
                    type="file"
                    accept=".stl,.fbx"
                    onChange={handleFileUpload}
                    className="hidden"
                    aria-label="Upload 3D model file"
                  />
              </label>
            )}
        </div>

        {/* Footer - Hidden on mobile */}
        <footer className="hidden md:block glass p-3 text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-slate-700 text-center z-10" role="contentinfo">
          {getFooterText()}
        </footer>
      </main>

      {/* Side Panel - Desktop: Sidebar, Mobile: Full-screen overlay */}
      <aside
        className={`transition-all duration-300 ease-in-out glass flex-shrink-0 overflow-y-auto
          ${isPanelOpen
            ? 'md:w-80 md:p-4 md:opacity-100 md:border-l md:border-gray-200 md:dark:border-slate-700 fixed md:relative inset-0 md:inset-auto w-full p-6 opacity-100 z-30 md:z-auto'
            : 'w-0 p-0 opacity-0 pointer-events-none border-0'
          }`}
        aria-hidden={!isPanelOpen}
      >
        {isPanelOpen && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">Model Properties</h2>
              {/* Close button - Only visible on mobile */}
              <button
                onClick={() => setIsPanelOpen(false)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-700 dark:text-gray-300"
                aria-label="Close properties panel"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Material Selection */}
            <div className="mb-6 animate-fade-in">
              <label htmlFor="material-select" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Print Materials
              </label>
              <select
                id="material-select"
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
              >
                <option value="">Select material...</option>
                <option value="asa">ASA - Durable and weather-resistant (outdoor use)</option>
                <option value="tpu">TPU - Flexible rubber-like material</option>
                <option value="pla">PLA - Affordable (prototypes)</option>
                <option value="petg">PETG - Durable and tough (functional parts)</option>
                <option value="nylon-carbon">Nylon + carbon fiber - Extremely strong and lightweight</option>
                <option value="resin-standard">Resin - ABS-type (fine details)</option>
                <option value="resin-clear">Resin - Clear alternative</option>
              </select>
              {selectedMaterial && (
                <div className="mt-2 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs text-indigo-700 dark:text-indigo-300">
                    {selectedMaterial === 'asa' && 'Durable and weather-resistant material, perfect for outdoor use.'}
                    {selectedMaterial === 'tpu' && 'Flexible rubber-like material for flexible and soft parts.'}
                    {selectedMaterial === 'pla' && 'Affordable and easy material for prototypes and visual models.'}
                    {selectedMaterial === 'petg' && 'Durable and tough material, perfect for functional parts.'}
                    {selectedMaterial === 'nylon-carbon' && 'Extremely strong and lightweight composite for technical and demanding parts.'}
                    {selectedMaterial === 'resin-standard' && 'Best suited for fine detail prints. More durable ABS-type resin.'}
                    {selectedMaterial === 'resin-clear' && 'Clear resin alternative for fine detail prints.'}
                  </p>
                </div>
              )}
            </div>

            {/* Model Scale Control */}
            {modelStats && (
              <div className="mb-6 animate-fade-in">
                <label htmlFor="model-scale" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Model Size
                </label>
                <div className="space-y-2">
                  <input
                    id="model-scale"
                    type="range"
                    min="10"
                    max="300"
                    value={modelScale}
                    onChange={(e) => setModelScale(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400">10%</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="10"
                        max="300"
                        value={modelScale}
                        onChange={(e) => {
                          const value = Math.min(300, Math.max(10, Number(e.target.value)));
                          setModelScale(value);
                        }}
                        className="w-16 px-2 py-1 text-center text-sm bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">300%</span>
                  </div>
                  <button
                    onClick={() => setModelScale(100)}
                    className="w-full mt-1 px-3 py-1.5 text-xs bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                  >
                    Reset to default size
                  </button>
                </div>
              </div>
            )}

            {modelStats ? (
                <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300 md:whitespace-nowrap animate-fade-in">
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                      <strong className="block text-gray-600 dark:text-gray-400 text-xs mb-1">Vertices</strong>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{modelStats.vertices.toLocaleString()}</span>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-lg">
                      <strong className="block text-gray-600 dark:text-gray-400 text-xs mb-1">Triangles</strong>
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">{modelStats.triangles.toLocaleString()}</span>
                    </div>
                    <div className="pt-2">
                        <strong className="block text-gray-600 dark:text-gray-400 text-xs mb-2">Original Dimensions</strong>
                        <div className="space-y-2 pl-2">
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">X:</span>
                            <span className="font-mono text-gray-900 dark:text-white">{modelStats.dimensions.x}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Y:</span>
                            <span className="font-mono text-gray-900 dark:text-white">{modelStats.dimensions.y}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500 dark:text-gray-400">Z:</span>
                            <span className="font-mono text-gray-900 dark:text-white">{modelStats.dimensions.z}</span>
                          </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-4 mt-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
                      <button
                        onClick={() => setIsQuoteModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 dark:from-indigo-500 dark:to-purple-500 dark:hover:from-indigo-600 dark:hover:to-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                      >
                        <Send className="w-4 h-4" />
                        Request Quote
                      </button>
                      <button
                        onClick={handleRefreshModel}
                        className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-[1.02]"
                        title="Upload a different model while keeping your information"
                      >
                        <RefreshCw className="w-4 h-4" />
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

      {/* Modals */}
      <WelcomeModal
        isOpen={showWelcomeModal}
        onGetQuote={handleGetQuote}
        onTrySample={handleTrySample}
      />

      <EmailVerificationModal
        isOpen={showEmailModal}
        onVerified={handleEmailVerified}
        onClose={() => setShowEmailModal(false)}
      />

      {/* Quote Request Modal */}
      <QuoteRequestModal
        isOpen={isQuoteModalOpen}
        onClose={() => setIsQuoteModalOpen(false)}
        modelData={modelStats ? {
          fileName: currentFileName,
          vertices: modelStats.vertices,
          triangles: modelStats.triangles,
          dimensions: modelStats.dimensions,
          material: selectedMaterial,
          scale: modelScale,
        } : null}
        modelFile={currentFile}
        userInfo={userName && userEmail ? {
          name: userName,
          email: userEmail,
        } : undefined}
      />

      {/* Footer Attribution */}
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
    </div>
  );
}
