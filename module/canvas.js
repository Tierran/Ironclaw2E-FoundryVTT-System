/** @override */
export const measureDistances = function (segments, options = {}) {
    if (!options.gridSpaces) return BaseGrid.prototype.measureDistances.call(this, segments, options);

    // Track the total number of diagonals
    let nDiagonal = 0;
    const rule = this.parent.diagonalRule;
    const d = canvas.dimensions;

    // Iterate over measured segments
    return segments.map(s => {
        let r = s.ray;

        // Determine the total distance traveled
        let nx = Math.abs(Math.ceil(r.dx / d.size));
        let ny = Math.abs(Math.ceil(r.dy / d.size));

        // Determine the number of straight and diagonal moves
        let nd = Math.min(nx, ny);
        let ns = Math.abs(ny - nx);
        nDiagonal += nd;

        // Standard Euclidean measurement
        if (rule === "EUCL" || rule === "RDCL") {
            return Math.round(Math.hypot(nx, ny) * canvas.scene.gridDistance);
        }

        // The one-two, or five-ten, compromise
        else if (rule === "ONTW") {
            let nd10 = Math.floor(nDiagonal / 2) - Math.floor((nDiagonal - nd) / 2);
            let spaces = (nd10 * 2) + (nd - nd10) + ns;
            return spaces * canvas.dimensions.distance;
        }

        // Diagonal movement same as orthogonal
        else return (ns + nd) * canvas.scene.gridDistance;
    });
};

/**
 * A subclass for echolocation based vision
 */
export class EcholocationVisionMode extends VisionMode {

    /** @override */
    animated = true;
}

/**
 * Return an object holding the default Ironclaw vision modes, to be assigned to 'CONFIG.Canvas.visionModes'
 */
export function IronclawVisionModes() {
    return {
        basic: new VisionMode({
            id: "basic",
            label: "VISION.ModeBasicVision",
            vision: {
                defaults: { attenuation: 0, contrast: 0, saturation: 0, brightness: 0 }
            }
        }),
        nightVision: new VisionMode({
            id: "nightVision",
            label: "ironclaw2e.config.vision.nightVision",
            canvas: {
                shader: ColorAdjustmentsSamplerShader,
                uniforms: { enable: true, contrast: 0.15, saturation: -0.75, brightness: 0.15 }
            },
            lighting: {
                background: {
                    postProcessingModes: ["SATURATION"],
                    uniforms: { saturation: -0.75 }
                },
                illumination: {
                    postProcessingModes: ["SATURATION"],
                    uniforms: { saturation: -0.7 }
                },
                coloration: {
                    postProcessingModes: ["SATURATION"],
                    uniforms: { saturation: -0.75 }
                },
                levels: {
                    [VisionMode.LIGHTING_LEVELS.DIM]: VisionMode.LIGHTING_LEVELS.BRIGHT,
                    [VisionMode.LIGHTING_LEVELS.BRIGHT]: VisionMode.LIGHTING_LEVELS.BRIGHTEST
                }
            },
            vision: {
                darkness: { adaptive: false },
                defaults: { attenuation: 0.1, contrast: 0.15, saturation: -0.75, brightness: 0.15 }
            }
        }),
        echolocation: new EcholocationVisionMode({
            id: "echolocation",
            label: "ironclaw2e.config.vision.echolocation",
            canvas: {
                shader: ColorAdjustmentsSamplerShader,
                uniforms: { enable: true, contrast: 0.8, saturation: -1, exposure: 0.35, brightness: 0.15 }
            },
            lighting: {
                background: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED },
                illumination: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED },
                coloration: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED }
            },
            vision: {
                darkness: { adaptive: false },
                defaults: { attenuation: 0, contrast: 0.25, saturation: -1, brightness: 1 },
                background: { shader: WaveOutwardBackgroundVisionShader },
                coloration: { shader: WaveOutwardColorationVisionShader }
            }
        })
    };
}

var shaderTimeMultiplier = "-16.0";
var shaderRotateMultiplier = "0.01";

/**
 * The wave vision shader, used to create waves emanations with outward central waves (for echolocation)
 * @implements {ColorationVisionShader}
 */
class WaveOutwardColorationVisionShader extends ColorationVisionShader {

