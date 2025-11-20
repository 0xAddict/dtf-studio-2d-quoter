import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';
import { WelcomeModal } from './WelcomeModal';
import { EmailVerificationModal } from './EmailVerificationModal';
import { QuoteForm, QuoteData } from './QuoteForm';
import { QuoteDisplay } from './QuoteDisplay';
import { Upload, Rotate3d, Bookmark, RulerDimensionLine, Axis3d, Box } from 'lucide-react';

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
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [modelStats, setModelStats] = useState<{ vertices: number; triangles: number; dimensions: { x: string; y: string; z: string; } } | null>(null);

  // Tool state
  const measurementHelpersRef = useRef<THREE.Group>(new THREE.Group());
  const pivotHelperRef = useRef<THREE.Group>(createPivotHelper());
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  const [measurementInfo, setMeasurementInfo] = useState<{ points: THREE.Vector3[], distance: number | null }>({ points: [], distance: null });

  // Modal and flow states
  const [showWelcomeModal, setShowWelcomeModal] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [showQuoteDisplay, setShowQuoteDisplay] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [currentQuote, setCurrentQuote] = useState<any>(null);
  const [currentModelName, setCurrentModelName] = useState<string>('');

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

  // Scene setup - retry when modal closes if initialization was skipped
  useEffect(() => {
    if (!containerRef.current) return;
    if (sceneInitializedRef.current) return; // Prevent re-initialization
    const currentContainer = containerRef.current;

    // Ensure container has valid dimensions before initializing Three.js
    const width = currentContainer.clientWidth;
    const height = currentContainer.clientHeight;

    if (width === 0 || height === 0) {
      console.warn('Container has invalid dimensions, waiting for valid size. Current:', width, 'x', height);
      return;
    }

    console.log('Initializing Three.js scene with dimensions:', width, 'x', height);

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
      console.log('Three.js scene initialized successfully');

      return () => {
        observer.disconnect();
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
        if (rendererRef.current) {
          rendererRef.current.dispose();
        }
        if (controlsRef.current) controlsRef.current.dispose();
        if (currentContainer && rendererRef.current?.domElement) {
          try {
            currentContainer.removeChild(rendererRef.current.domElement);
          } catch (e) {
            // Element might already be removed
          }
        }
      };
    } catch (error) {
      console.error('Error initializing Three.js scene:', error);
      return () => {
        // Cleanup in case of error
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      };
    }
  }, [showWelcomeModal, backgroundColor]); // Re-run when modal closes or theme changes

  // Update lights and grid when theme changes (without recreating scene)
  useEffect(() => {
    if (!lightsRef.current.ambient) return;

    if (lightsRef.current.ambient) {
      lightsRef.current.ambient.intensity = isDark ? 0.5 : 0.7;
    }
    if (lightsRef.current.directional1) {
      lightsRef.current.directional1.intensity = isDark ? 0.7 : 0.9;
    }
    if (lightsRef.current.directional2) {
      lightsRef.current.directional2.intensity = isDark ? 0.3 : 0.5;
    }
    if (lightsRef.current.hemisphere) {
      lightsRef.current.hemisphere.skyColor.setHex(isDark ? 0x4a5568 : 0xffffbb);
      lightsRef.current.hemisphere.groundColor.setHex(isDark ? 0x1e293b : 0x080820);
      lightsRef.current.hemisphere.intensity = isDark ? 0.3 : 0.4;
    }
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
            material.color = newColor;
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

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'stl') {
      loadModel(file, new STLLoader(), (data) => new STLLoader().parse(data as ArrayBuffer));
    } else if (extension === 'fbx') {
      loadModel(file, new FBXLoader(), (data) => new FBXLoader().parse(data as ArrayBuffer, ''));
    } else {
      setError('Unsupported file format. Please upload STL or FBX files.');
    }
    event.target.value = '';
  };

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
    loadSampleModel();
  };

  const handleEmailVerified = (email: string) => {
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

    setCurrentModelName('Sample Cube');
    setModelInfo('Sample model loaded: Cube');
    calculateModelStats(cube, size);
  };

  const handleQuoteSubmit = (quoteData: QuoteData) => {
    // Generate mock quote
    const materialPrices: { [key: string]: number } = {
      pla: 0.05,
      abs: 0.08,
      petg: 0.10,
      nylon: 0.15,
      resin: 0.20,
      metal: 0.50,
    };

    const finishPrices: { [key: string]: number } = {
      standard: 0,
      smooth: 15,
      painted: 30,
      premium: 50,
    };

    // Mock volume calculation (in cm³)
    const mockVolume = 100 * (quoteData.scale / 100) ** 3;

    const baseCost = 10;
    const materialCost = mockVolume * (materialPrices[quoteData.material] || 0.05) * quoteData.quantity;
    const finishCost = (finishPrices[quoteData.finishType] || 0) * quoteData.quantity;
    const total = baseCost + materialCost + finishCost;

    // Calculate delivery date (5-10 business days)
    const deliveryDays = Math.floor(Math.random() * 6) + 5;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);

    const quote = {
      quoteId: `HF-${Date.now().toString(36).toUpperCase()}`,
      modelName: currentModelName,
      email: userEmail || 'demo@example.com',
      quoteData,
      pricing: {
        baseCost,
        materialCost,
        finishCost,
        total,
      },
      estimatedDelivery: `${deliveryDays} business days (${deliveryDate.toLocaleDateString()})`,
      createdAt: new Date().toLocaleString(),
    };

    setCurrentQuote(quote);
    setShowQuoteForm(false);
    setShowQuoteDisplay(true);
  };

  const handleNewQuote = () => {
    setShowQuoteDisplay(false);
    setCurrentQuote(null);
    removeCurrentModel();
    setCurrentModelName('');
  };

  const handleModelUploadForQuote = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCurrentModelName(file.name);

    // Load the model first
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'stl') {
      loadModel(file, new STLLoader(), (data) => new STLLoader().parse(data as ArrayBuffer));
    } else if (extension === 'fbx') {
      loadModel(file, new FBXLoader(), (data) => new FBXLoader().parse(data as ArrayBuffer, ''));
    } else {
      setError('Unsupported file format. Please upload STL or FBX files.');
      event.target.value = '';
      return;
    }

    // Show quote form after upload
    setTimeout(() => {
      setShowQuoteForm(true);
    }, 1000);

    event.target.value = '';
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
    <div className="w-full h-screen flex bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
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

                {/* Center: Primary Action - Hidden on mobile */}
                {!showWelcomeModal && (
                  <label className="hidden md:flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white px-5 py-2 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 hover:shadow-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-offset-slate-900 text-sm font-medium">
                      <Upload className="w-4 h-4" aria-hidden="true" />
                      Upload Model
                      <input
                        type="file"
                        accept=".stl,.fbx"
                        onChange={userEmail ? handleModelUploadForQuote : handleFileUpload}
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
                        <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">Upload a 3D model to get started</p>
                        <p className="text-sm mt-2 text-gray-400 dark:text-gray-500">Supported formats: STL, FBX</p>
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

            {/* Mobile Upload FAB - Bottom Right - Only visible on mobile */}
            {!showWelcomeModal && (
              <label className="md:hidden absolute bottom-4 right-4 z-20 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 dark:from-indigo-500 dark:to-indigo-600 dark:hover:from-indigo-600 dark:hover:to-indigo-700 text-white rounded-full cursor-pointer transition-all duration-200 transform hover:scale-110 active:scale-95 shadow-lg hover:shadow-xl focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500 dark:focus-within:ring-offset-slate-900 animate-fade-in">
                  <Upload className="w-6 h-6" aria-hidden="true" />
                  <input
                    type="file"
                    accept=".stl,.fbx"
                    onChange={userEmail ? handleModelUploadForQuote : handleFileUpload}
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

      {currentModelName && (
        <QuoteForm
          isOpen={showQuoteForm}
          modelName={currentModelName}
          onSubmit={handleQuoteSubmit}
          onClose={() => setShowQuoteForm(false)}
        />
      )}

      {currentQuote && (
        <QuoteDisplay
          isOpen={showQuoteDisplay}
          quote={currentQuote}
          onClose={() => setShowQuoteDisplay(false)}
          onNewQuote={handleNewQuote}
        />
      )}
    </div>
  );
}
