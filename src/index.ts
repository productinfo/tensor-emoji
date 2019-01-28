const posenet = require('@tensorflow-models/posenet');

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const webcam: HTMLMediaElement = document.querySelector('#webcam');
const errorMsg: HTMLElement = document.querySelector('#errorMessage');

const constraints = {
  audio: false,
  video: {
    facingMode: 'user',
    width: isMobile ? undefined : webcam.clientWidth,
    height: isMobile ? undefined : webcam.clientHeight
  }
};

const loadVideo = async (element: HTMLMediaElement): Promise<HTMLMediaElement> => {
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  element.srcObject = stream;
  return new Promise(resolve => (element.onloadedmetadata = () => resolve(element)));
};

(async () => {
  let video: HTMLMediaElement;
  try {
    video = await loadVideo(webcam);
  } catch (err) {
    console.error(err);
    errorMsg.textContent = 'Is your camera blocked? Please unblock and reload.';
    return;
  }

  const canvas: HTMLCanvasElement = document.querySelector('#output');
  canvas.width = webcam.clientWidth;
  canvas.height = webcam.clientHeight;
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

  const threshold = 0.8;
  const emojiSize = 32;
  const emoji = ['🍩', '🦅', '🦅'];
  const scale = 1;

  ctx.font = `${emojiSize}px sans-serif`;

  async function poseDetectionFrame() {
    const net = await posenet.load(isMobile ? 0.5 : 0.75);
    const pose = await net.estimateSinglePose(video, isMobile ? 0.2 : 0.75, false, isMobile ? 32 : 8);

    const [nose, rightEye, leftEye] = pose.keypoints;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    [nose, leftEye, rightEye].forEach(({ score, position }, index) => {
      if (score > threshold) {
        const { y, x } = position;
        ctx.fillText(emoji[index], x * scale - emojiSize / 2, y * scale + emojiSize / 2);
      }
    });

    requestAnimationFrame(poseDetectionFrame);
  }

  poseDetectionFrame();
})();
