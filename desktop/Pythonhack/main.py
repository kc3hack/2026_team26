from media_handlers import CameraHandler, AudioHandler
import cv2

def main():
    cam = CameraHandler()
    mic = AudioHandler()

    print("実行中... 'q' キーで終了")
    try:
        while True:
            # カメラから取得
            frame = cam.get_frame()
            if frame is not None:
                cv2.imshow('Camera Preview', frame)

            # マイクから取得 (バイナリデータ)
            audio_data = mic.get_audio_chunk()
            # ここで音声解析や保存処理が可能

            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    finally:
        cam.release()
        mic.close()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()