

export class VideoProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private video: HTMLVideoElement;
  private frameRate: number;
  private isRunning: boolean;
  private backendUrl: string;
  private onFrameData: (data: any) => void;

  constructor(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    backendUrl: string = "http://localhost:5005",
    frameRate: number = 5,
    onFrameData?: (data: any) => void
  ) {
    this.video = video;
    this.canvas = canvas;
    this.backendUrl = backendUrl;
    this.frameRate = frameRate;
    this.isRunning = false;
    this.onFrameData = onFrameData || (() => { });

    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    this.ctx = ctx;
  }

  /**
   * Start capturing and processing video frames
   */
  async start() {
    this.isRunning = true;
    const frameInterval = 1000 / this.frameRate;

    const processFrame = async () => {
      if (!this.isRunning) return;

      try {
        // Capture current frame
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.ctx.drawImage(this.video, 0, 0);

        // Convert to JPEG base64
        const imageData = this.canvas.toDataURL("image/jpeg", 0.8);

        // Send to backend
        try {
          const response = await fetch(`${this.backendUrl}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ image: imageData }),
          });

          if (response.ok) {
            const result = await response.json();
            this.onFrameData(result);
          }
        } catch (error) {
          console.error("Backend communication error:", error);
        }
      } catch (error) {
        console.error("Frame processing error:", error);
      }

      if (this.isRunning) {
        setTimeout(processFrame, frameInterval);
      }
    };

    // Start processing loop
    processFrame();
  }

  /**
   * Stop capturing and processing video frames
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * Check if processor is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }
}

/**
 * WebSocket-based video processor for real-time streaming
 */
export class WebSocketVideoProcessor {
  private ws: WebSocket | null = null;
  private video: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frameRate: number;
  private isRunning: boolean;
  private wsUrl: string;
  private onMessage: (data: any) => void;

  constructor(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    wsUrl: string = "ws://localhost:5005/api/ws",
    frameRate: number = 5,
    onMessage?: (data: any) => void
  ) {
    this.video = video;
    this.canvas = canvas;
    this.wsUrl = wsUrl;
    this.frameRate = frameRate;
    this.isRunning = false;
    this.onMessage = onMessage || (() => { });

    const ctx = this.canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    this.ctx = ctx;
  }

  /**
   * Connect to WebSocket server and start streaming
   */
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log("[v0] WebSocket connected");
          this.isRunning = true;
          this.startStreaming();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.onMessage(data);
          } catch (error) {
            console.error("Failed to parse WebSocket message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("[v0] WebSocket error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[v0] WebSocket disconnected");
          this.isRunning = false;
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start streaming video frames
   */
  private startStreaming() {
    const frameInterval = 1000 / this.frameRate;

    const sendFrame = () => {
      if (!this.isRunning || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
        return;
      }

      try {
        // Capture current frame
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
        this.ctx.drawImage(this.video, 0, 0);

        // Convert to base64 (remove data URL prefix)
        const imageData = this.canvas.toDataURL("image/jpeg", 0.8).split(",")[1];

        // Send to server
        this.ws.send(
          JSON.stringify({
            image: imageData,
          })
        );

        console.log("[v0] Frame sent");
      } catch (error) {
        console.error("Frame streaming error:", error);
      }

      if (this.isRunning) {
        setTimeout(sendFrame, frameInterval);
      }
    };

    sendFrame();
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    this.isRunning = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}