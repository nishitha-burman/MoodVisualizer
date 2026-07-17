// Mood Visualizer — Fullscreen raymarched mood shader
// Uniforms match the TypeScript UNIFORM_BUFFER_SIZE layout exactly.

struct Uniforms {
  time: f32,
  hue: f32,
  saturation: f32,
  brightness: f32,
  speed: f32,
  turbulence: f32,
  density: f32,
  scale: f32,
  noise_freq: f32,
  coherence: f32,
  resolution_x: f32,
  resolution_y: f32,
};

@group(0) @binding(0) var<uniform> u: Uniforms;

// Fullscreen triangle vertex shader (3 verts cover screen; we use 6 for a quad)
struct VsOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

@vertex
fn vs_main(@builtin(vertex_index) vid: u32) -> VsOut {
  // Two-triangle fullscreen quad
  var positions = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0),  vec2f(1.0, -1.0), vec2f(1.0, 1.0),
  );
  let p = positions[vid];
  var out: VsOut;
  out.pos = vec4f(p, 0.0, 1.0);
  out.uv = p * 0.5 + 0.5;
  return out;
}

// --- Noise functions ---

fn hash33(p: vec3f) -> vec3f {
  var q = fract(p * vec3f(0.1031, 0.1030, 0.0973));
  q += dot(q, q.yxz + 33.33);
  return fract((q.xxy + q.yxx) * q.zyx);
}

fn noise3d(p: vec3f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let u = f * f * (3.0 - 2.0 * f);

  let n000 = dot(hash33(i + vec3f(0.0, 0.0, 0.0)) * 2.0 - 1.0, f - vec3f(0.0, 0.0, 0.0));
  let n100 = dot(hash33(i + vec3f(1.0, 0.0, 0.0)) * 2.0 - 1.0, f - vec3f(1.0, 0.0, 0.0));
  let n010 = dot(hash33(i + vec3f(0.0, 1.0, 0.0)) * 2.0 - 1.0, f - vec3f(0.0, 1.0, 0.0));
  let n110 = dot(hash33(i + vec3f(1.0, 1.0, 0.0)) * 2.0 - 1.0, f - vec3f(1.0, 1.0, 0.0));
  let n001 = dot(hash33(i + vec3f(0.0, 0.0, 1.0)) * 2.0 - 1.0, f - vec3f(0.0, 0.0, 1.0));
  let n101 = dot(hash33(i + vec3f(1.0, 0.0, 1.0)) * 2.0 - 1.0, f - vec3f(1.0, 0.0, 1.0));
  let n011 = dot(hash33(i + vec3f(0.0, 1.0, 1.0)) * 2.0 - 1.0, f - vec3f(0.0, 1.0, 1.0));
  let n111 = dot(hash33(i + vec3f(1.0, 1.0, 1.0)) * 2.0 - 1.0, f - vec3f(1.0, 1.0, 1.0));

  let nx00 = mix(n000, n100, u.x);
  let nx10 = mix(n010, n110, u.x);
  let nx01 = mix(n001, n101, u.x);
  let nx11 = mix(n011, n111, u.x);
  let nxy0 = mix(nx00, nx10, u.y);
  let nxy1 = mix(nx01, nx11, u.y);
  return mix(nxy0, nxy1, u.z);
}

fn fbm(p: vec3f, octaves: i32) -> f32 {
  var val = 0.0;
  var amp = 0.5;
  var freq = 1.0;
  var pos = p;
  for (var i = 0; i < octaves; i++) {
    val += amp * noise3d(pos * freq);
    freq *= 2.0;
    amp *= 0.5;
    pos += vec3f(1.7, 9.2, 3.4);
  }
  return val;
}

// --- Signed distance functions ---

fn sdf_sphere(p: vec3f, r: f32) -> f32 {
  return length(p) - r;
}

fn smooth_union(d1: f32, d2: f32, k: f32) -> f32 {
  let h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
  return mix(d2, d1, h) - k * h * (1.0 - h);
}

fn scene_sdf(p: vec3f) -> f32 {
  let t = u.time * u.speed;
  let freq = u.noise_freq;
  let turb = u.turbulence;
  let scl = u.scale;

  // Animated displacement from curl-noise-like FBM
  let octaves = i32(mix(2.0, 5.0, 1.0 - u.coherence));
  let displacement = fbm(p * freq * 0.5 + vec3f(t * 0.3, t * 0.2, t * 0.15), octaves) * turb;

  // Primary metaball cluster
  let offset1 = vec3f(sin(t * 0.7) * 0.4, cos(t * 0.5) * 0.3, sin(t * 0.3) * 0.2);
  let offset2 = vec3f(cos(t * 0.6) * 0.5, sin(t * 0.8) * 0.4, cos(t * 0.4) * 0.3);
  let offset3 = vec3f(sin(t * 0.4 + 2.0) * 0.3, cos(t * 0.9) * 0.5, sin(t * 0.6) * 0.4);

  let r = 0.4 * scl;
  let d1 = sdf_sphere(p - offset1, r) + displacement;
  let d2 = sdf_sphere(p - offset2, r * 0.8) + displacement * 0.8;
  let d3 = sdf_sphere(p - offset3, r * 0.6) + displacement * 1.2;

  let k = mix(0.8, 0.2, u.coherence); // smooth union factor
  var d = smooth_union(d1, d2, k);
  d = smooth_union(d, d3, k);

  // Extra blobs for high density
  if (u.density > 0.5) {
    let offset4 = vec3f(cos(t * 1.1) * 0.6, sin(t * 0.7 + 1.0) * 0.3, cos(t * 0.5 + 2.0) * 0.5);
    let d4 = sdf_sphere(p - offset4, r * 0.5) + displacement * 0.6;
    d = smooth_union(d, d4, k);
  }

  return d;
}

