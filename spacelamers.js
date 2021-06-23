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
Difficulty variables for each level. Number of enemies, number of lives per enemy, enemy speed in pixels per frame,
and chances per frame of enemy shooting space (when ship not underneath), shooting at ship directly (when ship underneath),
target distance to ship and chances of enemy moving downward.
*/
const level = [
    {enemies: 1, enemyLives: 2, speed: 2, shootSpace: 0.005, shootShip: 0.02, targetDistance: 600, moveDown: 0},
    {enemies: 1, enemyLives: 3, speed: 4, shootSpace: 0.005, shootShip: 0.02, targetDistance: 500, moveDown: 0},
    {enemies: 1, enemyLives: 3, speed: 6, shootSpace: 0.02, shootShip: 0.1, targetDistance: 200, moveDown: 0.001},
    {enemies: 2, enemyLives: 3, speed: 8, shootSpace: 0.02, shootShip: 0.1, targetDistance: 500, moveDown: 0.01},
    {enemies: 2, enemyLives: 3, speed: 10, shootSpace: 0.03, shootShip: 0.15, targetDistance: 500, moveDown: 0.02},
    {enemies: 2, enemyLives: 3, speed: 12, shootSpace: 0.05, shootShip: 0.2, targetDistance: 300, moveDown: 0.05},
    {enemies: 3, enemyLives: 3, speed: 12, shootSpace: 0.05, shootShip: 0.2, targetDistance: 400, moveDown: 0.05},
];

//Initialize game objects
const ship = {
    lives: 0,
    refractory: false
};

let stars = [];
let planets = [];
let enemies = [];

//Initialize object for remembering keys pressed
const keysPressed = {};

//Initialize or declare other variables
let currentLevel = 0;
let play;
let explosion;

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

//Prepare for the next level
function nextLevel() {
    if (ship.ammoInterval) {
        clearInterval(ship.ammoInterval);
    } 
    ship.lives++;
    currentLevel++;
    ship.ammo = 10;
    c.fillStyle = 'white';
    c.strokeStyle = 'white'
    c.font = 'bold 100px sans-serif';
    c.strokeRect(525, height / 2 - 125, 500, 300)
    c.fillText('Level ' + currentLevel, 600, height / 2);
    c.font = 'bold 40px sans-serif';
    c.fillText('Hit enter to continue', 570, height / 2 + 100  );
    window.addEventListener('keydown', initializeLevel);
}

//Initialize level
function initializeLevel(e) {

    if (e.key === 'Enter') {
        window.removeEventListener('keydown', initializeLevel);
        play = true;
        ship.x = width / 2;
        ship.bullets = [];
        ship.ammoInterval = setInterval(() => {ship.ammo++; renderStatus()}, 2000)
        enemies = [];
        
        //Initialize enemies
        for (let i = 0; i < level[currentLevel - 1].enemies; i++) {
            enemies.push({
                x: 50 + Math.floor(Math.random() * width - 100),
                y: 50 + i * 100,
                targetX: 50 + Math.floor(Math.random() * width - 100),
                targetY: 50 + i * 100,
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
                bullets: [],
                lives: level[currentLevel - 1].enemyLives
            })
        }
        renderStatus();
        render();
    }
}

//Keep track of which keys are currently pressed, except the space key, which needs to be pressed repeatedly
function keyDown(e) {
    if (play && e.key === ' ' && ship.ammo > 0) {
        ship.bullets.push({x: ship.x, y: height - 65});
        ship.ammo--;
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
        ship.x = ship.x > 50 ? ship.x - 10 : ship.x;
    }
    if (keysPressed.ArrowRight) {
        ship.x = ship.x < width - 50 ? ship.x + 10 : ship.x;
    }
}

function checkHits() {
    //Check whether ship is hit by enemy bullet.
    for (let enemy of enemies) {
        for ({x, y} of enemy.bullets) {
            if (!ship.refractory && x > ship.x - 40 && x < ship.x + 40 && y > height - 65 + Math.abs(x - ship.x) && y < height - 5) {
                
                //If so, a life is lost and the ship becomes refractory for one second
                ship.lives -= 1;
                ship.refractory = true;
                setTimeout(() => ship.refractory = false, 1000);
                renderStatus();
                
                //If all lives are lost, the game is over
                if (ship.lives === 0) {
                    play = false;
                    explode(ship.x, height - 65, 'blue');
                    setTimeout(() => gameOver(), 2000);
                 }
            }
        }
    }
 
    //Check whether enemy is hit by ship bullet
    for (let enemy of enemies) {
        for ({x, y} of ship.bullets) {
            if (!enemy.refractory && x > enemy.x - 50 && x < enemy.x + 50 && y < enemy.y + 40 && y > enemy.y + 10) {
    
                //If so, an enemy life is lost and the enemy becomes refractory for one second
                enemy.lives -= 1;
                enemy.refractory = true;
                setTimeout(() => enemy.refractory = false, 1000);
    
                //If all lives are lost, delete enemy from array and explode enemy
                if (enemy.lives === 0) {
                    enemies = enemies.filter(enemy => enemy.lives > 0);
                    explosion = true;
                    explode(enemy.x, enemy.y, enemy.color);
                }
            }
        }
    }

    //If all enemies are dead, proceed to next level
    if (enemies.length === 0) {
        play = false;
        setTimeout(() => nextLevel(), 2000);
    }
}

