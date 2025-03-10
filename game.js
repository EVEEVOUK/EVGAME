let playerX, playerY;
let obstacles = [];
let stations = [];
let boosts = [];
let superStations = [];
let battery = 100;
let speed = 6;
let score = 0;
let combo = 0;
let gameState = "playing"; // Changed to auto-start
let highScore = 0;
let roadOffset = 0;
let shield = false;
let evColor = [0, 200, 0];
let slipTimer = 0;

let emailInput = "";
let emailSubmitted = false;
let downloadClicked = false;

function setup() {
  let canvasWidth = min(windowWidth, 800);
  let canvasHeight = min(windowHeight, 1200);
  createCanvas(canvasWidth, canvasHeight);
  resetGame();
}

function windowResized() {
  let canvasWidth = min(windowWidth, 800);
  let canvasHeight = min(windowHeight, 1200);
  resizeCanvas(canvasWidth, canvasHeight);
}

function draw() {
  background(50);
  
  if (gameState === "playing") {
    playGame();
  } else if (gameState === "gameover") {
    drawGameOverScreen();
  }
}

function resetGame() {
  playerX = width / 2;
  playerY = height - height * 0.15;
  battery = 100;
  speed = 6;
  score = 0;
  combo = 0;
  shield = false;
  slipTimer = 0;
  obstacles = [];
  stations = [];
  boosts = [];
  superStations = [];
  roadOffset = 0;
  emailInput = "";
  emailSubmitted = false;
  downloadClicked = false;
  if (highScore >= 5000) evColor = [0, 0, 255];
  else if (highScore >= 2000) evColor = [255, 0, 0];
  else evColor = [0, 200, 0];
}

function drawGameOverScreen() {
  fill(255);
  textSize(width * 0.06);
  textAlign(CENTER, CENTER);
  text("Game Over", width / 2, height / 2 - height * 0.35);

  textSize(width * 0.04);
  text(`Score: ${score}`, width / 2, height / 2 - height * 0.25);
  text(`High Score: ${highScore}`, width / 2, height / 2 - height * 0.18);
  text(`I survived ${score} points! Beat me!`, width / 2, height / 2 - height * 0.11);

  textSize(width * 0.035);
  fill(200);
  rect(width / 2 - width * 0.15, height / 2 - height * 0.025, width * 0.3, height * 0.05);
  fill(255);
  text("Enter your email to stay updated:", width / 2, height / 2 - height * 0.08);
  text(emailInput + (frameCount % 60 < 30 ? "|" : ""), width / 2 - width * 0.13, height / 2 + height * 0.015);

  fill(0, 255, 0);
  rect(width / 2 - width * 0.05, height / 2 + height * 0.075, width * 0.1, height * 0.05, 5);
  fill(255);
  text("Submit", width / 2, height / 2 + height * 0.1);

  if (emailSubmitted) {
    fill(0, 255, 0);
    text("Email Saved! Check your download.", width / 2, height / 2 + height * 0.18);
  }

  fill(0, 191, 255);
  textSize(width * 0.035);
  text("Download EVEEVO App", width / 2, height / 2 + height * 0.28);
  stroke(0, 191, 255);
  strokeWeight(1);
  line(width / 2 - width * 0.1, height / 2 + height * 0.29, width / 2 + width * 0.1, height / 2 + height * 0.29);
  noStroke();

  if (downloadClicked) {
    fill(0, 191, 255);
    text("Opening eveevo.co.uk...", width / 2, height / 2 + height * 0.35);
  }

  // Restart Button for iPhone
  fill(255, 165, 0); // Orange button
  rect(width / 2 - 75, height / 2 + height * 0.45 - 25, 150, 50, 10); // Touch-friendly size
  fill(255);
  textSize(width * 0.04);
  text("Restart", width / 2, height / 2 + height * 0.45);

  if (score >= 2000 && score < 5000) text("Red EV Unlocked!", width / 2, height / 2 + height * 0.52);
  if (score >= 5000) text("Blue EV Unlocked!", width / 2, height / 2 + height * 0.52);
}

function playGame() {
  drawBackground();
  updatePlayer();
  spawnItems();
  updateItems();
  drawUI();
  checkCollisions();
  if (battery <= 0) {
    gameState = "gameover";
    if (score > highScore) highScore = score;
  }
  score += 1 + combo;
}

