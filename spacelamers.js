//Initiaze canvas and canvas dimensions
const width = document.body.clientWidth;
const height = window.innerHeight - 20;
const canvas = document.getElementById('canvas');
const c = canvas.getContext('2d');
canvas.setAttribute('width', width);
canvas.setAttribute('height', height);

//Initialize level-independent variables
let keysPressed = {};
let shipLives = 3;
let level = 1;
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
let play;

//Initialize level-dependent variables
function initializeLevel() {
    shipX = width / 2;
    enemyX = 50 + Math.floor(Math.random() * width - 50);
    enemyTargetX = 50 + Math.floor(Math.random() * width - 50);
    shipBullets = [];
    enemyBullets = [];
    enemyLives = 3;
    shipFill = 'blue';
    enemyFill = 'red';
    play = true;
}

//Keep track of which keys are currently pressed. Except the space key, which needs to be pressed repeatedly
function keyDown(e) {
    if (e.key === ' ') {
        shipBullets.push([shipX, height - 50]);
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
        if (x > shipX - 50 && x < shipX + 50 && y > height - 80 && y < height - 60) {
            
            //If so, a life is lost and the ship needs to turn yellow and back blue again.
            shipLives -= 1;
            shipFill = 'yellow';
            setTimeout(() => shipFill = 'blue', 1000);
            
            //If all lives are lost, the game is over
            if (shipLives === 0) {
                play = false;
                gameOver();
            }
        }
    }

    //Check whether enemy is hit by ship bullet
    for ([x, y] of shipBullets) {
        if (x > enemyX - 50 && x < enemyX + 50 && y < 100 && y > 80) {

            //If so, an enemy life is lost and the ship needs to turn yellow and back red again.
            enemyLives -= 1;
            enemyFill = 'yellow';
            setTimeout(() => enemyFill = 'red', 1000);

            //If all lives are lost, proceed to next level
            if (enemyLives === 0) {
                shipLives++;
                level++;
                initializeLevel();
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

//Draw the scores and level
function drawScore() {
    c.font = '48px sans-serif';
    c.fillText(level, 20, 50);
    c.fillText(enemyLives, width - 50, 50);
    c.fillText(shipLives, width - 50, height - 50);
}

//Game over
function gameOver() {
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

    c.fillStyle = 'white'
    drawScore();
  
    if (play) {
        requestAnimationFrame(render);
    }
 
}

initializeLevel();

render();

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);