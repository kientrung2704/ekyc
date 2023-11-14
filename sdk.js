// Variables
function isiOS() {
	return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isAndroid() {
	return /Android/i.test(navigator.userAgent);
}

function isMobile() {
	return isAndroid() || isiOS();
}

let RECORD = true;
let CHECK = false;

const MOVE_CENTER = 80;
const HOLD = {
	left: 35,
	right: 35,
	bottom: 40,
};

const VIDEO_SIZE = {
	"640 X 480": { width: 640, height: 480 },
	"640 X 360": { width: 640, height: 360 },
	// "360 X 270": { width: 360, height: 270 },
	"360 X 270": { width: 400, height: 300 },
	"240 X 360": { width: 240, height: 360 },
	"360 X 480": { width: 360, height: 480 },
};
const STATE = {
	camera: { targetFPS: 60, sizeOption: "360 X 270" },
	camera_face: { targetFPS: 60, sizeOption: "360 X 480" },
	backend: "",
	flags: {},
	modelConfig: {
		boundingBox: true,
	},
};
const MEDIAPIPE_FACE_CONFIG = {
	maxFaces: 1,
	boundingBox: true,
	keypoints: true,
	modelType: "short",
};
const CAMERA_POINT = {
	small: { left: [360, 240], right: [0, 240], bottom: [180, 480] },
	big: { left: [360, 240], right: [0, 240], bottom: [180, 480] },
};

const id_card = {
	id: "Số CMND",
	name: "Họ tên",
	birthday: "Ngày sinh",
	birthplace: "Quê quán",
	sex: "Giới tính",
	address: "Nơi ĐKHKTT",
	province: "Tên tỉnh",
	district: "Tên huyện",
	ward: "Tên phường xã",
	province_code: "Mã tỉnh",
	district_code: "Mã huyện",
	ward_code: "Mã phường xã",
	street: "Mã đường",
	nationality: "Tên quốc gia",
	religion: "Tôn giáo",
	ethnicity: "Dân tộc",
	expiry: "Ngày hết hạn",
	issue_date: "Ngày phát hành",
	issue_by: "Nơi cấp",
	licence_class: "Hạng bằng lái xe",
	passport_id: "Số hộ chiếu",
	passport_type: "Loại hộ chiếu",
	military_title: "Quân hàm",
	type_blood: "Nhóm máu",
	type: "Loại giấy tờ ",
};
// ctx.arc(0, 240, 30 /* radius */, 0, 2 * Math.PI);
// ctx.arc(360, 240, 30 /* radius */, 0, 2 * Math.PI);
// ctx.arc(180, 480, 30 /* radius */, 0, 2 * Math.PI);
let animation;
let front_img = null;
let front_img1 = null;
let end_img1 = null;
let end_img = null;
let face1 = null;
let faceImage = null;
let face2 = null;
let step = 1;
let detector, camera, stats;
let startInferenceTime,
	numInferences = 0;
let inferenceTimeSum = 0,
	lastPanelUpdate = 0;
let rafId;
let ocr = null;
const token = "f4669d95f7b58427058fc158391e93da";

// Element
const NOTIFY = document.getElementById("notify");
const loading = document.getElementById("loading-overlay");

// Camera
function drawPath(ctx, points, closePath) {
	const region = new Path2D();
	region.moveTo(points[0][0], points[0][1]);
	for (let i = 1; i < points.length; i++) {
		const point = points[i];
		region.lineTo(point[0], point[1]);
	}

	if (closePath) {
		region.closePath();
	}
	ctx.stroke(region);
}

async function createDetector() {
	const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
	const detectorConfig = {
		runtime: "mediapipe",
		solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/face_detection",
		// or 'base/node_modules/@mediapipe/face_detection' in npm.
	};
	detector = await faceDetection.createDetector(model, detectorConfig);
	return detector;
}

function drawResults(ctx, faces, boundingBox, showKeypoints) {
	faces.forEach(async (face) => {
		const box = face.box;
		if (CHECK) {
			// if (!boundingBox) {
			//   ctx.strokeStyle = "#FF2C35";
			//   ctx.lineWidth = 1;

			//   const box = face.box;
			//   drawPath(
			//     ctx,
			//     [
			//       [box.xMin, box.yMin],
			//       [box.xMax, box.yMin],
			//       [box.xMax, box.yMax],
			//       [box.xMin, box.yMax],
			//     ],
			//     true
			//   );
			// }
			let rightPoint = [face.keypoints[4].x, face.keypoints[4].y];
			let leftPoint = [face.keypoints[5].x, face.keypoints[5].y];
			let bottomPoint = mid_point([box.xMax, box.yMax], [box.xMin, box.yMax]);

			let distanceRight = distance(rightPoint, CAMERA_POINT.small.right);
			let distanceLeft = distance(leftPoint, CAMERA_POINT.small.left);
			let distanceBottom = distance(bottomPoint, CAMERA_POINT.small.bottom);
			console.log(distanceRight, distanceLeft, distanceBottom);
			ctx.beginPath();
			ctx.arc(0, 240, 30 /* radius */, 0, 2 * Math.PI);
			// ctx.arc(360, 240, 30 /* radius */, 0, 2 * Math.PI);
			ctx.arc(180, 480, 30 /* radius */, 0, 2 * Math.PI);
			ctx.fill();
			if (step === 3) {
				if (distanceRight <= 75 && distanceLeft <= 75 && distanceBottom <= 90) {
					CHECK = false;
					changeNotify(true, "Giữ cố định");
					const oval = document.getElementById("oval");
					canvas = document.getElementById("img-output");

					var context = canvas.getContext("2d");

					canvas.width = 1280;
					canvas.height = 960;
					context.drawImage(video, 0, 0, 1280, 960);
					var data = canvas.toDataURL("image/png");
					const blobUrl = b64toBlob(data);
					// camera = await Camera.setupCamera(STATE.camera_face, true);

					face1 = blobUrl;
					faceImage = data;

					if (init.FACE_LIVENESS && !CHECK) {
						const loading = document.getElementById("loading-overlay");
						loading.classList.remove("ekyc_d-none");
						const livenessFace = await faceLiveness(face1);

						loading.classList.add("ekyc_d-none");
						if (livenessFace.code === 1) {
							oval.classList.remove("canvas-small");
							oval.classList.add("canvas-big");
							changeNotify(false, "Di chuyển gần hơn");
							setTimeout(function () {
								step = 4;
								CHECK = true;
							}, 2000);
						}
					} else {
						setTimeout(function () {
							changeNotify(true, "");
							step = 4;
							oval.classList.remove("canvas-small");
							oval.classList.add("canvas-big");
							CHECK = true;
						}, 2500);
					}
				} else if (
					distanceRight >= 170 ||
					distanceLeft >= 170 ||
					distanceBottom >= 170
				) {
					changeNotify(false, "Đưa mặt vào giữa khung hình");
				} else if (
					(distanceRight > 75 && distanceRight < 170) ||
					(distanceLeft > 75 && distanceLeft < 170) ||
					(distanceBottom > 90 && distanceBottom < 170)
				) {
					changeNotify(false, "Di chuyển gần hơn");
				}
			}

			if (step === 4) {
				if (
					distanceRight <= HOLD.right &&
					distanceLeft <= HOLD.left &&
					distanceBottom <= HOLD.bottom
				) {
					CHECK = false;
					changeNotify(true, "Giữ cố định");
					setTimeout(async function () {
						var context = canvas.getContext("2d");
						// Facematching
						// formData.append('ref_score ', front_img)
						// CHECK = false;
						context.drawImage(video, 0, 0, 1280, 960);
						var data = canvas.toDataURL("image/png");
						const blobUrl2 = b64toBlob(data);
						face2 = blobUrl2;
						if (init.FACE_MATCHING) {
							loading.classList.remove("ekyc_d-none");

							const matching = await faceMatching(front_img, face1);
							loading.classList.add("ekyc_d-none");
							document.getElementsByClassName(
								"guide-img__header"
							)[0].innerHTML = "Kết quả";
							document
								.getElementById("results")
								.classList.remove("ekyc_d-none");
							document
								.getElementById("result_front")
								.setAttribute("src", front_img1);
							document
								.getElementById("result_back")
								.setAttribute("src", end_img1);
							document
								.getElementById("result_face")
								.setAttribute("src", faceImage);
							document.getElementById("result_matching").innerHTML =
								Math.floor(matching.score * 100) + "%";
							document
								.getElementsByClassName("front")[0]
								.classList.add("ekyc_d-none");

							let parent = document.getElementById("results");
							let div = "";
							div += "<div class='result-details'>";
							for (const [key, value] of Object.entries(ocr)) {
								id_card;
								div += "<p class='result-detail'>";
								div += `<span>${id_card[key]}</span>`;
								div += `<span>${value ? value : ""}</span>`;
								div += "</p>";
							}
							div += "</div>";

							parent.insertAdjacentHTML("beforeend", div);
							document.getElementsByClassName("result-details")[1]?.remove();
							let btn = '<div class="take-wapper" id="redo">';
							btn +=
								'<div class="redo-btn demo-btn" id="redoDemo">Làm lại</div>';
							btn += "</div>";
							parent.insertAdjacentHTML("beforeend", btn);
							document.querySelectorAll("[id=redo]")[1]?.remove();
							document
								.getElementById("redoDemo")
								.addEventListener("click", async function () {
									location.reload();
								});
						}
					}, 1000);
				} else if (
					distanceRight >= MOVE_CENTER ||
					distanceLeft >= MOVE_CENTER ||
					distanceBottom >= MOVE_CENTER
				) {
					changeNotify(false, "Đưa mặt vào giữa khung hình");
				} else if (
					(distanceRight > HOLD.right && distanceRight < MOVE_CENTER) ||
					(distanceLeft > HOLD.left && distanceLeft < MOVE_CENTER) ||
					(distanceBottom > HOLD.bottom && distanceBottom < MOVE_CENTER)
				) {
					changeNotify(false, "Di chuyển gần hơn");
				}
			}
			// if (
			//   distanceRight >= 10 &&
			//   distanceRight <= HOLD.right &&
			//   distanceLeft >= 10 &&
			//   distanceLeft <= HOLD.left &&
			//   distanceBottom >= 15 &&
			//   distanceBottom <= HOLD.bottom
			// )
			// if (
			//   distanceRight <= HOLD.right &&
			//   distanceLeft <= HOLD.left &&
			//   distanceBottom <= HOLD.bottom
			// ) {
			//   // console.log("Giữ Nguyên");
			//   changeNotify(true, "Giữ cố định");
			//   const oval = document.getElementById("oval");
			//   canvas = document.getElementById("output");
			//   CHECK = false;
			//   if (step === 3) {
			//     var context = canvas.getContext("2d");

			//     canvas.width = 1280;
			//     canvas.height = 960;
			//     context.drawImage(video, 0, 0, 1280, 960);
			//     var data = canvas.toDataURL("image/png");
			//     const blobUrl = b64toBlob(data);
			//     camera = await Camera.setupCamera(STATE.camera_face, true);

			//     face1 = blobUrl;
			//     faceImage = data;

			//     if (init.FACE_LIVENESS && !CHECK) {
			//       const loading = document.getElementById("loading-overlay");
			//       loading.classList.remove("ekyc_d-none");
			//       const livenessFace = await faceLiveness(face1);

			//       loading.classList.add("ekyc_d-none");
			//       if (livenessFace.code === 1) {
			//         oval.classList.remove("canvas-small");
			//         oval.classList.add("canvas-big");
			//         canvas.classList.remove("small-oval");
			//         canvas.classList.add("big-oval");
			//         setTimeout(function () {
			//           changeNotify(true, "");
			//           CHECK = true;
			//           step = 4;
			//         }, 2500);
			//       } else {
			//         changeNotify(false, livenessFace.message);
			//         setTimeout(function () {
			//           changeNotify(true, "");
			//           step = 4;
			//           CHECK = true;
			//         }, 2500);
			//       }
			//     } else {
			//       setTimeout(function () {
			//         changeNotify(true, "");
			//         step = 4;
			//         canvas.classList.remove("small-oval");
			//         canvas.classList.add("big-oval");
			//         CHECK = true;
			//       }, 2500);
			//     }
			//   }

			//   if (step === 4) {
			//     var context = canvas.getContext("2d");
			//     // Facematching
			//     // formData.append('ref_score  ', front_img)
			//     // CHECK = false;
			//     context.drawImage(video, 0, 0, 1280, 960);
			//     var data = canvas.toDataURL("image/png");
			//     const blobUrl2 = b64toBlob(data);
			//     face2 = blobUrl2;
			//     if (init.FACE_MATCHING) {
			//       setTimeout(async function () {
			//         loading.classList.remove("ekyc_d-none");

			//         const matching = await faceMatching(front_img, face1);
			//         loading.classList.add("ekyc_d-none");
			//         document.getElementsByClassName(
			//           "guide-img__header"
			//         )[0].innerHTML = "Kết quả";
			//         document
			//           .getElementById("results")
			//           .classList.remove("ekyc_d-none");
			//         document
			//           .getElementById("result_front")
			//           .setAttribute("src", front_img1);
			//         document
			//           .getElementById("result_back")
			//           .setAttribute("src", end_img1);
			//         document
			//           .getElementById("result_face")
			//           .setAttribute("src", faceImage);
			//         document.getElementById("result_matching").innerHTML =
			//           Math.floor(matching.score * 100) + "%";
			//         document
			//           .getElementsByClassName("front")[0]
			//           .classList.add("ekyc_d-none");

			//         let parent = document.getElementById("results");
			//         let div = "";
			//         div += "<div class='result-details'>";
			//         for (const [key, value] of Object.entries(ocr)) {
			//           id_card;
			//           div += "<p class='result-detail'>";
			//           div += `<span>${id_card[key]}</span>`;
			//           div += `<span>${value ? value : ""}</span>`;
			//           div += "</p>";
			//         }
			//         div += "</div>";

			//         parent.insertAdjacentHTML("beforeend", div);
			//         document.getElementsByClassName("result-details")[1]?.remove();
			//         let btn = '<div class="take-wapper" id="redo">';
			//         btn +=
			//           '<div class="redo-btn demo-btn" id="redoDemo">Làm lại</div>';
			//         btn += "</div>";
			//         parent.insertAdjacentHTML("beforeend", btn);
			//         document.querySelectorAll("[id=redo]")[1]?.remove();
			//         document
			//           .getElementById("redoDemo")
			//           .addEventListener("click", async function () {
			//             location.reload();
			//             // step = 1;
			//             // var checkboxs = document.querySelectorAll(".inp-cbx");
			//             // checkboxs.forEach(function (cb) {
			//             //   cb.checked = false;
			//             // });
			//             // front_img = null;
			//             // front_img1 = null;
			//             // end_img1 = null;
			//             // end_img = null;
			//             // face1 = null;
			//             // faceImage = null;
			//             // face2 = null;
			//             // numInferences = 0;
			//             // inferenceTimeSum = 0;
			//             // lastPanelUpdate = 0;
			//             // ocr = null;

			//             // document
			//             //   .getElementById("step1-demo-ekyc")
			//             //   .classList.add("ekyc_d-none");
			//             // document
			//             //   .getElementById("home-demo-ekyc")
			//             //   .classList.remove("ekyc_d-none");
			//             // document
			//             //   .getElementsByClassName("guide-main")[0]
			//             //   .classList.remove("ekyc_d-none");
			//             // document.getElementsByClassName(
			//             //   "guide-img__header"
			//             // )[0].innerHTML = "Hướng dẫn chụp ảnh giấy tờ tùy thân";
			//             // document
			//             //   .getElementById("results")
			//             //   .classList.add("ekyc_d-none");
			//             // resetHidden();
			//           });
			//       }, 2500);
			//     }
			//   }
			// } else if (
			//   distanceRight >= MOVE_CENTER ||
			//   distanceLeft >= MOVE_CENTER ||
			//   distanceBottom >= MOVE_CENTER
			// ) {
			//   changeNotify(false, "Đưa mặt vào giữa khung hình");
			// } else if (
			//   (distanceRight > HOLD.right && distanceRight < MOVE_CENTER) ||
			//   (distanceLeft > HOLD.left && distanceLeft < MOVE_CENTER) ||
			//   (distanceBottom > HOLD.bottom && distanceBottom < MOVE_CENTER)
			// ) {
			//   changeNotify(false, "Di chuyển gần hơn");
			// }
			// else {
			//   changeNotify(false, "Di chuyển xa hơn");
			// }
		}

		// console.log("Right: ", distanceRight);
		// console.log("Left: ", distanceLeft);
		// console.log("Bottom: ", distanceBottom);
		// let keypoints = [
		//   [face.keypoints[4].x, face.keypoints[4].y],
		//   // [box.xMin, box.yMin],
		//   // [box.xMax, box.yMin],
		//   [face.keypoints[5].x, face.keypoints[5].y],
		//   [0, 0],
		//   // [box.xMax, box.yMax],
		//   // [box.xMin, box.yMax],
		// ];
		// // if (showKeypoints) {
		// ctx.fillStyle = "#FF2C35";

		// keypoints.push(mid_point([box.xMax, box.yMax], [box.xMin, box.yMax]));
		// const areas = area(keypoints[0], keypoints[1], keypoints[2]);
		// const tri = 0.5 * (216 * 144);
		// console.log("AREA: ", areas);
		// console.log("TRI: ", tri);

		// if (areas < 18000) {
		//   console.log("Gần hơn");
		// } else if (areas > tri) {
		//   console.log("Xa 1 chút");
		// } else if (areas >= 18000 && areas <= tri) {
		//   console.log("Giữ Nguyên");
		// }
		// for (let i = 0; i < 4; i++) {
		//   const x = keypoints[i][0];
		//   const y = keypoints[i][1];

		//   ctx.beginPath();
		//   ctx.arc(x, y, 3 /* radius */, 0, 2 * Math.PI);
		//   ctx.fill();
		// }
		// let distanceRight = distance(keypoints[0], [0, 180]);
		// let distanceLeft = distance(keypoints[1], [240, 180]);
		// let distanceBottom = distance(
		//   mid_point([box.xMax, box.yMax], [box.xMin, box.yMax])
		// );

		// console.log("Right: ", distanceRight);
		// console.log("Left: ", distanceLeft);
		// console.log("Bottom: ", distanceBottom);

		// if (distanceRight <= 25 && distanceLeft <= 25 && distanceBottom <= 375) {
		//   console.log("Giữ Nguyên");
		// } else if () {

		// }

		// }
	});
	// ctx.beginPath();
	// ctx.arc(0, 240, 30 /* radius */, 0, 2 * Math.PI);
	// // ctx.arc(360, 240, 30 /* radius */, 0, 2 * Math.PI);
	// ctx.arc(180, 480, 30 /* radius */, 0, 2 * Math.PI);
	// ctx.fill();
}

function changeNotify(type, text) {
	if (type) {
		NOTIFY.classList.add("success-noti");
		NOTIFY.classList.add("error-noti");
	} else {
		NOTIFY.classList.remove("success-noti");
		NOTIFY.classList.add("error-noti");
	}
	NOTIFY.innerHTML = text;
}

function mid_point([x1, y1], [x2, y2]) {
	return [(x1 + x2) / 2, (y1 + y2) / 2];
}

function area([x1, y1], [x2, y2], [x3, y3]) {
	return (
		0.5 * Math.abs(x1 * y2 + x2 * y3 + x3 * y1 - (y1 * x2 + y2 * x3 + y3 * x1))
	);
}

function distance([x1, y1], [x2, y2]) {
	var a = x1 - x2;
	var b = y1 - y2;

	return Math.sqrt(a * a + b * b);
}

class Camera {
	constructor() {
		this.video = document.getElementById("video");
		this.canvas = document.getElementById("output");
		this.ctx = this.canvas.getContext("2d");
	}

	/**
	 * Initiate a Camera instance and wait for the camera stream to be ready.
	 * @param cameraParam From app `STATE.camera`.
	 */
	static async setupCamera(cameraParam, isZoom) {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			throw new Error(
				"Browser API navigator.mediaDevices.getUserMedia not available"
			);
		}

		const { targetFPS, sizeOption } = cameraParam;
		const $size = VIDEO_SIZE[sizeOption];
		const videoConfig = {
			audio: false,
			video: {
				facingMode: "user",
				// Only setting the video to a specified size for large screen, on
				// mobile devices accept the default size.
				width: isMobile() ? VIDEO_SIZE["360 X 270"].width : $size.width,
				height: isMobile() ? VIDEO_SIZE["360 X 270"].height : $size.height,
				frameRate: {
					ideal: targetFPS,
				},
				zoom: true,
			},
		};

		const stream = await navigator.mediaDevices.getUserMedia(videoConfig);

		const camera = new Camera();
		camera.video.srcObject = stream;
		// const [track] = stream.getVideoTracks();
		// const capabilities = track.getCapabilities();
		// const settings = track.getSettings();
		// console.log(settings, capabilities);
		// if (!isZoom && step === 3) {
		//   track.applyConstraints({ advanced: [{ zoom: 250 }] });
		// } else {
		//   track.applyConstraints({ advanced: [{ zoom: 100 }] });
		// }

		await new Promise((resolve) => {
			camera.video.onloadedmetadata = () => {
				resolve(video);
			};
		});

		camera.video.play();

		const videoWidth = camera.video.videoWidth;
		const videoHeight = camera.video.videoHeight;
		console.log(videoWidth, videoHeight);
		// Must set below two lines, otherwise video element doesn't show.
		camera.video.width = videoWidth;
		camera.video.height = videoHeight;

		camera.canvas.width = videoWidth;
		camera.canvas.height = videoHeight;
		// const canvasContainer = document.querySelector(".canvas-wrapper");
		// canvasContainer.style = `width: ${videoWidth}px; height: ${videoHeight}px; border-radius: 50%`;

		// Because the image from camera is mirrored, need to flip horizontally.
		// camera.ctx.globalCompositeOperation = "destination-over";
		camera.ctx.translate(camera.video.videoWidth, 0);
		camera.ctx.scale(-1, 1);

		return camera;
	}

	async drawCtx() {
		// return new Promise(function (i) {
		//   var n = document.getElementById("video"),
		//     a = document.getElementById("output");
		//   let j = 0.6 * 1.5 * 0.75;
		//   let t = 0.6;
		//   let o = ((1 - j) / 2) * n.videoWidth;
		//   let c = ((1 - t) / 2) * n.videoHeight;
		//   let l = n.videoWidth * j;
		//   let s = n.videoHeight;
		//   let d = 0;
		//   let r = 0;
		//   let v = n.videoWidth * j;
		//   let _ = n.videoHeight;
		//   l < 0 && ((o += l), (l = Math.abs(l))),
		//     s < 0 && ((c += s), (s = Math.abs(s))),
		//     v < 0 && ((d += v), (v = Math.abs(v))),
		//     _ < 0 && ((r += _), (_ = Math.abs(_)));

		//   const p = Math.max(o, 0),
		//     u = Math.min(o + l, n.videoWidth),
		//     g = Math.max(c, 0),
		//     m = Math.min(c + s, n.videoHeight),
		//     y = v / l,
		//     b = _ / s;

		//   console.log(d, o, y);
		//   a.getContext("2d").drawImage(
		//     n,
		//     p,
		//     g,
		//     u - p,
		//     m - g,
		//     o < 0 ? d - o * y : d,
		//     c < 0 ? r - c * b : r,
		//     (u - p) * y,
		//     (m - g) * b
		//     // 0,
		//     // 0,
		//     // this.video.videoWidth,
		//     // this.video.videoHeight
		//   );
		//   i(a);
		// });
		//     this.ctx.beginPath();
		// ctx.arc(x, y, 3 /* radius */, 0, 2 * Math.PI);
		// ctx.fill();
		this.ctx.drawImage(
			this.video,
			0,
			0,
			this.video.videoWidth,
			this.video.videoHeight
		);
	}

	drawResults(faces, boundingBox, keypoints) {
		drawResults(this.ctx, faces, boundingBox, keypoints);
	}
}
async function renderResult() {
	if (camera.video.readyState < 2) {
		await new Promise((resolve) => {
			camera.video.onloadeddata = () => {
				resolve(video);
			};
		});
	}

	let faces = null;
	// Detector can be null if initialization failed (for example when loading
	// from a URL that does not exist).
	if (detector != null) {
		// FPS only counts the time it takes to finish estimateFaces.

		// Detectors can throw errors, for example when using custom URLs that
		// contain a model that doesn't provide the expected output.
		try {
			faces = await detector.estimateFaces(camera.video, {
				flipHorizontal: false,
			});
		} catch (error) {
			detector.dispose();
			detector = null;
			alert(error);
		}
	}
	await camera.drawCtx();

	// The null check makes sure the UI is not in the middle of changing to a
	// different model. If during model change, the result is from an old model,
	// which shouldn't be rendered.
	if (RECORD) {
		if (faces && faces.length > 0 && !STATE.isModelChanged) {
			camera.drawResults(
				faces,
				STATE.modelConfig.boundingBox,
				STATE.modelConfig.keypoints
			);
		} else {
			changeNotify(false, "Đưa mặt vào khung hình");
		}
	}
}

