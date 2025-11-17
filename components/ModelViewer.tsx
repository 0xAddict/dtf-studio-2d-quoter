import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

type ActiveTool = 'none' | 'measure' | 'pivot';

const createPivotHelper = () => {
    const group = new THREE.Group();
    const axes = new THREE.AxesHelper(0.5); // Larger axes
    const sphereGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff, depthTest: false, transparent: true, opacity: 0.9 });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(axes);
    group.add(sphere);
    return group;
};

export default function ModelViewer() {
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

  // New feature states
  const [isWireframe, setIsWireframe] = useState(false);
  const [modelColor, setModelColor] = useState('#00b4d8');
  const [backgroundColor, setBackgroundColor] = useState('#808080');
  const [savedViews, setSavedViews] = useState<{ name: string; position: [number, number, number]; target: [number, number, number] }[]>([]);
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [modelStats, setModelStats] = useState<{ vertices: number; triangles: number; dimensions: { x: string; y: string; z: string; } } | null>(null);

  // Tool state
  const measurementHelpersRef = useRef<THREE.Group>(new THREE.Group());
  const pivotHelperRef = useRef<THREE.Group>(createPivotHelper());
  const [activeTool, setActiveTool] = useState<ActiveTool>('none');
  const [measurementInfo, setMeasurementInfo] = useState<{ points: THREE.Vector3[], distance: number | null }>({ points: [], distance: null });

  // Scene setup
  useEffect(() => {
    if (!containerRef.current) return;
    const currentContainer = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(backgroundColor);
    sceneRef.current = scene;
    scene.add(measurementHelpersRef.current);
    pivotHelperRef.current.visible = false;
    scene.add(pivotHelperRef.current);

    const camera = new THREE.PerspectiveCamera(75, currentContainer.clientWidth / currentContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(currentContainer.clientWidth, currentContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    currentContainer.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight1.position.set(5, 10, 7.5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight2.position.set(-5, 10, -7.5);
    scene.add(directionalLight2);
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.4);
    scene.add(hemisphereLight);

    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

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
        // Wrapping the resize logic in requestAnimationFrame is a common way to avoid
        // the "ResizeObserver loop completed with undelivered notifications" error.
        // It ensures that the resizing logic runs in sync with the browser's rendering cycle,
        // preventing timing conflicts with React's DOM updates.
        requestAnimationFrame(() => {
            if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
            cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        });
    });
    observer.observe(currentContainer);
    
    return () => {
      observer.disconnect();
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      if (rendererRef.current) rendererRef.current.dispose();
      if (controlsRef.current) controlsRef.current.dispose();
      if (currentContainer && rendererRef.current?.domElement) {
        currentContainer.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Effect for pointer events to handle tools - separated to get fresh 'activeTool' state
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
                        const material = new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.8 });
                        const sphere = new THREE.Mesh(geometry, material);
                        sphere.position.copy(p);
                        measurementHelpersRef.current.add(sphere);
                    });
        
                    if (newPoints.length === 2) {
                        newDistance = newPoints[0].distanceTo(newPoints[1]);
                        const material = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 2, transparent: true, opacity: 0.8 });
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

  const updateMaterialProperties = (object: THREE.Object3D) => {
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
  };

  useEffect(() => {
    if (currentModelRef.current) {
      updateMaterialProperties(currentModelRef.current);
    }
  }, [isWireframe, modelColor]);


  const removeCurrentModel = () => {
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
  };

  const centerAndScaleModel = (object: THREE.Object3D) => {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 1. Center the geometry at the world origin
    object.position.sub(center);

    // 2. Scale the model uniformly to a visible size
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4 / maxDim;
    object.scale.multiplyScalar(scale);

    // 3. IMPORTANT: Update the model's world matrix so the new bounding box is accurate.
    object.updateMatrixWorld(true);

    // 4. Recalculate the bounding box after transformations
    const newBox = new THREE.Box3().setFromObject(object);

    // 5. Translate the model so its lowest point is on the grid floor (y=0)
    object.position.y -= newBox.min.y;
    
    return { size, scale };
  };

  const calculateModelStats = (object: THREE.Object3D, originalSize: THREE.Vector3) => {
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
  }

  const loadModel = (file: File, loader: STLLoader | FBXLoader, parser: (data: ArrayBuffer | string) => THREE.Object3D | THREE.BufferGeometry) => {
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
  };

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
  
  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 2, 5);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      pivotHelperRef.current.visible = false;
    }
  };

  const saveCurrentView = () => {
    if (!cameraRef.current || !controlsRef.current) return;
    const name = `View ${savedViews.length + 1}`;
    setSavedViews([...savedViews, {
        name,
        position: cameraRef.current.position.toArray(),
        target: controlsRef.current.target.toArray(),
    }]);
  };

  const loadView = (index: number) => {
    if (!cameraRef.current || !controlsRef.current || !savedViews[index]) return;
    const view = savedViews[index];
    cameraRef.current.position.fromArray(view.position);
    controlsRef.current.target.fromArray(view.target);
    pivotHelperRef.current.position.fromArray(view.target);
    pivotHelperRef.current.visible = !(new THREE.Vector3().fromArray(view.target).equals(new THREE.Vector3(0,0,0)));
  };
  
  const handleToolSelect = (tool: ActiveTool) => {
    setActiveTool(prev => prev === tool ? 'none' : tool);
  }

  const getFooterText = () => {
    switch(activeTool) {
        case 'measure':
            return <span className="text-yellow-400"><strong>Measuring:</strong> {measurementInfo.distance ? `Distance: ${measurementInfo.distance.toFixed(3)} units` : 'Click first point on model...'}</span>;
        case 'pivot':
            return <span className="text-blue-400"><strong>Set Pivot:</strong> Click a point on the model to set the new orbit center.</span>;
        default:
            return <span><strong className="text-white">Controls:</strong> Left click + drag to rotate • Right click + drag to pan • Scroll to zoom</span>;
    }
  }

  return (
    <div className="w-full h-screen flex bg-gray-900 text-white overflow-hidden">
      <main className="flex-1 flex flex-col relative">
        <header className="bg-gray-800/50 backdrop-blur-sm p-4 shadow-lg border-b border-gray-700 z-10">
            <div className="flex justify-between items-center mb-3">
                <h1 className="text-xl md:text-2xl font-bold text-cyan-400">3D Model Viewer</h1>
                <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="p-2 rounded-md hover:bg-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPanelOpen ? "M17 8l4 4m0 0l-4 4m4-4H3" : "M4 8h16M4 16h16"} /></svg>
                </button>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                {/* File Upload */}
                <label className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-md cursor-pointer transition-all duration-300 transform hover:scale-105">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H5.5z" /><path d="M9 13.5V9m0 0l-2 2m2-2l2 2" /></svg>
                    Upload Model
                    <input type="file" accept=".stl,.fbx" onChange={handleFileUpload} className="hidden" />
                </label>
                
                {/* View Controls */}
                <div className="flex items-center gap-2">
                    <button onClick={resetCamera} title="Reset Camera" className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm10 10a1 1 0 011 1v2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 111.885-.666A5.002 5.002 0 0014.001 13H11a1 1 0 010 2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101z" clipRule="evenodd" /></svg></button>
                    <button onClick={saveCurrentView} title="Save View" className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V4zm2 0v1h6V4H7zm6 2H7v1h6V6zm-1 3H8v1h4V9zm-1 3H9v1h2v-1z" /></svg></button>
                    <select onChange={(e) => loadView(parseInt(e.target.value))} defaultValue="" className="flex-1 bg-gray-700 text-white px-2 py-2 rounded-md outline-none focus:ring-2 focus:ring-cyan-500">
                        <option value="" disabled>Load View</option>
                        {savedViews.map((view, i) => <option key={i} value={i}>{view.name}</option>)}
                    </select>
                </div>

                {/* Display Controls */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-700 rounded-md p-1 flex-1">
                        <label htmlFor="bg-color-picker" className="text-xs px-1" title="Background Color">BG</label>
                        <input id="bg-color-picker" type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-8 h-7 rounded border-none bg-gray-700 cursor-pointer" />
                    </div>
                    <div className="flex items-center gap-1 bg-gray-700 rounded-md p-1 flex-1">
                        <label htmlFor="color-picker" className="text-xs px-1" title="Model Color">Model</label>
                        <input id="color-picker" type="color" value={modelColor} onChange={(e) => setModelColor(e.target.value)} className="w-8 h-7 rounded border-none bg-gray-700 cursor-pointer" />
                    </div>
                    <button onClick={() => setIsWireframe(!isWireframe)} title="Toggle Wireframe" className={`flex-1 py-2 rounded-md transition-colors text-sm ${isWireframe ? 'bg-cyan-600' : 'bg-gray-700 hover:bg-gray-600'}`}>Wireframe</button>
                </div>
                
                {/* Tools */}
                <div className="flex items-center gap-2">
                    <button onClick={() => handleToolSelect('measure')} title="Measure Distance" className={`flex-1 flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition-colors ${activeTool === 'measure' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 2a1 1 0 011-1h8a1 1 0 011 1v1.586l-2.293-2.293a1 1 0 00-1.414 1.414L10 5.414l-2.293-2.293a1 1 0 00-1.414-1.414L4 3.586V2a1 1 0 011-1zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm1 3a1 1 0 100 2h8a1 1 0 100-2H5zm1 3a1 1 0 100 2h6a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => handleToolSelect('pivot')} title="Set Pivot Point" className={`flex-1 flex items-center justify-center gap-2 text-white px-4 py-2 rounded-md transition-colors ${activeTool === 'pivot' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                    </button>
                </div>
            </div>
            
            <div className="mt-3 text-sm space-y-2">
                {loading && <div className="text-cyan-400 flex items-center gap-2"><div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>Loading...</div>}
                {error && <div className="text-red-400 bg-red-900/30 px-3 py-2 rounded-md"><strong>Error:</strong> {error}</div>}
                {modelInfo && !error && <div className="text-green-400 bg-green-900/30 px-3 py-2 rounded-md">{modelInfo}</div>}
            </div>
        </header>
        
        <div ref={containerRef} className="flex-1 relative">
            {!currentModelRef.current && !loading && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 pointer-events-none">
                    <div className="text-center p-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12.792V6.208a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6.208v6.584L5.25 18h11.563M18 12.75l-3 3m0 0l-3-3m3 3V3.75" /><path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.75h5.513c.621 0 1.125.504 1.125 1.125v13.027c0 .621-.504 1.125-1.125 1.125H5.737a1.125 1.125 0 01-1.125-1.125V4.875c0-.621.504-1.125 1.125-1.125h5.513" /></svg>
                        <p className="text-xl text-gray-400">Upload a 3D model to get started</p>
                        <p className="text-sm mt-2 text-gray-500">Supported formats: STL, FBX</p>
                    </div>
                </div>
            )}
            <div className="absolute bottom-4 left-4 bg-gray-900/50 backdrop-blur-sm text-white p-3 rounded-lg text-xs leading-relaxed shadow-lg pointer-events-none">
                <h3 className="font-bold text-sm mb-1 text-cyan-400">Controls</h3>
                <div><strong className="w-16 inline-block">Rotate:</strong> Left Mouse</div>
                <div><strong className="w-16 inline-block">Pan:</strong> Right Mouse</div>
                <div><strong className="w-16 inline-block">Zoom:</strong> Scroll Wheel</div>
            </div>
        </div>
        
        <footer className="bg-gray-800/50 backdrop-blur-sm p-3 text-sm text-gray-400 border-t border-gray-700 text-center z-10">
          {getFooterText()}
        </footer>
      </main>

      <aside className={`transition-all duration-300 ease-in-out bg-gray-800/80 backdrop-blur-sm border-l border-gray-700 flex-shrink-0 ${isPanelOpen ? 'w-80 p-4' : 'w-0 p-0'} overflow-hidden`}>
        <h2 className="text-lg font-bold text-cyan-400 mb-4 whitespace-nowrap">Model Properties</h2>
        {modelStats ? (
            <div className="space-y-3 text-sm text-gray-300 whitespace-nowrap">
                <div><strong className="w-24 inline-block text-gray-400">Vertices:</strong> {modelStats.vertices.toLocaleString()}</div>
                <div><strong className="w-24 inline-block text-gray-400">Triangles:</strong> {modelStats.triangles.toLocaleString()}</div>
                 <div className="pt-2">
                    <strong className="block text-gray-400 mb-1">Original Dimensions:</strong>
                    <div><span className="w-8 inline-block text-gray-500">X:</span> {modelStats.dimensions.x}</div>
                    <div><span className="w-8 inline-block text-gray-500">Y:</span> {modelStats.dimensions.y}</div>
                    <div><span className="w-8 inline-block text-gray-500">Z:</span> {modelStats.dimensions.z}</div>
                </div>
            </div>
        ) : (
            <div className="text-sm text-gray-500 italic whitespace-nowrap">
                No model loaded.
            </div>
        )}
      </aside>
    </div>
  );
}
