// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }`

// Fragment shader program
var FSHADER_SOURCE =`
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }`

// Global Variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL() {
  // Retrieve <canvas> element
  canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  // gl = getWebGLContext(canvas);
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  
  gl.enable(gl.DEPTH_TEST); // Enable depth test
}

function connectVariablesToGLSL() {
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // // Get the storage location of a_Position
  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  // Get the storage location of u_FragColor
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  // Get the storage location of u_ModelMatrix
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) {
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // Get the storage location of u_GlobalRotateMatrix
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  if (!u_GlobalRotateMatrix) {
    console.log('Failed to get the storage location of u_GlobalRotateMatrix');
    return;
  }

  // Set initial value for this matrix to identify
  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Globals related UI elements
let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 5.0;
let g_seletcedType = POINT;
let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_isDragging = false;
let g_lastMouseX = null;
let g_lastMouseY = null;
let g_wingsAngle = 0;
let g_lowerBeakAngle = 0;
let g_leftThighAngle = 0;
let g_leftCalfAngle = 0;
let g_leftFootAngle = 0;
let g_rightThighAngle = 0;
let g_rightCalfAngle = 0;
let g_rightFootAngle = 0;
let g_eyesScale = 0;
let g_wingsAnimation = false;
let g_lowerBeakAnimation = false;
let g_leftLegAnimation = false;
let g_leftFootAnimation = false;
let g_rightLegAnimation = false;
let g_rightFootAnimation = false;
let g_shiverAnimation = false;
let g_shiverStartTime = 0;

function addActionsForHtmlUI() {
  // Button events
  document.getElementById('animationLowerBeakOffButton').onclick = function() { g_lowerBeakAnimation = false; };
  document.getElementById('animationLowerBeakOnButton').onclick = function() { g_lowerBeakAnimation = true; };
  document.getElementById('animationWingsOffButton').onclick = function() { g_wingsAnimation = false; };
  document.getElementById('animationWingsOnButton').onclick = function() { g_wingsAnimation = true; };
  document.getElementById('animationLeftLegOffButton').onclick = function() { g_leftLegAnimation = false; };
  document.getElementById('animationLeftLegOnButton').onclick = function() { g_leftLegAnimation = true; };
  document.getElementById('animationRightLegOffButton').onclick = function() { g_rightLegAnimation = false; };
  document.getElementById('animationRightLegOnButton').onclick = function() { g_rightLegAnimation = true; };
  document.getElementById('animationLeftFootOffButton').onclick = function() { g_leftFootAnimation = false; };
  document.getElementById('animationLeftFootOnButton').onclick = function() { g_leftFootAnimation = true; };
  document.getElementById('animationRightFootOffButton').onclick = function() { g_rightFootAnimation = false; };
  document.getElementById('animationRightFootOnButton').onclick = function() { g_rightFootAnimation = true; };

  // Slider events
  document.getElementById('lowerBeakSlide').addEventListener('mousemove', function() { g_lowerBeakAngle = this.value; renderAllShapes(); });
  document.getElementById('wingsSlide').addEventListener('mousemove', function() { g_wingsAngle = this.value; renderAllShapes(); });
  document.getElementById('leftThighSlide').addEventListener('mousemove', function() { g_leftThighAngle = this.value; renderAllShapes(); });
  document.getElementById('rightThighSlide').addEventListener('mousemove', function() { g_rightThighAngle = this.value; renderAllShapes(); });
  document.getElementById('leftFootSlide').addEventListener('mousemove', function() { g_leftFootAngle = this.value; renderAllShapes(); });
  document.getElementById('rightFootSlide').addEventListener('mousemove', function() { g_rightFootAngle = this.value; renderAllShapes(); });
  document.getElementById('leftCalfSlide').addEventListener('mousemove', function() { g_leftCalfAngle = this.value; renderAllShapes(); });
  document.getElementById('rightCalfSlide').addEventListener('mousemove', function() { g_rightCalfAngle = this.value; renderAllShapes(); });
}

function main() {
  // Set up canvas and gl variables
  setupWebGL();
  //Set up GLSL shaders and connect variables to GLSL
  connectVariablesToGLSL();

  // Set up actions for HTML UI
  addActionsForHtmlUI();

  // Register function (event handler) to be called on a mouse press
  canvas.onmousedown = click;
  // canvas.onmousemove = click;
  canvas.onmousemove = function(ev) { if (ev.buttons == 1) click(ev); };

  /// ChatGPT helped me with this camera rotation code
  canvas.addEventListener('mousedown', function(ev) {
    g_isDragging = true;
    g_lastMouseX = ev.clientX;
    g_lastMouseY = ev.clientY;

    if (ev.shiftKey) {
      g_shiverAnimation = true;
      g_shiverStartTime = performance.now() / 1000.0; // Start time in seconds
    }
  });

  canvas.addEventListener('mouseup', function(ev) {
    g_isDragging = false;
  });

  canvas.addEventListener('mousemove', function(ev) {
    if (g_isDragging) {
      let dx = ev.clientX - g_lastMouseX;
      let dy = ev.clientY - g_lastMouseY;
      g_globalAngleX -= (dx * 0.5);
      g_globalAngleY -= (dy * 0.5);

      g_globalAngleY = Math.max(-90, Math.min(90, g_globalAngleY));

      g_lastMouseX = ev.clientX;
      g_lastMouseY = ev.clientY;
      renderAllShapes(); // Draw the shapes
    }
  });

  // Specify the color for clearing <canvas>
  //gl.clearColor(0, 0, 0.5, 0.2);

  requestAnimationFrame(tick); // Start the tick function
}

var g_startTime = performance.now() / 1000.0; // Start time in seconds
var g_seconds = performance.now() / 1000.0 - g_startTime; // Time in seconds

// Called by browser repeatedly to update the display
function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime; // Update time in seconds
  
  // Update the angles of everything if currently animating
  updateAnimationAngles();

  renderAllShapes(); // Draw the shapes

  requestAnimationFrame(tick); // Request that the browser calls tick
}