async function renderPrediction() {
	if (!STATE.isModelChanged) {
		await renderResult();
	}
	rafId = requestAnimationFrame(renderPrediction);
}

async function app() {
	camera = await Camera.setupCamera(STATE.camera, false);

	detector = await createDetector();

	renderPrediction();
}
app();

// Checkbox
function onChangeCheckbox(e) {
	var checkboxs = document.querySelectorAll(".inp-cbx");

	checkboxs.forEach(function (cb) {
		if (cb != e.target) cb.checked = false;
	});
}

document.addEventListener(
	"DOMContentLoaded",
	function () {
		document.querySelector(".list-choose").onchange = onChangeCheckbox;
	},
	false
);

// document
//   .getElementById("openGuide")
//   .addEventListener("click", async function () {
//     document
//       .getElementsByClassName("guide-main")[0]
//       .classList.remove("ekyc_d-none");
//   });

// Start Demo
document
	.getElementById("start-demo-ekyc")
	.addEventListener("click", async function () {
		var checked = document.querySelector(".inp-cbx:checked");
		if (!checked) {
			alert("Bạn phải chọn loại giấy tờ trước khi tiếp tục");
			return;
		}

		var value = checked.value;
		var home = document.getElementById("home-demo-ekyc");
		var camera = document.getElementById("step1-demo-ekyc");
		home.classList.add("ekyc_d-none");
		camera.classList.remove("ekyc_d-none");
	});
