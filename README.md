# 🕺 SRK PoseNet Overlay & Body Angle Detection

This project uses **PoseNet** from `ml5.js` to detect human poses from a webcam in real-time, calculate key **body joint angles**, and overlay an image of **Shahrukh Khan (SRK)** onto the user's face like an AR filter.

> 📸 Works entirely in the browser with webcam access!

---

## 🚀 Features

- 📷 Real-time pose detection via webcam  
- 🔢 Calculates angles at key joints: elbows, shoulders, hips, knees  
- 🎭 Overlays a Shahrukh Khan face image over the user's face  
- 🧠 Uses PoseNet via `ml5.js` and p5.js for rendering  
- ✅ Clean UI with body keypoints and skeleton visualized  

---

## 🛠 Technologies Used

- [p5.js](https://p5js.org/) – Canvas rendering & webcam access  
- [ml5.js](https://ml5js.org/) – Easy-to-use ML library (PoseNet)  
- JavaScript (ES6+)  

---

## 📂 Folder Structure
```
project-folder/
├── index.html
├── sketch.js
├── srk.png # Transparent image of Shahrukh Khan's face
└── README.md
