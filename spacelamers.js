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

/*
Difficulty variables for each level. Enemy speed in pixels per frame and chances per frame of enemy shooting space (when
ship not underneath), shooting at ship directly (when ship underneath), moving toward the ship and moving downward.
*/
const level = [
    {speed: 2, shootSpace: 0.001, shootShip: 0.01, moveToShip: 0.01, moveDown: 0},
    {speed: 4, shootSpace: 0.005, shootShip: 0.02, moveToShip: 0.02, moveDown: 0},
    {speed: 6, shootSpace: 0.01, shootShip: 0.05, moveToShip: 0.05, moveDown: 0.001},
    {speed: 8, shootSpace: 0.02, shootShip: 0.1, moveToShip: 0.1, moveDown: 0.01},
    {speed: 10, shootSpace: 0.03, shootShip: 0.15, moveToShip: 0.2, moveDown: 0.02},
    {speed: 12, shootSpace: 0.05, shootShip: 0.2, moveToShip: 0.3, moveDown: 0.05},
    {speed: 15, shootSpace: 0.1, shootShip: 0.25, moveToShip: 0.5, moveDown: 0.1},
];

//Initialize object for remembering keys pressed
const keysPressed = {};

//Initialize arrays for holding stars and planets
let stars = [];
let planets = [];

//Initialize level-independent variables
let currentLevel = 0;
let shipLives = 200;
let shipRefractory = false;
let enemyRefractory = false;

//Declare level-dependent variables
let shipX;
let shipBullets;
let shipAmmo;
let shipAmmoInterval;
let enemyX;
let enemyY;
let enemyTargetX;
let enemyTargetY;
let enemyBullets;
let enemyLives;
let play;

//Generate initial stars
function generateStars() {
    for (let i = 0; i < height; i++) {
        if (Math.random() < 0.1) {
            stars.push({
                x: Math.floor(Math.random() * width),
                y: i,
                dy: Math.ceil(Math.random() * 3)
            })
        }
    }
}

//Prepares for the next level
function nextLevel() {

    if (shipAmmoInterval) clearInterval(shipAmmoInterval);

    shipLives++;
    currentLevel++;
    shipAmmo = 10;
    c.fillStyle = 'white';
    c.strokeStyle = 'white'
    c.font = 'bold 100px sans-serif';
    c.strokeRect(525, height / 2 - 125, 500, 300)
    c.fillText('Level ' + currentLevel, 600, height / 2);
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
        enemyY = 50;
        enemyTargetX = 50 + Math.floor(Math.random() * width - 50);
        enemyTargetY = 50;
        shipBullets = [];
        enemyBullets = [];
        enemyLives = 1;
        play = true;

        shipAmmoInterval = setInterval(() => {shipAmmo++; renderStatus()}, 2000)

        renderStatus();
        render();
    }
}

//Keep track of which keys are currently pressed. Except the space key, which needs to be pressed repeatedly
function keyDown(e) {
    if (play && e.key === ' ' && shipAmmo > 0) {
        shipBullets.push([shipX, height - 65]);
        shipAmmo--;
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
        if (!shipRefractory && x > shipX - 40 && x < shipX + 40 && y > height - 65 + Math.abs(x - shipX) && y < height - 5) {
            
            //If so, a life is lost and the ship needs to turn yellow and back blue again.
            shipLives -= 1;
            shipRefractory = true;
            setTimeout(() => shipRefractory = false, 1000);
            renderStatus();
            
            //If all lives are lost, the game is over
            if (shipLives === 0) {
                play = false;
                explode(false);
                setTimeout(() => gameOver(), 2000);
             }
        }
    }

    //Check whether enemy is hit by ship bullet
    for ([x, y] of shipBullets) {
        if (!enemyRefractory && x > enemyX - 50 && x < enemyX + 50 && y < enemyY + 40 && y > enemyY + 10) {

            //If so, an enemy life is lost and the ship needs to turn yellow and back red again.
            enemyLives -= 1;
            enemyRefractory = true;
            setTimeout(() => enemyRefractory = false, 1000);
            

            //If all lives are lost, proceed to next level
            if (enemyLives === 0) {
                play = false;
                explode(true);
                setTimeout(() => nextLevel(), 2000);
                
 
            }
        }
    }
}