fn calc_normal(p: vec3f) -> vec3f {
  let e = vec2f(0.001, 0.0);
  return normalize(vec3f(
    scene_sdf(p + e.xyy) - scene_sdf(p - e.xyy),
    scene_sdf(p + e.yxy) - scene_sdf(p - e.yxy),
    scene_sdf(p + e.yyx) - scene_sdf(p - e.yyx),
  ));
}

// --- Color conversion ---

fn oklch_to_rgb(L: f32, C: f32, h_deg: f32) -> vec3f {
  let h = radians(h_deg);
  let a = C * cos(h);
  let b = C * sin(h);

  // OKLab to linear sRGB (approximate)
  let l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  let m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  let s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  let l3 = l_ * l_ * l_;
  let m3 = m_ * m_ * m_;
  let s3 = s_ * s_ * s_;

  let r = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  let g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  let bl = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  return clamp(vec3f(r, g, bl), vec3f(0.0), vec3f(1.0));
}

// --- Main fragment shader ---

@fragment
fn fs_main(in: VsOut) -> @location(0) vec4f {
  let resolution = vec2f(u.resolution_x, u.resolution_y);
  let uv = (in.uv * 2.0 - 1.0) * vec2f(resolution.x / resolution.y, 1.0);

  // Camera setup
  let ro = vec3f(0.0, 0.0, 3.5); // ray origin
  let rd = normalize(vec3f(uv, -1.5)); // ray direction

  // Raymarching
  var t_ray = 0.0;
  var hit = false;
  var p = ro;

  for (var i = 0; i < 80; i++) {
    p = ro + rd * t_ray;
    let d = scene_sdf(p);
    if (d < 0.002) {
      hit = true;
      break;
    }
    if (t_ray > 10.0) { break; }
    t_ray += d * 0.8;
  }

  var color: vec3f;

  if (hit) {
    let n = calc_normal(p);

    // Lighting
    let light_dir = normalize(vec3f(0.5, 0.8, 0.6));
    let diff = max(dot(n, light_dir), 0.0);
    let spec = pow(max(dot(reflect(-light_dir, n), -rd), 0.0), 32.0);

    // Base color from mood
    let base = oklch_to_rgb(u.brightness, u.saturation * 0.15, u.hue);

    // Secondary color (shifted hue)
    let secondary = oklch_to_rgb(u.brightness * 0.8, u.saturation * 0.12, u.hue + 60.0);

    // Mix based on normal direction for iridescence
    let iridescence = dot(n, vec3f(0.0, 1.0, 0.0)) * 0.5 + 0.5;
    let surface_color = mix(base, secondary, iridescence);

    // Fresnel rim
    let fresnel = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    let rim_color = oklch_to_rgb(u.brightness + 0.1, u.saturation * 0.1, u.hue + 120.0);

    color = surface_color * (0.3 + diff * 0.7) + spec * 0.4 + fresnel * rim_color * 0.5;

    // Glow / density factor
    color *= u.density * 0.5 + 0.7;
  } else {
    // Background: vibrant gradient with noise (Inside Out-inspired)
    let bg_noise = fbm(vec3f(uv * 2.0, u.time * u.speed * 0.1), 3) * 0.06;
    let bg_base = oklch_to_rgb(0.55 + u.brightness * 0.2, 0.08 + u.saturation * 0.06, u.hue + 180.0);
    let bg_accent = oklch_to_rgb(0.45 + u.brightness * 0.15, 0.06 + u.saturation * 0.05, u.hue + 240.0);
    let gradient_t = in.uv.y * 0.6 + 0.2;
    let bg_mixed = mix(bg_base, bg_accent, gradient_t);
    let vignette = 1.0 - length(uv) * 0.15;
    color = bg_mixed * vignette + bg_noise;
  }

  // Tone mapping (simple Reinhard)
  color = color / (color + vec3f(1.0));

  // Gamma correction
  color = pow(color, vec3f(1.0 / 2.2));

  return vec4f(color, 1.0);
}
