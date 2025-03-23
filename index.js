const canvas = document.getElementById("canvas");
canvas.width = 1000;
canvas.height = 600;

let context = canvas.getContext("2d");
context.fillStyle = "gray";
context.fillRect(0,0, canvas.width, canvas.height);

let startBGColor = "grey";
let drawColor = "black";
let drawWidth = "2";
let currentBrush = "round"; // Default brush type
let currentJoin = "round"; // Default brush type
let isDrawing = false;
let isErasing = false;
let previousColor = drawColor;
let colorjitter = 0;
let opacity = 1;

let lastX;
let lastY;

let undo_array = [];
let redo_array = [];
let undo_index = -1;
let redo_index = -1;


canvas.addEventListener("touchstart", start,  false);
canvas.addEventListener("touchmove", draw, false);
canvas.addEventListener("mousedown", start,  false);
canvas.addEventListener("mousemove", draw, false);

canvas.addEventListener("touchend", stop, false);
canvas.addEventListener("mouseup", stop, false);
canvas.addEventListener("mouseout", stop, false);


function getCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
    let x, y;

    if (event.touches) {
        // Handle touch events
        const touch = event.touches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
    } else {
        // Handle mouse events
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
    }

    return { x, y };
}


function start(event) {
    isDrawing = true;
    context.beginPath();
    const { x, y } = getCoordinates(event);
    context.moveTo(x, y);
    event.preventDefault();

    // Apply color jitter if not erasing
    if (!isErasing) {
        let jitteredColor = addColorJitter(drawColor, colorjitter);
        context.strokeStyle = jitteredColor;
    } else {
        context.strokeStyle = drawColor; // Use background color for erasing
    }
    context.globalAlpha = opacity; 
}

function draw(event) {
    if (isDrawing) {
        const { x, y } = getCoordinates(event);

        context.lineWidth = drawWidth;
        context.lineJoin = currentJoin;
        context.lineCap = currentBrush;
        context.globalAlpha = opacity; 

        // Draw based on the selected brush type
        if (currentBrush === "round") {
            context.lineTo(x, y);
            context.stroke();
        } else if (currentBrush === "square") {
            drawSquareBrush(x, y); // Call the square brush function
        } else if (currentBrush === "triangle") {
            drawTriangleBrush(x, y); // Call the triangle brush function
        }

        lastX = x; // Update lastX
        lastY = y; // Update lastY
    }
    event.preventDefault();
}

function stop(event) {
    if (isDrawing) {
        context.stroke();
        context.closePath();
        isDrawing = false;
    }
    event.preventDefault();

    if (event.type !== 'mouseout') {
        undo_array.push(context.getImageData(0, 0, canvas.width, canvas.height));
        undo_index += 1;
    }
}

function erase() {
    if (isErasing) {
        // If already in eraser mode, switch back to the previous color
        isErasing = false;
        drawColor = previousColor; // Restore the previous drawing color

        // Remove active class from the eraser button
        document.querySelector('.eraser').classList.remove('active');
    } else {
        // If not in eraser mode, switch to eraser mode
        previousColor = drawColor; // Store the current drawing color
        isErasing = true;
        drawColor = startBGColor; // Set the draw color to the background color

        // Add active class to the eraser button
        document.querySelector('.eraser').classList.add('active');
    }
}

function switchToDrawing() {
    isErasing = false; // Switch back to drawing mode
    drawColor = "black"; // Reset to default drawing color

    // Remove active class from the eraser button
    document.querySelector('.eraser').classList.remove('active');
}

function clearCanvas(){
    context.fillStyle = startBGColor;
    context.clearRect(0,0, canvas.width , canvas.height);
    context.fillRect(0,0, canvas.width , canvas.height);
    undo_array = [];
    undo_index = -1;
}

function undo_last(){
    if(undo_index <= 0){
        clearCanvas();
    } else {
        redo_array.push(undo_array[undo_index]); // Store the undone state
        redo_index += 1;
        undo_index -= 1;
        undo_array.pop();
        context.putImageData(undo_array[undo_index],0 , 0);
    }
}

function redo_last(){
    if(redo_index >= 0){
        context.putImageData(redo_array[redo_index], 0, 0);
        undo_array.push(redo_array[redo_index]); // Restore to undo_array
        undo_index += 1;
        redo_array.pop();
        redo_index -= 1;
    }
    
}

