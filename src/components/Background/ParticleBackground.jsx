import { useEffect, useRef } from 'react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    // Load Three.js from CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    script.onload = initBackground;
    document.head.appendChild(script);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.head.removeChild(script);
    };
  }, []);

  const initBackground = () => {
    if (!window.THREE || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const scene = new window.THREE.Scene();
    const camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new window.THREE.WebGLRenderer({ canvas, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create particles
    const count = 600;
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 1200;
    }

    const geometry = new window.THREE.BufferGeometry();
    geometry.setAttribute('position', new window.THREE.BufferAttribute(positions, 3));

    const material = new window.THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.8,
      transparent: true,
      opacity: 0.6
    });

    const particles = new window.THREE.Points(geometry, material);
    scene.add(particles);
    camera.position.z = 300;

    sceneRef.current = { scene, camera, renderer, particles };

    // Animation loop
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      particles.rotation.y += 0.0004;
      particles.rotation.x += 0.0002;
      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0"
      style={{ 
        pointerEvents: 'none',
        zIndex: -10
      }}
    />
  );
};

export default ParticleBackground;