import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { LigandMap, LigandType } from '../types';
import { COLORS, BOND_LENGTH, ATOM_SCALE, SLOTS } from '../constants';

interface Scene3DProps {
  ligands: LigandMap;
  onSlotClick: (slotId: number) => void;
}

const Scene3D: React.FC<Scene3DProps> = ({ ligands, onSlotClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const particlesRef = useRef<THREE.Points | null>(null);
  
  // Refs for scene objects
  const slotsMeshesRef = useRef<THREE.Group>(new THREE.Group());
  const ligandMeshesGroupRef = useRef<THREE.Group>(new THREE.Group());

  // Initialize Scene
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(COLORS.Background);
    scene.fog = new THREE.FogExp2(COLORS.Background, 0.02); // Add depth fog
    sceneRef.current = scene;

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(6, 4, 8); // Slightly nicer angle
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // Better colors
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5; // Slow idle rotation
    controlsRef.current = controls;

    // 5. Lighting (Studio Setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Main Key Light (Warm)
    const mainLight = new THREE.DirectionalLight(0xfff0dd, 2);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.bias = -0.0001;
    scene.add(mainLight);

    // Fill Light (Cool) - from opposite side
    const fillLight = new THREE.DirectionalLight(0xddeeff, 1);
    fillLight.position.set(-5, 0, -5);
    scene.add(fillLight);

    // Rim Light (Accent) - for edges
    const rimLight = new THREE.SpotLight(0x6366f1, 5); // Indigo accent
    rimLight.position.set(0, 5, -10);
    rimLight.lookAt(0, 0, 0);
    scene.add(rimLight);

    // 6. Central Metal Atom (High Polish)
    const metalGeo = new THREE.SphereGeometry(1.2, 64, 64);
    const metalMat = new THREE.MeshPhysicalMaterial({
      color: COLORS.Metal,
      roughness: 0.15,
      metalness: 0.9,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });
    const metalMesh = new THREE.Mesh(metalGeo, metalMat);
    metalMesh.castShadow = true;
    metalMesh.receiveShadow = true;
    scene.add(metalMesh);

    // 7. Background Particles (Starfield)
    const particlesGeo = new THREE.BufferGeometry();
    const count = 1000;
    const posArray = new Float32Array(count * 3);
    for(let i = 0; i < count * 3; i++) {
      // Random position in a sphere around the center
      const r = 15 + Math.random() * 30;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      posArray[i] = r * Math.sin(phi) * Math.cos(theta); // x
      posArray[i+1] = r * Math.sin(phi) * Math.sin(theta); // y
      posArray[i+2] = r * Math.cos(phi); // z
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x818cf8, // Light Indigo
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particlesGeo, particlesMat);
    particlesRef.current = particleSystem;
    scene.add(particleSystem);

    // 8. Slot Group Setup
    scene.add(slotsMeshesRef.current);
    scene.add(ligandMeshesGroupRef.current);

    // Create Ghost Slots (Interactable holograms)
    const slotGeo = new THREE.SphereGeometry(ATOM_SCALE, 32, 32);
    const slotMat = new THREE.MeshBasicMaterial({
      color: COLORS.Highlight,
      transparent: true,
      opacity: 0.15,
      wireframe: true, // Techy look
    });
    // Inner fill for easier clicking
    const slotFillMat = new THREE.MeshBasicMaterial({
      color: COLORS.Highlight,
      transparent: true,
      opacity: 0.05,
    });

    SLOTS.forEach((slotData) => {
      const group = new THREE.Group();
      
      const wireMesh = new THREE.Mesh(slotGeo, slotMat.clone());
      const fillMesh = new THREE.Mesh(slotGeo, slotFillMat.clone());
      
      group.add(wireMesh);
      group.add(fillMesh);

      const pos = new THREE.Vector3(slotData.position.x, slotData.position.y, slotData.position.z);
      pos.multiplyScalar(BOND_LENGTH);
      group.position.copy(pos);
      
      // Store user data on the group so raycaster finds it
      group.userData = { isSlot: true, id: slotData.id };
      // Also on children for raycaster intersection convenience
      wireMesh.userData = { isSlot: true, id: slotData.id };
      fillMesh.userData = { isSlot: true, id: slotData.id };
      
      slotsMeshesRef.current.add(group);
    });

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (controlsRef.current) controlsRef.current.update();
      
      // Rotate particles slowly
      if (particlesRef.current) {
        particlesRef.current.rotation.y += 0.0005;
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    // Interaction Handlers
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current || !cameraRef.current) return;
      
      // Disable auto-rotate when user interacts
      if (controlsRef.current) controlsRef.current.autoRotate = false;

      const rect = containerRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);

      // Intersect recursively with slot group
      const intersects = raycasterRef.current.intersectObjects(slotsMeshesRef.current.children, true);
      
      if (intersects.length > 0) {
        // Find the root object that has the ID
        let target = intersects[0].object;
        while (target.parent && !target.userData.isSlot) {
          target = target.parent;
        }
        
        if (target.userData.isSlot) {
          onSlotClick(target.userData.id);
        }
      }
    };

    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    containerRef.current.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeEventListener('pointerdown', handlePointerDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ligand Synchronization
  useEffect(() => {
    if (!ligandMeshesGroupRef.current) return;

    // Clear previous
    ligandMeshesGroupRef.current.clear();

    // Handle Slot Visibility
    slotsMeshesRef.current.children.forEach((group) => {
      const slotId = group.userData.id;
      const isOccupied = ligands[slotId] !== undefined;
      group.visible = !isOccupied; // Hide ghost slot if occupied
    });

    // Create Atoms
    Object.entries(ligands).forEach(([key, type]) => {
      const slotId = parseInt(key);
      const slotVector = SLOTS[slotId].position;
      const ligandType = type as LigandType;

      // 1. Atom (Physical Material for glossy look)
      const atomGeo = new THREE.SphereGeometry(ATOM_SCALE, 64, 64);
      const color = ligandType === 'NH3' ? COLORS.NH3 : COLORS.Cl;
      
      const atomMat = new THREE.MeshPhysicalMaterial({
        color: color,
        metalness: 0.1,
        roughness: 0.2,
        clearcoat: 1.0,        // Candy shell look
        clearcoatRoughness: 0.1,
        sheen: 1.0,
      });
      
      const atomMesh = new THREE.Mesh(atomGeo, atomMat);
      const pos = new THREE.Vector3(slotVector.x, slotVector.y, slotVector.z).multiplyScalar(BOND_LENGTH);
      atomMesh.position.copy(pos);
      atomMesh.castShadow = true;
      atomMesh.receiveShadow = true;
      ligandMeshesGroupRef.current.add(atomMesh);

      // 2. Bond (Sleek Cylinder)
      const center = new THREE.Vector3(0, 0, 0);
      const direction = pos.clone().normalize();
      const bondHeight = pos.distanceTo(center);

      const bondGeo = new THREE.CylinderGeometry(0.12, 0.12, bondHeight, 16);
      const bondMat = new THREE.MeshStandardMaterial({ 
        color: COLORS.Bond,
        roughness: 0.3,
        metalness: 0.4
      });
      const bondMesh = new THREE.Mesh(bondGeo, bondMat);

      bondMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
      bondMesh.position.copy(direction.multiplyScalar(bondHeight / 2));
      
      ligandMeshesGroupRef.current.add(bondMesh);
    });

  }, [ligands]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default Scene3D;