    /** @inheritdoc */
    static fragmentShader = `
  ${this.SHADER_HEADER}
  ${this.WAVE()}
  ${this.PERCEIVED_BRIGHTNESS}
    
  void main() {
    ${this.FRAGMENT_BEGIN}
    // Normalize vUvs and compute base time
    vec2 uvs = (2.0 * vUvs) - 1.0;
    float t = time * ${shaderTimeMultiplier};

    // Rotate uvs
    float sinX = sin(t * ${shaderRotateMultiplier});
    float cosX = cos(t * ${shaderRotateMultiplier});
    mat2 rotationMatrix = mat2( cosX, -sinX, sinX, cosX);
    vec2 ruv = ((vUvs - 0.5) * rotationMatrix) + 0.5;

    // Prepare distance from 4 corners
    float dst[4];
    dst[0] = distance(vec2(0.0), ruv);
    dst[1] = distance(vec2(1.0), ruv);
    dst[2] = distance(vec2(1.0,0.0), ruv);
    dst[3] = distance(vec2(0.0,1.0), ruv);

    // Produce 4 arms smoothed to the edges
    float angle = atan(ruv.x * 2.0 - 1.0, ruv.y * 2.0 - 1.0) * INVTWOPI;
    float beam = fract(angle * 4.0);
    beam = smoothstep(0.3, 1.0, max(beam, 1.0 - beam));

    // Computing the 4 corner waves
    float multiWaves = 0.0;
    for ( int i = 0; i <= 3 ; i++) {
      multiWaves += smoothstep(0.6, 1.0, max(multiWaves, wcos(-10.0, 1.30 - dst[i], dst[i] * 120.0, t)));
    }
    // Computing the central wave
    multiWaves += smoothstep(0.6, 1.0, max(multiWaves, wcos(-10.0, 1.35 - dist, dist * 120.0, t)));

    // Construct final color
    finalColor = vec3(mix(multiWaves, 0.0, sqrt(beam))) * colorEffect;
    ${this.COLORATION_TECHNIQUES}
    ${this.ADJUSTMENTS}
    ${this.FALLOFF}
    ${this.FRAGMENT_END}
  }`;

    /** @inheritdoc */
    static defaultUniforms = ({ ...super.defaultUniforms, colorEffect: [0.05, 0.05, 0.05] });

    /** @inheritdoc */
    get isRequired() {
        return true;
    }
}

/**
 * Shader specialized in wave like senses (echolocation)
 * @implements {BackgroundVisionShader}
 */
class WaveOutwardBackgroundVisionShader extends BackgroundVisionShader {
    /**
     * Shader final
     * @type {string}
     */
    static FRAGMENT_END = `
  gl_FragColor = finalColor4c * depth;`;

    /** @inheritdoc */
    static fragmentShader = `
  ${this.SHADER_HEADER}
  ${this.WAVE()}
  ${this.PERCEIVED_BRIGHTNESS}
  
  void main() {
    ${this.FRAGMENT_BEGIN}    
    // Normalize vUvs and compute base time
    vec2 uvs = (2.0 * vUvs) - 1.0;
    float t = time * ${shaderTimeMultiplier};

    // Rotate uvs
    float sinX = sin(t * ${shaderRotateMultiplier});
    float cosX = cos(t * ${shaderRotateMultiplier});
    mat2 rotationMatrix = mat2( cosX, -sinX, sinX, cosX);
    vec2 ruv = ((vUvs - 0.5) * rotationMatrix) + 0.5;

    // Produce 4 arms smoothed to the edges
    float angle = atan(ruv.x * 2.0 - 1.0, ruv.y * 2.0 - 1.0) * INVTWOPI;
    float beam = fract(angle * 4.0);
    beam = smoothstep(0.3, 1.0, max(beam, 1.0 - beam));

    // Construct final color
    vec3 grey = vec3(perceivedBrightnessAdvanced(baseColor.rgb));
    finalColor = mix(baseColor.rgb, grey * 0.7, sqrt(beam)) * mix(vec3(1.0), colorTint, 0.3);
    ${this.ADJUSTMENTS}
    ${this.BACKGROUND_TECHNIQUES}
    ${this.FALLOFF}
    ${this.FRAGMENT_END}
  }`;

    /** @inheritdoc */
    static defaultUniforms = ({ ...super.defaultUniforms, colorTint: [0.1, 0.1, 0.1] });

    /** @inheritdoc */
    get isRequired() {
        return true;
    }
}