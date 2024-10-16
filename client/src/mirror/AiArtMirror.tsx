import { useEffect, useRef, useState } from "react";
import "./FaceDetection.css";
import { FaCamera } from "react-icons/fa";
import ImageModal from "@/ImageModal";


export default function AiArtMirror() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [countdown, setCountdown] = useState<number | null>(null);
  const [blitz, setBlitz] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCapturePhotoButtons, setShowCapturePhotoButtons] = useState(false);

  useEffect(() => {
    const startVideo = () => {
      navigator.mediaDevices
        .getUserMedia({ video: {} })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => console.error("Error accessing webcam: ", err));
    };

    startVideo();
  }, []);

  useEffect(() => {
    const SpeechRecognition =
      (window.SpeechRecognition || window.webkitSpeechRecognition) as typeof window.SpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = "en-US";
      recognition.interimResults = false;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[event.resultIndex][0].transcript.trim().toLowerCase();
        console.log("Voice input: ", transcript);
        
        // voice commands
        if (transcript.includes("open blue camera")) {
          setShowCapturePhotoButtons(true);
        } else if (transcript.includes("close blue camera")) {
          setShowCapturePhotoButtons(false);
        }

        if (showCapturePhotoButtons === true && transcript.includes("capture photo")) {
          startCountdown();
          console.log("Capturing photo..");
        }

        if (showPreview && imageData){
          if (transcript.includes("yes")) {
            handleConfirmScreenshot();
            console.log("Downloading..");
          } else if (transcript.includes("no")) {
            handleCancelScreenshot();
            console.log("Cancelling..");
          }
        }
      };

      recognition.start();
    } else {
      console.error("Speech Recognition not supported in this browser.");
    }
  }, [showCapturePhotoButtons, showPreview, imageData]);

  const handleVideoOnPlay = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
  };

  const takeScreenshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (context) {
        context.save();

        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);

        context.restore();

        const img = canvas.toDataURL("image/png");
        setImageData(img);
        setShowPreview(true);
      }
    }
  };

  const disableScreenshotButton = () => {
    const button = document.querySelector("#scrnsht_btn");
    if (button) {
      button.setAttribute("disabled", "true");
    }
  };

  const enableScreenshotButton = () => {
    const button = document.querySelector("#scrnsht_btn");
    if (button) {
      button.removeAttribute("disabled");
    }
  };

  const startCountdown = () => {
    setCountdown(3);
    disableScreenshotButton();
    const interval = setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown && prevCountdown > 1) {
          return prevCountdown - 1;
        } else {
          clearInterval(interval);
          setCountdown(null);
          triggerBlitzEffect();
          takeScreenshot();
          enableScreenshotButton();
          return null;
        }
      });
    }, 1000);
  };

  const triggerBlitzEffect = () => {
    setBlitz(true);
    setTimeout(() => setBlitz(false), 500);
  };

  // SKAL BRUKES TIL Å SENDE IMG TIL BACKEND
  const handleConfirmScreenshot = async () => {
    if (imageData) {
      // Send POST request to the backend with base64 image data
      try {
        const response = await fetch("http://localhost:5353/upload-base64", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageData }),
        });
        console.log(response.body);
        if (response.ok) {
          console.log("Image uploaded successfully");
          // Handle any response data if needed
        } else {
          console.error("Error uploading image");
          // Optionally, read the response for more details
          const errorData = await response.json();
          console.error("Error details:", errorData);
        }
      } catch (error) {
        console.error("Error uploading image", error);
      }
    } else {
      console.error("No image data to send");
    }

    setShowPreview(false);
    setImageData(null);
  };

  const handleCancelScreenshot = () => {
    setShowPreview(false);
    setImageData(null);
  };

  const openCapturePhotoButtons = () => {
    setShowCapturePhotoButtons((prev) => !prev);
  };

  return (
    <div className={`relative h-screen ${blitz ? "blitz-effect" : ""}`}>
      <div className='absolute z-10 w-full mt-20'></div>

      <video
        ref={videoRef}
        className='object-cover w-full h-full inverted-video'
        autoPlay
        muted
        onPlay={handleVideoOnPlay}
      />
      <canvas ref={canvasRef} className='hidden' />
      {countdown !== null && (
        <div className='absolute p-4 text-white transform -translate-x-1/2 -translate-y-1/2 text-9xl top-1/2 left-1/2'>
          {countdown}
        </div>
      )}
      <div className='absolute bottom-0 left-0 flex p-4'>
        <button
          id='scrnsht_btn'
          className='rounded p-3 text-white bg-blue-500 hover:scale-[1.1] transform transition duration-150'
          onClick={openCapturePhotoButtons}
        >
          <FaCamera />
        </button>

        {showCapturePhotoButtons && (
          <>
            <button
              id='scrnsht_btn'
              className='p-1 ml-2 text-blue-500 bg-[rgb(255,255,255,0.8)] border-2 border-blue-500 rounded'
              onClick={startCountdown}
            >
              Capture photo (Send to AI)
            </button>
          </>
        )}
      </div>

      {showPreview && imageData && (
        <ImageModal
          title='Would you like to download this image?'
          confirmText='Yes'
          declineText='No'
          imgSrc={imageData}
          openModule={showPreview}
          cancelMoodScreenshot={handleCancelScreenshot}
          confirmMoodScreenshot={handleConfirmScreenshot}
        />
      )}
    </div>
  );
}
