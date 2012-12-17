(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  define(['jquery', 'vendor/namespace', 'Three', 'CopyShader', 'ConvolutionShader', 'VignetteShader', 'FilmShader', 'TrackballControls', 'EffectComposer', 'RenderPass', 'BloomPass', 'FilmPass', 'TexturePass', 'ShaderPass', 'MaskPass', 'CopyShader', 'objects/Stars', 'objects/Planet', 'vendor/dat.gui.min'], function() {
    var App;
    return namespace("ThreePlanet", {
      App: App = (function() {

        function App() {
          this.onResize = __bind(this.onResize, this);

          this.render = __bind(this.render, this);

          this.animate = __bind(this.animate, this);

          this.createLensFlare = __bind(this.createLensFlare, this);

          this.initRenderer = __bind(this.initRenderer, this);

          this.createLights = __bind(this.createLights, this);

          this.createCamera = __bind(this.createCamera, this);

          this.updateWorld = __bind(this.updateWorld, this);

          this.createWorld = __bind(this.createWorld, this);

          var advanced, basic, gui, post,
            _this = this;
          this.clock = new THREE.Clock();
          this.scene = new THREE.Scene();
          this.PLANET_POSITION = new THREE.Vector3(0.001, 0.001, 0.001);
          this.PLANET_RADIUS = 200.0;
          this.lightPosition = new THREE.Vector3(0, 0, -this.PLANET_RADIUS * 10);
          this.LIGHT_DIRECTION = this.PLANET_POSITION.clone().subSelf(this.lightPosition).normalize();
          this.renderer = new THREE.WebGLRenderer({
            clearColor: 0x000000,
            alpha: true,
            clearAlpha: 1,
            antialias: true
          });
          this.bloom = 0.6;
          this.grain = 0.25;
          this.scanlines = 0.025;
          this.vignette = 1.5;
          this.vignetteOffset = 1.0;
          this.createCamera();
          this.createLights();
          this.initRenderer();
          this.createWorld();
          this.createLensFlare();
          $(window).bind("resize", function(e) {
            return _this.onResize();
          });
          this.animate();
          gui = new dat.GUI({
            width: 300,
            hide: true
          });
          this.camera = "space";
          gui.add(this, "camera", ["space", "atmosphere"]).onChange(function(value) {
            return _this.currentCamera = (function() {
              switch (value) {
                case "atmosphere":
                  return this.camera2;
                default:
                  return this.camera1;
              }
            }).call(_this);
          });
          basic = gui.addFolder("Basic");
          basic.add(this.planet.planetUtil, "exposure", 1.0, 4);
          basic.add(this.planet.planetUtil, "innerRadius");
          basic.add(this.planet.planetUtil, "outerRadius");
          advanced = gui.addFolder("Advanced");
          advanced.addColor(this.planet.planetUtil, "wavelengthColor");
          advanced.add(this.planet.planetUtil, "scaleDepth", 0, 2);
          advanced.add(this.planet.planetUtil, "Kr", 0, 0.01);
          advanced.add(this.planet.planetUtil, "Km", 0, 0.1);
          post = gui.addFolder("Post-processing");
          post.add(this, "bloom", 0, 2);
          post.add(this, "grain", 0, 2);
          post.add(this, "scanlines", 0, 1);
          post.add(this, "vignette", 0, 2);
          post.add(this, "vignetteOffset", 0, 2);
        }

        App.prototype.createWorld = function() {
          var material, mesh, r, shader, textureCube, urls;
          this.stars = new ThreePlanet.objects.Stars();
          this.scene.add(this.stars);
          this.planet = new ThreePlanet.objects.Planet(this.PLANET_RADIUS, this.PLANET_POSITION, this.directionalLight, this.currentCamera);
          this.scene.add(this.planet);
          r = "textures/nightCompressed/";
          urls = [r + "px.jpg", r + "nx.jpg", r + "py.jpg", r + "ny.jpg", r + "pz.jpg", r + "nz.jpg"];
          textureCube = THREE.ImageUtils.loadTextureCube(urls);
          shader = THREE.ShaderUtils.lib["cube"];
          shader.uniforms["tCube"].value = textureCube;
          material = new THREE.ShaderMaterial({
            fragmentShader: shader.fragmentShader,
            vertexShader: shader.vertexShader,
            uniforms: shader.uniforms,
            side: THREE.BackSide
          });
          mesh = new THREE.Mesh(new THREE.CubeGeometry(10000, 10000, 10000), material);
          return this.scene.add(mesh);
        };

        App.prototype.updateWorld = function(time, delta) {
          this.lightPosition.z = Math.cos(time * 0.05) * (this.PLANET_RADIUS * 10);
          this.lightPosition.x = Math.sin(time * 0.05) * (this.PLANET_RADIUS * 10);
          this.lightPosition.y = Math.sin(time * 0.05) * (-this.PLANET_RADIUS * 0.5);
          this.scene.updateMatrixWorld();
          return this.planet.update(time, delta);
        };

        App.prototype.createCamera = function() {
          this.camera1 = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
          this.scene.add(this.camera1);
          this.controls = new THREE.TrackballControls(this.camera1, this.renderer.domElement);
          this.controls.rotateSpeed = 1.0;
          this.controls.zoomSpeed = 1.4;
          this.controls.panSpeed = 0.2;
          this.controls.noZoom = false;
          this.controls.noPan = false;
          this.controls.staticMoving = false;
          this.controls.dynamicDampingFactor = 0.1;
          this.controls.keys = [65, 83, 68];
          this.camera1.position.set(this.PLANET_POSITION.x + this.PLANET_RADIUS * 2, this.PLANET_POSITION.y, this.PLANET_POSITION.z + this.PLANET_RADIUS * 2);
          this.camera1.position.x = -600;
          this.camera1.position.z = 0;
          this.camera1.lookAt(this.PLANET_POSITION);
          this.camera2 = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 10000);
          this.scene.add(this.camera2);
          this.camera2.position = new THREE.Vector3(-67.54433193947916, 134.44195702074728, -134.0052727111125);
          this.camera2.rotation = new THREE.Vector3(0.2, -0.9, 1.01);
          return this.currentCamera = this.camera1;
        };

        App.prototype.createLights = function() {
          this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.15);
          this.directionalLight.position = this.lightPosition;
          return this.scene.add(this.directionalLight);
        };

        App.prototype.initRenderer = function() {
          var renderTargetParameters;
          $("body").append("<div id='container'></div>");
          this.container = $("#container")[0];
          this.renderer.setSize(window.innerWidth, window.innerHeight);
          this.renderer.autoClear = false;
          this.container.appendChild(this.renderer.domElement);
          this.renderModel = new THREE.RenderPass(this.scene, this.currentCamera);
          this.effectBloom = new THREE.BloomPass(this.bloom);
          this.effectFilm = new THREE.FilmPass(this.grain, this.scanlines, 648, false);
          this.effectVignette = new THREE.ShaderPass(THREE.VignetteShader);
          this.effectVignette.uniforms['darkness'].value = this.vignette;
          renderTargetParameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.ARGBFormat,
            stencilBuffer: false
          };
          this.renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameters);
          this.composer = new THREE.EffectComposer(this.renderer, this.renderTarget);
          this.composer.addPass(this.renderModel);
          this.composer.addPass(this.effectBloom);
          this.composer.addPass(this.effectFilm);
          this.composer.addPass(this.effectVignette);
          return this.effectVignette.renderToScreen = true;
        };

        App.prototype.createLensFlare = function() {
          var flareColor, textureFlare0, textureFlare2, textureFlare3;
          textureFlare0 = THREE.ImageUtils.loadTexture("textures/lensflare0.jpg");
          textureFlare2 = THREE.ImageUtils.loadTexture("textures/lensflare2.jpg");
          textureFlare3 = THREE.ImageUtils.loadTexture("textures/lensflare3.jpg");
          flareColor = new THREE.Color(0xffffff);
          this.lensFlare = new THREE.LensFlare(textureFlare0, 700, 0.0, THREE.AdditiveBlending, flareColor);
          this.lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);
          this.lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);
          this.lensFlare.add(textureFlare2, 512, 0.0, THREE.AdditiveBlending);
          this.lensFlare.add(textureFlare3, 60, 0.6, THREE.AdditiveBlending);
          this.lensFlare.add(textureFlare3, 70, 0.7, THREE.AdditiveBlending);
          this.lensFlare.add(textureFlare3, 120, 0.9, THREE.AdditiveBlending);
          this.lensFlare.add(textureFlare3, 70, 1.0, THREE.AdditiveBlending);
          this.lensFlare.position = this.lightPosition;
          this.lensFlare.customUpdateCallback = this.updateLensFlare;
          return this.scene.add(this.lensFlare);
        };

        App.prototype.animate = function() {
          var delta, time;
          delta = this.clock.getDelta();
          time = this.clock.getElapsedTime() * 10;
          this.effectBloom.copyUniforms.opacity.value = this.bloom;
          this.effectFilm.uniforms.nIntensity.value = this.grain;
          this.effectFilm.uniforms.sIntensity.value = this.scanlines;
          this.effectVignette.uniforms.darkness.value = this.vignette;
          this.effectVignette.uniforms.offset.value = this.vignetteOffset;
          requestAnimationFrame(this.animate);
          if (this.controls) {
            this.controls.update();
          }
          this.updateWorld(time, delta);
          return this.render(time, delta);
        };

        App.prototype.render = function(time, delta) {
          this.renderer.clear();
          if (this.composer) {
            this.renderModel.camera = this.currentCamera;
            this.planet.camera = this.currentCamera;
            return this.composer.render(delta);
          } else {
            return this.renderer.render(this.scene, this.currentCamera);
          }
        };

        App.prototype.onResize = function() {
          var height, width;
          width = window.innerWidth;
          height = window.innerHeight;
          this.camera1.aspect = width / height;
          this.camera2.aspect = this.camera1.aspect;
          this.camera1.updateProjectionMatrix();
          this.camera2.updateProjectionMatrix();
          if (this.controls) {
            this.controls.screen.width = width;
            this.controls.screen.height = height;
          }
          this.renderer.setSize(window.innerWidth, window.innerHeight);
          if (this.composer) {
            return this.composer.reset();
          }
        };

        return App;

      })()
    });
  });

}).call(this);