app();

// Open the guide dialog
document
	.getElementById("openGuide")
	.addEventListener("click", async function () {
		document
			.getElementsByClassName("guide-content")[0]
			.classList.remove("ekyc_d-none");
		document
			.getElementsByClassName("guide-detail")[0]
			.classList.remove("ekyc_d-none");
		document.getElementById("ekyc-header").classList.add("ekyc-header-white");
		document.getElementById("guide").classList.add("guide-bg");
		document.getElementsByClassName("front")[0].classList.add("ekyc_d-none");
	});

//  Close the guide dialog
document
	.getElementById("continue-demo-ekyc")
	.addEventListener("click", async function () {
		document
			.getElementsByClassName("guide-content")[0]
			.classList.add("ekyc_d-none");
		document
			.getElementsByClassName("guide-detail")[0]
			.classList.add("ekyc_d-none");
		document
			.getElementById("ekyc-header")
			.classList.remove("ekyc-header-white");
		document.getElementById("guide").classList.remove("guide-bg");
		document.getElementsByClassName("guide-img__header")[0].innerHTML =
			"Chụp ảnh giấy tờ tùy thân";
		document.getElementsByClassName("front")[0].classList.remove("ekyc_d-none");

		// playCameraTakeCard();
		// if (step === 1) {
		// 	app();
		// }
	});

