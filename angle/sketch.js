let video;
let poseNet;
let poses = [];

// We'll store the SRK image in this variable
let srkImg;

function preload() {
  // Replace "srk.png" with the path or URL to your Shahrukh Khan image
  srkImg = loadImage("srk.png");
}

function setup() {
  createCanvas(640, 480);

  // Create a video capture
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  // Create a new PoseNet method
  poseNet = ml5.poseNet(video, modelReady);

  // When PoseNet detects a pose, store the results
  poseNet.on("pose", function (results) {
    poses = results;
  });
}

function modelReady() {
  console.log("PoseNet model loaded");
}

function draw() {
  // Draw the webcam video
  image(video, 0, 0, width, height);

  // Draw keypoints and skeleton
  drawKeypoints();
  drawSkeleton();

  // If at least one person is detected, calculate angles and place SRK face
  if (poses.length > 0) {
    let pose = poses[0].pose; // We'll use the first detected person

    // 1) Calculate and display angles
    let angles = getAllBodyAngles(pose);
    fill(255);
    textSize(16);
    let yOffset = 20; // Starting y-position for text
    for (const angleName in angles) {
      let angleValue = angles[angleName];
      if (angleValue !== null) {
        text(`${angleName}: ${nf(angleValue, 2, 2)}°`, 10, yOffset);
        yOffset += 20;
      }
    }

    // 2) Place the SRK face onto the detected face
    placeSRKFace(pose);
  }
}

/* 
   placeSRKFace(pose):
   Finds the person's face region using keypoints (ears or eyes)
   and draws the SRK image at that location with appropriate size.
*/
function placeSRKFace(pose) {
  // Get ear positions
  let leftEar = getKeypointPosition(pose, "leftEar");
  let rightEar = getKeypointPosition(pose, "rightEar");

  // If ears aren't both confident, fallback to eyes
  if (!leftEar || !rightEar) {
    leftEar = getKeypointPosition(pose, "leftEye");
    rightEar = getKeypointPosition(pose, "rightEye");
  }

  // If we still don't have two points, bail out
  if (!leftEar || !rightEar) {
    return;
  }

  // 1) Calculate midpoint (center of face) from leftEar & rightEar
  let faceCenterX = (leftEar.x + rightEar.x) / 2;
  let faceCenterY = (leftEar.y + rightEar.y) / 2;

  // 2) Calculate distance between the two points (ear to ear or eye to eye)
  let faceWidth = dist(leftEar.x, leftEar.y, rightEar.x, rightEar.y);

  // 3) Pick a scaling factor to match the face size
  //    Increase this multiplier as needed:
  let scaleFactor = 3;  // Try 3, 4, etc.
  let desiredFaceWidth = faceWidth * scaleFactor;

  // Keep aspect ratio of SRK image
  let aspectRatio = srkImg.height / srkImg.width;
  let desiredFaceHeight = desiredFaceWidth * aspectRatio;

  // 4) Position image so its center is the face center
  let x = faceCenterX - desiredFaceWidth / 2;
  let y = faceCenterY - desiredFaceHeight / 2;

  // 5) Draw the image
  image(srkImg, x, y, desiredFaceWidth, desiredFaceHeight);
}

/* 
  getAllBodyAngles(pose):
  Returns an object with angles for elbows, shoulders, hips, and knees.
*/
function getAllBodyAngles(pose) {
  function getJointAngle(pose, partA, partB, partC) {
    let A = getKeypointPosition(pose, partA);
    let B = getKeypointPosition(pose, partB);
    let C = getKeypointPosition(pose, partC);
    if (A && B && C) {
      return getAngle(A, B, C);
    }
    return null;
  }

  return {
    // Elbows
    leftElbow:  getJointAngle(pose, "leftWrist",  "leftElbow",  "leftShoulder"),
    rightElbow: getJointAngle(pose, "rightWrist", "rightElbow", "rightShoulder"),

    // Shoulders
    leftShoulder:  getJointAngle(pose, "leftElbow",   "leftShoulder",  "leftHip"),
    rightShoulder: getJointAngle(pose, "rightElbow",  "rightShoulder", "rightHip"),

    // Hips
    leftHip:  getJointAngle(pose, "leftShoulder",  "leftHip",  "leftKnee"),
    rightHip: getJointAngle(pose, "rightShoulder", "rightHip", "rightKnee"),

    // Knees
    leftKnee:  getJointAngle(pose, "leftHip",  "leftKnee",  "leftAnkle"),
    rightKnee: getJointAngle(pose, "rightHip", "rightKnee", "rightAnkle"),
  };
}

/*
  Returns the {x, y} position of a specific keypoint (by name) 
  if it exists and has a confidence > 0.2
*/
function getKeypointPosition(pose, partName) {
  let kp = pose.keypoints.find(k => k.part === partName);
  if (kp && kp.score > 0.2) {
    return kp.position;
  }
  return null;
}

/*
  Given three points a, b, c (with b as the "vertex"), returns the angle (in degrees)
  formed at point b. 
*/
function getAngle(a, b, c) {
  let ab = { x: b.x - a.x, y: b.y - a.y }; // Vector from a to b
  let cb = { x: b.x - c.x, y: b.y - c.y }; // Vector from c to b

  let dot = ab.x * cb.x + ab.y * cb.y;    // dot product
  let magAB = sqrt(ab.x * ab.x + ab.y * ab.y);
  let magCB = sqrt(cb.x * cb.x + cb.y * cb.y);

  if (magAB === 0 || magCB === 0) return 0;

  let cosAngle = dot / (magAB * magCB);

  // Clamp cosAngle to [-1, 1] to avoid floating-point errors
  cosAngle = max(-1, min(1, cosAngle));

  // Convert from radians to degrees
  let angle = acos(cosAngle) * (180 / PI);
  return angle;
}

// Draw ellipses at each keypoint
function drawKeypoints() {
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];
      if (keypoint.score > 0.2) {
        fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }
}

// Draw the skeleton (green lines connecting keypoints)
function drawSkeleton() {
  for (let i = 0; i < poses.length; i++) {
    let skeleton = poses[i].skeleton;
    for (let j = 0; j < skeleton.length; j++) {
      let partA = skeleton[j][0];
      let partB = skeleton[j][1];
      stroke(0, 255, 0);
      line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
    }
  }
}