// Update the angles of everything if currently animating
function updateAnimationAngles() {
  if (g_shiverAnimation) {
    let elapsed = g_seconds - g_shiverStartTime;
    
    /// Asked ChatGPT for help on just the shiver part (changing g_globalAngleX) of the animation
    if (elapsed > 2) {
      g_shiverAnimation = false; // Stop the animation after 1 second
    }
    else {
      g_globalAngleX += Math.sin(g_seconds * 5) * 5; // Shiver effect
      // shake legs
      g_leftThighAngle += Math.sin(g_seconds * 20) * 5;
      g_rightThighAngle += -Math.sin(g_seconds * 20) * 5;
      // shake wings
      g_wingsAngle = Math.max(0, 90 * Math.sin(10 * g_seconds)); 
    }
  }
  
  if (g_wingsAnimation) {
    g_wingsAngle = Math.max(0, 45 * Math.sin(4 * g_seconds));
  }

  if (g_lowerBeakAnimation) {
    g_lowerBeakAngle = Math.min(0, Math.max(-5, 45 * Math.sin(2.5 * g_seconds)));
  }

  if (g_leftLegAnimation) {
    g_leftThighAngle = Math.max(-50, Math.min(50, 45 * Math.sin(2.5 * g_seconds)));
  }

  if (g_rightLegAnimation) {
    g_rightThighAngle = Math.max(-50, Math.min(50, -45 * Math.sin(2.5 * g_seconds)));
  }

  if (g_leftFootAnimation) {
    g_leftFootAngle = Math.max(-10, Math.min(0, 45 * Math.sin(2.5 * g_seconds)));
  }
  
  if (g_rightFootAnimation) {
    g_rightFootAngle = Math.max(-10, Math.min(0, -45 * Math.sin(2.5 * g_seconds)));
  }  

  // ChatGPT helped me with the blinking animation
  let blink = Math.abs(Math.sin(2 * g_seconds));

  if (blink > 0.9) {
    g_eyesScale = 0.01 + (0.07 * (1.0 - blink) * 10.0);
  } 
  else {
    g_eyesScale = 0.08;
  }
}

