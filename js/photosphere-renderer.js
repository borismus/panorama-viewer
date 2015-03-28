function PhotosphereRenderer() {
  this.init();
}

PhotosphereRenderer.prototype.init = function() {
  // Load the default photosphere.
  this.setPhotosphere('images/arizona_sonora_museum.jpg', {isBinocular: true});

  var container = document.querySelector('body');
  var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 2000 );

  var renderer = new THREE.WebGLRenderer();
  renderer.setClearColor( 0x101010 );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );

  var controls = new THREE.VRControls( camera );
  var effect = new THREE.VREffect( renderer );
  effect.setSize( window.innerWidth, window.innerHeight );

  this.camera = camera;
  this.renderer = renderer;
  this.effect = effect;
  this.controls = controls;
  this.manager = new WebVRManager(effect);

  window.addEventListener( 'resize', this.onWindowResize_.bind(this), false );
};

PhotosphereRenderer.prototype.render = function() {
  this.controls.update();

  if (this.manager.isVRMode()) {
    this.effect.render( [ this.sceneLeft, this.sceneRight ], this.camera );
  } else {
    this.renderer.render(this.sceneLeft, this.camera);
  }
};

PhotosphereRenderer.prototype.setPhotosphere = function(src, opt_params) {
  var params = opt_params || {};
  var isBinocular = !!params.isBinocular;

  this.texture = this.createTexture(src);
  if (isBinocular) {
    this.sceneLeft = this.createScene({scaleY: 0.5});
    this.sceneRight = this.createScene({scaleY: 0.5, offsetY: 0.5});
  } else {
    this.sceneLeft = this.createScene();
    this.sceneRight = this.createScene();
  }
};

PhotosphereRenderer.prototype.createTexture = function(src) {
  var texture = THREE.ImageUtils.loadTexture(src);
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.format = THREE.RGBFormat;
  texture.generateMipmaps = false;
  return texture;
};

PhotosphereRenderer.prototype.createScene = function(opt_params) {
  var p = opt_params || {};
  p.scaleX = p.scaleX || 1;
  p.scaleY = p.scaleY || 1;
  p.offsetX = p.offsetX || 0;
  p.offsetY = p.offsetY || 0;

  var scene = new THREE.Scene();
  var geometry = new THREE.SphereGeometry( 500, 60, 40 );
  geometry.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );
  var uvs = geometry.faceVertexUvs[ 0 ];
  for ( var i = 0; i < uvs.length; i ++ ) {
    for ( var j = 0; j < 3; j ++ ) {
      uvs[ i ][ j ].x *= p.scaleX;
      uvs[ i ][ j ].x += p.offsetX;
      uvs[ i ][ j ].y *= p.scaleY;
      uvs[ i ][ j ].y += p.offsetY;
    }
  }
  var material = new THREE.MeshBasicMaterial( { map: this.texture } );
  var mesh = new THREE.Mesh( geometry, material );
  mesh.rotation.y = - Math.PI / 2;
  scene.add( mesh );

  return scene;
};

PhotosphereRenderer.prototype.onWindowResize_ = function() {
  this.camera.aspect = window.innerWidth / window.innerHeight;
  this.camera.updateProjectionMatrix();
  this.effect.setSize( window.innerWidth, window.innerHeight );
};

