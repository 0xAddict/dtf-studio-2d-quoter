import { useCallback, useRef, useState } from 'react';
import * as THREE from 'three';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

export interface ModelStats {
  vertices: number;
  triangles: number;
  dimensions: {
    x: string;
    y: string;
    z: string;
  };
}

export interface UseModelLoaderOptions {
  initialColor?: string;
  initialWireframe?: boolean;
  onLoadStart?: () => void;
  onLoadComplete?: (stats: ModelStats) => void;
  onLoadError?: (error: string) => void;
}

export interface UseModelLoaderReturn {
  loading: boolean;
  error: string;
  modelStats: ModelStats | null;
  currentModel: THREE.Object3D | null;
  currentFileName: string;
  currentFile: File | null;
  baseScale: number;

  // Actions
  loadModelFromFile: (file: File, scene: THREE.Scene, controls?: THREE.EventDispatcher) => void;
  loadModelFromUrl: (url: string, fileName: string, scene: THREE.Scene, controls?: THREE.EventDispatcher) => Promise<void>;
  removeModel: (scene: THREE.Scene) => void;
  updateMaterialProperties: (color: string, wireframe: boolean) => void;
  applyScale: (scale: number) => void;
  centerAndScaleModel: (object: THREE.Object3D) => { size: THREE.Vector3; scale: number };
  calculateModelStats: (object: THREE.Object3D, originalSize: THREE.Vector3) => ModelStats;
}

/**
 * Custom hook for handling 3D model loading, centering, scaling, and management.
 * Extracts the model loading logic from ModelViewer.tsx for better separation of concerns.
 */