function renderAllShapes() {
  var startTime = performance.now();
  
  /// ChatGPT helped me with the global rotation matrix
  // Pass the matrix to u_ModelMatrix variable
  var globalRotMat = new Matrix4().rotate(g_globalAngleX, 0, 1, 0);
  globalRotMat.rotate(g_globalAngleY, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  var identityM = new Matrix4();
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, identityM.elements);

  // Ground
  var ground = new Cube();
  ground.color = [0.0, 0.4, 0.0, 1];
  ground.matrix.translate(-2.0, -2.71, .5);
  ground.matrix.rotate(0, 1, 0, 0);
  ground.matrix.scale(100.0, 2, 0.0);
  ground.render();

  var globalRotMat = new Matrix4().rotate(g_globalAngleX, 0, 1, 0);
  globalRotMat.rotate(g_globalAngleY, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Left thigh
  var leftThigh = new Cube();
  leftThigh.color = [0.9, 0.7, 0, 1.0];
  leftThigh.matrix.translate(-.1, -.35, 0.0);
  leftThigh.matrix.rotate(180, 0, 0, 1);
  leftThigh.matrix.rotate(g_leftThighAngle, 1, 0, 0);
  var leftThighCoordinatesMat = new Matrix4(leftThigh.matrix);
  leftThigh.matrix.scale(0.1, 0.175, 0.05);
  leftThigh.render();

  // Left calf
  var leftCalf = new Cube();
  leftCalf.color = [0.9, 0.7, 0, 1.0];
  leftCalf.matrix = leftThighCoordinatesMat;
  leftCalf.matrix.translate(0.0, .175, 0.0);
  leftCalf.matrix.rotate(g_leftCalfAngle, 1, 0, 0);
  var leftCalfCoordinatesMat = new Matrix4(leftCalf.matrix);
  leftCalf.matrix.scale(0.1, 0.175, 0.05);
  leftCalf.render();

  // Left Foot
  var leftFoot = new Cube();
  leftFoot.color = [0.9, 0.7, 0, 1.0];
  leftFoot.matrix = leftCalfCoordinatesMat;
  leftFoot.matrix.translate(.15, .155, .1);
  leftFoot.matrix.rotate(180, 0, 1, 0);
  leftFoot.matrix.rotate(g_leftFootAngle, 1, 0, 0);
  leftFoot.matrix.scale(.2, .02, .3);
  leftFoot.render();

  // Right thigh
  var rightThigh = new Cube();
  rightThigh.color = [0.9, 0.7, 0, 1.0];
  rightThigh.matrix.translate(0.2, -.35, 0.0);
  rightThigh.matrix.rotate(180, 0, 0, 1);
  rightThigh.matrix.rotate(g_rightThighAngle, 1, 0, 0);
  var rightThighCoordinatesMat = new Matrix4(rightThigh.matrix);
  rightThigh.matrix.scale(0.1, 0.175, 0.05);
  rightThigh.render();

  // Right calf
  var rightCalf = new Cube();
  rightCalf.color = [0.9, 0.7, 0, 1.0];
  rightCalf.matrix = rightThighCoordinatesMat;
  rightCalf.matrix.translate(0.0, .175, 0.0);
  rightCalf.matrix.rotate(g_rightCalfAngle, 1, 0, 0);
  var rightCalfCoordinatesMat = new Matrix4(rightCalf.matrix);
  rightCalf.matrix.scale(0.1, 0.175, 0.05);
  rightCalf.render();

  // Right Foot
  var rightFoot = new Cube();
  rightFoot.color = [0.9, 0.7, 0, 1.0];
  rightFoot.matrix = rightCalfCoordinatesMat;
  rightFoot.matrix.translate(.15, .155, .1);
  rightFoot.matrix.rotate(180, 0, 1, 0);
  rightFoot.matrix.rotate(g_rightFootAngle, 1, 0, 0);
  rightFoot.matrix.scale(.2, .02, .3);
  rightFoot.render();

  // Gray body
  var body = new Cube();
  body.color = [0.8, 0.8, 0.8, 1.0];
  body.matrix.translate(-.25, -.4, -0.4);
  body.matrix.rotate(0, 1, 0, 0);
  body.matrix.scale(0.5, 0.5, 0.7);
  body.render();

  // Right wing
  var rightWing = new Cube();
  rightWing.color = [0.6, 0.6, 0.6, 1.0];
  rightWing.matrix.translate(0.25, 0.1, 0.25);
  rightWing.matrix.rotate(180, 1, 0, 0);
  rightWing.matrix.rotate(-g_wingsAngle, 0, 0, 1);
  rightWing.matrix.scale(0.07, 0.33, 0.5);
  rightWing.render();

  // Left wing
  var leftWing = new Cube();
  leftWing.color = [0.6, 0.6, 0.6, 1.0];
  leftWing.matrix.translate(-0.25, .1, -0.25);
  leftWing.matrix.rotate(180, 0, 0, 1);
  leftWing.matrix.rotate(-g_wingsAngle, 0, 0, 1);
  leftWing.matrix.scale(0.07, 0.33, 0.5);
  leftWing.render();

  // Head
  var head = new Cube();
  head.color = [0.9, 0.9, 0.9, 1.0];
  head.matrix.translate(-0.15, 0.03, -0.6);
  head.matrix.rotate(0, 1, 0, 0);
  head.matrix.scale(0.3001, 0.43, 0.27);
  head.render();

  // Head Hair
  var headHair = new Cube();
  headHair.color = [1, 0, 0, 1]; 
  headHair.matrix.translate(-.05, 0.1, -0.55);
  headHair.matrix.rotate(0, 1, 0, 0);
  headHair.matrix.scale(.1, .45, 0.3);
  headHair.render();

  // Beak upper
  var beakUpper = new Cube();
  beakUpper.color = [1.0, 0.6, 0.0, 1.0];
  beakUpper.matrix.translate(-.148, 0.23, -0.75);
  beakUpper.matrix.rotate(0, 1, 0, 0);
  beakUpper.matrix.scale(0.295, 0.05, 0.3);
  beakUpper.render();

  // Beak lower
  var beakLower = new Cube();
  beakLower.color = [0.8, 0.5, 0.0, 1.0];
  beakLower.matrix.translate(-.148, 0.23, -0.45);
  beakLower.matrix.rotate(180, 1, 0, 0);
  beakLower.matrix.rotate(g_lowerBeakAngle, 1, 0, 0);
  beakLower.matrix.scale(0.295, 0.05, 0.3);
  beakLower.render();

  // Gizzard
  var gizzard = new Cube();
  gizzard.color = [1.0, 0, 0.0, 1.0];
  gizzard.matrix.translate(-.07, 0.04, -0.7);
  gizzard.matrix.rotate(0, 1, 0, 0);
  gizzard.matrix.scale(0.13, 0.15, 0.1);
  gizzard.render();

  // Left eye
  var leftEye = new Cube();
  leftEye.color = [0.0, 0.0, 0.0, 1.0];
  leftEye.matrix.translate(-0.15, 0.28, -0.602);
  leftEye.matrix.rotate(0, 1, 0, 0);
  leftEye.matrix.scale(0.08, g_eyesScale, 0.01);
  leftEye.render();

  // Right eye
  var rightEye = new Cube();
  rightEye.color = [0.0, 0.0, 0.0, 1.0];
  rightEye.matrix.translate(.07, 0.28, -0.602);
  rightEye.matrix.rotate(0, 1, 0, 0);
  rightEye.matrix.scale(0.08, g_eyesScale, 0.01);
  rightEye.render();

  var duration = performance.now() - startTime;
  sendTextToHTML("ms: " + Math.floor(duration) + " fps: " + Math.floor(1000/duration), "numdot");
}

function sendTextToHTML(text, htmlID) {
  var htmlElm = document.getElementById(htmlID);
  if (!htmlElm) {
    console.log('Failed to get the storage location of ' + htmlID);
    return;
  }
  htmlElm.innerHTML = text;
}

var g_shapesList = []; // The array for the position of a mouse press

function click(ev) {
  // Extract the event click and return it in WebGL coordinates
  let [x, y] = convertCoordinatesEventToGL(ev);

  // /// ChatGPT helped me with this math
  // let currentTime = performance.now();
  // let velocity = 0;

  // if (g_lastMousePos && g_lastMouseTime) {
  //   let dx = x - g_lastMousePos[0];
  //   let dy = y - g_lastMousePos[1];
  //   let dt = currentTime - g_lastMouseTime;
  //   let dist = Math.sqrt(dx * dx + dy * dy);
  //   velocity = dist / dt; // pixels/ms
  // }

  // g_lastMousePos = [x, y];
  // g_lastMouseTime = currentTime;

  // // Create and store a new point object
  // let point;
  // if (g_seletcedType == POINT) {
  //   point = new Point();
  // }
  // else if (g_seletcedType == TRIANGLE) {
  //   point = new Triangle();
  // }
  // else if (g_seletcedType == CIRCLE) {
  //   point = new Circle();
  //   point.segments = g_seletcedSegment;
  // }

  // point.position = [x, y];
  // point.timestamp = performance.now();

  // Draw every shape that is supposed to be drawn
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  var x = ev.clientX; // x coordinate of a mouse pointer
  var y = ev.clientY; // y coordinate of a mouse pointer
  var rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
  y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);

  return([x, y]);
}