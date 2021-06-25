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
    {enemies: 1, enemyLives: 2, speed: 2, shootSpace: 0.005, shootShip: 0.02, shootMega: 0, targetDistance: 600, moveDown: 0, laser: 0},
    {enemies: 1, enemyLives: 3, speed: 4, shootSpace: 0.005, shootShip: 0.02, shootMega: 0, targetDistance: 500, moveDown: 0, laser: 0},
    {enemies: 1, enemyLives: 3, speed: 6, shootSpace: 0.02, shootShip: 0.1, shootMega: 0, targetDistance: 200, moveDown: 0.001, laser: 0},
    {enemies: 2, enemyLives: 3, speed: 8, shootSpace: 0.02, shootShip: 0.1, shootMega: 0, targetDistance: 500, moveDown: 0.01, laser: 0},
    {enemies: 2, enemyLives: 3, speed: 10, shootSpace: 0.03, shootShip: 0.15, shootMega: 0.001, targetDistance: 500, moveDown: 0.02, laser: 1},
    {enemies: 2, enemyLives: 3, speed: 12, shootSpace: 0.03, shootShip: 0.15, shootMega: 0.002, targetDistance: 300, moveDown: 0.05, laser: 2},
    {enemies: 3, enemyLives: 3, speed: 12, shootSpace: 0.03, shootShip: 0.15, shootMega: 0.002, targetDistance: 400, moveDown: 0.05, laser: 3},
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
let animation;
let play;
let explosion;
let laser;

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

//Start the game
function startGame() {
        
    //Generate initial title stars
    let titleStars = [];
    for (let i = 50; i < 700; i ++ ) {
        let r = i;
        let theta = Math.random() * 2 * Math.PI;
        titleStars.push({r: r, theta: theta});    
    }
 
    window.addEventListener('keydown', nextLevel);

    renderStars();
  
    function renderStars() {

        //Clear the canvas and create new star
        c.clearRect(0, 0, width, height);
        let r = 50;
        let theta = Math.random() * 2 * Math.PI
        titleStars.push({r: r, theta: theta});

        //Render each star
        titleStars.forEach(star => {
            star.r += 1;
            star.theta += Math.PI / 180;
            c.fillStyle = 'white';
            c.beginPath();
            c.arc(width / 2 + star.r * Math.cos(star.theta), height / 2 + star.r * Math.sin(star.theta), 1, 0, 2 * Math.PI, true);
            c.fill();
         })

         //Filter stars
         titleStars = titleStars.filter(star => star.r < width);

         //Render title
         c.font = 'bold ' + width / 8 + 'px monospace';
         let linGrad = c.createLinearGradient(0, 0, width, height);
         linGrad.addColorStop(0, 'grey');
         linGrad.addColorStop(1, 'yellow');
         c.fillStyle = linGrad;
         const letters = ' SPACE LAMERS ';
         for (let i = 0; i < letters.length; i++) {
             c.fillText(letters[i], width / letters.length * i, height / 3.5);
         }

         //Render info text
         c.fillStyle = 'black';
         c.fillRect(width / 4, height / 2.5 , width /2, height / 3);
         c.strokeStyle = 'white';
         c.strokeRect(width / 4, height / 2.5 , width /2, height / 3);
         c.fillStyle = 'white';
         c.font = width / 50 + 'px monospace';
         c.fillText('Controls', 0.27 * width, 0.47 * height);
         c.fillText('Arrow keys: move', 0.27 * width, 0.54 * height);
         c.fillText('Space: fire bullet',0.27 *  width, 0.61 * height);
         c.fillText('Ctrl: fire laser (level 5 and higher)', 0.27 * width, 0.68 * height);
         c.fillText('Hit enter to continue', 0.38 * width, 0.85 * height);

         animation = requestAnimationFrame(renderStars);
    }
}

