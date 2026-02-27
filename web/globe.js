import * as THREE from "https://cdn.skypack.dev/three@0.134.0";
import OrbitControls from "https://cdn.skypack.dev/orbit-controls-es6@2.0.1";

console.log('Globe module loaded');

// Global cleanup tracker
let globeCleanup = null;

// Export cleanup function for external use
export function cleanupGlobe() {
    if (globeCleanup) {
        globeCleanup();
        globeCleanup = null;
        console.log('Globe cleaned up successfully');
    }
}

// Auto-cleanup on page unload
window.addEventListener('beforeunload', cleanupGlobe);

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobe);
} else {
    setTimeout(initGlobe, 100);
}

function initGlobe() {
    console.log('initGlobe called');

    const globe_el = document.getElementById("globe");
    if (!globe_el) {
        console.error("Globe element not found");
        return;
    }

    console.log('Globe element found:', globe_el);

    // Get dimensions with fallback
    const rect = globe_el.getBoundingClientRect();
    const W = rect.width || 400;
    const H = rect.height || 400;

    console.log('Globe dimensions:', W, 'x', H);

    const GLOBE_RADIUS = 28;
    const DEG2RAD = Math.PI / 180;
    const worldDotRows = 200;
    const worldDotSize = .095;

    const globe_map_url = "https://github.githubassets.com/images/modules/site/home/globe/map.png";
    const image = new Image();
    image.src = globe_map_url;
    image.crossOrigin = "Anonymous";

    // Track all disposables for cleanup
    const resources = {
        geometries: [],
        materials: [],
        meshes: [],
        lights: [],
        controls: null,
        renderer: null,
        animationId: null,
        scene: null,
        camera: null
    };

    const scene = new THREE.Scene();
    resources.scene = scene;

    const camera = new THREE.PerspectiveCamera(20, W / H, 0.1, 1000);
    camera.position.set(0, 0, 220);  // Moved back to capture orbital tubes
    resources.camera = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    globe_el.appendChild(renderer.domElement);
    resources.renderer = renderer;

    const parentContainer = new THREE.Group();
    const euler = new THREE.Euler(.3, 4.6, .05);
    let rot = euler;
    const offset = (new Date).getTimezoneOffset() || 0;
    rot.y = euler.y + Math.PI * (offset / 720);
    parentContainer.rotation.copy(rot);
    scene.add(parentContainer);
    resources.meshes.push(parentContainer);

    const haloContainer = new THREE.Group();
    scene.add(haloContainer);
    resources.meshes.push(haloContainer);

    // Special Globe object
    class GLOBE {
        constructor(t) {
            this.props = t;
            this.init();
        }

        init() {
            const { radius: t, detail: e = 50, renderer: n, shadowPoint: i, highlightPoint: r, highlightColor: a, frontHighlightColor: s = 3555965, waterColor: o = 857395, landColorFront: l = 16777215, shadowDist: c, highlightDist: h, frontPoint: d } = this.props,
                u = new THREE.SphereGeometry(t, e, e),
                p = new THREE.MeshStandardMaterial({
                    color: o,
                    metalness: 0,
                    roughness: .9
                });

            // Track for cleanup
            resources.geometries.push(u);
            resources.materials.push(p);

            this.uniforms = [];

            p.onBeforeCompile = t => {
                t.uniforms.shadowDist = { value: c };
                t.uniforms.highlightDist = { value: h };
                t.uniforms.shadowPoint = { value: (new THREE.Vector3).copy(i) };
                t.uniforms.highlightPoint = { value: (new THREE.Vector3).copy(r) };
                t.uniforms.frontPoint = { value: (new THREE.Vector3).copy(d) };
                t.uniforms.highlightColor = { value: new THREE.Color(a) };
                t.uniforms.frontHighlightColor = { value: new THREE.Color(s) };

                t.vertexShader = "#define GLSLIFY 1\n#define STANDARD\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n\t#ifdef USE_TANGENT\n\t\tvarying vec3 vTangent;\n\t\tvarying vec3 vBitangent;\n\t#endif\n#endif\n#include <common>\n#include <uv_pars_vertex>\n#include <uv2_pars_vertex>\n#include <displacementmap_pars_vertex>\n#include <color_pars_vertex>\n#include <fog_pars_vertex>\n#include <morphtarget_pars_vertex>\n#include <skinning_pars_vertex>\n#include <shadowmap_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n#include <clipping_planes_pars_vertex>\n\nvarying vec3 vWorldPosition;\n\nvoid main() {\n\t#include <uv_vertex>\n\t#include <uv2_vertex>\n\t#include <color_vertex>\n\t#include <beginnormal_vertex>\n\t#include <morphnormal_vertex>\n\t#include <skinbase_vertex>\n\t#include <skinnormal_vertex>\n\t#include <defaultnormal_vertex>\n#ifndef FLAT_SHADED\n\tvNormal = normalize( transformedNormal );\n\t#ifdef USE_TANGENT\n\t\tvTangent = normalize( transformedTangent );\n\t\tvBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );\n\t#endif\n#endif\n\t#include <begin_vertex>\n\t#include <morphtarget_vertex>\n\t#include <skinning_vertex>\n\t#include <displacementmap_vertex>\n\t#include <project_vertex>\n\t#include <logdepthbuf_vertex>\n\t#include <clipping_planes_vertex>\n\tvViewPosition = - mvPosition.xyz;\n    vec4 worldPosition = vec4( transformed, 1.0 );\n\t#ifdef USE_INSTANCING\n\t\tworldPosition = instanceMatrix * worldPosition;\n\t#endif\n\tworldPosition = modelMatrix * worldPosition;\n\tvWorldPosition = worldPosition.xyz;\n\t#include <shadowmap_vertex>\n\t#include <fog_vertex>\n}";

                t.fragmentShader = "#define GLSLIFY 1\n#define STANDARD\n#ifdef PHYSICAL\n\t#define REFLECTIVITY\n\t#define CLEARCOAT\n\t#define TRANSPARENCY\n#endif\nuniform vec3 diffuse;\nuniform vec3 emissive;\nuniform float roughness;\nuniform float metalness;\nuniform float opacity;\n#ifdef TRANSPARENCY\n\tuniform float transparency;\n#endif\n#ifdef REFLECTIVITY\n\tuniform float reflectivity;\n#endif\n#ifdef CLEARCOAT\n\tuniform float clearcoat;\n\tuniform float clearcoatRoughness;\n#endif\n#ifdef USE_SHEEN\n\tuniform vec3 sheen;\n#endif\nvarying vec3 vViewPosition;\n#ifndef FLAT_SHADED\n\tvarying vec3 vNormal;\n\t#ifdef USE_TANGENT\n\t\tvarying vec3 vTangent;\n\t\tvarying vec3 vBitangent;\n\t#endif\n#endif\n#include <common>\n#include <packing>\n#include <dithering_pars_fragment>\n#include <color_pars_fragment>\n#include <uv_pars_fragment>\n#include <uv2_pars_fragment>\n#include <map_pars_fragment>\n#include <alphamap_pars_fragment>\n#include <aomap_pars_fragment>\n#include <lightmap_pars_fragment>\n#include <emissivemap_pars_fragment>\n#include <bsdfs>\n#include <cube_uv_reflection_fragment>\n#include <envmap_common_pars_fragment>\n#include <envmap_physical_pars_fragment>\n#include <fog_pars_fragment>\n#include <lights_pars_begin>\n#include <lights_physical_pars_fragment>\n#include <shadowmap_pars_fragment>\n#include <bumpmap_pars_fragment>\n#include <normalmap_pars_fragment>\n#include <clearcoat_pars_fragment>\n#include <roughnessmap_pars_fragment>\n#include <metalnessmap_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n#include <clipping_planes_pars_fragment>\n\nuniform float shadowDist;\nuniform float highlightDist;\nuniform vec3 shadowPoint;\nuniform vec3 highlightPoint;\nuniform vec3 frontPoint;\nuniform vec3 highlightColor;\nuniform vec3 frontHighlightColor;\n\nvarying vec3 vWorldPosition;\n\nvoid main() {\n\t#include <clipping_planes_fragment>\n\tvec4 diffuseColor = vec4( diffuse, opacity );\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\n\tvec3 totalEmissiveRadiance = emissive;\n\t#include <logdepthbuf_fragment>\n\t#ifdef USE_MAP\n\t\tvec4 texelColor = texture2D( map, vUv );\n\t\ttexelColor = mapTexelToLinear( texelColor );\n\t\t#ifndef IS_FILL\n\t\t\tdiffuseColor *= texelColor;\n\t\t#endif\n\t#endif\n\t#include <color_fragment>\n\t#include <alphamap_fragment>\n\t#include <alphatest_fragment>\n\t#include <roughnessmap_fragment>\n\t#include <metalnessmap_fragment>\n\t#include <normal_fragment_begin>\n\t#include <normal_fragment_maps>\n\t#include <clearcoat_normal_fragment_begin>\n\t#include <clearcoat_normal_fragment_maps>\n\t#include <emissivemap_fragment>\n\t#include <lights_physical_fragment>\n\t#include <lights_fragment_begin>\n\t#include <lights_fragment_maps>\n\t#include <lights_fragment_end>\n\t#include <aomap_fragment>\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\n\t#ifdef TRANSPARENCY\n\t\tdiffuseColor.a *= saturate( 1. - transparency + linearToRelativeLuminance( reflectedLight.directSpecular + reflectedLight.indirectSpecular ) );\n\t#endif\n    float dist;\n\tfloat distZ;\n\t#ifdef USE_HIGHLIGHT\n\t\tdist = distance(vWorldPosition, highlightPoint);\n\t\tdistZ = distance(vWorldPosition.z, 0.0);\n\t\toutgoingLight = mix(highlightColor, outgoingLight, smoothstep(0.0, highlightDist, dist) * smoothstep(0.0, 3.0, pow(distZ, 0.5)));\n        outgoingLight = mix(outgoingLight * 2.0, outgoingLight, smoothstep(0.0, 12.0, distZ));\n\t#endif\n    #ifdef USE_FRONT_HIGHLIGHT\n        dist = distance(vWorldPosition * vec3(0.875, 0.5, 1.0), frontPoint);\n        outgoingLight = mix(frontHighlightColor * 1.6, outgoingLight, smoothstep(0.0, 15.0, dist));\n    #endif\n    dist = distance(vWorldPosition, shadowPoint);\n\toutgoingLight = mix(outgoingLight * 0.01, outgoingLight, smoothstep(0.0, shadowDist, dist));\n\t#ifdef IS_FILL\n\t\toutgoingLight = mix(outgoingLight, outgoingLight * 0.5, 1.0 - texelColor.g * 1.5);\n\t#endif\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\n\t#include <tonemapping_fragment>\n\t#include <encodings_fragment>\n\t#include <fog_fragment>\n\t#include <premultiplied_alpha_fragment>\n\t#include <dithering_fragment>\n}";

                this.uniforms.push(t.uniforms);
            };

            p.defines = {
                USE_HIGHLIGHT: 1,
                USE_HIGHLIGHT_ALT: 1,
                USE_FRONT_HIGHLIGHT: 1,
                DITHERING: 1
            };

            this.mesh = new THREE.Group();
            const m = new THREE.Mesh(u, p);
            m.renderOrder = 1;
            this.mesh.add(m);
            this.meshFill = m;
            this.materials = [p];
        }

        setShadowPoint(t) {
            this.uniforms && this.uniforms.forEach((e => { e.shadowPoint.value.copy(t) }));
        }

        setHighlightPoint(t) {
            this.uniforms && this.uniforms.forEach((e => { e.highlightPoint.value.copy(t) }));
        }

        setFrontPoint(t) {
            this.uniforms && this.uniforms.forEach((e => { e.frontPoint.value.copy(t) }));
        }

        setShadowDist(t) {
            this.uniforms && this.uniforms.forEach((e => { e.shadowDist.value = t }));
        }

        setHighlightDist(t) {
            this.uniforms && this.uniforms.forEach((e => { e.highlightDist.value = t }));
        }

        dispose() {
            // Properly dispose Three.js resources
            if (this.meshFill) {
                if (this.meshFill.geometry) this.meshFill.geometry.dispose();
                if (this.meshFill.material) this.meshFill.material.dispose();
            }
            this.materials.forEach(m => m.dispose());
            this.mesh = null;
            this.materials = null;
            this.uniforms = null;
            this.meshFill = null;
        }
    }

    image.onload = () => {
        draw_world_dots();
    };

    // GLOBE WATER
    const shadowPoint = (new THREE.Vector3).copy(parentContainer.position).add(new THREE.Vector3(.7 * GLOBE_RADIUS, .3 * -GLOBE_RADIUS, GLOBE_RADIUS));
    const highlightPoint = (new THREE.Vector3).copy(parentContainer.position).add(new THREE.Vector3(1.5 * -GLOBE_RADIUS, 1.5 * -GLOBE_RADIUS, 0));
    const frontPoint = (new THREE.Vector3).copy(parentContainer.position).add(new THREE.Vector3(0, 0, GLOBE_RADIUS));

    const globe = new GLOBE({
        radius: GLOBE_RADIUS,
        detail: 55,
        renderer: renderer,
        shadowPoint: shadowPoint,
        shadowDist: 1.5 * GLOBE_RADIUS,
        highlightPoint: highlightPoint,
        highlightColor: 5339494,
        highlightDist: 5,
        frontPoint: frontPoint,
        frontHighlightColor: 2569853,
        waterColor: 1513012,
        landColorFront: 16777215,
        landColorBack: 16777215
    });

    scene.add(globe.mesh);

    // HALO
    const a = new THREE.SphereGeometry(GLOBE_RADIUS, 45, 45);
    const s = new THREE.ShaderMaterial({
        uniforms: {
            c: { type: "f", value: .7 },
            p: { type: "f", value: 15 },
            glowColor: { type: "c", value: new THREE.Color(1844322) },
            viewVector: { type: "v3", value: new THREE.Vector3(0, 0, 220) }
        },
        vertexShader: "uniform vec3 viewVector;uniform float c;uniform float p;varying float intensity;varying float intensityA;void main() { vec3 vNormal = normalize( normalMatrix * normal ); vec3 vNormel = normalize( normalMatrix * viewVector ); intensity = pow( c - dot(vNormal, vNormel), p ); intensityA = pow( 0.63 - dot(vNormal, vNormel), p ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}",
        fragmentShader: "uniform vec3 glowColor;varying float intensity;varying float intensityA;void main() { gl_FragColor = vec4( glowColor * intensity, 1.0 * intensityA ); }",
        side: 1,
        blending: 2,
        transparent: true,
        dithering: true
    });

    // Track halo resources
    resources.geometries.push(a);
    resources.materials.push(s);

    const halo = new THREE.Mesh(a, s);
    halo.scale.multiplyScalar(1.15);
    halo.rotateX(.03 * Math.PI);
    halo.rotateY(.03 * Math.PI);
    halo.renderOrder = 3;
    haloContainer.add(halo);
    haloContainer.position.set(0, 0, -10);

    // LIGHTS
    const light_amb = new THREE.AmbientLight(16777215, .8);
    const light_spot_1 = new THREE.SpotLight(2197759, 12, 120, .3, 0, 1.1);
    const light_spot_2 = new THREE.SpotLight(16018366, 5, 75, .5, 0, 1.25);
    const light_dir = new THREE.DirectionalLight(11124735, 3);

    light_spot_1.position.set(parentContainer.position.x - 2.5 * GLOBE_RADIUS, 80, -40);
    light_spot_2.position.set(parentContainer.position.x + GLOBE_RADIUS, GLOBE_RADIUS, 2 * GLOBE_RADIUS);
    light_spot_2.distance = 75;
    light_dir.position.set(parentContainer.position.x - 50, parentContainer.position.y + 30, 10);

    light_spot_1.target = parentContainer;
    light_spot_2.target = parentContainer;
    light_dir.target = parentContainer;

    scene.add(light_amb, light_spot_1, light_spot_2);
    resources.lights.push(light_amb, light_spot_1, light_spot_2, light_dir);

    // Controls
    const controls = new OrbitControls(camera, globe_el);
    controls.rotateSpeed = 0.05;
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.minPolarAngle = Math.PI * .3;
    controls.maxPolarAngle = Math.PI * .6;
    controls.enableZoom = false;
    resources.controls = controls;

    // Animation loop with cleanup support
    const animate = (time) => {
        resources.animationId = requestAnimationFrame(animate);
        parentContainer.rotation.y += 0.002;
        controls.update();

        // Update storm effects (halos pulse, particles flow)
        if (window.globeStormEffects) {
            window.globeStormEffects.update(time);
        }

        renderer.render(scene, camera);
    };

    animate();

    // Expose atmosphere control globally
    window.globeAtmosphere = {
        haloMaterial: s,
        globeMaterials: globe.materials,  // Access materials through globe object
        // Cache the colors to avoid recreating them
        _normalColor: new THREE.Color(1844322),  // Blue/purple
        _stormColor: new THREE.Color(0xFF6B00),  // Orange/gold
        _normalHighlight: new THREE.Color(5339494),  // Normal highlight (blue)
        _stormHighlight: new THREE.Color(0xFF4400),  // Storm highlight (red/orange)

        setSolarStormMode: function(enabled = true, intensity = 0) {
            // intensity: 0 (normal) to 1 (full solar storm)
            // Use copy() and lerp() instead of lerpColors() for proper interpolation
            const currentHaloColor = this._normalColor.clone().lerp(this._stormColor, intensity);
            this.haloMaterial.uniforms.glowColor.value = currentHaloColor;

            // Also interpolate the highlight color smoothly
            const globeMat = this.globeMaterials && this.globeMaterials[0];
            if (globeMat && globeMat.uniforms) {
                const currentHighlight = this._normalHighlight.clone().lerp(this._stormHighlight, intensity);
                globeMat.uniforms.highlightColor.value = currentHighlight;
            }
        }
    };

    function draw_world_dots() {
        const e = new THREE.Object3D();
        const d = getImageData(image);
        const i = [];
        const r = worldDotRows;

        for (let lat = -90; lat <= 90; lat += 180 / r) {
            const radius = Math.cos(Math.abs(lat) * DEG2RAD) * GLOBE_RADIUS;
            const circum = radius * Math.PI * 2 * 2;
            for (let r = 0; r < circum; r++) {
                const lng = 360 * r / circum - 180;
                if (!visibilityForCoordinate(lng, lat, d))
                    continue;
                const s = calc_pos(lat, lng, GLOBE_RADIUS);
                e.position.set(s.x, s.y, s.z);
                const o = calc_pos(lat, lng, GLOBE_RADIUS + 5);
                e.lookAt(o.x, o.y, o.z);
                e.updateMatrix();
                i.push(e.matrix.clone());
            }
        }

        const dot = new THREE.CircleGeometry(worldDotSize, 5);
        const dot_mat = new THREE.MeshStandardMaterial({
            color: 3818644,
            metalness: 0,
            roughness: .9,
            transparent: true,
            alphaTest: .02
        });

        // Track dot resources
        resources.geometries.push(dot);
        resources.materials.push(dot_mat);

        dot_mat.onBeforeCompile = (t) => {
            t.fragmentShader = t.fragmentShader.replace(
                "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
                "gl_FragColor = vec4( outgoingLight, diffuseColor.a ); if (gl_FragCoord.z > 0.51) { gl_FragColor.a = 1.0 + ( 0.51 - gl_FragCoord.z ) * 17.0; }"
            );
        };

        const o = new THREE.InstancedMesh(dot, dot_mat, i.length);
        for (let l = 0; l < i.length; l++)
            o.setMatrixAt(l, i[l]);
        o.renderOrder = 3;
        parentContainer.add(o);
        resources.meshes.push(o);
    }

    function visibilityForCoordinate(lng, lat, data) {
        const i = 4 * data.width;
        const r = parseInt((lng + 180) / 360 * data.width + .5);
        const a = data.height - parseInt((lat + 90) / 180 * data.height - .5);
        const s = parseInt(i * (a - 1) + 4 * r) + 3;
        return data.data[s] > 90;
    }

    function getImageData(img) {
        const el = document.createElement("canvas").getContext("2d");
        el.canvas.width = img.width;
        el.canvas.height = img.height;
        el.drawImage(img, 0, 0, img.width, img.height);
        return el.getImageData(0, 0, img.width, img.height);
    }

    function calc_pos(lat, lng, R, vec) {
        vec = vec || new THREE.Vector3();
        const V = (90 - lat) * DEG2RAD;
        const H = (lng + 180) * DEG2RAD;
        return vec.set(
            -R * Math.sin(V) * Math.cos(H),
            R * Math.cos(V),
            R * Math.sin(V) * Math.sin(H)
        ), vec;
    }

    // ============================================
    // ORBITAL TUBES (Phase 5 - Food Security)
    // ============================================
    const orbitalTubes = [];
    const orbitalTubeMaterial = new THREE.MeshBasicMaterial({
        color: 0x10b981,  // Green for Food Security theme
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
    });
    resources.materials.push(orbitalTubeMaterial);

    // Create curved orbital paths around the globe
    function createOrbitalTube(index, total) {
        const tubeRadius = GLOBE_RADIUS * 1.15;  // Tight orbit to stay within canvas bounds
        const curvePoints = [];

        // Create a curved path using QuadraticBezierCurve3
        // Each tube orbits at a different angle
        const angleOffset = (index / total) * Math.PI * 2;
        const tiltAngle = (index % 3 === 0) ? 0.3 : ((index % 3 === 1) ? -0.2 : 0.15);

        for (let i = 0; i <= 50; i++) {
            const t = i / 50;
            const angle = t * Math.PI * 2 + angleOffset;

            // Base circular path
            let x = Math.cos(angle) * tubeRadius;
            let y = Math.sin(angle) * tubeRadius * 0.4;  // Flatten the orbit
            let z = Math.sin(angle) * tubeRadius * 0.8;

            // Apply tilt
            const yTemp = y * Math.cos(tiltAngle) - z * Math.sin(tiltAngle);
            const zTemp = y * Math.sin(tiltAngle) + z * Math.cos(tiltAngle);
            y = yTemp;
            z = zTemp;

            curvePoints.push(new THREE.Vector3(x, y, z));
        }

        const curve = new THREE.CatmullRomCurve3(curvePoints);
        const tubeGeometry = new THREE.TubeGeometry(curve, 64, 0.15, 8, true);
        resources.geometries.push(tubeGeometry);

        const tube = new THREE.Mesh(tubeGeometry, orbitalTubeMaterial.clone());
        tube.renderOrder = 2;  // Between globe and halo

        // Initialize with zero draw range (hidden)
        tubeGeometry.setDrawRange(0, 0);

        parentContainer.add(tube);
        resources.meshes.push(tube);

        return {
            mesh: tube,
            geometry: tubeGeometry,
            maxIndex: tubeGeometry.index.count
        };
    }

    // Create 8 orbital tubes
    const TUBE_COUNT = 8;
    for (let i = 0; i < TUBE_COUNT; i++) {
        orbitalTubes.push(createOrbitalTube(i, TUBE_COUNT));
    }

    // Expose orbital tube control globally
    window.globeOrbitalTubes = {
        tubes: orbitalTubes,

        // Animate tubes based on progress (0 to 1)
        // Progress = scroll position through Phase 5
        setProgress: function(progress) {
            const clampedProgress = Math.max(0, Math.min(1, progress));

            // Each tube starts growing at a different time
            orbitalTubes.forEach((tube, index) => {
                const tubeStart = index / TUBE_COUNT;  // Stagger start times
                const tubeEnd = tubeStart + 0.4;  // Each tube takes 40% of phase to grow

                let tubeProgress = (clampedProgress - tubeStart) / 0.4;
                tubeProgress = Math.max(0, Math.min(1, tubeProgress));

                // Progressive drawing using setDrawRange
                const drawCount = Math.floor(tube.maxIndex * tubeProgress);
                tube.geometry.setDrawRange(0, drawCount);

                // Fade in opacity based on progress
                tube.mesh.material.opacity = tubeProgress * 0.6;
            });
        },

        // Reset all tubes to hidden
        reset: function() {
            orbitalTubes.forEach(tube => {
                tube.geometry.setDrawRange(0, 0);
                tube.mesh.material.opacity = 0;
            });
        }
    };

    console.log('Orbital tubes initialized');

    // ============================================
    // MULTIPLE HALO LAYERS & SOLAR WIND (Phase 4)
    // ============================================

    // Additional halo layers for solar storm effect
    const stormHalos = [];
    const haloConfigs = [
        { scale: 1.25, color: 0xFF6B00, opacity: 0.4, pulseSpeed: 0.002 },  // Orange outer
        { scale: 1.35, color: 0xFF4400, opacity: 0.25, pulseSpeed: 0.003 }, // Red-orange
        { scale: 1.45, color: 0xFFAA00, opacity: 0.15, pulseSpeed: 0.001 }  // Gold outermost
    ];

    haloConfigs.forEach((config, index) => {
        const haloGeom = new THREE.SphereGeometry(GLOBE_RADIUS, 32, 32);
        resources.geometries.push(haloGeom);

        const haloMat = new THREE.ShaderMaterial({
            uniforms: {
                c: { type: "f", value: .5 },
                p: { type: "f", value: 8 + index * 2 },
                glowColor: { type: "c", value: new THREE.Color(config.color) },
                viewVector: { type: "v3", value: new THREE.Vector3(0, 0, 220) },
                opacity: { type: "f", value: config.opacity }
            },
            vertexShader: "uniform vec3 viewVector;uniform float c;uniform float p;varying float intensity;void main() { vec3 vNormal = normalize( normalMatrix * normal ); vec3 vNormel = normalize( normalMatrix * viewVector ); intensity = pow( c - dot(vNormal, vNormel), p ); gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );}",
            fragmentShader: "uniform vec3 glowColor;uniform float opacity;varying float intensity;void main() { gl_FragColor = vec4( glowColor * intensity, opacity * intensity ); }",
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        resources.materials.push(haloMat);

        const haloMesh = new THREE.Mesh(haloGeom, haloMat);
        haloMesh.scale.multiplyScalar(config.scale);
        haloMesh.renderOrder = 3 + index;
        haloContainer.add(haloMesh);

        stormHalos.push({
            mesh: haloMesh,
            material: haloMat,
            baseOpacity: config.opacity,
            pulseSpeed: config.pulseSpeed,
            phase: index * Math.PI / 3
        });
    });

    // Solar wind particles
    const particleCount = 500;
    const particleGeom = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);
    const particleOffsets = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        // Distribute particles in a spherical shell
        const radius = GLOBE_RADIUS * (1.2 + Math.random() * 0.8);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;

        particlePositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = radius * Math.cos(phi);
        particlePositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);

        particleSpeeds[i] = 0.5 + Math.random() * 1.5;  // Flow speed
        particleOffsets[i] = Math.random() * Math.PI * 2;  // Random start phase
    }

    particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    resources.geometries.push(particleGeom);

    // Custom shader material for distance-based fade
    const particleMat = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xFFAA00) },
            opacity: { value: 0.0 },
            globeRadius: { value: GLOBE_RADIUS },
            maxDistance: { value: GLOBE_RADIUS * 1.4 },  // Fade out beyond this radius
            pointSize: { value: 15.0 }
        },
        vertexShader: `
            uniform float pointSize;
            uniform float globeRadius;
            uniform float maxDistance;
            varying float vAlpha;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;

                // Calculate distance from globe center
                float dist = length(position);

                // Fade based on distance from globe surface
                float fade = 1.0 - smoothstep(globeRadius * 1.1, maxDistance, dist);
                vAlpha = fade;

                // Size attenuation - larger particles closer to camera
                gl_PointSize = pointSize * (200.0 / -mvPosition.z);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            uniform float opacity;
            varying float vAlpha;
            void main() {
                // Create circular point
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                if (dist > 0.5) discard;

                // Soft edge
                float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
                gl_FragColor = vec4(color, opacity * alpha * vAlpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    resources.materials.push(particleMat);

    const particleSystem = new THREE.Points(particleGeom, particleMat);
    particleSystem.renderOrder = 4;
    parentContainer.add(particleSystem);
    resources.meshes.push(particleSystem);

    // Store original positions for animation
    const originalPositions = particlePositions.slice();

    // Expose storm effects control globally
    window.globeStormEffects = {
        halos: stormHalos,
        particles: {
            system: particleSystem,
            positions: particlePositions,
            speeds: particleSpeeds,
            offsets: particleOffsets,
            original: originalPositions,
            material: particleMat,
            visible: false
        },

        setIntensity: function(intensity) {
            // intensity: 0 (none) to 1 (full storm)

            // Animate halo layers
            stormHalos.forEach((halo, index) => {
                const targetOpacity = halo.baseOpacity * intensity;
                halo.material.uniforms.opacity.value = targetOpacity;
            });

            // Animate particles
            this.particles.visible = intensity > 0;
            this.particles.material.uniforms.opacity.value = intensity * 0.6;
        },

        update: function(time) {
            // Animate halo pulse
            stormHalos.forEach((halo, index) => {
                if (halo.material.uniforms.opacity.value > 0) {
                    const pulse = Math.sin(time * halo.pulseSpeed + halo.phase) * 0.3 + 0.7;
                    halo.material.uniforms.opacity.value = halo.baseOpacity * pulse;
                }
            });

            // Animate solar wind particles
            if (this.particles.visible && this.particles.material.opacity > 0) {
                const positions = this.particles.positions;
                const original = this.particles.original;
                const speeds = this.particles.speeds;
                const offsets = this.particles.offsets;

                for (let i = 0; i < positions.length; i += 3) {
                    const idx = i / 3;
                    const t = time * 0.001 * speeds[idx] + offsets[idx];

                    // Flow around the globe in a spiral
                    const radius = Math.sqrt(original[i] ** 2 + original[i + 1] ** 2 + original[i + 2] ** 2);
                    const baseTheta = Math.atan2(original[i + 2], original[i]);
                    const phi = Math.acos(original[i + 1] / radius);

                    // Add spiral motion
                    const theta = baseTheta + t * 0.5;
                    const spiralRadius = radius + Math.sin(t * 2 + idx) * 2;

                    positions[i] = spiralRadius * Math.sin(phi) * Math.cos(theta);
                    positions[i + 1] = spiralRadius * Math.cos(phi) + Math.sin(t + idx) * 3;
                    positions[i + 2] = spiralRadius * Math.sin(phi) * Math.sin(theta);
                }

                this.particles.system.geometry.attributes.position.needsUpdate = true;
            }
        }
    };

    console.log('Storm effects initialized (halos + particles)');

    console.log('Globe initialized successfully');

    // Define cleanup function
    globeCleanup = () => {
        // Cancel animation loop
        if (resources.animationId) {
            cancelAnimationFrame(resources.animationId);
        }

        // Dispose controls
        if (resources.controls) {
            resources.controls.dispose();
        }

        // Dispose all geometries
        resources.geometries.forEach(g => {
            if (g) g.dispose();
        });

        // Dispose all materials
        resources.materials.forEach(m => {
            if (m) m.dispose();
        });

        // Dispose renderer (releases WebGL context)
        if (resources.renderer) {
            resources.renderer.dispose();
            // Remove canvas from DOM
            const canvas = resources.renderer.domElement;
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }

        // Clear scene
        if (resources.scene) {
            while(resources.scene.children.length > 0) {
                resources.scene.remove(resources.scene.children[0]);
            }
        }

        // Clear references
        resources.geometries = [];
        resources.materials = [];
        resources.meshes = [];
        resources.lights = [];
        resources.controls = null;
        resources.renderer = null;
        resources.animationId = null;
        resources.scene = null;
        resources.camera = null;

        console.log('Globe memory cleaned up');
    };
}