// Close EKYC
document
	.getElementById("closeEkyc")
	.addEventListener("click", async function () {
		location.reload();
	});

// Take Image
document
	.getElementById("take-img")
	.addEventListener("click", async function () {
		if (step < 3) {
			const video = document.querySelector("video");
			const canvas = document.getElementById("output");
			const photo = document.getElementById("outPut");
			var context = canvas.getContext("2d");

			canvas.width = 1280;
			canvas.height = 960;
			context.drawImage(video, 0, 0, 1280, 960);

			var data = canvas.toDataURL("image/png");
			const blobUrl = b64toBlob(data);
			!front_img1 ? (front_img1 = data) : (end_img1 = data);
			!front_img ? (front_img = blobUrl) : (end_img = blobUrl);
			step += 1;

			photo.setAttribute("src", data);
			canvas.classList.add("ekyc_d-none");
			photo.classList.remove("ekyc_d-none");

			document.getElementById("wrapper").classList.add("btn-group");
			document.getElementById("take-img").classList.add("ekyc_d-none");
			document.getElementById("redoBtn").classList.remove("ekyc_d-none");
			document.getElementById("useImg").classList.remove("ekyc_d-none");
		}
	});

document.getElementById("useImg").addEventListener("click", async function () {
	if (step === 2) {
		// LIVENESS FRONT
		if (init.LIVENESS_CARD) {
			loading.classList.remove("ekyc_d-none");
			const liveness = await cardLiveness(step === 2 ? front_img : end_img);
			loading.classList.add("ekyc_d-none");
			console.log(liveness);
			if (liveness.code === 1) {
				resetHidden();
				document.getElementsByClassName("front-type__right")[0].innerHTML =
					"Mặt sau";
			} else {
				front_img = null;
				front_img1 = null;
				const message = liveness?.message;

				document.getElementById("useImg").classList.add("ekyc_d-none");
				document.getElementById("redoBtn").classList.remove("ekyc_d-none");
				document.getElementById("redoBtn").classList.add("ekyc_w-full");
				document
					.getElementById("error-message")
					.classList.remove("ekyc_d-none");
				document.getElementById("error-label").innerHTML =
					liveness.code <= 160 ? "Lỗi hệ thống" : "Ảnh không hợp lệ";
				document.getElementById("error-detail").innerHTML = message
					? message
					: "";
			}
		}
	}

	if (step === 3) {
		// const loading = document.getElementById('loading-overlay')
		// loading.classList.remove('ekyc_d-none')
		if (init.LIVENESS_CARD) {
			loading.classList.remove("ekyc_d-none");
			const liveness = await cardLiveness(end_img);

			if (liveness.code === 1) {
				const cardOcr = await orcCard();
				loading.classList.add("ekyc_d-none");

				if (cardOcr.code === 1) {
					ocr = cardOcr.information;
					stepFace();
				}
			} else {
				loading.classList.add("ekyc_d-none");
				end_img = null;
				end_img1 = null;
				const message = liveness?.message;

				document.getElementById("useImg").classList.add("ekyc_d-none");
				document.getElementById("redoBtn").classList.remove("ekyc_d-none");
				document.getElementById("redoBtn").classList.add("ekyc_w-full");
				document
					.getElementById("error-message")
					.classList.remove("ekyc_d-none");
				document.getElementById("error-label").innerHTML =
					liveness.code <= 160 ? "Lỗi hệ thống" : "Ảnh không hợp lệ";
				document.getElementById("error-detail").innerHTML = message
					? message
					: "";
			}
		} else {
			stepFace();
			// resetHidden();
			// CHECK = true;
			// const video = document.getElementById("output");
			// video.classList.add("face-video");
			// video.classList.add("small-oval");
			// video.classList.remove("idCard_video");
			// document.getElementById("wrapper").classList.add("ekyc_d-none");

			// document.getElementsByClassName("front")[0].classList.add("ekyc_center");
			// document
			//   .getElementsByClassName("front-type")[0]
			//   .classList.add("ekyc_d-none");
			// document
			//   .getElementsByClassName("face-message")[0]
			//   .classList.remove("ekyc_d-none");
			// document.getElementsByClassName("guide-img__header")[0].innerHTML =
			//   "Chụp ảnh chân dung";
			// detector = await createDetector();
			// faces = await detector.estimateFaces(video.video, {
			//   flipHorizontal: false,
			// });
		}

		// await detectionLoop();
		// current.face = await validationLoop();
		// TO DO CALL API
	}
});