document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.key === "z") {
        undo_last();
        event.preventDefault(); // Prevent default behavior
    }

    if (event.ctrlKey && event.key === "r") {
        redo_last();
        event.preventDefault(); // Prevent default behavior
    }

    if (event.ctrlKey && event.key === "c") {
        clearCanvas();
        event.preventDefault(); // Prevent default behavior
    }
});


function addColorJitter(color, jitterAmount) {
    // Extract RGB values from the color string (e.g., "rgb(0,0,0)" or hex values)
    let rgbMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    if (!rgbMatch) return color; // Return the original color if it's not in hex format

    let r = parseInt(rgbMatch[1], 16);
    let g = parseInt(rgbMatch[2], 16);
    let b = parseInt(rgbMatch[3], 16);

    // Add jitter to each component and clamp the values between 0 and 255
    r = Math.min(255, Math.max(0, r + Math.floor((Math.random() * 2 - 1) * jitterAmount*2)));
    g = Math.min(255, Math.max(0, g + Math.floor((Math.random() * 2 - 1) * jitterAmount*2)));
    b = Math.min(255, Math.max(0, b + Math.floor((Math.random() * 2 - 1) * jitterAmount*2)));

    // Return the new jittered color as a hex string
    return `rgb(${r},${g},${b})`;
}

function save(){
     // Convert canvas content to a data URL (Base64 encoded PNG)
     const dataURL = canvas.toDataURL("image/png");

     // Create a temporary <a> element
     const link = document.createElement("a");
     link.href = dataURL;
 
     // Set the download attribute with a default filename
     link.download = "canvas-image.png";
 
     // Trigger the download by programmatically clicking the link
     link.click();
}

function updateCanvasSize() {
    // Get the width and height values from the input fields
    const newWidth = parseInt(document.getElementById("canvasWidth").value);
    const newHeight = parseInt(document.getElementById("canvasHeight").value);

    // Update canvas dimensions
    canvas.width = newWidth;
    canvas.height = newHeight;

    // Redraw the canvas background
    context.fillStyle = startBGColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Clear undo/redo arrays as the canvas has been reset
    undo_array = [];
    redo_array = [];
    undo_index = -1;
    redo_index = -1;
}

function toggleCanvasMenu() {
    const menu = document.getElementById("canvasMenu");
    if (menu.style.display === "none" || menu.style.display === "") {
        menu.style.display = "flex"; // Show the menu
    } else {
        menu.style.display = "none"; // Hide the menu
    }
}

document.getElementById("opacRange").addEventListener("input", (event) => {
    opacity = parseFloat(event.target.value); // Update opacity dynamically
});

document.getElementById("opacInput").addEventListener("input", (event) => {
    opacity = parseFloat(event.target.value); // Update opacity from number input
});

function toggleBrushMenu() {
    const menu = document.getElementById("brushMenu");
    if (menu.style.display === "none" || menu.style.display === "") {
        menu.style.display = "flex"; // Show the menu
    } else {
        menu.style.display = "none"; // Hide the menu
    }
}

function changeBrush(brushType) {
    switch (brushType) {
        case "round":
            currentBrush = "round";
            currentJoin = "round";
            context.lineCap = "round";
            ctx.lineJoin='round';
            break;
        case "square":
            currentBrush = "butt";
            currentJoin = "bevel";
            context.lineCap = "butt"; // Square ends
            ctx.lineJoin='bevel';
            break;
        case "triangle":
            currentBrush = "square";
            currentJoin = "miter";
            context.lineCap = "square"; // Triangle effect can be simulated with square
            ctx.lineJoin='miter';
            break;
        default:
            context.lineCap = "round"; // Default to round
    }
}

function drawSquareBrush(x, y) {
    // Apply color jitter
    let jitteredColor = addColorJitter(drawColor, colorjitter);
    context.fillStyle = jitteredColor; // Use the jittered color
    context.fillRect(x - drawWidth / 2, y - drawWidth / 2, drawWidth, drawWidth);
}

function drawTriangleBrush(x, y) {
    let jitteredColor = addColorJitter(drawColor, colorjitter);
    context.fillStyle = jitteredColor; // Use the jittered color
    context.beginPath();
    context.moveTo(x, y - drawWidth / 2); // Top point of the triangle
    context.lineTo(x - drawWidth / 2, y + drawWidth / 2); // Bottom left point
    context.lineTo(x + drawWidth / 2, y + drawWidth / 2); // Bottom right point
    context.closePath();
    context.fill();
}


function changeBrush(brushType) {
    currentBrush = brushType; // Update the current brush type
}


