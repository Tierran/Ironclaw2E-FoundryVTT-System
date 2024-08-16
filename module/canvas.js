/* -------------------------------------------- */
/*  Measurements                                */
/* -------------------------------------------- */
/* eslint-disable */

/* -------------------------------------------- */
/*  Vision Modes                                */
/* -------------------------------------------- */

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
            label: "ironclaw2e.info.sense.nightVision",
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
                    [VisionMode.LIGHTING_LEVELS.UNLIT]: VisionMode.LIGHTING_LEVELS.DIM,
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
            label: "ironclaw2e.info.sense.echolocation",
            canvas: {
                shader: ColorAdjustmentsSamplerShader,
                uniforms: { contrast: 0, saturation: -1, exposure: -0.35 }
            },
            lighting: {
                background: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED },
                illumination: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED },
                coloration: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED },
                darkness: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED }
            },
            vision: {
                darkness: { adaptive: false },
                defaults: { attenuation: 0, contrast: 0.25, saturation: -1, brightness: 1 },
                background: { shader: WaveOutwardBackgroundVisionShader },
                coloration: { shader: WaveOutwardColorationVisionShader }
            }
        }),
        // Blindness effect
        blindness: new VisionMode({
            id: "blindness",
            label: "VISION.ModeBlindness",
            tokenConfig: false,
            canvas: {
                shader: ColorAdjustmentsSamplerShader,
                uniforms: { enable: true, contrast: -0.75, saturation: -1, exposure: -0.3 }
            },
            lighting: {
                background: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED },
                illumination: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED },
                coloration: { visibility: VisionMode.LIGHTING_VISIBILITY.DISABLED }
            },
            vision: {
                darkness: { adaptive: false },
                defaults: { attenuation: 0, contrast: -0.5, saturation: -1, brightness: -1 }
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
  gl_FragColor = vec4(finalColor, 1.0) * depth;
  `;

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
    vec3 grey = vec3(perceivedBrightness(baseColor.rgb));
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

/* -------------------------------------------- */
/*  Detection Modes                             */
/* -------------------------------------------- */

/**
 * Return an object holding the default Ironclaw detection modes, to be assigned to 'CONFIG.Canvas.detectionModes'
 */
export function IronclawDetectionModes() {
    return {
        lightPerception: new DetectionModeLightPerception({
            id: "lightPerception",
            label: "DETECTION.LightPerception",
            type: DetectionMode.DETECTION_TYPES.SIGHT
        }),
        basicSight: new DetectionModeBasicSight({
            id: "basicSight",
            label: "DETECTION.BasicSight",
            type: DetectionMode.DETECTION_TYPES.SIGHT
        }),
        emitUltrasound: new DetectionModeEmitUltrasound({
            id: "emitUltrasound",
            label: "ironclaw2e.info.detection.emitUltrasound",
            type: DetectionMode.DETECTION_TYPES.SOUND
        }),
        hearUltrasound: new DetectionModeHearUltrasound({
            id: "hearUltrasound",
            label: "ironclaw2e.info.detection.hearUltrasound",
            type: DetectionMode.DETECTION_TYPES.SOUND
        }),


        seeAll: new DetectionModeAll({
            id: "seeAll",
            label: "DETECTION.SeeAll",
            type: DetectionMode.DETECTION_TYPES.SIGHT
        }),
        senseAll: new DetectionModeAll({
            id: "senseAll",
            label: "DETECTION.SenseAll",
            walls: false,
            angle: false,
            type: DetectionMode.DETECTION_TYPES.OTHER
        })
    }
}

/**
 * Detection mode that is based on emitting rapid pulses of ultrasound
 */
class DetectionModeEmitUltrasound extends DetectionMode {
    /** @override */
    static getDetectionFilter() {
        return this._detectionFilter ??= GlowOverlayFilter.create({
            outlineColor: [0.5, 0.5, 0.5, 0.1]
        });
    }

    /** @override */
    _canDetect(visionSource, target) {
        // Echolocation can't notice things when muted, or invisible things
        const src = visionSource.object.document;
        if ((src instanceof TokenDocument) && src.hasStatusEffect(CONFIG.specialStatusEffects.MUTE)) return false;
        const tgt = target?.document;
        const isInvisible = (tgt instanceof TokenDocument) && tgt.hasStatusEffect(CONFIG.specialStatusEffects.INVISIBLE);
        return !isInvisible;
    }
}

/**
 * Detection mode that represents ears sensitive enough to hear into ultrasound
 */
class DetectionModeHearUltrasound extends DetectionMode {
    /** @override */
    static getDetectionFilter() {
        return this._detectionFilter ??= OutlineOverlayFilter.create({
            outlineColor: [0, 0.60, 0.60, 1],
            wave: true,
            knockout: false
        });
    }

    /** @override */
    _canDetect(visionSource, target) {

        // Ultrasound-hearing can only detect active use of ultrasound (echolocation)
        const tgt = target?.document;
        const emitsUltrasound = (tgt instanceof TokenDocument) && tgt.detectionModes.find(x => x.id === "emitUltrasound")?.enabled && !tgt.hasStatusEffect(CONFIG.specialStatusEffects.MUTE);
        if (!emitsUltrasound) return false;
        return true;
    }
}