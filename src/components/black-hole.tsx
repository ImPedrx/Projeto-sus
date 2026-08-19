"use client";

import { useEffect, useRef } from "react";

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

// Straight light bands drawn in a space that has been pulled inward toward the
// centre: bending the coordinates rather than the bands is what makes the light
// wrap around the horizon the way a lens does, and it costs one displacement.
const FRAGMENT = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uSpeed;
uniform float uZoom;
uniform float uOrb;
uniform float uBands;
uniform float uGlow;
uniform float uContrast;
uniform float uFade;
uniform vec2 uCenter;

out vec4 fragColor;

float band(float d, float thickness) {
  return exp(-pow(abs(d) / thickness, 1.6));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  uv *= uZoom;
  uv -= uCenter;

  float r = max(length(uv), 1e-4);
  vec2 dir = uv / r;

  // Deflection falls off with distance, so the warp is violent at the rim and
  // negligible at the edges of the frame.
  float deflection = (uOrb * uOrb) / (r + uOrb * 0.35);
  vec2 lensed = uv - dir * deflection;

  float light = 0.0;
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    if (fi >= uBands) break;

    // Bands drift at slightly different rates, so the field never repeats on a
    // short loop.
    float offset = (fi - (uBands - 1.0) * 0.5) * 0.34;
    float drift = sin(uTime * uSpeed * (0.11 + fi * 0.017) + fi * 2.399) * 0.12;
    float thickness = 0.007 + 0.006 * fract(fi * 0.618);
    float weight = 0.45 + 0.55 * fract(fi * 0.37 + 0.2);
    float d = lensed.y - offset - drift;

    // A hard core inside a wide halo: the halo alone reads as fog, the core
    // alone loses the bloom that sells the light.
    light += band(d, thickness) * weight;
    light += band(d, thickness * 5.0) * weight * 0.22;
  }

  // The horizon eats everything inside it, with a thin rim where light piles up.
  float horizon = smoothstep(uOrb * 0.92, uOrb * 1.02, r);
  float rim = exp(-pow(abs(r - uOrb * 1.05) / (uOrb * 0.34), 2.0)) * uGlow;

  float intensity = light * horizon + rim * horizon;
  intensity *= exp(-r * uFade);
  intensity = pow(clamp(intensity, 0.0, 1.0), uContrast);

  fragColor = vec4(vec3(intensity), intensity);
}`;

type Params = {
  speed: number;
  zoom: number;
  orb: number;
  bands: number;
  glow: number;
  contrast: number;
  fade: number;
  centerX: number;
  centerY: number;
};

const DEFAULTS: Params = {
  speed: 1,
  zoom: 1.35,
  orb: 0.34,
  bands: 5,
  glow: 0.7,
  contrast: 0.75,
  fade: 0.35,
  // The headline is set flush left, so the horizon sits to the right of it and
  // the type never has to fight the bright rim.
  centerX: 0.38,
  centerY: -0.12,
};

export function BlackHole({
  className = "",
  speed = DEFAULTS.speed,
  zoom = DEFAULTS.zoom,
  orb = DEFAULTS.orb,
  bands = DEFAULTS.bands,
  glow = DEFAULTS.glow,
  contrast = DEFAULTS.contrast,
  fade = DEFAULTS.fade,
  centerX = DEFAULTS.centerX,
  centerY = DEFAULTS.centerY,
}: Partial<Params> & { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // The draw loop reads the latest values every frame, so tweaking a parameter
  // never tears down the GL context.
  const paramsRef = useRef<Params>(DEFAULTS);
  useEffect(() => {
    paramsRef.current = {
      speed,
      zoom,
      orb,
      bands,
      glow,
      contrast,
      fade,
      centerX,
      centerY,
    };
  }, [speed, zoom, orb, bands, glow, contrast, fade, centerX, centerY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
    });
    // Without WebGL2 the section keeps its flat background; the effect is
    // decoration and nothing below it depends on the canvas.
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("black-hole shader:", gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("black-hole:", gl.getProgramInfoLog(program));
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const location = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uResolution = uniform("uResolution");
    const uTime = uniform("uTime");
    const uniforms = {
      speed: uniform("uSpeed"),
      zoom: uniform("uZoom"),
      orb: uniform("uOrb"),
      bands: uniform("uBands"),
      glow: uniform("uGlow"),
      contrast: uniform("uContrast"),
      fade: uniform("uFade"),
      center: uniform("uCenter"),
    };

    const resize = () => {
      // Capping the pixel ratio keeps a full-bleed fragment shader affordable on
      // phones, where the effect is largest relative to the GPU.
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      const width = Math.floor(canvas.clientWidth * ratio);
      const height = Math.floor(canvas.clientHeight * ratio);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let visible = true;

    const draw = (elapsed: number) => {
      resize();
      const p = paramsRef.current;
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, elapsed / 1000);
      gl.uniform1f(uniforms.speed, p.speed);
      gl.uniform1f(uniforms.zoom, p.zoom);
      gl.uniform1f(uniforms.orb, p.orb);
      gl.uniform1f(uniforms.bands, p.bands);
      gl.uniform1f(uniforms.glow, p.glow);
      gl.uniform1f(uniforms.contrast, p.contrast);
      gl.uniform1f(uniforms.fade, p.fade);
      gl.uniform2f(uniforms.center, p.centerX, p.centerY);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (elapsed: number) => {
      draw(elapsed);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (frame || !visible) return;
      frame = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    if (reduceMotion.matches) {
      // One frame: the composition still reads, nothing moves.
      draw(0);
    } else {
      start();
    }

    // Off-screen or backgrounded, the shader stops costing anything.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !reduceMotion.matches) start();
        else stop();
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible && !reduceMotion.matches) start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
