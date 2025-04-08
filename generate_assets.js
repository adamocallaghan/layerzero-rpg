const fs = require('fs');
const { createCanvas } = require('canvas');

// Create directories if they don't exist
if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
}
if (!fs.existsSync('assets/images')) {
    fs.mkdirSync('assets/images');
}

// Generate character sprite
const characterCanvas = createCanvas(32, 32);
const characterCtx = characterCanvas.getContext('2d');
characterCtx.fillStyle = '#3498db';
characterCtx.fillRect(0, 0, 32, 32);
const characterBuffer = characterCanvas.toBuffer('image/png');
fs.writeFileSync('assets/images/character.png', characterBuffer);

// Generate gem sprite
const gemCanvas = createCanvas(16, 16);
const gemCtx = gemCanvas.getContext('2d');
gemCtx.fillStyle = '#f1c40f';
gemCtx.fillRect(0, 0, 16, 16);
const gemBuffer = gemCanvas.toBuffer('image/png');
fs.writeFileSync('assets/images/gem.png', gemBuffer);

// Generate store sprite
const storeCanvas = createCanvas(64, 64);
const storeCtx = storeCanvas.getContext('2d');
storeCtx.fillStyle = '#e74c3c';
storeCtx.fillRect(0, 0, 64, 64);
const storeBuffer = storeCanvas.toBuffer('image/png');
fs.writeFileSync('assets/images/store.png', storeBuffer);

// Generate background
const bgCanvas = createCanvas(800, 600);
const bgCtx = bgCanvas.getContext('2d');
bgCtx.fillStyle = '#2c3e50';
bgCtx.fillRect(0, 0, 800, 600);
const bgBuffer = bgCanvas.toBuffer('image/png');
fs.writeFileSync('assets/images/background.png', bgBuffer); 