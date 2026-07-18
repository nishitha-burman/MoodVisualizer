import { VisualParams, UNIFORM_BUFFER_SIZE } from "../mood/types";
import shaderCode from "../shaders/mood.wgsl?raw";

/**
 * WebGPU renderer for the mood visualization.
 * Manages device initialization, pipeline, uniform buffer, and render loop.
 */
export class MoodRenderer {
  private device!: GPUDevice;
  private context!: GPUCanvasContext;
  private pipeline!: GPURenderPipeline;
  private uniformBuffer!: GPUBuffer;
  private bindGroup!: GPUBindGroup;
  private canvas: HTMLCanvasElement;
  private startTime = performance.now();
  private animationId = 0;

  // Current and target visual params for smooth interpolation
  private currentParams: VisualParams = {
    hue: 280, saturation: 0.4, brightness: 0.4,
    speed: 0.5, turbulence: 0.3, density: 0.5,
    scale: 1.0, noiseFreq: 2.0, coherence: 0.7,
  };
  private targetParams: VisualParams = { ...this.currentParams };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  /**
   * Initialize WebGPU. Returns false if not supported.
   */
  async init(): Promise<boolean> {
    if (!navigator.gpu) return false;

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return false;

    this.device = await adapter.requestDevice();
    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;

    const format = navigator.gpu.getPreferredCanvasFormat();
    this.context.configure({
      device: this.device,
      format,
      alphaMode: "premultiplied",
    });

    // Create uniform buffer
    this.uniformBuffer = this.device.createBuffer({
      size: UNIFORM_BUFFER_SIZE,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });

    // Shader module
    const shaderModule = this.device.createShaderModule({ code: shaderCode });

    // Bind group layout
    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [{
        binding: 0,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      }],
    });

    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [{
        binding: 0,
        resource: { buffer: this.uniformBuffer },
      }],
    });

    // Pipeline
    this.pipeline = this.device.createRenderPipeline({
      layout: this.device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] }),
      vertex: {
        module: shaderModule,
        entryPoint: "vs_main",
      },
      fragment: {
        module: shaderModule,
        entryPoint: "fs_main",
        targets: [{ format }],
      },
      primitive: { topology: "triangle-list" },
    });

    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());

    return true;
  }

  private handleResize() {
    // Cap DPR on mobile to reduce GPU workload (high-DPI phones can be 3×+)
    const maxDpr = "ontouchstart" in window ? 1.5 : 2.5;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    this.canvas.width = Math.floor(this.canvas.clientWidth * dpr);
    this.canvas.height = Math.floor(this.canvas.clientHeight * dpr);
  }

  /**
   * Set the target visual parameters. The renderer will smoothly interpolate to them.
   */
  setTarget(params: VisualParams) {
    this.targetParams = { ...params };
  }

  /**
   * Start the render loop.
   */
  start() {
    const render = () => {
      this.animationId = requestAnimationFrame(render);
      this.lerpParams();
      this.writeUniforms();
      this.draw();
    };
    render();
  }

  /**
   * Stop the render loop.
   */
  stop() {
    cancelAnimationFrame(this.animationId);
  }

  private lerpParams() {
    const t = 0.03; // interpolation speed per frame (~60fps → ~2s transition)
    const c = this.currentParams;
    const g = this.targetParams;
    c.hue = lerpAngle(c.hue, g.hue, t);
    c.saturation = lerp(c.saturation, g.saturation, t);
    c.brightness = lerp(c.brightness, g.brightness, t);
    c.speed = lerp(c.speed, g.speed, t);
    c.turbulence = lerp(c.turbulence, g.turbulence, t);
    c.density = lerp(c.density, g.density, t);
    c.scale = lerp(c.scale, g.scale, t);
    c.noiseFreq = lerp(c.noiseFreq, g.noiseFreq, t);
    c.coherence = lerp(c.coherence, g.coherence, t);
  }

  private writeUniforms() {
    const time = (performance.now() - this.startTime) / 1000;
    const data = new Float32Array([
      time,
      this.currentParams.hue,
      this.currentParams.saturation,
      this.currentParams.brightness,
      this.currentParams.speed,
      this.currentParams.turbulence,
      this.currentParams.density,
      this.currentParams.scale,
      this.currentParams.noiseFreq,
      this.currentParams.coherence,
      this.canvas.width,
      this.canvas.height,
    ]);
    this.device.queue.writeBuffer(this.uniformBuffer, 0, data);
  }

  private draw() {
    const encoder = this.device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{
        view: this.context.getCurrentTexture().createView(),
        clearValue: { r: 0.02, g: 0.02, b: 0.04, a: 1 },
        loadOp: "clear",
        storeOp: "store",
      }],
    });
    pass.setPipeline(this.pipeline);
    pass.setBindGroup(0, this.bindGroup);
    pass.draw(6); // fullscreen quad (2 triangles)
    pass.end();
    this.device.queue.submit([encoder.finish()]);
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = ((b - a + 540) % 360) - 180;
  return (a + diff * t + 360) % 360;
}
