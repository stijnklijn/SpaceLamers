//Initiaze canvas and canvas dimensions
const width = document.body.clientWidth;
const height = 0.9 * (window.innerHeight - 25);
const statusHeight = 0.1 * (window.innerHeight - 25);
let canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');
canvas.setAttribute('width', width);
canvas.setAttribute('height', height);
canvas = document.getElementById('canvas-statusbar');
const c2 = canvas.getContext('2d');
canvas.setAttribute('width', width);
canvas.setAttribute('height', statusHeight);

//Initialize level-independent variables
let keysPressed = {};
let shipLives = 2;
let level = 0;
let difficulty = [[4, 0.99], [7, 0.96], [10, 0.93], [13, 0.90], [16, 0.87], [19, 0.84]];

//Declare level-dependent variables
let shipX;
let enemyX;
let enemyTargetX;
let shipBullets;
let enemyBullets;
let enemyLives;
let shipFill;
let enemyFill;
let ammo;
let play;
let ammoInterval;

//Prepares for the next level
function nextLevel() {

    if (ammoInterval) clearInterval(ammoInterval);

    shipLives++;
    level++;
    ammo = 10;
    c.fillStyle = 'white';
    c.strokeStyle = 'white'
    c.font = 'bold 100px sans-serif';
    c.strokeRect(525, height / 2 - 125, 500, 300)
    c.fillText('Level ' + level, 600, height / 2);
    c.font = 'bold 40px sans-serif';
    c.fillText('Hit enter to continue', 570, height / 2 + 100  );
    window.addEventListener('keydown', initializeLevel);
}

//Initialize level-dependent variables
function initializeLevel(e) {

    if (e.key === 'Enter') {
        window.removeEventListener('keydown', initializeLevel);

        shipX = width / 2;
        enemyX = 50 + Math.floor(Math.random() * width - 50);
        enemyTargetX = 50 + Math.floor(Math.random() * width - 50);
        shipBullets = [];
        enemyBullets = [];
        enemyLives = 3;
        shipFill = 'blue';
        enemyFill = 'red';
        play = true;

        ammoInterval = setInterval(() => {ammo++; renderStatus()}, 2000)

        renderStatus();
        render();
    }
}

//Keep track of which keys are currently pressed. Except the space key, which needs to be pressed repeatedly
function keyDown(e) {
    if (e.key === ' ' && ammo > 0) {
        shipBullets.push([shipX, height - 50]);
        ammo--;
        renderStatus();
        return;
    }
    keysPressed[e.key] =  true;
}

function keyUp(e) {
    keysPressed[e.key] = false;
}

//Check whether arrow keys are pressed and ship needs to move
function checkKeys() {
    if (keysPressed.ArrowLeft) {
        shipX = shipX > 50 ? shipX - 10 : shipX;
    }
    if (keysPressed.ArrowRight) {
        shipX = shipX < width - 50 ? shipX + 10 : shipX;
    }
}

function checkHits() {
    //Check whether ship is hit by enemy bullet.
    for ([x, y] of enemyBullets) {
        if (x > shipX - 50 && x < shipX + 50 && y > height - 80 && y < height - 70) {
            
            //If so, a life is lost and the ship needs to turn yellow and back blue again.
            shipLives -= 1;
            shipFill = 'yellow';
            setTimeout(() => shipFill = 'blue', 1000);
            renderStatus();
            
            //If all lives are lost, the game is over
            if (shipLives === 0) {
                play = false;
                gameOver();
            }
        }
    }

    //Check whether enemy is hit by ship bullet
    for ([x, y] of shipBullets) {
        if (x > enemyX - 50 && x < enemyX + 50 && y < 100 && y > 90) {

            //If so, an enemy life is lost and the ship needs to turn yellow and back red again.
            enemyLives -= 1;
            enemyFill = 'yellow';
            setTimeout(() => enemyFill = 'red', 1000);

            //If all lives are lost, proceed to next level
            if (enemyLives === 0) {
                play = false;
                nextLevel();
            }
        }
    }
}

//Draw the ship
function drawShip() {
    c.fillRect(shipX - 50, height - 50, 100, 20);
}