//Draw the stars
function drawStars() {

    //Create new star
    if (Math.random() < 0.1) {
        stars.push({
            x: Math.floor(Math.random() * width),
            y: 0,
            dy: Math.ceil(Math.random() * 3)
        })
    }

    //Move all stars 1 pixel to the south
    stars = stars.map(star => ({
        x: star.x,
        y: star.y + star.dy,
        dy: star.dy}));

    //Filter stars that have left the screen
    stars = stars.filter(star => star.y < height)

    //Draw the remaining stars
    stars.forEach(star => {
        c.beginPath();
        c.arc(star.x, star.y, 1, 0, 2 * Math.PI, true);
        c.fill();
    })
}

//Draw the planets
function drawPlanets() {

    //Create a new planet
    if (Math.random() < 0.001) {
        planets.push({
            x: Math.floor(Math.random() * width),
            y: -25,
            dy: Math.ceil(Math.random() * 3),
            r: Math.floor(10 + Math.random() * 15),
            gradR1: Math.floor(Math.random() * 255),
            gradG1: Math.floor(Math.random() * 255),
            gradB1: Math.floor(Math.random() * 255),
            gradR2: Math.floor(Math.random() * 255),
            gradG2: Math.floor(Math.random() * 255),
            gradB2: Math.floor(Math.random() * 255),
          });
    }

    //Move all planets 1 pixel to the south
    planets = planets.map(planet => ({
        x: planet.x,
        y: planet.y + planet.dy,
        dy: planet.dy,
        r: planet.r,
        gradR1: planet.gradR1,
        gradG1: planet.gradG1,
        gradB1: planet.gradB1,
        gradR2: planet.gradR2,
        gradG2: planet.gradG2,
        gradB2: planet.gradB2,
        }));

    //Filter planets that have left the screen
    planets = planets.filter(planet => planet.y < height + 25)

    //Draw the remaining planets
    planets.forEach(planet => {
        c.beginPath();
        c.moveTo(planet.x, planet.y);
        c.arc(planet.x, planet.y, planet.r, 0, 2 * Math.PI, true);
        let linGrad = c.createLinearGradient(
            planet.x + planet.r * Math.cos(Math.PI),
            planet.y + planet.r * Math.sin(Math.PI),
            planet.x + planet.r * Math.cos(0),
            planet.y + planet.r * Math.sin(0));
        linGrad.addColorStop(0, `rgb(${planet.gradR1}, ${planet.gradG1}, ${planet.gradB1})`);
        linGrad.addColorStop(1, `rgb(${planet.gradR2}, ${planet.gradG2}, ${planet.gradB2})`);
        c.fillStyle = linGrad;
        c.fill();
    })
}

//Draw the ship
function drawShip() {

    //Draw front
    c.beginPath();
    c.moveTo(shipX, height - 65);
    c.lineTo(shipX - 20, height - 45);
    c.lineTo(shipX + 20, height - 45);
    c.fill();

    //Draw the left wing
    c.beginPath();
    c.moveTo(shipX - 20, height - 45);
    c.lineTo(shipX, height - 25);
    c.lineTo(shipX - 20, height - 5);
    c.lineTo(shipX - 40, height - 25);
    c.fill();
 
    //Draw right wing
    c.beginPath();
    c.moveTo(shipX + 20, height - 45);
    c.lineTo(shipX + 40, height - 25);
    c.lineTo(shipX + 20, height - 5);
    c.lineTo(shipX, height - 25);
    c.fill();

    
 }

