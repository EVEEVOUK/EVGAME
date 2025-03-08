// Declare Supabase client globally
let supabaseClient;

function initializeSupabase() {
  if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient('https://bvnanmbydwwqoymejrmu.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2bmFubWJ5ZHd3cW95bWVqcm11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE0MzA2NzMsImV4cCI6MjA1NzAwNjY3M30.PZy4BxAXawcXWbY2BKeCYiihmdFi3B2lIDcWofExRT4');
  } else {
    console.error("Supabase library not loaded yet. Retrying...");
    setTimeout(initializeSupabase, 100); // Retry after 100ms
  }
}

// Initialize global variables
let playerX, playerY;
let obstacles = [];
let stations = [];
let boosts = [];
let superStations = [];
let battery = 100;
let speed = 6;
let score = 0;
let combo = 0;
let gameState = "start";
let highScore = 0;
let roadOffset = 0;
let shield = false;
let evColor = [0, 200, 0];
let slipTimer = 0;

let emailInput = "";
let emailSubmitted = false;
let downloadClicked = false;
let user = null; // Store authenticated user
let leaderboard = []; // Store leaderboard data

function setup() {
  let canvasWidth = min(windowWidth, 800);
  let canvasHeight = min(windowHeight, 1200);
  createCanvas(canvasWidth, canvasHeight);
  frameRate(60); // Ensure consistent frame rate
  initializeSupabase();
  resetGame();
  checkUser(); // Check if user is already logged in
}

async function checkUser() {
  if (!supabaseClient) return;
  const { data: { user: currentUser } } = await supabaseClient.auth.getUser();
  user = currentUser;
  if (user) {
    await fetchHighScore();
    await fetchLeaderboard();
  }
}

async function fetchHighScore() {
  if (!user) return;
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('high_score')
    .eq('id', user.id)
    .single();
  if (error) console.error("Error fetching high score:", error);
  else highScore = data?.high_score || 0;
}

async function fetchLeaderboard() {
  const { data, error } = await supabaseClient
    .from('profiles')
    .select('email, high_score')
    .order('high_score', { ascending: false })
    .limit(5); // Top 5 scores
  if (error) console.error("Error fetching leaderboard:", error);
  else leaderboard = data || [];
}

function windowResized() {
  let canvasWidth = min(windowWidth, 800);
  let canvasHeight = min(windowHeight, 1200);
  resizeCanvas(canvasWidth, canvasHeight);
}

function draw() {
  background(50);
  if (gameState === "start") drawStartScreen();
  else if (gameState === "playing") playGame();
  else if (gameState === "gameover") drawGameOverScreen();
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

function drawStartScreen() {
  fill(255);
  textSize(width * 0.06);
  textAlign(CENTER, CENTER);
  text("EVEEVO RACE GAME", width / 2, height / 2 - height * 0.1);
  textSize(width * 0.04);
  text("Press 'Start' (S) to Begin", width / 2, height / 2 + height * 0.05);
  text("Dodge obstacles, overtake ICE cars, and charge your EV!", width / 2, height / 2 + height * 0.15);
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

  if (!user && !emailSubmitted) {
    textSize(width * 0.035);
    fill(200);
    rect(width / 2 - width * 0.15, height / 2 - height * 0.025, width * 0.3, height * 0.05);
    fill(255);
    text("Enter your email to join:", width / 2, height / 2 - height * 0.08);
    text(emailInput + (frameCount % 60 < 30 ? "|" : ""), width / 2 - width * 0.13, height / 2 + height * 0.015);

    fill(0, 255, 0);
    rect(width / 2 - width * 0.05, height / 2 + height * 0.075, width * 0.1, height * 0.05, 5);
    fill(255);
    text("Sign Up", width / 2, height / 2 + height * 0.1);

    if (emailSubmitted) {
      fill(0, 255, 0);
      text("Signed up! Score saved.", width / 2, height / 2 + height * 0.18);
    }
  } else if (user) {
    textSize(width * 0.035);
    fill(0, 255, 0);
    text(`Logged in as: ${user.email}`, width / 2, height / 2 - height * 0.08);
    text("Score saved to leaderboard!", width / 2, height / 2 + height * 0.1);
  }

  // Leaderboard
  fill(255);
  textSize(width * 0.035);
  text("Leaderboard", width / 2, height / 2 + height * 0.18);
  for (let i = 0; i < leaderboard.length; i++) {
    let entry = leaderboard[i];
    text(`${i + 1}. ${entry.email.split('@')[0]}: ${entry.high_score}`, width / 2, height / 2 + height * (0.22 + i * 0.04));
  }

  fill(0, 191, 255);
  text("Download EVEEVO App", width / 2, height / 2 + height * 0.38);
  stroke(0, 191, 255);
  strokeWeight(1);
  line(width / 2 - width * 0.1, height / 2 + height * 0.39, width / 2 + width * 0.1, height / 2 + height * 0.39);
  noStroke();

  if (downloadClicked) {
    fill(0, 191, 255);
    text("Opening eveevo.co.uk...", width / 2, height / 2 + height * 0.45);
  }

  fill(255);
  textSize(width * 0.04);
  text("Press 'Restart' (R) to Play Again", width / 2, height / 2 + height * 0.55);
  if (score >= 2000 && score < 5000) text("Red EV Unlocked!", width / 2, height / 2 + height * 0.62);
  if (score >= 5000) text("Blue EV Unlocked!", width / 2, height / 2 + height * 0.62);
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
    submitScore();
  }
  score += 1 + combo;
}