async function stepFace() {
	resetHidden();
	CHECK = true;
	const video = document.getElementById("output");
	const oval = document.getElementById("oval");
	oval.classList.add("canvas-oval");
	oval.classList.add("canvas-small");

	video.classList.add("face-video");
	video.classList.remove("idCard_video");
	document.getElementById("wrapper").classList.add("ekyc_d-none");
	// camera = await Camera.setupCamera(STATE.camera_face);
	document.getElementsByClassName("front")[0].classList.add("ekyc_center");
	document.getElementsByClassName("front-type")[0].classList.add("ekyc_d-none");
	document
		.getElementsByClassName("face-message")[0]
		.classList.remove("ekyc_d-none");
	document.getElementsByClassName("guide-img__header")[0].innerHTML =
		"Chụp ảnh chân dung";
	detector = await createDetector();
	faces = await detector.estimateFaces(video.video, {
		flipHorizontal: false,
	});
}

document.getElementById("redoBtn").addEventListener("click", async function () {
	step -= 1;
	const canvas = document.getElementById("output");
	document.getElementById("error-message").classList.add("ekyc_d-none");
	document.getElementById("redoBtn").classList.remove("ekyc_w-full");

	if (step === 1) {
		front_img = null;
		canvas.width = 400;
		canvas.height = 300;
	} else if (step === 2) {
		end_img = null;
		canvas.width = 400;
		canvas.height = 300;
	}
	resetHidden();
});