//Draw bullets fired by the ship
function drawShipBullets() {

    //Move all bullets 10 pixels to the north
    shipBullets = shipBullets.map(bullet => ([bullet[0], bullet[1] - 10]));

    //Filter bullets that have left the screen
    shipBullets = shipBullets.filter(bullet => bullet[1] > 10);

    //Draw the remaining bullets
    shipBullets.forEach(bullet => {
        c.beginPath();
        c.moveTo(bullet[0], bullet[1]);
        c.lineTo(bullet[0] + 5, bullet[1] + 10);
        c.lineTo(bullet[0] + 5, bullet[1] + 20);
        c.lineTo(bullet[0] - 5, bullet[1] + 20);
        c.lineTo(bullet[0] - 5, bullet[1] + 10);
        c.closePath();
        c.fill();
    })
}

//Draw the enemy
function drawEnemy() {

    //Move left or right if target is not within close range
    if (enemyTargetX + level[currentLevel - 1].speed < enemyX ) {
        enemyX -= level[currentLevel - 1].speed;
    }
    else if (enemyTargetX - level[currentLevel - 1].speed > enemyX) {
        enemyX += level[currentLevel - 1].speed;
    }

    //If target is within close range, randomly assign a new target
    else {

        //If a random threshold is exceeded, target the ship
        if (Math.random() < level[currentLevel - 1].moveToShip) {
            enemyTargetX = shipX;
        }

        //Otherwise target a random location
        else {
            enemyTargetX = 50 + Math.floor(Math.random() * width - 100);
        }
     }

     //Move up or down according to target location
     if (enemyTargetY > enemyY) {
         enemyY += 5;
     }
     else if (enemyTargetY < enemyY) {
         enemyY -= 5;
     }
     else if (enemyTargetY === 400) {
         enemyTargetY = 50;
     }
     else {
         if (Math.random() < level[currentLevel - 1].moveDown) enemyTargetY = 400;
     }

    //Draw body and head
    c.beginPath();
    c.arc(enemyX, enemyY, 25, 0, 2 * Math.PI, true);
    c.ellipse(enemyX, enemyY + 25, 50, 15, 0, 0, 2 * Math.PI, true);
    c.fill();

    //Draw face
    c.beginPath();
    c.arc(enemyX, enemyY, 20, 0, 2 * Math.PI, true);
    c.fillStyle = 'black';
    c.fill();

    //Draw left eye
    c.beginPath();
    c.arc(enemyX - 7, enemyY, 3, 0, 2 * Math.PI, true);
    c.fillStyle = 'red';
    c.fill();

    //Draw right eye
    c.beginPath();
    c.arc(enemyX + 7, enemyY, 3, 0, 2 * Math.PI, true);
    c.fill();

    //Draw left eyebrow
    c.beginPath();
    c.moveTo(enemyX - 12, enemyY - 10)
    c.lineTo(enemyX - 2, enemyY - 7);
    c.lineWidth = 2;
    c.strokeStyle = 'red';
    c.stroke();

    //Draw right eyebrow
    c.beginPath();
    c.moveTo(enemyX + 12, enemyY - 10)
    c.lineTo(enemyX + 2, enemyY - 7);
    c.stroke();

    //Draw mouth
    c.beginPath();
    c.moveTo(enemyX - 10, enemyY + 10);
    c.lineTo(enemyX + 10, enemyY + 10);
    c.stroke();


}

//Draw bullets fired by the enemy
function drawEnemyBullets() {

    //If enemy is above ship, introduce a new bullet if random threshold is exceeded
    if (enemyX - shipX < 20 && enemyX - shipX > -20 && Math.random() < level[currentLevel - 1].shootShip) {
        enemyBullets.push([enemyX, enemyY + 50])
    }

    //Otherwise, introduce a new bullet if another (less likely) threshold is exceeded
    else if (Math.random() < level[currentLevel - 1].shootSpace) {
        enemyBullets.push([enemyX, enemyY + 50])
    }

    //Move all bullets 10 pixels to the south
    enemyBullets = enemyBullets.map(bullet => ([bullet[0], bullet[1] + 10]));

    //Filter bullets that have left the screen
    enemyBullets = enemyBullets.filter(bullet => bullet[1] < width - 10);

    //Draw the remaining bullets
    enemyBullets.forEach(bullet => {
        c.beginPath();
        c.moveTo(bullet[0], bullet[1]);
        c.lineTo(bullet[0] - 5, bullet[1] - 10);
        c.lineTo(bullet[0] - 5, bullet[1] -20);
        c.lineTo(bullet[0] + 5, bullet[1] - 20);
        c.lineTo(bullet[0] + 5, bullet[1] - 10);
        c.closePath();
        c.fill();
    })
}

