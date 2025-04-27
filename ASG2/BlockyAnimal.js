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
let g_globalAngle = 0;
let g_wingsAngle = 0;
let g_lowerBeakAngle = 0;
let g_wingsAnimation = false;
let g_lowerBeakAnimation = false;

function addActionsForHtmlUI() {
  // Button events
  document.getElementById('animationLowerBeakOffButton').onclick = function() { g_lowerBeakAnimation = false; };
  document.getElementById('animationLowerBeakOnButton').onclick = function() { g_lowerBeakAnimation = true; };
  document.getElementById('animationWingsOffButton').onclick = function() { g_wingsAnimation = false; };
  document.getElementById('animationWingsOnButton').onclick = function() { g_wingsAnimation = true; };

  // Slider events
  document.getElementById('lowerBeakSlide').addEventListener('mousemove', function() { g_lowerBeakAngle = this.value; renderAllShapes(); });
  document.getElementById('wingsSlide').addEventListener('mousemove', function() { g_wingsAngle = this.value; renderAllShapes(); });
  document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderAllShapes(); });
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

  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0.5, 0.2);

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
  // if (g_yellowAnimation) {
  //   g_yellowAngle = 45 * Math.sin(g_seconds);
  // }

  // if (g_magentaAnimation) {
  //   g_magentaAngle = 45 * Math.sin(3 * g_seconds);
  // }

  if (g_wingsAnimation) {
    g_wingsAngle = Math.max(0, 45 * Math.sin(4 * g_seconds));
  }

  if (g_lowerBeakAnimation) {
    g_lowerBeakAngle = 45 * Math.sin(3 * g_seconds);
  }
}

function renderAllShapes() {
  var startTime = performance.now();
  
  // Pass the matrix to u_ModelMatrix variable
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Left Leg
  var leftLeg = new Cube();
  leftLeg.color = [0.9, 0.7, 0, 1.0];
  leftLeg.matrix.translate(-.2, -.7, 0.0);
  leftLeg.matrix.rotate(0, 1, 0, 0);
  leftLeg.matrix.scale(0.1, 0.3, 0.05);
  leftLeg.render();

  // Right Leg
  var rightLeg = new Cube();
  rightLeg.color = [0.9, 0.7, 0, 1.0];
  rightLeg.matrix.translate(0.1, -.7, 0.0);
  rightLeg.matrix.rotate(0, 1, 0, 0);
  rightLeg.matrix.scale(0.1, 0.3, 0.05);
  rightLeg.render();

  // Right Foot
  var rightFoot = new Cube();
  rightFoot.color = [0.9, 0.7, 0, 1.0];
  rightFoot.matrix.translate(0.05, -.7, 0.1);
  rightFoot.matrix.rotate(0, 1, 0, 0);
  rightFoot.matrix.scale(0.2, 0.02, -0.3);
  rightFoot.render();

  // Left Foot
  var leftFoot = new Cube();
  leftFoot.color = [0.9, 0.7, 0, 1.0];
  leftFoot.matrix.translate(-.25, -.7, 0.1);
  leftFoot.matrix.rotate(0, 1, 0, 0);
  leftFoot.matrix.scale(0.2, 0.02, -0.3);
  leftFoot.render();

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
  rightWing.matrix.translate(0.25, -.23, -0.3);
  rightWing.matrix.translate(0, -0.165, 0);
  rightWing.matrix.rotate(-g_wingsAngle, 0, 0, 1);
  rightWing.matrix.translate(0, 0.165, 0);
  rightWing.matrix.scale(0.07, 0.33, 0.5);
  rightWing.render();

  // Left wing
  var leftWing = new Cube();
  leftWing.color = [0.6, 0.6, 0.6, 1.0];
  leftWing.matrix.translate(-0.32, -.23, -0.3);
  leftWing.matrix.rotate(0, 1, 0, 0);
  leftWing.matrix.scale(0.07, 0.33, 0.5);
  leftWing.render();

  // Head
  var head = new Cube();
  head.color = [0.9, 0.9, 0.9, 1.0];
  head.matrix.translate(-0.15, 0.03, -0.6);
  head.matrix.rotate(0, 1, 0, 0);
  head.matrix.scale(0.3, 0.43, 0.27);
  head.render();

  // Beak upper
  var beakUpper = new Cube();
  beakUpper.color = [1.0, 0.6, 0.0, 1.0];
  beakUpper.matrix.translate(-.15, 0.23, -0.75);
  beakUpper.matrix.rotate(0, 1, 0, 0);
  beakUpper.matrix.scale(0.2999, 0.05, 0.3);
  beakUpper.render();

  // Beak lower
  var beakLower = new Cube();
  beakLower.color = [0.8, 0.5, 0.0, 1.0];
  beakLower.matrix.translate(-.15, 0.18, -0.75);
  beakLower.matrix.rotate(0, 1, 0, 0);
  beakLower.matrix.scale(0.2999, 0.05, 0.3);
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
  leftEye.matrix.scale(0.08, 0.08, 0.01);
  leftEye.render();

  // Right eye
  var rightEye = new Cube();
  rightEye.color = [0.0, 0.0, 0.0, 1.0];
  rightEye.matrix.translate(.07, 0.28, -0.602);
  rightEye.matrix.rotate(0, 1, 0, 0);
  rightEye.matrix.scale(0.08, 0.08, 0.01);
  rightEye.render();

  // Draw a yellow arm
  // var yellow = new Cube();
  // yellow.color = [1.0, 1.0, 0.0, 1.0];
  // yellow.matrix.setTranslate(0, -0.5, 0.0);
  // yellow.matrix.rotate(-5, 1, 0, 0);

  // yellow.matrix.rotate(g_yellowAngle, 0, 0, 1);
  // var yellowCoordinatesMat = new Matrix4(yellow.matrix);
  // yellow.matrix.scale(0.25, 0.7, 0.5);
  // yellow.matrix.translate(-0.5, 0, 0);
  // yellow.render();

  // Purple box
  // var box = new Cube();
  // box.color = [1.0, 0.0, 1.0, 1.0];
  // box.matrix = yellowCoordinatesMat;
  // box.matrix.translate(0, .65, 0);
  // box.matrix.rotate(-g_magentaAngle, 0, 0, 1);
  // box.matrix.scale(0.3, 0.3, 0.3);
  // box.matrix.translate(-0.5, 0, -0.001);
  // box.render();

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

  /// ChatGPT helped me with this math
  let currentTime = performance.now();
  let velocity = 0;

  if (g_lastMousePos && g_lastMouseTime) {
    let dx = x - g_lastMousePos[0];
    let dy = y - g_lastMousePos[1];
    let dt = currentTime - g_lastMouseTime;
    let dist = Math.sqrt(dx * dx + dy * dy);
    velocity = dist / dt; // pixels/ms
  }

  g_lastMousePos = [x, y];
  g_lastMouseTime = currentTime;

  // Create and store a new point object
  let point;
  if (g_seletcedType == POINT) {
    point = new Point();
  }
  else if (g_seletcedType == TRIANGLE) {
    point = new Triangle();
  }
  else if (g_seletcedType == CIRCLE) {
    point = new Circle();
    point.segments = g_seletcedSegment;
  }

  point.position = [x, y];
  point.timestamp = performance.now();

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