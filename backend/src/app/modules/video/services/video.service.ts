import { Service } from 'typedi';
const fs = require('fs');
const path = require('path');
import { ObjectId } from 'bson';
import { AnyObject, Condition } from 'mongoose';
// const cv = require('opencv.js');
// const jpeg = require('jpeg');
// let v4l2camera = require('v4l2camera');
var NodeWebcam = require('node-webcam');
// import { Peer } from "peerjs";
import { Injectable } from '@nestjs/common';

@Injectable()
@Service()
export class VideoService {

  opts = {
    //Picture related
    width: 1280,
    height: 720,
    quality: 100,
    // Number of frames to capture
    // More the frames, longer it takes to capture
    // Use higher framerate for quality. Ex: 60
    frames: 60,
    //Delay in seconds to take shot
    //if the platform supports miliseconds
    //use a float (0.1)
    //Currently only on windows
    delay: 0,
    //Save shots in memory
    saveShots: true,
    // [jpeg, png] support varies
    // Webcam.OutputTypes
    output: 'jpeg',
    //Which camera to use
    //Use Webcam.list() for results
    //false for default device
    device: false,
    // [location, buffer, base64]
    // Webcam.CallbackReturnTypes
    callbackReturn: 'location',
    //Logging
    verbose: false,
  };

  collecitonName = 'video-interview';

  constructor() {
    //const peer = new Peer("pick-an-id");
    // const conn = peer.connect("another-peers-id");
    //       conn.on("open", () => {
    //         conn.send("hi!");
    //       });
  }

  videoRecord() {
    //Creates webcam instance
    var Webcam = NodeWebcam.create(this.opts);
    //Will automatically append location output type
    Webcam.capture('test_picture', function (err, data) { });
    //Also available for quick use
    NodeWebcam.capture('test_picture', this.opts, function (err, data) { });

    //Get list of cameras
    Webcam.list(function (list) {
      //Use another device
      var anotherCam = NodeWebcam.create({ device: list[0] });
    });
    //Return type with base 64 image
    var opts = {
      callbackReturn: 'base64',
    };
    NodeWebcam.capture('test_picture', opts, function (err, data) {
      var image = "<img src='" + data + "'>";
    });
  }

  videoFaceRecognition(): any {
    // Loading classifier with the frontal face model
    // cv.FS_createLazyFile(
    //   '/',
    //   'haarcascade_frontalface_default.xml',
    //   'haarcascade_frontalface_default.xml',
    //   true,
    //   false
    // );

    // let faceClassifier = new cv.CascadeClassifier();
    // faceClassifier.load('haarcascade_frontalface_default.xml');

    // Start the camera
    // let cam = new v4l2camera.Camera('/dev/video0');
    // if (cam.configGet().formatName !== 'YUYV') {
    //    // console.log('YUYV camera required');
    //   process.exit(1);
    // }

    // Configure and start the camera
    //cam.configSet({ width: 320, height: 240 });
    //let format = cam.configGet();
    //  // console.log(
    //   'Camera config [ ' +
    //     format.formatName +
    //     ' ' +
    //     format.width +
    //     'x' +
    //     format.height +
    //     ' ' +
    //     format.interval.numerator +
    //     '/' +
    //     format.interval.denominator +
    //     ']'
    // );
    // cam.start();

    let yuvMat = null;
    let rgbMat = null;
    let grayMat = null;

    let stopped = false;
    let frameIndex = 0;

    // cam.capture(function detectFace(success) {
    //   let frame = cam.frameRaw();
    //   let videoHeight = cam.height;
    //   let videoWidth = cam.width;
    //   if (!yuvMat) yuvMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC2);
    //   yuvMat.data.set(frame);
    //   if (!rgbMat) rgbMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC4);
    //   cv.cvtColor(yuvMat, rgbMat, cv.COLOR_YUV2RGBA_YUYV);
    //   if (!grayMat) grayMat = new cv.Mat(videoHeight, videoWidth, cv.CV_8UC1);
    //   cv.cvtColor(rgbMat, grayMat, cv.COLOR_RGBA2GRAY);

    //   let faces = [];
    //   let eyes = [];
    //   let size;
    //   let faceVect = new cv.RectVector();
    //   let faceMat = new cv.Mat();

    //   // Scale down the input frame
    //   cv.pyrDown(grayMat, faceMat);
    //   if (videoWidth > 320) cv.pyrDown(faceMat, faceMat);
    //   size = faceMat.size();

    //   // Processing the frame to find faces
    //   faceClassifier.detectMultiScale(faceMat, faceVect);

    //   // Draw rectangle around faces
    //   for (let i = 0; i < faceVect.size(); i++) {
    //     let xRatio = videoWidth / size.width;
    //     let yRatio = videoHeight / size.height;
    //     let face = faceVect.get(i);
    //     let x = face.x * xRatio;
    //     let y = face.y * yRatio;
    //     let w = face.width * xRatio;
    //     let h = face.height * yRatio;
    //     let point1 = new cv.Point(x, y);
    //     let point2 = new cv.Point(x + w, y + h);
    //     cv.rectangle(rgbMat, point1, point2, [255, 0, 0, 255]);
    //      // console.log(
    //       '\tFace detected : ' +
    //         '[' +
    //         i +
    //         ']' +
    //         ' (' +
    //         x +
    //         ', ' +
    //         y +
    //         ', ' +
    //         w +
    //         ', ' +
    //         h +
    //         ')'
    //     );
    //   }

    // Free the memory used by vectors
    // faceMat.delete();
    // faceVect.delete();

    // if (stopped) {
    //   cam.stop();
    //    // console.log('Stopped');
    //   let rawData = {
    //     data: rgbMat.data,
    //     width: rgbMat.size().width,
    //     height: rgbMat.size().height,
    //   };
    //  // var jpegData = jpeg.encode(rawData, 50);
    //   const filename = 'result.jpg';
    //  // fs.writeFileSync(filename, jpegData.data);
    //    // console.log('Written into ' + filename);
    //   yuvMat.delete();
    //   rgbMat.delete();
    //   grayMat.delete();
    //   process.exit();
    // }
    // cam.capture(detectFace);
    //});

    const ESC_KEY = '\u001b';
    const CTRL_C = '\u0003';
    // let stdin = process.stdin;
    // stdin.setRawMode(true);
    // stdin.resume();
    // stdin.setEncoding('utf8');
    // stdin.on('data', function (key) {
    //if (key === ESC_KEY || key === CTRL_C) {
    //stopped = true;
    //}
    //});
  }

}
