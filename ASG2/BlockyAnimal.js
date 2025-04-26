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

let g_seletcedSegment = 10;
let g_selectedAlpha = 1.0;
let g_spectrumDraw = false;
let g_lastMousePos = null;
let g_lastMouseTime = null;
let g_kaleidoscopeMode = false;
let g_kaleidoscopeSegments = 6;

function addActionsForHtmlUI() {
  // Button events (shape type)
  document.getElementById('green').onclick = function() { g_selectedColor = [0.0, 1.0, 0.0, 1.0]; };
  document.getElementById('red').onclick = function() { g_selectedColor = [1.0, 0.0, 0.0, 1.0]; };
  document.getElementById('clearButton').onclick = function() { g_shapesList = []; renderAllShapes(); };
  
  document.getElementById('pointButton').onclick = function() { g_seletcedType = POINT };
  document.getElementById('triangleButton').onclick = function() { g_seletcedType = TRIANGLE };
  document.getElementById('circleButton').onclick = function() { g_seletcedType = CIRCLE };

  // Color slider events
  document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value / 100; });
  document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value / 100; });
  document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value / 100; });
  
  // Slider events
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
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  renderAllShapes(); // Draw the initial shapes
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
  
  /// ChatGPT gave me some pointers with this portion 
  if (g_spectrumDraw && velocity > 0) {
    let speed = Math.min(velocity * 1000, 100);
    point.size = Math.max(5, Math.min(30, speed));

    let t = speed / 100;
    point.color = [
      t,
      0.2,
      1.0 - t,
      g_selectedAlpha
    ];
  }
  else {
    point.color = g_selectedColor.slice();
    point.size = g_selectedSize;
  }
  
  /// ChatGPT helped me with this kaleidoscope math/code
  if (g_kaleidoscopeMode) {
    for (let i = 0; i < g_kaleidoscopeSegments; i++) {
      const angle = (2 * Math.PI / g_kaleidoscopeSegments) * i;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const xRotated = x * cosA - y * sinA;
      const yRotated = x * sinA + y * cosA;

      let clone = Object.create(Object.getPrototypeOf(point));
      Object.assign(clone, point);
      clone.timestamp = performance.now();
      clone.position = [xRotated, yRotated];
      g_shapesList.push(clone);
    }
  } 
  else {
    g_shapesList.push(point);
  }

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

function renderAllShapes() {
  var startTime = performance.now();
  
  // Pass the matrix to u_ModelMatrix variable
  var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  var body = new Cube();
  body.color = [1.0, 0.0, 0.0, 1.0];
  body.matrix.translate(-.25, -.5, 0.0);
  body.matrix.scale(0.5, 1.0, 0.5);
  body.render();

  // Draw a left arm
  var leftArm = new Cube();
  leftArm.color = [1.0, 1.0, 0.0, 1.0];
  leftArm.matrix.setTranslate(0.7, 0.0, 0.0);
  leftArm.matrix.rotate(45, 0, 0, 1);
  leftArm.matrix.scale(0.25, 0.7, 0.5);
  leftArm.render();

  // Test box
  var box = new Cube();
  box.color = [1.0, 0.0, 1.0, 1.0];
  box.matrix.translate(0, 0, -0.5, 0);
  box.matrix.rotate(-30, 1, 0, 0);
  box.matrix.scale(0.5, 0.5, 0.5);
  box.render();

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
