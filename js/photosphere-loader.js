/**
 * A photosphere loader optimized for limited texture sizes (eg. mobile is usually
 * limited to 4096x2048), and with support for stereo photospheres.
 */
function PhotosphereLoader(opt_params) {
  var params = opt_params || {};

  // Support for splitting a large photosphere texture (eg. 7168x3584) into two
  // smaller ones at 3584x3584 for projection onto half-spheres.
  // TODO(smus): Implement this later. For now, scale to 4096.
  this.useHemisphereTextures = !!params.useHemisphereTextures;
  // Support for binocular photospheres, where the image actually contains the left
  // and right images stacked on one another.
  this.isBinocular = !!params.isBinocular;

  // Working elements.
  this.canvas = document.createElement('canvas');
  this.image = document.createElement('img');

  // Calculate maximum texture size supported by this device.
  this.maxTextureSize = this.getMaxTextureSize();

  this.callbacks = {};

  // Output canvases.
  this.leftCanvas = document.createElement('canvas');
  this.rightCanvas = document.createElement('canvas');
}


PhotosphereLoader.prototype.load = function(src) {
  var canvas = this.canvas;
  this.image.src = src;

  this.image.addEventListener('load', this.onLoaded_.bind(this));
};

PhotosphereLoader.prototype.on = function(eventName, callback) {
  this.callbacks[eventName] = callback;
};

PhotosphereLoader.prototype.onLoaded_ = function(event) {
  var w = this.image.width;
  var h = this.image.height;
  console.log('Loaded image %d x %d', w, h);

  // Ensure we're good, size-wise.
  if (w > this.maxTextureSize || h > this.maxTextureSize) {
    // For now, report an error. Later, attempt to split into hemispheres.
    console.error('Image too large to fit into a texture. Limit: %d',
        this.maxTextureSize);
    return;
  }

  // See if it's a binocular or monocular photosphere.
  if (w == h) {
    console.log('Binocular photosphere.');
    this.isBinocular = true;
  } else if (w == h * 2) {
    console.log('Monocular photosphere.');
    this.isBinocular = false;
  } else {
    // Images that aren't 2:1 or 1:1 are invalid.
    console.error('Invalid dimensions for a photosphere.');
    return;
  }

  if (this.isBinocular) {
    // Size the output canvases.
    this.leftCanvas.width = w;
    this.leftCanvas.height = h/2;
    this.rightCanvas.width = w;
    this.rightCanvas.height = h/2;

    // Blit the top image onto the left canvas, and bottom onto right.
    var left = this.leftCanvas.getContext('2d');
    var right = this.rightCanvas.getContext('2d');
    left.drawImage(this.image, 0, 0,  w, h/2, 0, 0, w, h/2);
    right.drawImage(this.image, 0, h/2, w, h/2, 0, 0, w, h/2);
  } else {
    this.leftCanvas.width = w;
    this.leftCanvas.height = h;
    var left = this.leftCanvas.getContext('2d');
    left.drawImage(this.image, 0, 0, w, h, 0, 0, w, h);
  }

  this.fire_(this.callbacks.loaded);
};

PhotosphereLoader.prototype.getMaxTextureSize = function() {
  var gl = this.canvas.getContext('webgl');
  return gl.getParameter(gl.MAX_TEXTURE_SIZE);
};

PhotosphereLoader.prototype.fire_ = function(callback) {
  if (callback) {
    callback();
  }
};