export function useModelLoader(options: UseModelLoaderOptions = {}): UseModelLoaderReturn {
  const {
    initialColor = '#6366f1',
    initialWireframe = false,
    onLoadStart,
    onLoadComplete,
    onLoadError,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);
  const [currentFileName, setCurrentFileName] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const currentModelRef = useRef<THREE.Object3D | null>(null);
  const baseScaleRef = useRef<number>(1);
  const currentColorRef = useRef<string>(initialColor);
  const currentWireframeRef = useRef<boolean>(initialWireframe);

  /**
   * Center the model at origin and scale it to fit within a reasonable viewport size.
   */
  const centerAndScaleModel = useCallback((object: THREE.Object3D): { size: THREE.Vector3; scale: number } => {
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

  /**
   * Calculate and return model statistics (vertices, triangles, dimensions).
   */
  const calculateModelStats = useCallback((object: THREE.Object3D, originalSize: THREE.Vector3): ModelStats => {
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

    return {
      vertices,
      triangles: Math.round(triangles),
      dimensions: {
        x: originalSize.x.toFixed(3),
        y: originalSize.y.toFixed(3),
        z: originalSize.z.toFixed(3),
      },
    };
  }, []);

  /**
   * Update material properties (color, wireframe) on the current model.
   */
  const updateMaterialProperties = useCallback((color: string, wireframe: boolean) => {
    currentColorRef.current = color;
    currentWireframeRef.current = wireframe;

    if (!currentModelRef.current) return;

    const newColor = new THREE.Color(color);
    currentModelRef.current.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(material => {
          if (material instanceof THREE.MeshStandardMaterial || material instanceof THREE.MeshPhongMaterial) {
            material.wireframe = wireframe;
            material.color.copy(newColor);
          }
        });
      }
    });
  }, []);

  /**
   * Apply a scale percentage to the current model.
   */
  const applyScale = useCallback((scalePercent: number) => {
    if (!currentModelRef.current || !baseScaleRef.current) return;

    const newScale = baseScaleRef.current * (scalePercent / 100);
    currentModelRef.current.scale.setScalar(newScale);

    // Recalculate position to keep model on the grid
    const box = new THREE.Box3().setFromObject(currentModelRef.current);
    currentModelRef.current.position.y -= box.min.y;
  }, []);

  /**
   * Remove the current model from the scene and clean up resources.
   */
  const removeModel = useCallback((scene: THREE.Scene) => {
    if (currentModelRef.current) {
      scene.remove(currentModelRef.current);
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
    }

    setModelStats(null);
    setCurrentFileName('');
    setCurrentFile(null);
    baseScaleRef.current = 1;
  }, []);

  /**
   * Internal function to process and add a loaded model to the scene.
   */
  const processLoadedModel = useCallback((
    object: THREE.Object3D,
    file: File,
    scene: THREE.Scene,
    controls?: any
  ) => {
    // Set up shadows for all meshes
    object.traverse(child => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Center and scale the model
    const { size } = centerAndScaleModel(object);

    // Apply current material properties
    updateMaterialProperties(currentColorRef.current, currentWireframeRef.current);

    // Add to scene
    scene.add(object);
    currentModelRef.current = object;

    // Set pivot point to center of model (origin after centering)
    if (controls && 'target' in controls) {
      controls.target.set(0, 0, 0);
    }

    // Calculate and set model stats
    const stats = calculateModelStats(object, size);
    setModelStats(stats);
    setCurrentFileName(file.name);
    setCurrentFile(file);

    onLoadComplete?.(stats);
  }, [centerAndScaleModel, updateMaterialProperties, calculateModelStats, onLoadComplete]);

  /**
   * Load a model from a File object.
   */
  const loadModelFromFile = useCallback((
    file: File,
    scene: THREE.Scene,
    controls?: THREE.EventDispatcher
  ) => {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension !== 'stl' && extension !== 'fbx') {
      setError('Unsupported file format. Please upload STL or FBX files.');
      onLoadError?.('Unsupported file format');
      return;
    }

    setLoading(true);
    setError('');
    onLoadStart?.();

    // Remove any existing model first
    removeModel(scene);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) throw new Error('File could not be read.');

        let object: THREE.Object3D;

        if (extension === 'stl') {
          const loader = new STLLoader();
          const geometry = loader.parse(result as ArrayBuffer);

          const material = new THREE.MeshPhongMaterial({
            color: currentColorRef.current,
            specular: 0x111111,
            shininess: 200,
            wireframe: currentWireframeRef.current,
          });

          object = new THREE.Mesh(geometry, material);
        } else {
          const loader = new FBXLoader();
          object = loader.parse(result as ArrayBuffer, '');
        }

        processLoadedModel(object, file, scene, controls);
      } catch (err: any) {
        const errorMessage = `Error loading model: ${err.message}`;
        setError(errorMessage);
        onLoadError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setLoading(false);
      setError('Error reading file');
      onLoadError?.('Error reading file');
    };

    reader.readAsArrayBuffer(file);
  }, [removeModel, processLoadedModel, onLoadStart, onLoadError]);

  /**
   * Load a model from a URL.
   */
  const loadModelFromUrl = useCallback(async (
    url: string,
    fileName: string,
    scene: THREE.Scene,
    controls?: THREE.EventDispatcher
  ): Promise<void> => {
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (extension !== 'stl' && extension !== 'fbx') {
      setError('Unsupported file format. Please upload STL or FBX files.');
      onLoadError?.('Unsupported file format');
      return;
    }

    setLoading(true);
    setError('');
    onLoadStart?.();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch model: ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: 'application/octet-stream' });
      const file = new File([blob], fileName, { type: 'application/octet-stream' });

      // Remove any existing model first
      removeModel(scene);

      let object: THREE.Object3D;

      if (extension === 'stl') {
        const loader = new STLLoader();
        const geometry = loader.parse(arrayBuffer);
        geometry.computeVertexNormals();

        const material = new THREE.MeshPhongMaterial({
          color: currentColorRef.current,
          specular: 0x111111,
          shininess: 200,
          wireframe: currentWireframeRef.current,
        });

        object = new THREE.Mesh(geometry, material);
      } else {
        const loader = new FBXLoader();
        object = loader.parse(arrayBuffer, '');
      }

      processLoadedModel(object, file, scene, controls);
    } catch (err: any) {
      const errorMessage = `Error loading model: ${err.message}`;
      setError(errorMessage);
      onLoadError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [removeModel, processLoadedModel, onLoadStart, onLoadError]);

  return {
    loading,
    error,
    modelStats,
    currentModel: currentModelRef.current,
    currentFileName,
    currentFile,
    baseScale: baseScaleRef.current,

    loadModelFromFile,
    loadModelFromUrl,
    removeModel,
    updateMaterialProperties,
    applyScale,
    centerAndScaleModel,
    calculateModelStats,
  };
}