function drawBackground() {
  fill(100);
  rect(0, 0, width, height);
  stroke(255);
  strokeWeight(2);
  roadOffset += speed * 1.25;
  if (roadOffset > height * 0.05) roadOffset = 0;
  for (let y = -height * 0.05; y < height; y += height * 0.05) {
    line(width / 3, y + roadOffset, width / 3, y + roadOffset + height * 0.025);
    line((width * 2) / 3, y + roadOffset, (width * 2) / 3, y + roadOffset + height * 0.025);
  }
  noStroke();
  fill(80);
  rect(0, 0, width, height * 0.1);
}

function drawPlayer(x, y) {
  let carWidth = width * 0.1;
  let carHeight = height * 0.1;
  let wheelWidth = carWidth * 0.25;
  let wheelHeight = carHeight * 0.25;

  fill(...evColor);
  rect(x - carWidth / 2, y - carHeight / 2, carWidth, carHeight, 10);
  fill(150);
  let wheelOffset = frameCount % 10 < 5 ? 2 : -2;
  rect(x - carWidth / 2 - wheelWidth / 2, y - carHeight / 4 + wheelOffset, wheelWidth, wheelHeight);
  rect(x + carWidth / 2 - wheelWidth / 2, y - carHeight / 4 + wheelOffset, wheelWidth, wheelHeight);
  rect(x - carWidth / 2 - wheelWidth / 2, y + carHeight / 4 + wheelOffset, wheelWidth, wheelHeight);
  rect(x + carWidth / 2 - wheelWidth / 2, y + carHeight / 4 + wheelOffset, wheelWidth, wheelHeight);
  fill(255);
  rect(x - carWidth * 0.45, y - carHeight * 0.35, carWidth * 0.9, carHeight * 0.35);
  fill(0);
  textSize(width * 0.03);
  textAlign(CENTER, CENTER);
  text(`${floor(battery)}%`, x, y - carHeight * 0.25);
  if (speed > 6) {
    noFill();
    stroke(0, 255, 255);
    strokeWeight(2);
    rect(x - carWidth / 2 - 5, y - carHeight / 2 - 5, carWidth + 10, carHeight + 10, 15);
    noStroke();
  }
  if (shield) {
    noFill();
    stroke(255, 255, 0);
    strokeWeight(3);
    ellipse(x, y, carWidth + 20, carHeight + 20);
    noStroke();
  }
}

function updatePlayer() {
  if (keyIsDown(LEFT_ARROW)) playerX -= 5;
  if (keyIsDown(RIGHT_ARROW)) playerX += 5;
  if (slipTimer > 0) {
    playerX += random(-5, 5);
    slipTimer--;
  }
  playerX = constrain(playerX, width * 0.05, width * 0.95);
  drawPlayer(playerX, playerY);
  battery -= 0.015 * speed;
}

function spawnItems() {
  if (frameCount % 45 === 0) {
    let lane = random([width / 6, width / 2, (width * 5) / 6]);
    let r = random();
    // Adjusted probabilities: more chargers, fewer obstacles
    if (r < 0.1) obstacles.push({ x: lane, y: -50, type: "roadWorkBarrier" });
    else if (r < 0.2) obstacles.push({ x: lane, y: -50, type: "trafficBarrel" });
    else if (r < 0.3) obstacles.push({ x: lane, y: -50, type: "sign" });
    else if (r < 0.4) obstacles.push({ x: lane, y: -50, type: "oil" });
    else if (r < 0.5) obstacles.push({ x: lane, y: -50, type: "block" });
    else if (r < 0.6) obstacles.push({ x: lane, y: -50, type: "iceCar", iceSpeed: random(3, 6) });
    else if (r < 0.65) obstacles.push({ x: lane, y: -50, type: "deer" });
    else if (r < 0.7) obstacles.push({ x: lane, y: -50, type: "sheep" });
    else if (r < 0.75) obstacles.push({ x: lane, y: -50, type: "cow" }); // Obstacles end at 75% (was 85%)
    else if (r < 0.85) stations.push({ x: lane, y: -50 }); // Regular stations: 10% (was 5%)
    else if (r < 0.90) boosts.push({ x: lane, y: -50 }); // Boosts: 5% (was 6%)
    else superStations.push({ x: lane, y: -50 }); // Super stations: 10% (was 4%)
  }
}

