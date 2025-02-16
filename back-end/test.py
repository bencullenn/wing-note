import asyncio
import websockets
import cv2
import pyaudio


async def stream_data():
    uri = "ws://127.0.0.1:8000/ws"

    # --- Initialize audio capture using PyAudio ---
    audio = pyaudio.PyAudio()
    audio_format = pyaudio.paInt16  # 16-bit audio
    channels = 1
    rate = 16000
    frames_per_buffer = 1024  # adjust as needed

    audio_stream = audio.open(
        format=audio_format,
        channels=channels,
        rate=rate,
        input=True,
        frames_per_buffer=frames_per_buffer,
    )

    # --- Initialize video capture using OpenCV ---
    video_cap = cv2.VideoCapture(0)

    async with websockets.connect(uri) as websocket:
        try:
            # Toggle to alternate packet types: True for audio, False for video.
            expecting_audio = True
            while True:
                if expecting_audio:
                    # Capture an audio chunk (raw PCM data)
                    audio_data = audio_stream.read(
                        frames_per_buffer, exception_on_overflow=False
                    )
                    await websocket.send(audio_data)
                    print("Sent audio packet")
                else:
                    # Capture a video frame from the webcam
                    ret, frame = video_cap.read()
                    if not ret:
                        print("Failed to capture video frame")
                        continue
                    # Encode the frame as JPEG to get a compressed binary packet.
                    ret, buffer = cv2.imencode(".jpg", frame)
                    if ret:
                        video_data = buffer.tobytes()
                        await websocket.send(video_data)
                        print("Sent video packet")
                # Toggle the packet type for the next iteration.
                expecting_audio = not expecting_audio
                await asyncio.sleep(0.1)  # Adjust timing for your data rate

        except Exception as e:
            print(f"Error: {e}")
        finally:
            # Clean up audio and video resources.
            audio_stream.stop_stream()
            audio_stream.close()
            audio.terminate()
            video_cap.release()


asyncio.run(stream_data())