function drawBackground() {
  fill(100);
  rect(0, 0, width, height);
  stroke(255);
  strokeWeight(2);
  roadOffset += speed * 0.02; // Smoother movement
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
  battery -= 0.01 * speed; // Adjusted for smoother gameplay
}

function spawnItems() {
  if (frameCount % 45 === 0) {
    let lane = random([width / 6, width / 2, (width * 5) / 6]);
    let r = random();
    if (r < 0.1) obstacles.push({ x: lane, y: -50, type: "roadWorkBarrier" });
    else if (r < 0.2) obstacles.push({ x: lane, y: -50, type: "trafficBarrel" });
    else if (r < 0.3) obstacles.push({ x: lane, y: -50, type: "sign" });
    else if (r < 0.4) obstacles.push({ x: lane, y: -50, type: "oil" });
    else if (r < 0.5) obstacles.push({ x: lane, y: -50, type: "block" });
    else if (r < 0.6) obstacles.push({ x: lane, y: -50, type: "iceCar", iceSpeed: random(3, 6) });
    else if (r < 0.65) obstacles.push({ x: lane, y: -50, type: "deer" });
    else if (r < 0.7) obstacles.push({ x: lane, y: -50, type: "sheep" });
    else if (r < 0.75) obstacles.push({ x: lane, y: -50, type: "cow" });
    else if (r < 0.8) obstacles.push({ x: lane, y: -50, type: "fallenTree" });
    else if (r < 0.85) obstacles.push({ x: lane, y: -50, type: "debris" });
    else if (r < 0.9) stations.push({ x: lane, y: -50 });
    else if (r < 0.96) boosts.push({ x: lane, y: -50 });
    else superStations.push({ x: lane, y: -50 });
  }
}

function updateItems() {
  let itemSize = width * 0.1;
  for (let i = obstacles.length - 1; i >= 0; i--) {
    if (obstacles[i].type === "iceCar") {
      obstacles[i].y += obstacles[i].iceSpeed * 0.02;
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
        ellipse(smokeX, smokeY, itemSize / 3, itemSize / 3);
      }
      if (obstacles[i].y > height + itemSize) obstacles.splice(i, 1);
    } else {
      obstacles[i].y += speed * 0.02;
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
    stations[i].y += speed * 0.02;
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
    boosts[i].y += speed * 0.02;
    fill(0, 0, 255);
    ellipse(boosts[i].x, boosts[i].y, itemSize * 0.6, itemSize * 0.6);
    fill(255);
    textSize(width * 0.03);
    text("S", boosts[i].x - itemSize / 8, boosts[i].y + itemSize / 8);
    if (boosts[i].y > height) boosts.splice(i, 1);
  }

  for (let i = superStations.length - 1; i >= 0; i--) {
    superStations[i].y += speed * 0.02;
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
      if (obstacles[i] && obstacles[i].type !== "iceCar" && obstacles[i].type !== "block") {
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

async function submitScore() {
  if (!supabaseClient || !user) return;
  const { error } = await supabaseClient
    .from('profiles')
    .upsert({ id: user.id, high_score: max(score, highScore), email: user.email });
  if (error) console.error("Error submitting score:", error);
  await fetchLeaderboard(); // Refresh leaderboard
}

async function signUp() {
  if (!supabaseClient || !emailInput) return;
  const { data, error } = await supabaseClient.auth.signUp({
    email: emailInput,
    password: 'defaultpassword123' // Consider a more secure approach in production
  });
  if (error) {
    console.error("Signup error:", error.message);
  } else {
    user = data.user;
    emailSubmitted = true;
    await submitScore();
    await checkUser();
  }
}

function keyPressed() {
  if (key === "s" && gameState === "start") gameState = "playing";
  if (key === "r" && gameState === "gameover") {
    resetGame();
    gameState = "playing";
  }
  if (gameState === "gameover" && !user && !emailSubmitted) {
    if (keyCode === BACKSPACE && emailInput.length > 0) {
      emailInput = emailInput.substring(0, emailInput.length - 1);
    } else if (keyCode === ENTER && emailInput.length > 0) {
      signUp();
    } else if (key.length === 1 && emailInput.length < 40) {
      emailInput += key;
    }
  }
}

function mousePressed() {
  if (gameState === "gameover") {
    let submitX = width / 2 - width * 0.05;
    let submitY = height / 2 + height * 0.075;
    if (!user && mouseX > submitX && mouseX < submitX + width * 0.1 &&
        mouseY > submitY && mouseY < submitY + height * 0.05 &&
        emailInput.length > 0 && !emailSubmitted) {
      signUp();
    }

    let linkX = width / 2 - width * 0.1;
    let linkY = height / 2 + height * 0.38 - height * 0.02;
    if (mouseX > linkX && mouseX < linkX + width * 0.2 &&
        mouseY > linkY && mouseY < linkY + height * 0.04 &&
        !downloadClicked) {
      downloadClicked = true;
      window.open("https://www.eveevo.co.uk", "_blank");
    }
  }
}
