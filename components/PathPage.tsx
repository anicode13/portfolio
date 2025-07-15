"use client"
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

const AirplanesPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const sceneInstanceRef = useRef<any>(null);

  useEffect(() => {
    let animationFrame: number | undefined = undefined;

    console.log('Starting 3D scene initialization...');

    class Scene {
      views: any[];
      renderer: any;
      scene: any;
      light: any;
      softLight: any;
      modelGroup: any;
      w: number = 0;
      h: number = 0;
      constructor(model: any) {
        this.views = [
          { bottom: 0, height: 1 },
          { bottom: 0, height: 0 }
        ];
        this.renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          canvas: canvasRef.current || undefined,
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.scene = new THREE.Scene();
        for (let ii = 0; ii < this.views.length; ++ii) {
          const view = this.views[ii];
          const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
          camera.position.fromArray([0, 0, 180]);
          camera.layers.disableAll();
          camera.layers.enable(ii);
          view.camera = camera;
          camera.lookAt(new THREE.Vector3(0, 5, 0));
        }
        this.light = new THREE.PointLight(0xffffff, 0.75);
        this.light.position.z = 150;
        this.light.position.x = 70;
        this.light.position.y = -20;
        this.scene.add(this.light);
        this.softLight = new THREE.AmbientLight(0xffffff, 1.5);
        this.scene.add(this.softLight);
        this.onResize();
        window.addEventListener('resize', this.onResize, false);
        const edges = new THREE.EdgesGeometry(model.children[0].geometry);
        let line = new THREE.LineSegments(edges);
        if (line.material instanceof THREE.Material) {
          line.material.depthTest = false;
          line.material.opacity = 0.5;
          line.material.transparent = true;
        }
        line.position.x = 0.5;
        line.position.z = -1;
        line.position.y = 0.2;
        this.modelGroup = new THREE.Group();
        model.layers.set(0);
        line.layers.set(1);
        this.modelGroup.add(model);
        this.modelGroup.add(line);
        this.scene.add(this.modelGroup);
      }
      render = () => {
        for (let ii = 0; ii < this.views.length; ++ii) {
          const view = this.views[ii];
          const camera = view.camera;
          const bottom = Math.floor(this.h * view.bottom);
          const height = Math.floor(this.h * view.height);
          this.renderer.setViewport(0, 0, this.w, this.h);
          this.renderer.setScissor(0, bottom, this.w, height);
          this.renderer.setScissorTest(true);
          camera.aspect = this.w / this.h;
          this.renderer.render(this.scene, camera);
        }
      };
      onResize = () => {
        this.w = window.innerWidth;
        this.h = window.innerHeight;
        for (let ii = 0; ii < this.views.length; ++ii) {
          const view = this.views[ii];
          const camera = view.camera;
          camera.aspect = this.w / this.h;
          let camZ = (window.screen.width - (this.w * 1)) / 3;
          camera.position.z = camZ < 180 ? 180 : camZ;
          camera.updateProjectionMatrix();
        }
        this.renderer.setSize(this.w, this.h);
        this.render();
      };
    }

    function loadModel() {
      console.log('Starting to load 3D model...');
      // Remove SVG references since SVG elements were removed from JSX
      // gsap.set('#line-length', { drawSVG: 0 });
      // gsap.set('#line-wingspan', { drawSVG: 0 });
      // gsap.set('#circle-phalange', { drawSVG: 0 });
      
      function createFallbackModel() {
        console.log('Creating fallback airplane model');
        
        // Create a simple airplane shape using basic geometries
        const group = new THREE.Group();
        
        // Fuselage (body)
        const fuselageGeometry = new THREE.CylinderGeometry(3, 3, 40, 8);
        // Fallback model material
        const material = new THREE.MeshPhongMaterial({ 
          color: isDarkMode ? 0xFFFFFF : 0x000000, 
          specular: isDarkMode ? 0xFFFFFF : 0xFFFFFF, 
          shininess: 100, 
          flatShading: false 
        });
        console.log('Creating fallback model with color:', isDarkMode ? 'WHITE' : 'BLACK');
        const fuselage = new THREE.Mesh(fuselageGeometry, material);
        fuselage.rotation.z = Math.PI / 2;
        group.add(fuselage);
        
        // Wings
        const wingGeometry = new THREE.BoxGeometry(60, 2, 8);
        // Loaded model material
        let mat = new THREE.MeshPhongMaterial({ 
          color: isDarkMode ? 0xFFFFFF : 0x000000, 
          specular: isDarkMode ? 0xFFFFFF : 0xFFFFFF, 
          shininess: 100, 
          flatShading: false 
        });
        const wing = new THREE.Mesh(wingGeometry, mat);
        wing.position.y = 0;
        group.add(wing);
        
        // Tail
        const tailGeometry = new THREE.BoxGeometry(8, 2, 12);
        const tail = new THREE.Mesh(tailGeometry, mat);
        tail.position.z = 20;
        group.add(tail);
        
        // Vertical stabilizer
        const vStabGeometry = new THREE.BoxGeometry(2, 8, 6);
        const vStab = new THREE.Mesh(vStabGeometry, mat);
        vStab.position.z = 20;
        vStab.position.y = 4;
        group.add(vStab);
        
        console.log('Fallback airplane model created:', group);
        const loadingEl = document.querySelector('.loading');
        if (loadingEl) {
          loadingEl.innerHTML = 'Fallback airplane model loaded successfully!';
        }
        setupAnimation(group);
      }
      
      let object: any;
      function onModelLoaded() {
        console.log('3D model loaded successfully!', object);
        object.traverse(function (child: any) {
          // Loaded model material
          let mat = new THREE.MeshPhongMaterial({ 
            color: isDarkMode ? 0xFFFFFF : 0x000000, 
            specular: isDarkMode ? 0xFFFFFF : 0xFFFFFF, 
            shininess: 100, 
            flatShading: false 
          });
          child.material = mat;
        });
        console.log('Loaded model with color:', isDarkMode ? 'WHITE' : 'BLACK');
        setupAnimation(object);
      }
      const manager = new THREE.LoadingManager(onModelLoaded) as any;
      manager.onProgress = (item: any, loaded: any, total: any) => console.log('Loading progress:', item, loaded, total);
      manager.onError = (url: string) => {
        console.error('Error loading model:', url);
        console.log('Creating fallback model instead...');
        const loadingEl = document.querySelector('.loading');
        if (loadingEl) {
          loadingEl.innerHTML = 'Using fallback airplane model...';
        }
        createFallbackModel();
      };
      const loader = new OBJLoader(manager);
      console.log('Attempting to load model from:', 'https://assets.codepen.io/557388/1405+Plane_1.obj');
      loader.load('https://assets.codepen.io/557388/1405+Plane_1.obj', function (obj: any) { 
        console.log('OBJ loader callback, object:', obj);
        object = obj; 
      });
    }

    function setupAnimation(model: any) {
      console.log('Setting up animation with model:', model);
      sceneInstanceRef.current = new Scene(model);
      console.log('Scene created:', sceneInstanceRef.current);
      
      let plane = sceneInstanceRef.current.modelGroup;
      
      // Make canvas visible immediately
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.style.visibility = 'visible';
        canvas.style.opacity = '1';
        console.log('Canvas made visible');
      } else {
        console.error('Canvas element not found!');
      }
      
      gsap.fromTo('canvas', { x: '50%', autoAlpha: 0 }, { duration: 1, x: '0%', autoAlpha: 1 });
      gsap.to('.loading', { autoAlpha: 0 });
      gsap.to('.scroll-cta', { opacity: 1 });
      // Remove SVG reference since SVG elements were removed from JSX
      // gsap.set('svg', { autoAlpha: 1 });
      let tau = Math.PI * 2;
      gsap.set(plane.rotation, { y: tau * -.25 });
      gsap.set(plane.position, { x: 80, y: -32, z: -60 });
      sceneInstanceRef.current.render();
      console.log('Initial render completed');
      let sectionDuration = 1;
      
      gsap.to('.ground', {
        y: '30%', scrollTrigger: {
          trigger: '.ground-container', scrub: true, start: 'top bottom', end: 'bottom top'
        }
      });
      gsap.from('.clouds', {
        y: '25%', scrollTrigger: {
          trigger: '.ground-container', scrub: true, start: 'top bottom', end: 'bottom top'
        }
      });
      
      
      gsap.to('#line-length', {
        drawSVG: 100, scrollTrigger: {
          trigger: '.length', scrub: true, start: 'top bottom', end: 'top top'
        }
      });
      gsap.to('#line-wingspan', {
        drawSVG: 100, scrollTrigger: {
          trigger: '.wingspan', scrub: true, start: 'top 25%', end: 'bottom 50%'
        }
      });
      gsap.to('#circle-phalange', {
        drawSVG: 100, scrollTrigger: {
          trigger: '.phalange', scrub: true, start: 'top 50%', end: 'bottom 100%'
        }
      });
      gsap.to('#line-length', {
        opacity: 0, drawSVG: 0, scrollTrigger: {
          trigger: '.length', scrub: true, start: 'top top', end: 'bottom top'
        }
      });
      gsap.to('#line-wingspan', {
        opacity: 0, drawSVG: 0, scrollTrigger: {
          trigger: '.wingspan', scrub: true, start: 'top top', end: 'bottom top'
        }
      });
      gsap.to('#circle-phalange', {
        opacity: 0, drawSVG: 0, scrollTrigger: {
          trigger: '.phalange', scrub: true, start: 'top top', end: 'bottom top'
        }
      });
      
      let tl = gsap.timeline({
        onUpdate: sceneInstanceRef.current.render,
        scrollTrigger: {
          trigger: '.content',
          scrub: true,
          start: 'top top',
          end: 'bottom bottom'
        },
        defaults: { duration: sectionDuration, ease: 'power2.inOut' }
      });
      let delay = 0;
      tl.to('.scroll-cta', { duration: 0.25, opacity: 0 }, delay);
      tl.to(plane.position, { x: -10, ease: 'power1.in' }, delay);
      delay += sectionDuration;
      tl.to(plane.rotation, { x: tau * .25, y: 0, z: -tau * 0.05, ease: 'power1.inOut' }, delay);
      tl.to(plane.position, { x: -40, y: 0, z: -60, ease: 'power1.inOut' }, delay);
      delay += sectionDuration;
      tl.to(plane.rotation, { x: tau * .25, y: 0, z: tau * 0.05, ease: 'power3.inOut' }, delay);
      tl.to(plane.position, { x: 40, y: 0, z: -60, ease: 'power2.inOut' }, delay);
      delay += sectionDuration;
      tl.to(plane.rotation, { x: tau * .2, y: 0, z: -tau * 0.1, ease: 'power3.inOut' }, delay);
      tl.to(plane.position, { x: -40, y: 0, z: -30, ease: 'power2.inOut' }, delay);
      delay += sectionDuration;
      tl.to(plane.rotation, { x: tau * .25, y: 0, z: tau * 0.05, ease: 'power3.inOut' }, delay);
      tl.to(plane.position, { x: 40, y: 0, z: -60, ease: 'power2.inOut' }, delay);
      delay += sectionDuration;
      tl.to(plane.rotation, { x: tau * .2, y: 0, z: -tau * 0.1, ease: 'power3.inOut' }, delay);
      tl.to(plane.position, { x: -40, y: 0, z: -30, ease: 'power2.inOut' }, delay);
      delay += sectionDuration;
      tl.to(plane.rotation, { x: tau * .25, y: 0, z: tau * 0.05, ease: 'power3.inOut' }, delay);
      tl.to(plane.position, { x: 40, y: 0, z: -60, ease: 'power2.inOut' }, delay);
      delay += sectionDuration;
      tl.to(plane.rotation, { x: tau * .2, y: 0, z: -tau * 0.1, ease: 'power3.inOut' }, delay);
      tl.to(plane.position, { x: -40, y: 0, z: -30, ease: 'power2.inOut' }, delay);
      delay += sectionDuration;
      tl.to(plane.rotation, { x: tau * 0.15, y: tau * .85, z: -tau * 0, ease: 'power1.in' }, delay);
      tl.to(plane.position, { z: -150, x: 0, y: 0, ease: 'power1.inOut' }, delay);
      delay += sectionDuration;
      tl.to(plane.rotation, { duration: sectionDuration, x: -tau * 0.05, y: tau, z: -tau * 0.1, ease: 'none' }, delay);
      tl.to(plane.position, { duration: sectionDuration, x: 0, y: 30, z: 320, ease: 'power1.in' }, delay);
      tl.to(sceneInstanceRef.current.light.position, { duration: sectionDuration, x: 0, y: 0, z: 0 }, delay);
    }

    // Start loading the model directly since libraries are now imported
    console.log('Libraries imported successfully, starting model load...');
    loadModel();

    return () => {
      if (sceneInstanceRef.current && sceneInstanceRef.current.renderer) {
        sceneInstanceRef.current.renderer.dispose();
      }
      window.removeEventListener('resize', sceneInstanceRef.current?.onResize);
      if (animationFrame !== undefined) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  // Update plane material when theme changes
  useEffect(() => {
    if (sceneInstanceRef.current && sceneInstanceRef.current.modelGroup) {
      const newColor = isDarkMode ? 0xFFFFFF : 0x000000;
      const newSpecular = isDarkMode ? 0xFFFFFF : 0xFFFFFF;
      sceneInstanceRef.current.modelGroup.traverse((child: any) => {
        if (child.material) {
          child.material.color.setHex(newColor);
          // Only update specular if the material is MeshPhongMaterial and has specular
          if (child.material instanceof THREE.MeshPhongMaterial && child.material.specular) {
            child.material.specular.setHex(newSpecular);
          }
          child.material.needsUpdate = true;
        }
      });
      // Force a render update
      if (sceneInstanceRef.current.render) {
        sceneInstanceRef.current.render();
      }
    }
  }, [isDarkMode]);

  return (
    <div className="content">
      <button               
        className="absolute top-6 right-6 p-3 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200"
        onClick={() => setIsDarkMode(!isDarkMode)}
        style={{
          background: 'var(--bg-secondary)',
          boxShadow: '0 2px 8px var(--shadow-light)',
          color: 'var(--text-primary)'
      }}
      >
         {isDarkMode ? (
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                )}
      </button>
      <div className="loading">Loading</div>
      <div className="trigger"></div>
      <div className="section">
        <h1>Anika Jain</h1>
        <h3>Full-Stack Developer | On the Journey to Becoming an AI Engineer</h3>
        {/* <p>You've probably forgotten what these are.</p> */}
        <div className="scroll-cta">Scroll</div>
      </div>
      <div className="section right">
        <h2>Takeoff: The Beginning</h2>
      </div>
      <div className="ground-container">
        <div className="parallax ground"></div>
        <div className="section">
          <p>Wrote my first line of code.<br/> It worked.<br/> I was hooked.<br/>
Learned HTML, CSS, JS...<br/> Then took a deep dive into the MERN stack.</p>
        </div>
        <div className="section right">
          <h2>E-commerce Store</h2>
          <p>Tech Stack: React, Node.js, Express, MongoDB <br/>
Built a full-featured shopping platform with product listing, cart, user auth, and order flow.<br/>
Learned backend integration, secure APIs, and real-world architecture.</p>
        </div>
        <div className="section">
          <p>Link coming soon...</p>
        </div>
        <div className="section right">
          <h2>Doodleflow</h2>
          <p>Tech Stack: React, Tailwind, Canvas API <br/>
My take on Excalidraw — real-time sketching with style.<br/>
Learned canvas rendering, user interaction, and performance tuning.</p>
        </div>
        <div className="section">
          <p>Link coming soon...</p>
        </div>
        <div className="section right">
         <h2>Coding Agent</h2>
          <p>Tech Stack: Python, CLI, Local Sandbox <br/>
Built a local agent that executes code securely with command handling.<br/>
Learned sandboxing, orchestration, and task parsing.</p>
        </div>
        <div className="section">
          <p>Link coming soon...</p>
        </div>
        <div className="section right">
          <h2>Entering the AI Phase</h2>
          <p>Started learning ML & AI fundamentals.<br/>
Built neural networks from scratch.<br/>
Explored AI integration in apps.<br/>
Currently diving into: LLMs, AI agents, and building smart systems.</p>
        </div>
        <div className="parallax clouds"></div>
      </div>
      <div className="sunset">
        <div className="section"></div>
        <div className="section end">
          <h2>It's just the beginning. Stay tuned for more.</h2>
          <ul className="credits">
            <li>Plane model by <a href="https://poly.google.com/view/8ciDd9k8wha" target="_blank">Google</a></li>
            <li>Animated using <a href="https://greensock.com/scrolltrigger/" target="_blank">GSAP ScrollTrigger</a></li>
          </ul>
        </div>
      </div>
      {/* Canvas for Three.js */}
      <canvas ref={canvasRef} style={{ position: 'fixed', zIndex: 2, top: 0, left: 0, pointerEvents: 'none', visibility: 'hidden', opacity: 0 }} />
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=swap');
        svg { z-index: 100; }
        :root {
          --padding: 10vmin;
          --color-background: ${isDarkMode ? '#0a0a0a' : '#D0CBC7'};
          --font-size-large: 8vw;
          --font-size-medium: 4vw;
          --font-size-normal: 2vw;
        }
        @media only screen and (min-width: 800px) {
          :root {
            --font-size-large: 64px;
            --font-size-medium: 32px;
            --font-size-normal: 16px;
          }
        }
        @media only screen and (max-width: 500px) {
          :root {
            --font-size-large: 40px;
            --font-size-medium: 20px;
            --font-size-normal: 14px;
          }
        }
        a { color: ${isDarkMode ? '#ffffff' : '#000000'}; }
        .content h1, .content h2, .content h3, .content p {
          color: ${isDarkMode ? '#ffffff' : '#000000'};
        }
        
        .theme-toggle {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
          border: 2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
          border-radius: 50%;
          width: 50px;
          height: 50px;
          font-size: 20px;
          cursor: pointer;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .theme-toggle:hover {
          transform: scale(1.1);
          background: ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        ul { margin: 0; padding: 0; list-style: none; }
        li { margin-top: 10px; }
        html, body {
          margin: 0;
          min-height: 100%;
          min-width: 100%;
          font-family: 'Libre Baskerville', serif;
          background-color: var(--color-background);
          font-weight: 400;
          font-size: var(--font-size-normal);
          overflow-x: hidden;
        }
        canvas {
          position: fixed;
          z-index: 2;
          top: 0;
          left: 0;
          pointer-events: none;
          visibility: hidden;
          opacity: 0;
        }
        .solid {
          clip-path: polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%);
        }
        .wireframe {
          clip-path: polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%);
        }
        .content {
          position: relative;
          z-index: 1;
        }
        .content .trigger {
          position: absolute;
          top: 0;
          height: 100%;
        }
        .content .section {
          position: relative;
          padding: var(--padding);
          --pad2: calc(var(--padding) * 2);
          width: calc(100vw - var(--pad2));
          height: calc(100vh - var(--pad2));
          margin: 0 auto;
          z-index: 2;
        }
        .content .section.right {
          text-align: right;
        }
        .content .ground-container {
          position: relative;
          overflow: hidden;
        }
        .content .ground-container .parallax {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: -100px;
          background-repeat: no-repeat;
          background-position: top center;
          background-size: cover;
          transform-origin: top center;
        }
        .content .ground-container .ground {
          z-index: -1;
          background-image: url("${isDarkMode ? '/map.jpg' : 'https://assets.codepen.io/557388/background-reduced.jpg'}");
          background-size: contain;
          background-repeat: repeat;
          background-position: center;
          
        
        }
        .content .ground-container .clouds {
          z-index: 1;
          background-image: url("https://assets.codepen.io/557388/clouds.png");
          filter: ${isDarkMode ? 'brightness(0.3) saturate(0.5)' : 'none'};
        }
        .content .scroll-cta, .content .credits {
          position: absolute;
          bottom: var(--padding);
        }
        .content .scroll-cta {
          font-size: var(--font-size-medium);
          opacity: 0;
        }
        .content .sunset {
          background: url("${isDarkMode ? 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80' : 'https://assets.codepen.io/557388/sunset-reduced.jpg'}") no-repeat top center;
          background-size: cover;
          transform-origin: top center;
        }
        .content h1, .content h2 {
          font-size: var(--font-size-large);
          margin: 0vmin 0 2vmin 0;
          font-weight: 700;
          display: inline;
        }
        .content h3 {
          font-size: var(--font-size-medium);
          font-weight: 400;
          margin: 0;
        }
        .content .end h2 {
          margin-bottom: 50vh;
        }
        .content .loading {
          position: fixed;
          width: 100vw;
          height: 100vh;
          top: 0;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-medium);
        }
      `}</style>
    </div>
  );
};

export default AirplanesPage; 