//Prepare for the next level
function nextLevel(e) {
    if (e && e.key !== 'Enter') {
        return;
    }

    if (currentLevel === 0) {
        window.removeEventListener('keydown', nextLevel);
        cancelAnimationFrame(animation);
    }
    
    if (ship.ammoInterval) {
        clearInterval(ship.ammoInterval);
    } 
    ship.lives++;
    currentLevel++;
    ship.ammo = 10;
    ship.laser = level[currentLevel - 1].laser;

    c.fillStyle = 'black';
    c.fillRect(0, 0, width, height);
    c.fillStyle = 'white';
    c.font = 'bold ' + width / 10 + 'px monospace';
    c.fillText('Level ' + currentLevel, 0.30 * width, height / 2);
    c.font = 'bold ' + width / 50 + 'px monospace';
    c.fillText('Hit enter to continue', 0.375 * width, 0.7 * height);
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
                active: true,
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

    if (play && !laser && e.key === 'Control' && ship.laser > 0) {
        laser = true;
        setTimeout(() => laser = false, 1000)
        ship.laser--;
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
        if (enemy.active) {
            for ({x, y, mega} of enemy.bullets) {
                if ((!ship.refractory && !mega && x > ship.x - 40 && x < ship.x + 40 && y > height - 65 + Math.abs(x - ship.x) && y < height - 5)
                    || (!ship.refractory && mega && x > ship.x - 80 && x < ship.x + 80 && y > height - 65 + Math.abs(x - ship.x) && y - 160 < height - 5)) {
                    
                    //If so, a life is lost and the ship becomes refractory for one second
                    ship.lives -= 1;
                    ship.refractory = true;
                    setTimeout(() => ship.refractory = false, 1000);
                    renderStatus();
                    
                    //If all lives are lost, the game is over
                    if (ship.lives === 0) {
                        play = false;
                        explode(ship.x, height - 65, 'blue');
                        setTimeout(() => gameOver(false), 2000);
                    }
                }
            }
        }
     }
 
     for (let enemy of enemies) {

        if (enemy.active) {

            //Check whether enemy is hit by ship bullet
            for ({x, y} of ship.bullets) {
                if (!enemy.refractory && x > enemy.x - 50 && x < enemy.x + 50 && y < enemy.y + 40 && y > enemy.y + 10) {
                    processEnemyHit(enemies.indexOf(enemy));
                }
            }

            //Check whether enemy is hit by laser
            if (!enemy.refractory && laser && ship.x < enemy.x + 50 && ship.x > enemy.x - 50) {
                processEnemyHit(enemies.indexOf(enemy));
            }
        }
    }

    //If all enemies are dead, proceed to next level
    if (enemies.every(enemy => !enemy.active)) {
        play = false;
        setTimeout(() => {
            if (currentLevel < 7) {
                nextLevel();
            }
            else {
                gameOver(true);
            }
        }, 2000);
    }
}