function updateItems() {
  let itemSize = width * 0.1;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].type === "iceCar") {
      obstacles[i].y += obstacles[i].iceSpeed * 1.25;
      fill(200, 0, 0);
      rect(obstacles[i].x - itemSize / 2, obstacles[i].y - itemSize / 2, itemSize, itemSize, 5);
      fill(50);
      let wheelOffset = frameCount % 10 < 5 ? 2 : -2;
      rect(obstacles[i].x - itemSize / 2 - itemSize / 8, obstacles[i].y - itemSize / 4 + wheelOffset, itemSize / 4, itemSize / 3);
      rect(obstacles[i].x + itemSize / 2 - itemSize / 8, obstacles[i].y - itemSize / 4 + wheelOffset, itemSize / 4, itemSize / 3);
      rect(obstacles[i].x - itemSize / 2 - itemSize / 8, obstacles[i].y + itemSize / 4 + wheelOffset, itemSize / 4, itemSize / 3);
      rect(obstacles[i].x + itemSize / 2 - itemSize / 8, obstacles[i].y + itemSize / 4 + wheelOffset, itemSize / 4, itemSize / 3);
      fill(150, 150, 150, 150);
      for (let j = 0; j < 3; j++) {
        let smokeX = obstacles[i].x - itemSize / 2 + random(-itemSize / 4, itemSize / 4);
        let smokeY = obstacles[i].y - itemSize / 2 - j * itemSize / 4;
        ellipse(smokeX, smokeY, itemSize / 3 + random(-5, 5), itemSize / 3 + random(-5, 5));
      }
      if (obstacles[i].y > height + itemSize) obstacles.splice(i, 1);
    } else {
      obstacles[i].y += speed * 1.25;
      if (obstacles[i].type === "roadWorkBarrier") {
        fill(255, 165, 0);
        rect(obstacles[i].x - itemSize * 1.2, obstacles[i].y - itemSize * 0.4, itemSize * 2.4, itemSize * 0.8, 5);
        fill(255);
        rect(obstacles[i].x - itemSize * 1.0, obstacles[i].y - itemSize * 0.4, itemSize * 0.4, itemSize * 0.8);
        rect(obstacles[i].x - itemSize * 0.2, obstacles[i].y - itemSize * 0.4, itemSize * 0.4, itemSize * 0.8);
        rect(obstacles[i].x + itemSize * 0.6, obstacles[i].y - itemSize * 0.4, itemSize * 0.4, itemSize * 0.8);
        fill(255, frameCount % 20 < 10 ? 0 : 255, 0);
        ellipse(obstacles[i].x, obstacles[i].y - itemSize * 0.5, itemSize * 0.3, itemSize * 0.3);
      } else if (obstacles[i].type === "trafficBarrel") {
        fill(255, 165, 0);
        rect(obstacles[i].x - itemSize * 0.4, obstacles[i].y - itemSize * 0.8, itemSize * 0.8, itemSize * 1.2, 5);
        fill(255);
        rect(obstacles[i].x - itemSize * 0.4, obstacles[i].y - itemSize * 0.6, itemSize * 0.8, itemSize * 0.2);
        rect(obstacles[i].x - itemSize * 0.4, obstacles[i].y - itemSize * 0.2, itemSize * 0.8, itemSize * 0.2);
        fill(255, frameCount % 20 < 10 ? 255 : 0, 0);
        ellipse(obstacles[i].x, obstacles[i].y - itemSize * 0.8, itemSize * 0.3, itemSize * 0.3);
      } else if (obstacles[i].type === "sign") {
        fill(200);
        rect(obstacles[i].x - itemSize * 0.5, obstacles[i].y - itemSize * 0.6, itemSize, itemSize * 0.5, 5);
        fill(150);
        rect(obstacles[i].x - itemSize * 0.05, obstacles[i].y - itemSize * 0.1, itemSize * 0.1, itemSize * 0.7);
        fill(255, 0, 0);
        textSize(width * 0.025);
        textAlign(CENTER, CENTER);
        text("SLOW", obstacles[i].x, obstacles[i].y - itemSize * 0.35);
      } else if (obstacles[i].type === "oil") {
        fill(0);
        ellipse(obstacles[i].x, obstacles[i].y, itemSize * 1.5, itemSize * 0.75);
        fill(255);
        textSize(width * 0.04);
        textAlign(CENTER, CENTER);
        text("OIL", obstacles[i].x, obstacles[i].y);
      } else if (obstacles[i].type === "block") {
        fill(150);
        rect(obstacles[i].x - itemSize * 0.75, obstacles[i].y - itemSize / 2, itemSize * 1.5, itemSize);
        fill(255, 0, 0);
        textSize(width * 0.03);
        text("STOP", obstacles[i].x - itemSize / 4, obstacles[i].y);
      } else if (obstacles[i].type === "fallenTree") {
        fill(139, 69, 19);
        rect(obstacles[i].x - itemSize * 1.5, obstacles[i].y - itemSize * 0.3, itemSize * 3, itemSize * 0.6, 5);
        fill(34, 139, 34);
        triangle(
          obstacles[i].x - itemSize * 1.2, obstacles[i].y - itemSize * 0.3,
          obstacles[i].x - itemSize * 0.8, obstacles[i].y - itemSize * 0.9,
          obstacles[i].x - itemSize * 0.4, obstacles[i].y - itemSize * 0.3
        );
        triangle(
          obstacles[i].x + itemSize * 0.4, obstacles[i].y - itemSize * 0.3,
          obstacles[i].x + itemSize * 0.8, obstacles[i].y - itemSize * 0.9,
          obstacles[i].x + itemSize * 1.2, obstacles[i].y - itemSize * 0.3
        );
        stroke(34, 139, 34);
        strokeWeight(2);
        line(obstacles[i].x - itemSize, obstacles[i].y - itemSize * 0.3, obstacles[i].x - itemSize * 1.1, obstacles[i].y - itemSize * 0.6);
        line(obstacles[i].x + itemSize, obstacles[i].y - itemSize * 0.3, obstacles[i].x + itemSize * 1.1, obstacles[i].y - itemSize * 0.6);
        noStroke();
      } else if (obstacles[i].type === "debris") {
        fill(100);
        triangle(obstacles[i].x - itemSize / 2, obstacles[i].y, obstacles[i].x, obstacles[i].y - itemSize / 2, obstacles[i].x + itemSize / 2, obstacles[i].y);
        rect(obstacles[i].x - itemSize / 4, obstacles[i].y, itemSize / 2, itemSize / 4);
      } else if (obstacles[i].type === "deer") {
        fill(139, 69, 19);
        rect(obstacles[i].x - itemSize * 0.3, obstacles[i].y - itemSize * 0.4, itemSize * 0.6, itemSize * 0.8, 5);
        fill(100, 50, 0);
        rect(obstacles[i].x - itemSize * 0.1, obstacles[i].y - itemSize * 0.6, itemSize * 0.2, itemSize * 0.3);
        fill(0);
        triangle(obstacles[i].x - itemSize * 0.1, obstacles[i].y - itemSize * 0.7, obstacles[i].x, obstacles[i].y - itemSize * 0.9, obstacles[i].x + itemSize * 0.1, obstacles[i].y - itemSize * 0.7);
        rect(obstacles[i].x - itemSize * 0.25, obstacles[i].y + itemSize * 0.2, itemSize * 0.1, itemSize * 0.4);
        rect(obstacles[i].x + itemSize * 0.15, obstacles[i].y + itemSize * 0.2, itemSize * 0.1, itemSize * 0.4);
        rect(obstacles[i].x - itemSize * 0.25, obstacles[i].y + itemSize * 0.3, itemSize * 0.1, itemSize * 0.4);
        rect(obstacles[i].x + itemSize * 0.15, obstacles[i].y + itemSize * 0.3, itemSize * 0.1, itemSize * 0.4);
      } else if (obstacles[i].type === "sheep") {
        fill(255);
        ellipse(obstacles[i].x, obstacles[i].y, itemSize * 0.9, itemSize * 0.7);
        fill(200);
        rect(obstacles[i].x - itemSize * 0.3, obstacles[i].y + itemSize * 0.2, itemSize * 0.15, itemSize * 0.4);
        rect(obstacles[i].x + itemSize * 0.15, obstacles[i].y + itemSize * 0.2, itemSize * 0.15, itemSize * 0.4);
        rect(obstacles[i].x - itemSize * 0.3, obstacles[i].y + itemSize * 0.3, itemSize * 0.15, itemSize * 0.4);
        rect(obstacles[i].x + itemSize * 0.15, obstacles[i].y + itemSize * 0.3, itemSize * 0.15, itemSize * 0.4);
        fill(50);
        rect(obstacles[i].x - itemSize * 0.15, obstacles[i].y - itemSize * 0.4, itemSize * 0.3, itemSize * 0.25);
        fill(255);
        triangle(obstacles[i].x - itemSize * 0.25, obstacles[i].y - itemSize * 0.45, obstacles[i].x - itemSize * 0.35, obstacles[i].y - itemSize * 0.55, obstacles[i].x - itemSize * 0.15, obstacles[i].y - itemSize * 0.5);
        triangle(obstacles[i].x + itemSize * 0.25, obstacles[i].y - itemSize * 0.45, obstacles[i].x + itemSize * 0.35, obstacles[i].y - itemSize * 0.55, obstacles[i].x + itemSize * 0.15, obstacles[i].y - itemSize * 0.5);
      } else if (obstacles[i].type === "cow") {
        fill(255);
        rect(obstacles[i].x - itemSize * 0.6, obstacles[i].y - itemSize * 0.5, itemSize * 1.2, itemSize * 0.9, 5);
        fill(0);
        ellipse(obstacles[i].x - itemSize * 0.3, obstacles[i].y - itemSize * 0.2, itemSize * 0.5, itemSize * 0.3);
        ellipse(obstacles[i].x + itemSize * 0.2, obstacles[i].y + itemSize * 0.1, itemSize * 0.6, itemSize * 0.4);
        fill(50);
        rect(obstacles[i].x - itemSize * 0.45, obstacles[i].y + itemSize * 0.2, itemSize * 0.15, itemSize * 0.5);
        rect(obstacles[i].x + itemSize * 0.3, obstacles[i].y + itemSize * 0.2, itemSize * 0.15, itemSize * 0.5);
        rect(obstacles[i].x - itemSize * 0.45, obstacles[i].y + itemSize * 0.3, itemSize * 0.15, itemSize * 0.5);
        rect(obstacles[i].x + itemSize * 0.3, obstacles[i].y + itemSize * 0.3, itemSize * 0.15, itemSize * 0.5);
        fill(255);
        rect(obstacles[i].x - itemSize * 0.2, obstacles[i].y - itemSize * 0.7, itemSize * 0.4, itemSize * 0.3);
        fill(0);
        triangle(obstacles[i].x - itemSize * 0.25, obstacles[i].y - itemSize * 0.75, obstacles[i].x - itemSize * 0.35, obstacles[i].y - itemSize * 0.85, obstacles[i].x - itemSize * 0.15, obstacles[i].y - itemSize * 0.8);
        triangle(obstacles[i].x + itemSize * 0.25, obstacles[i].y - itemSize * 0.75, obstacles[i].x + itemSize * 0.35, obstacles[i].y - itemSize * 0.85, obstacles[i].x + itemSize * 0.15, obstacles[i].y - itemSize * 0.8);
        stroke(0);
        strokeWeight(2);
        line(obstacles[i].x - itemSize * 0.5, obstacles[i].y + itemSize * 0.4, obstacles[i].x - itemSize * 0.7, obstacles[i].y + itemSize * 0.6);
        noStroke();
      }
      if (obstacles[i].y > height) obstacles.splice(i, 1);
    }
  }
  
  for (let i = stations.length - 1; i >= 0; i--) {
    stations[i].y += speed * 1.25;
    fill(150);
    rect(stations[i].x - itemSize * 0.4, stations[i].y - itemSize * 0.6, itemSize * 0.8, itemSize * 1.2, 5);
    fill(0, 255, 0);
    rect(stations[i].x - itemSize * 0.3, stations[i].y - itemSize * 0.5, itemSize * 0.6, itemSize * 0.4);
    stroke(0);
    strokeWeight(2);
    line(stations[i].x + itemSize * 0.3, stations[i].y - itemSize * 0.3, stations[i].x + itemSize * 0.5, stations[i].y);
    noStroke();
    fill(255, 255, 0);
    beginShape();
    vertex(stations[i].x, stations[i].y - itemSize * 0.4);
    vertex(stations[i].x - itemSize * 0.15, stations[i].y - itemSize * 0.2);
    vertex(stations[i].x + itemSize * 0.15, stations[i].y - itemSize * 0.2);
    vertex(stations[i].x, stations[i].y);
    endShape(CLOSE);
    fill(0);
    textSize(width * 0.03);
    textAlign(CENTER, CENTER);
    text("EV CHARGER", stations[i].x, stations[i].y + itemSize * 0.2);
    if (stations[i].y > height) stations.splice(i, 1);
  }
  
  for (let i = boosts.length - 1; i >= 0; i--) {
    boosts[i].y += speed * 1.25;
    fill(0, 0, 255);
    ellipse(boosts[i].x, boosts[i].y, itemSize * 0.6, itemSize * 0.6);
    fill(255);
    textSize(width * 0.03);
    text("S", boosts[i].x - itemSize / 8, boosts[i].y + itemSize / 8);
    if (boosts[i].y > height) boosts.splice(i, 1);
  }
  
  for (let i = superStations.length - 1; i >= 0; i--) {
    superStations[i].y += speed * 1.25;
    fill(255, 215, 0);
    rect(superStations[i].x - itemSize * 0.6, superStations[i].y - itemSize * 0.8, itemSize * 1.2, itemSize * 1.6, 10);
    fill(0, 255, 0);
    rect(superStations[i].x - itemSize * 0.4, superStations[i].y - itemSize * 0.7, itemSize * 0.8, itemSize * 0.5);
    stroke(0);
    strokeWeight(3);
    noFill();
    beginShape();
    vertex(superStations[i].x + itemSize * 0.4, superStations[i].y - itemSize * 0.5);
    bezierVertex(superStations[i].x + itemSize * 0.6, superStations[i].y - itemSize * 0.3, superStations[i].x + itemSize * 0.8, superStations[i].y, superStations[i].x + itemSize * 0.6, superStations[i].y + itemSize * 0.2);
    endShape();
    noStroke();
    fill(255);
    beginShape();
    vertex(superStations[i].x, superStations[i].y - itemSize * 0.6);
    vertex(superStations[i].x - itemSize * 0.2, superStations[i].y - itemSize * 0.3);
    vertex(superStations[i].x + itemSize * 0.2, superStations[i].y - itemSize * 0.3);
    vertex(superStations[i].x, superStations[i].y + itemSize * 0.1);
    endShape(CLOSE);
    noFill();
    stroke(255, 255, 0, 150);
    strokeWeight(4);
    ellipse(superStations[i].x, superStations[i].y, itemSize * 1.4, itemSize * 1.8);
    noStroke();
    fill(0);
    textSize(width * 0.035);
    textAlign(CENTER, CENTER);
    text("EV CHARGER", superStations[i].x, superStations[i].y + itemSize * 0.4);
    if (superStations[i].y > height) superStations.splice(i, 1);
  }
}

