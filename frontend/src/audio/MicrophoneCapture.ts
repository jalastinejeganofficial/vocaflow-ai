export class MicrophoneCapture {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;
  private startTime = 0;
  private recordedDuration = 0;

  public startRecording(stream: MediaStream) {
    this.recordedChunks = [];
    this.recordedDuration = 0;
    this.startTime = Date.now();

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    this.mediaRecorder = new MediaRecorder(stream, { mimeType });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    this.mediaRecorder.start(250); // Emit chunk every 250ms
    this.isRecording = true;
  }

  public stopRecording(): Promise<{ blob: Blob; duration: number }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error("No active recording session"));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedDuration = (Date.now() - this.startTime) / 1000;
        this.isRecording = false;
        resolve({ blob, duration: this.recordedDuration });
      };

      this.mediaRecorder.stop();
    });
  }

  public getIsRecording(): boolean {
    return this.isRecording;
  }

  public getElapsedDuration(): number {
    if (!this.isRecording) return this.recordedDuration;
    return (Date.now() - this.startTime) / 1000;
  }
}

export const globalMicCapture = new MicrophoneCapture();