// Utils
function b64toBlob(base64, sliceSize = 512) {
	const b64Data = base64.replace("data:image/png;base64,", "");
	const byteCharacters = atob(b64Data);
	const byteArrays = [];

	for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
		const slice = byteCharacters.slice(offset, offset + sliceSize);

		const byteNumbers = new Array(slice.length);
		for (let i = 0; i < slice.length; i++) {
			byteNumbers[i] = slice.charCodeAt(i);
		}

		const byteArray = new Uint8Array(byteNumbers);
		byteArrays.push(byteArray);
	}

	const blob = new Blob(byteArrays, { type: "image/png" });
	return new File([blob], "capture.png", {
		lastModified: new Date().getTime(),
		type: "image/png",
	});
}

async function resetHidden() {
	// const canvas = document.getElementById("output");
	if (step < 3) {
		camera = await Camera.setupCamera(STATE.camera, false);
	} else {
		camera = await Camera.setupCamera(STATE.camera_face, false);
	}

	document.getElementById("outPut").classList.add("ekyc_d-none");
	document.querySelector("video").classList.remove("ekyc_d-none");
	document.getElementById("output").classList.remove("ekyc_d-none");
	document.getElementById("wrapper").classList.remove("btn-group");
	document.getElementById("take-img").classList.remove("ekyc_d-none");
	document.getElementById("redoBtn").classList.add("ekyc_d-none");
	document.getElementById("useImg").classList.add("ekyc_d-none");
	// document.getElementById("wrapper").classList.remove("ekyc_d-none");
}