//Draw bullets fired by the ship
function drawShipBullets() {

    //Move all bullets 10 pixels to the north
    shipBullets = shipBullets.map(bullet => ([bullet[0], bullet[1] - 10]));

    //Filter bullets that have left the screen
    shipBullets = shipBullets.filter(bullet => bullet[1] > 10);

    //Draw the remaining bullets
    shipBullets.forEach(bullet => {
        c.fillRect(bullet[0] - 5, bullet[1] - 10, 10, 20);
    })
}

//Draw the enemy
function drawEnemy() {
    //Move left if target is not within close range
    if (enemyTargetX + difficulty[level - 1][0] < enemyX ) {
        enemyX -= difficulty[level - 1][0];
    }
    else if (enemyTargetX - difficulty[level - 1][0] > enemyX) {
        enemyX += difficulty[level - 1][0];
    }

    //If target is within close range, randomly assign a new target
    else {
        enemyTargetX = 50 + Math.floor(Math.random() * width - 50);
    }

    //Draw the enemy
    c.fillRect(enemyX - 50, 50, 100, 20);
}

//Draw bullets fired by the enemy
function drawEnemyBullets() {

    //Introduce a new bullet if random threshold is exceeded
    if (Math.random() > difficulty[level - 1][1]) {
        enemyBullets.push([enemyX, 50])
    }

    //Move all bullets 10 pixels to the south
    enemyBullets = enemyBullets.map(bullet => ([bullet[0], bullet[1] + 10]));

    //Filter bullets that have left the screen
    enemyBullets = enemyBullets.filter(bullet => bullet[1] < width - 10);

    //Draw the remaining bullets
    enemyBullets.forEach(bullet => {
        c.fillRect(bullet[0] - 5, bullet[1] - 10, 10, 20);
    })
}

//Game over
function gameOver() {
    clearInterval(ammoInterval);
    c.fillStyle = 'white'
    c.font = 'bold 200px sans-serif';
    c.fillText('GAME OVER', 125, height / 2);
}

//Clears the canvas and renders all elements
function render() {
    c.clearRect(0, 0, width, height);
    checkKeys();
    checkHits();

    c.fillStyle = shipFill;
    drawShip();

    c.fillStyle = 'blue';
    drawShipBullets();

    c.fillStyle = enemyFill;
    drawEnemy();

    c.fillStyle = 'red'
    drawEnemyBullets();
  
    if (play) {
        requestAnimationFrame(render);
    }
 
}

function renderStatus() {
    c2.clearRect (0, 0, width, statusHeight);

    //Draw numbers
    c2.fillStyle = 'white';
    c2.font = '48px sans-serif';
    c2.fillText(level, 60, statusHeight/ 1.5);
    c2.fillText(ammo, width / 2 + 10, statusHeight / 1.5);
    c2.fillText(shipLives, width - 55, statusHeight / 1.5);

    //Draw world
    c2.beginPath();
    c2.moveTo(25, statusHeight / 1.5);
    c2.arc(30, 35, 25, 0, 2 * Math.PI, true);
    let linGrad = c2.createLinearGradient(5, 35, 55, 35);
    linGrad.addColorStop(0, 'brown');
    linGrad.addColorStop(1, 'green');
    c2.fillStyle = linGrad;
    c2.fill();
    
    //Draw bullet
    c2.beginPath();
    c2.moveTo(width / 2 - 20, 60);
    c2.lineTo(width / 2 - 20, 30);
    c2.lineTo(width / 2 - 10, 10);
    c2.lineTo(width / 2, 30);
    c2.lineTo(width / 2, 60);
    linGrad = c2.createLinearGradient(width / 2 - 20, 35, width / 2, 35);
    linGrad.addColorStop(0, 'blue');
    linGrad.addColorStop(1, 'darkblue');
    c2.fillStyle = linGrad;
    c2.fill();

    //Draw heart
    c2.beginPath();
    c2.moveTo(width - 75, 40);
    c2.lineTo(width - 90, 60);
    c2.lineTo(width - 105, 40);
    c2.bezierCurveTo(width - 130, 0, width - 100, 0, width - 90, 25);
    c2.bezierCurveTo(width - 80, 0, width - 50, 0, width - 75, 40);
    linGrad = c2.createLinearGradient(width - 130, 40, width - 75, 40);
    linGrad.addColorStop(0, 'red');
    linGrad.addColorStop(1, 'darkred');
    c2.fillStyle = linGrad;
    c2.fill();
}


window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

nextLevel();