//Draw stars
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
    stars.forEach(star => star.y += star.dy)
 
    //Filter stars that have left the screen
    stars = stars.filter(star => star.y < height)

    //Draw remaining stars
    c.fillStyle = 'white'
    stars.forEach(star => {
        c.beginPath();
        c.arc(star.x, star.y, 1, 0, 2 * Math.PI, true);
        c.fill();
    })
}

//Draw planets
function drawPlanets() {

    //Create new planet
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
    planets.forEach(planet => planet.y += planet.dy)

    //Filter planets that have left the screen
    planets = planets.filter(planet => planet.y < height + 25)

    //Draw remaining planets
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

//Draw ship
function drawShip() {

    c.fillStyle = ship.refractory ? `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})` : 'blue'

    //Draw front
    c.beginPath();
    c.moveTo(ship.x, height - 65);
    c.lineTo(ship.x - 20, height - 45);
    c.lineTo(ship.x + 20, height - 45);
    c.fill();

    //Draw left wing
    c.beginPath();
    c.moveTo(ship.x - 20, height - 45);
    c.lineTo(ship.x, height - 25);
    c.lineTo(ship.x - 20, height - 5);
    c.lineTo(ship.x - 40, height - 25);
    c.fill();
 
    //Draw right wing
    c.beginPath();
    c.moveTo(ship.x + 20, height - 45);
    c.lineTo(ship.x + 40, height - 25);
    c.lineTo(ship.x + 20, height - 5);
    c.lineTo(ship.x, height - 25);
    c.fill();
}

//Draw bullets fired by ship
function drawShipBullets() {

    //Move all bullets 10 pixels to the north
    ship.bullets.forEach(bullet => bullet.y -= 10);

    //Filter bullets that have left the screen
    ship.bullets = ship.bullets.filter(bullet => bullet.y > 10);

    //Draw remaining bullets
    c.fillStyle = 'blue';

    ship.bullets.forEach(bullet => {
        c.beginPath();
        c.moveTo(bullet.x, bullet.y);
        c.lineTo(bullet.x + 5, bullet.y + 10);
        c.lineTo(bullet.x + 5, bullet.y + 20);
        c.lineTo(bullet.x - 5, bullet.y + 20);
        c.lineTo(bullet.x - 5, bullet.y + 10);
        c.closePath();
        c.fill();
    })
}

//Draw enemies
function drawEnemies() {

    for (let enemy of enemies) {

        //Move left or right if target is not within close range
        if (enemy.targetX + level[currentLevel - 1].speed < enemy.x ) {
            enemy.x -= level[currentLevel - 1].speed;
        }
        else if (enemy.targetX - level[currentLevel - 1].speed > enemy.x) {
            enemy.x += level[currentLevel - 1].speed;
        }

        //If target is within close range, randomly assign a new target within the target distance of the ship
        else {
            enemy.targetX = ship.x - level[currentLevel - 1].targetDistance + Math.floor(Math.random() * 2 * level[currentLevel - 1].targetDistance);
            enemy.targetX = Math.max(50, enemy.targetX);
            enemy.targetX = Math.min(enemy.targetX, width - 50);
        }

        //Move up or down according to target location
        if (enemy.targetY > enemy.y) {
            enemy.y += 5;
        }
        else if (enemy.targetY < enemy.y) {
            enemy.y -= 5;
        }
        else if (enemy.targetY === 400) {
            enemy.targetY = 50 + enemies.indexOf(enemy) * 100;
        }
        else {
            if (Math.random() < level[currentLevel - 1].moveDown) enemy.targetY = 400;
        }

        c.fillStyle = enemy.refractory ? `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})` : enemy.color;

        //Draw body and head
        c.beginPath();
        c.arc(enemy.x, enemy.y, 25, 0, 2 * Math.PI, true);
        c.ellipse(enemy.x, enemy.y + 25, 50, 15, 0, 0, 2 * Math.PI, true);
        c.fill();

        //Draw face
        c.beginPath();
        c.arc(enemy.x, enemy.y, 20, 0, 2 * Math.PI, true);
        c.fillStyle = 'black';
        c.fill();

        //Draw left eye
        c.beginPath();
        c.arc(enemy.x - 7, enemy.y, 3, 0, 2 * Math.PI, true);
        c.fillStyle = enemy.color;
        c.fill();

        //Draw right eye
        c.beginPath();
        c.arc(enemy.x + 7, enemy.y, 3, 0, 2 * Math.PI, true);
        c.fill();

        //Draw left eyebrow
        c.beginPath();
        c.moveTo(enemy.x - 12, enemy.y - 10)
        c.lineTo(enemy.x - 2, enemy.y - 7);
        c.lineWidth = 2;
        c.strokeStyle = enemy.color;
        c.stroke();

        //Draw right eyebrow
        c.beginPath();
        c.moveTo(enemy.x + 12, enemy.y - 10)
        c.lineTo(enemy.x + 2, enemy.y - 7);
        c.stroke();

        //Draw mouth
        c.beginPath();
        c.moveTo(enemy.x - 10, enemy.y + 10);
        c.lineTo(enemy.x + 10, enemy.y + 10);
        c.stroke();
    }
 }

//Draw bullets fired by the enemy
function drawEnemyBullets() {

    for (let enemy of enemies) {

        //If enemy is above ship, introduce a new bullet if random threshold is exceeded
        if (enemy.x - ship.x < 20 && enemy.x - ship.x > -20 && Math.random() < level[currentLevel - 1].shootShip) {
            enemy.bullets.push({x: enemy.x, y: enemy.y + 50})
        }

        //Otherwise, introduce a new bullet if another (less likely) threshold is exceeded
        else if (Math.random() < level[currentLevel - 1].shootSpace) {
            enemy.bullets.push({x: enemy.x, y: enemy.y + 50})
        }

        //Move all bullets 10 pixels to the south
        enemy.bullets.forEach(bullet => bullet.y += 10);

        //Filter bullets that have left the screen
        enemy.bullets = enemy.bullets.filter(bullet => bullet.y < height - 10);

        //Draw the remaining bullets
        c.fillStyle = enemy.color;

        enemy.bullets.forEach(bullet => {
            c.beginPath();
            c.moveTo(bullet.x, bullet.y);
            c.lineTo(bullet.x - 5, bullet.y - 10);
            c.lineTo(bullet.x - 5, bullet.y -20);
            c.lineTo(bullet.x + 5, bullet.y - 20);
            c.lineTo(bullet.x + 5, bullet.y - 10);
            c.closePath();
            c.fill();
        })
    }
 }


//Explode ship or enemy if all lives are lost
function explode(x, y, color) {

    let frames = 0;
    let fragments = [];

    //Generate parameters for 100 triangular shards and push into array
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

    //Render the explosion
    renderExplode();

    function renderExplode() {

        //Clear the canvas
        c.clearRect(0, 0, width, height);

        //Render usual scene on the background
        checkKeys();
        drawStars();
        drawPlanets();

        if (ship.lives > 0) {
            drawShip();
        } 

        drawShipBullets();
        drawEnemies();
        drawEnemyBullets();
 
        c.fillStyle = color;

        //Draw 100 triangular shards with given parameters
        for (fragment of fragments) {
            let [r, theta1, theta2, theta3, dx, dy, dr, ds] = fragment;
            c.beginPath();
            c.moveTo(
                x + frames * ds * r * Math.cos(theta1 + frames * dr * (Math.PI / 180)) + frames * dx,
                y + frames * ds * r * Math.sin(theta1 + frames * dr * (Math.PI / 180)) + frames * dy);
            c.lineTo(
                x + frames * ds * r * Math.cos(theta2 + frames * dr * (Math.PI / 180)) + frames * dx,
                y + frames * ds * r * Math.sin(theta2 + frames * dr * (Math.PI / 180)) + frames * dy);
            c.lineTo(
                x + frames * ds * r * Math.cos(theta3 + frames * dr * (Math.PI / 180)) + frames * dx,
                y + frames * ds * r * Math.sin(theta3 + frames * dr * (Math.PI / 180)) + frames * dy);
            c.closePath();
            c.fill();
        }

        frames++;

        //Render exactly 100 frames
        if (frames < 100) {
            requestAnimationFrame(renderExplode);
        }

        //Continue the game if the ship is still alive and there are enemies left
        else if (ship.lives > 0 && enemies.length > 0) {
            explosion = false; 
            render();
        }

        //Otherwise stop rendering
        else {
            explosion = false;
        }
    }
 
}

//Game over
function gameOver() {
    clearInterval(ship.ammoInterval);
    c.fillStyle = 'white'
    c.strokeStyle = 'white'
    c.font = 'bold 200px sans-serif';
    c.strokeRect(50, height / 2 - 225, 1400, 400)
    c.fillText('GAME OVER', 125, height / 2);
    c.font = 'bold 40px sans-serif';
    c.fillText('Hit enter to play again', 550, height / 2 + 100  );
    ship.lives = 3;
    ship.ammo = 10;
    currentLevel = 1;
    window.addEventListener('keydown', initializeLevel);
}

//Clears the canvas and renders all elements
function render() {
    c.clearRect(0, 0, width, height);
    checkKeys();
    checkHits();
    drawStars();
    drawPlanets();
    drawShip();
    drawShipBullets();
    drawEnemies();
    drawEnemyBullets();
  
    if (play && !explosion) {
        requestAnimationFrame(render);
    }
}

function renderStatus() {
    c2.clearRect (0, 0, width, statusHeight);

    //Draw numbers
    c2.fillStyle = 'white';
    c2.font = '48px sans-serif';
    c2.fillText(currentLevel, 60, statusHeight/ 1.5);
    c2.fillText(ship.ammo, width / 2 + 10, statusHeight / 1.5);
    c2.fillText(ship.lives, width - 55, statusHeight / 1.5);

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