async function faceMatching(front, face) {
	const formData = new FormData();

	formData.append("token", token);
	formData.append("image_cmt", front);
	formData.append("image_live", face);

	return await fetch("https://viettelai.vn/ekyc/face_matching", {
		method: "POST",
		body: formData,
	})
		.then((e) => e.json())
		.then((e) => e)
		.catch((e) => e);
}

async function cardLiveness(card) {
	const formData = new FormData();

	formData.append("token", token);
	formData.append("file", card);

	return await fetch("https://viettelai.vn/ekyc/id_spoof_check", {
		method: "POST",
		body: formData,
	})
		.then((e) => e.json())
		.then((e) => e)
		.catch((e) => e);
}

async function orcCard() {
	const formData = new FormData();

	formData.append("token", token);
	formData.append("image_front", front_img);
	formData.append("image_back", end_img);

	return await fetch("https://viettelai.vn/ekyc/id_card", {
		method: "POST",
		body: formData,
	})
		.then((e) => e.json())
		.then((e) => e)
		.catch((e) => e);
}

async function faceLiveness(face) {
	const formData = new FormData();

	formData.append("token", token);
	formData.append("file", face);
	formData.append("label_pose", "Portrait");

	return await fetch("https://viettelai.vn/ekyc/face_liveness", {
		method: "POST",
		body: formData,
	})
		.then((e) => e.json())
		.then((e) => e)
		.catch((e) => e);
}