function checkCollisions() {
  let carWidth = width * 0.1;
  let itemSize = width * 0.1;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let hitDist = obstacles[i].type === "trafficBarrel" || obstacles[i].type === "block" || obstacles[i].type === "iceCar" || obstacles[i].type === "debris" || obstacles[i].type === "oil" || obstacles[i].type === "cow" || obstacles[i].type === "fallenTree" || obstacles[i].type === "roadWorkBarrier" ? itemSize * 1.5 : itemSize * 0.875;
    if (dist(playerX, playerY, obstacles[i].x, obstacles[i].y) < hitDist && !shield) {
      if (obstacles[i].type === "iceCar" || obstacles[i].type === "block") {
        gameState = "gameover";
        if (score > highScore) highScore = score;
        obstacles.splice(i, 1);
      } else if (obstacles[i].type === "roadWorkBarrier") {
        battery -= 10;
        let originalSpeed = speed;
        speed = min(speed, 3);
        setTimeout(() => speed = max(originalSpeed, 6), 3000);
      } else if (obstacles[i].type === "trafficBarrel") {
        battery -= 25;
        speed *= 0.8;
        setTimeout(() => speed = max(speed / 0.8, 6), 2000);
      } else if (obstacles[i].type === "sign") {
        battery -= 10;
        speed *= 0.5;
        setTimeout(() => speed = max(speed / 0.5, 6), 3000);
      } else if (obstacles[i].type === "oil") {
        battery -= 5;
        slipTimer = 60;
      } else if (obstacles[i].type === "fallenTree") {
        battery -= 20;
        speed *= 0.7;
        setTimeout(() => speed = max(speed / 0.7, 6), 2500);
      } else if (obstacles[i].type === "debris") {
        battery -= 12;
        speed *= 0.75;
      } else if (obstacles[i].type === "deer") {
        battery -= 5;
        speed *= 0.7;
        setTimeout(() => speed = max(speed / 0.7, 6), 2000);
      } else if (obstacles[i].type === "sheep") {
        battery -= 7;
        speed *= 0.7;
        setTimeout(() => speed = max(speed / 0.7, 6), 2000);
      } else if (obstacles[i].type === "cow") {
        battery -= 10;
        speed *= 0.7;
        setTimeout(() => speed = max(speed / 0.7, 6), 2000);
      }
      if (obstacles[i].type !== "iceCar" && obstacles[i].type !== "block") {
        combo = 0;
        shakeScreen();
        obstacles.splice(i, 1);
      }
    } else if (dist(playerX, playerY, obstacles[i].x, obstacles[i].y) < hitDist) {
      obstacles.splice(i, 1);
    }
  }
  for (let i = stations.length - 1; i >= 0; i--) {
    if (dist(playerX, playerY, stations[i].x, stations[i].y) < itemSize) {
      battery = min(battery + 30, 100);
      combo += 1;
      stations.splice(i, 1);
    }
  }
  for (let i = boosts.length - 1; i >= 0; i--) {
    if (dist(playerX, playerY, boosts[i].x, boosts[i].y) < itemSize * 0.75) {
      speed += 2;
      combo += 1;
      boosts.splice(i, 1);
      setTimeout(() => speed = max(speed - 2, 6), 3000);
    }
  }
  for (let i = superStations.length - 1; i >= 0; i--) {
    if (dist(playerX, playerY, superStations[i].x, superStations[i].y) < itemSize * 1.125) {
      battery = 100;
      shield = true;
      combo += 3;
      setTimeout(() => shield = false, 5000);
      superStations.splice(i, 1);
    }
  }
}