//Process enemy hit
function processEnemyHit(enemy) {

    //If enemy hit, an enemy life is lost and the enemy becomes refractory for one second
    enemies[enemy].lives -= 1;
    if (enemies[enemy].lives > 0) {
        enemies[enemy].refractory = true;
        setTimeout(() => enemies[enemy].refractory = false, 1000);
    }
 
    //If all lives are lost, inactive and explode enemy
    else {
        enemies[enemy].active = false;
        explosion = true;
        explode(enemies[enemy].x, enemies[enemy].y, enemies[enemy].color);
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

//Draw laser fired by ship
function drawLaser() {
    c.strokeStyle = 'red';
    c.lineWidth = 10;
    c.beginPath();
    c.moveTo(ship.x, 0);
    c.lineTo(ship.x, height - 65);
    c.stroke();
}

//Draw enemies
function drawEnemies() {

    for (let enemy of enemies) {

        if (enemy.active) {

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
}

//Draw bullets fired by the enemy
function drawEnemyBullets() {

    for (let enemy of enemies) {

        if (enemy.active) {

            //If enemy is above ship, introduce a new bullet if random threshold is exceeded
            if (enemy.x - ship.x < 20 && enemy.x - ship.x > -20 && Math.random() < level[currentLevel - 1].shootShip) {
                enemy.bullets.push({x: enemy.x, y: enemy.y + 50, mega: false})
            }

            //Otherwise, introduce a new bullet if another (less likely) threshold is exceeded
            else if (Math.random() < level[currentLevel - 1].shootSpace) {
                enemy.bullets.push({x: enemy.x, y: enemy.y + 50, mega: false})
            }

            //Introduce a mega bullet if another (even less likely) threshold is exceeded
            else if (Math.random() < level[currentLevel - 1].shootMega) {
                enemy.bullets.push({x: enemy.x, y: enemy.y + 190, mega: true})
            }

            //Move all bullets to the south
            enemy.bullets.forEach(bullet => {
                if (bullet.mega) {
                    bullet.y += 1;
                }
                else {
                    bullet.y += 10;
                }
            });

            //Filter bullets that have left the screen
            enemy.bullets = enemy.bullets.filter(bullet => bullet.y < height + 160);

            //Draw remaining bullets
            enemy.bullets.forEach(bullet => {
                if (!bullet.mega) {
                    c.fillStyle = enemy.color;
                    c.beginPath();
                    c.moveTo(bullet.x, bullet.y);
                    c.lineTo(bullet.x - 5, bullet.y - 10);
                    c.lineTo(bullet.x - 5, bullet.y -20);
                    c.lineTo(bullet.x + 5, bullet.y - 20);
                    c.lineTo(bullet.x + 5, bullet.y - 10);
                    c.closePath();
                    c.fill();
                }
                else {
                    let linGrad = c.createLinearGradient(bullet.x - 40, bullet.y - 160, bullet.x + 40, bullet.y);
                    linGrad.addColorStop(0, 'black');
                    linGrad.addColorStop(1, enemy.color);
                    c.fillStyle = linGrad;
                    c.beginPath();
                    c.moveTo(bullet.x, bullet.y);
                    c.lineTo(bullet.x - 40, bullet.y - 80);
                    c.lineTo(bullet.x - 40, bullet.y - 160);
                    c.lineTo(bullet.x + 40, bullet.y - 160);
                    c.lineTo(bullet.x + 40, bullet.y - 80);
                    c.closePath();
                    c.fill();
                }
            })
        }
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

        if (ship.lives > 0 && laser) {
            drawLaser();
        }

        drawShipBullets();
        drawEnemies();
        drawEnemyBullets();
 
        c.fillStyle = color;

        //Draw 100 triangular shards with given parameters
        for ([r, theta1, theta2, theta3, dx, dy, dr, ds] of fragments) {
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
        else if (ship.lives > 0 && enemies.some(enemy => enemy.active)) {
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
function gameOver(win) {
    clearInterval(ship.ammoInterval);
    c.fillStyle = 'white'
    c.strokeStyle = 'white'
    c.strokeRect(0.05 * width, 0.20 * height, 0.9 * width, 0.6 * height)
    
    if (win) {
        c.font = 'bold ' + width / 10 + 'px monospace';
        c.fillText('GAME COMPLETED', 0.12 * width, height / 2);
    }

    else {
        c.font = 'bold '+ width / 7.5 + 'px monospace';
        c.fillText('GAME OVER', 0.16 * width, height / 2);
    
    }
    
    c.font = 'bold ' + width / 50 + 'px monospace';
    c.fillText('Hit enter to play again', 0.37 * width, 0.7 * height);
    ship.lives = 0;
    ship.ammo = 10;
    currentLevel = 0;
    window.addEventListener('keydown', nextLevel);
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

    if (laser) {
        drawLaser();
    }
  
    if (play && !explosion) {
        requestAnimationFrame(render);
    }
}

function renderStatus() {
    c2.clearRect (0, 0, width, statusHeight);

    //Draw numbers
    c2.fillStyle = 'white';
    c2.font = width / 30 + 'px monospace';
    c2.fillText(currentLevel, 0.07 * width, statusHeight/ 1.5);
    c2.fillText(ship.ammo, 0.19 * width, statusHeight / 1.5);
    c2.fillText(ship.laser, 0.31 * width, statusHeight / 1.5);
    c2.fillText(ship.lives, 0.43 * width, statusHeight / 1.5);

    //Draw world
    c2.beginPath();
    c2.arc(0.05 * width, statusHeight / 2, 25, 0, 2 * Math.PI, true);
    let linGrad = c2.createLinearGradient(0.03 * width, statusHeight / 2, 0.07 * width, statusHeight / 2);
    linGrad.addColorStop(0, 'brown');
    linGrad.addColorStop(1, 'green');
    c2.fillStyle = linGrad;
    c2.fill();
    
    //Draw bullet
    c2.beginPath();
    c2.moveTo(0.17 * width, 0.15 * statusHeight + 50);
    c2.lineTo(0.17 * width, 0.15 * statusHeight + 20);
    c2.lineTo(0.17 * width + 10, 0.15 * statusHeight);
    c2.lineTo(0.17 * width + 20, 0.15 * statusHeight + 20);
    c2.lineTo(0.17 * width + 20, 0.15 * statusHeight + 50);
    linGrad = c2.createLinearGradient(0.17 * width, 0.15 * statusHeight, 0.17 * width + 20, 0.15 * statusHeight + 50);
    linGrad.addColorStop(0, 'blue');
    linGrad.addColorStop(1, 'darkblue');
    c2.fillStyle = linGrad;
    c2.fill();

    //Draw laser
    linGrad = c2.createLinearGradient(0.29 * width, 0.15 * statusHeight, 0.29 * width + 20, 0.15 * statusHeight + 50);
    linGrad.addColorStop(0, 'red');
    linGrad.addColorStop(1, 'darkred');
    c2.fillStyle = linGrad;
    c2.fillRect(0.29 * width, 0.15 * statusHeight, 20, 50)

    //Draw heart
    c2.beginPath();
    c2.moveTo(0.38 * width + 55, 0.8 * statusHeight - 20);
    c2.lineTo(0.38 * width + 40, 0.8 * statusHeight);
    c2.lineTo(0.38 * width + 25, 0.8 * statusHeight - 20);
    c2.bezierCurveTo(0.38 * width, 0.8 * statusHeight - 60, 0.38 * width + 30, 0.8 * statusHeight - 60, 0.38 * width + 40, 0.8 * statusHeight - 35);
    c2.bezierCurveTo(0.38 * width + 50, 0.8 * statusHeight - 60, 0.38 * width + 80, 0.8 * statusHeight - 60, 0.38 * width + 55, 0.8 * statusHeight - 20);
    linGrad = c2.createLinearGradient(0.38 * width, statusHeight - 20, 0.38 * width + 80, statusHeight - 20);
    linGrad.addColorStop(0, 'red');
    linGrad.addColorStop(1, 'darkred');
    c2.fillStyle = linGrad;
    c2.fill();

    //Show level properties
    c2.fillStyle = 'white';
    c2.font = width / 75 + 'px monospace';
    c2.fillText(`speed: ${level[currentLevel - 1].speed}px/frame, shootSpace: ${(level[currentLevel - 1].shootSpace * 100).toFixed(1)}%, shootShip: ${(level[currentLevel - 1].shootShip * 100).toFixed(1)}%,`, 0.52 * width, 0.35 * statusHeight);
    c2.fillText(`shootMega: ${(level[currentLevel - 1].shootMega * 100).toFixed(1)}%, targetDistance: ${level[currentLevel - 1].targetDistance}px, moveDown: ${(level[currentLevel - 1].moveDown * 100).toFixed(1)}%.`, 0.52 * width, 0.75 * statusHeight);
}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);

generateStars();
startGame();