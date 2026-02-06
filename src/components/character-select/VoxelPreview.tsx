import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { HeroClass } from '../../types/hero';
import { buildPreviewCharacter } from '../../engine/VoxelCharacterBuilder';

interface VoxelPreviewProps {
  heroClass: HeroClass;
}

const VoxelPreview: React.FC<VoxelPreviewProps> = ({ heroClass }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const targetRotation = useRef({ x: 0.2, y: 0.5 });
  const mousePos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 4, 10);
    camera.lookAt(0, 2.5, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 15, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(8, 64),
      new THREE.MeshPhongMaterial({ color: 0x1e293b, transparent: true, opacity: 0.8 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(16, 16, 0x334155, 0x1e293b);
    grid.position.y = 0.01;
    scene.add(grid);

    const characterGroup = new THREE.Group();
    characterGroupRef.current = characterGroup;
    scene.add(characterGroup);

    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    const onMouseUp = () => { isDragging.current = false; };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const dx = e.clientX - mousePos.current.x;
      const dy = e.clientY - mousePos.current.y;
      targetRotation.current.y += dx * 0.01;
      targetRotation.current.x = Math.max(-0.5, Math.min(0.5, targetRotation.current.x + dy * 0.01));
      mousePos.current = { x: e.clientX, y: e.clientY };
    };
    const onWheel = (e: WheelEvent) => {
      camera.position.z = Math.max(6, Math.min(20, camera.position.z + e.deltaY * 0.01));
    };

    const el = containerRef.current;
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    el.addEventListener('wheel', onWheel);

    const clock = new THREE.Clock();
    let frameId: number;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const time = clock.getElapsedTime();

      if (characterGroup) {
        characterGroup.position.y = Math.sin(time * 1.5) * 0.15 + 0.2;
        characterGroup.rotation.y += (targetRotation.current.y - characterGroup.rotation.y) * 0.1;
        characterGroup.rotation.x += (targetRotation.current.x - characterGroup.rotation.x) * 0.1;
      }

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (el.contains(renderer.domElement)) {
        el.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    if (!characterGroupRef.current) return;
    const group = characterGroupRef.current;
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }
    const model = buildPreviewCharacter(heroClass);
    group.add(model);
  }, [heroClass]);

  return <div ref={containerRef} className="w-full h-full" />;
};

export default VoxelPreview;