function shakeScreen() {
  translate(random(-5, 5), random(-5, 5));
  setTimeout(() => translate(0, 0), 100);
}

function drawUI() {
  fill(255);
  textSize(width * 0.05);
  textAlign(CENTER, TOP);
  text("EVEEVO RACE GAME", width / 2, height * 0.02);
  textSize(width * 0.035);
  textAlign(LEFT, TOP);
  text(`Score: ${score}`, width * 0.025, height * 0.08);
  text(`Combo: x${combo}`, width * 0.025, height * 0.12);
}

function saveEmailToFile(email) {
  const emailContent = `Email: ${email}\nCaptured on: ${new Date().toISOString()}\n`;
  const blob = new Blob([emailContent], { type: "text/plain;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "eveevo_email.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function keyPressed() {
  if (gameState === "gameover" && !emailSubmitted) {
    if (keyCode === BACKSPACE && emailInput.length > 0) {
      emailInput = emailInput.substring(0, emailInput.length - 1);
    } else if (keyCode === ENTER && emailInput.length > 0) {
      emailSubmitted = true;
      saveEmailToFile(emailInput);
    } else if (key.length === 1 && emailInput.length < 40) {
      emailInput += key;
    }
  }
}

function mousePressed() {
  if (gameState === "gameover") {
    let submitX = width / 2 - width * 0.05;
    let submitY = height / 2 + height * 0.075;
    if (mouseX > submitX && mouseX < submitX + width * 0.1 &&
        mouseY > submitY && mouseY < submitY + height * 0.05 &&
        emailInput.length > 0 && !emailSubmitted) {
      emailSubmitted = true;
      saveEmailToFile(emailInput);
    }
    
    let linkX = width / 2 - width * 0.1;
    let linkY = height / 2 + height * 0.28 - height * 0.02;
    if (mouseX > linkX && mouseX < linkX + width * 0.2 &&
        mouseY > linkY && mouseY < linkY + height * 0.04 &&
        !downloadClicked) {
      downloadClicked = true;
      window.open("https://www.eveevo.co.uk", "_blank");
    }
    
    // Restart Button Logic
    let restartX = width / 2 - 75;
    let restartY = height / 2 + height * 0.45 - 25;
    if (mouseX > restartX && mouseX < restartX + 150 &&
        mouseY > restartY && mouseY < restartY + 50) {
      resetGame();
      gameState = "playing";
    }
  }
}
