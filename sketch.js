let video;
let bodyPose;
let poses = [];
let connections;
let cnv;

// background stars
let bgStars = [];

// random constellation words
let words = ["龙", "虎", "凤", "月", "山", "河", "风", "火", "光", "梦"];
let bodyWords = {}; // store random word per body

function preload() {
  bodyPose = ml5.bodyPose({ flipped: true });
}

function setup() {
  cnv = createCanvas(640, 480);
  let cx = (windowWidth - cnv.width) / 2;
  let cy = (windowHeight - cnv.height) / 2;
  cnv.position(cx, cy);

  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();

  bodyPose.detectStart(video, gotPoses);
  connections = bodyPose.getSkeleton();

  // background stars
  for (let i = 0; i < 200; i++) {
    bgStars.push({
      x: random(width),
      y: random(height),
      r: random(1, 2),
      twinkle: random(TWO_PI),
    });
  }
}

function gotPoses(results) {
  poses = results;

  // assign random word if new body appears
  for (let i = 0; i < poses.length; i++) {
    let id = poses[i].id; // unique body id from ml5
    if (!bodyWords[id]) {
      bodyWords[id] = random(words);
    }
  }

  // remove old bodies
  for (let id in bodyWords) {
    let stillThere = poses.some((p) => p.id === id);
    if (!stillThere) delete bodyWords[id];
  }
}

function draw() {
  // night sky effect
  background(0, 40);

  // faint video overlay
  tint(255, 30);
  image(video, 0, 0, width, height);
  noTint();

  // draw background stars
  noStroke();
  for (let s of bgStars) {
    let alpha = 150 + 105 * sin(frameCount * 0.02 + s.twinkle);
    fill(255, alpha);
    ellipse(s.x, s.y, s.r, s.r);
  }

  // draw each pose as constellation
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i];
    let keypoints = pose.keypoints;

    // --- constellation stars (with ripples)
    for (let k of keypoints) {
      if (k.confidence > 0.1) {
        // big pulsing core
        let pulse = 12 + 8 * sin(frameCount * 0.05 + k.x * 0.01);
        fill(200, 220, 255, 240);
        noStroke();
        ellipse(k.x, k.y, pulse, pulse);

        // ripple rings
        noFill();
        stroke(200, 220, 255, 120);
        strokeWeight(1);

        // make several rings expanding outward
        for (let r = 0; r < 3; r++) {
          let t = (frameCount * 2 + r * 40) % 200; // cycle
          let radius = pulse + t * 0.4;
          let alpha = map(200 - t, 0, 200, 0, 150); // fade
          stroke(200, 220, 255, alpha);
          ellipse(k.x, k.y, radius, radius);
        }
      }
    }

    // --- skeleton constellation lines
    stroke(180, 200, 255, 150);
    strokeWeight(1.5);
    for (let j = 0; j < connections.length; j++) {
      let a = keypoints[connections[j][0]];
      let b = keypoints[connections[j][1]];
      if (a.confidence > 0.1 && b.confidence > 0.1) {
        line(a.x, a.y, b.x, b.y);
      }
    }

    // --- extra random constellation lines
    for (let n = 0; n < 3; n++) {
      let a = random(keypoints);
      let b = random(keypoints);
      if (a.confidence > 0.1 && b.confidence > 0.1) {
        stroke(255, 255, 200, 170);
        line(a.x, a.y, b.x, b.y);
      }
    }

    // --- constellation labels
    let nose = keypoints.find((k) => k.name === "nose");
    if (nose && nose.confidence > 0.1) {
      fill(255);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(24);
      text("星座", nose.x, nose.y - 60);

      // each body has its unique word
      let word = bodyWords[pose.id] || "梦";
      textSize(20);
      text(word, nose.x, nose.y - 90);
    }
  }
}