function explode(enemy) {

    let frames = 0;
    let fragments = [];

    for (let i = 0; i < 100; i++) {
        let r = 5 + Math.random() * 30;
        let theta1 = Math.random() * 2 * Math.PI;
        let theta2 = Math.random() * 2 * Math.PI;
        let theta3 = Math.random() * 2 * Math.PI;
        let dx = Math.random() * 20 - 10;
        let dy = Math.random() * 20 - 10;
        let dr = Math.random() * 20 - 10;
        let ds = Math.random() / 10;
        fragments.push([r, theta1, theta2, theta3, dx, dy, dr, ds])
    }

    renderExplode();

    function renderExplode() {

        c.clearRect(0, 0, width, height);

        c.fillStyle = 'white';
        drawStars();
        drawPlanets();

        if (enemy) {
            c.fillStyle = 'blue';
            drawShip();
            drawShipBullets();
        }

        else {

            c.fillStyle = 'red';
            drawEnemy();
            drawEnemyBullets();
        }
 
        c.fillStyle = enemy ? 'red' : 'blue';

        for (fragment of fragments) {
            let [r, theta1, theta2, theta3, dx, dy, dr, ds] = fragment;
            c.beginPath();
            c.moveTo((enemy ? enemyX : shipX) + frames * ds * r * Math.cos(theta1 + frames * dr * (Math.PI / 180)) + frames * dx, (enemy ? enemyY : height - 65) + frames * ds * r * Math.sin(theta1 + frames * dr * (Math.PI / 180)) + frames * dy);
            c.lineTo((enemy ? enemyX : shipX) + frames * ds * r * Math.cos(theta2 + frames * dr * (Math.PI / 180)) + frames * dx, (enemy ? enemyY : height - 65) + frames * ds * r * Math.sin(theta2 + frames * dr * (Math.PI / 180)) + frames * dy);
            c.lineTo((enemy ? enemyX : shipX) + frames * ds * r * Math.cos(theta3 + frames * dr * (Math.PI / 180)) + frames * dx, (enemy ? enemyY : height - 65) + frames * ds * r * Math.sin(theta3 + frames * dr * (Math.PI / 180)) + frames * dy);
            c.closePath();
            c.fill();
        }

        frames++;

        if (frames < 100) {
            requestAnimationFrame(renderExplode);
        }   
    }
 
}

//Game over
function gameOver() {
    clearInterval(shipAmmoInterval);
    c.fillStyle = 'white'
    c.font = 'bold 200px sans-serif';
    c.fillText('GAME OVER', 125, height / 2);
    c.font = 'bold 40px sans-serif';
    c.fillText('Hit enter to play again', 550, height / 2 + 100  );
    shipLives = 3;
    shipAmmo = 10;
    currentLevel = 1;
    window.addEventListener('keydown', initializeLevel);

}

//Clears the canvas and renders all elements
function render() {
    c.clearRect(0, 0, width, height);
    checkKeys();
    checkHits();

    c.fillStyle = 'white'
    drawStars();

    drawPlanets();

    c.fillStyle = shipRefractory ? `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})` : 'blue'
    drawShip();

    c.fillStyle = 'blue';
    drawShipBullets();

    c.fillStyle = enemyRefractory ? `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})` : 'red'
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
    c2.fillText(currentLevel, 60, statusHeight/ 1.5);
    c2.fillText(shipAmmo, width / 2 + 10, statusHeight / 1.5);
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

generateStars();
nextLevel();