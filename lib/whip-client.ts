/**
 * WHIP (WebRTC-HTTP Ingestion Protocol) Client
 * Used to publish a local MediaStream to a Cloudflare WHIP endpoint.
 */

export class WHIPClient {
  private pc: RTCPeerConnection | null = null;
  private resourceUrl: string | null = null;
  private whipUrl: string;

  constructor(whipUrl: string) {
    this.whipUrl = whipUrl;
  }

  /**
   * Start publishing the given MediaStream to the WHIP endpoint.
   */
  async publish(stream: MediaStream): Promise<void> {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
      bundlePolicy: 'max-bundle',
    });

    // Add all tracks from the stream
    stream.getTracks().forEach((track) => {
      this.pc!.addTrack(track, stream);
    });

    // Create offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // Wait for ICE gathering to complete (or timeout after 3s)
    await this.waitForIceGathering(3000);

    // Send offer to WHIP endpoint
    const response = await fetch(this.whipUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
      },
      body: this.pc.localDescription!.sdp,
    });

    if (!response.ok) {
      throw new Error(`WHIP publish failed: ${response.status} ${response.statusText}`);
    }

    // Store the resource URL for later teardown
    const location = response.headers.get('Location');
    if (location) {
      this.resourceUrl = new URL(location, this.whipUrl).toString();
    }

    // Set remote description from the answer
    const answerSdp = await response.text();
    await this.pc.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
    );
  }

  /**
   * Stop publishing and clean up.
   */
  async stop(): Promise<void> {
    // Send DELETE to tear down the WHIP resource
    if (this.resourceUrl) {
      try {
        await fetch(this.resourceUrl, { method: 'DELETE' });
      } catch {
        // Best effort cleanup
      }
      this.resourceUrl = null;
    }

    // Close the peer connection
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  /**
   * Check if the client is currently connected.
   */
  get isConnected(): boolean {
    return this.pc?.connectionState === 'connected';
  }

  /**
   * Get the connection state.
   */
  get connectionState(): string {
    return this.pc?.connectionState || 'closed';
  }

  /**
   * Wait for ICE gathering to complete or timeout.
   */
  private waitForIceGathering(timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.pc || this.pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      const timeout = setTimeout(resolve, timeoutMs);
      this.pc.addEventListener('icegatheringstatechange', () => {
        if (this.pc?.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }
}

/**
 * WHEP (WebRTC-HTTP Egress Protocol) Player
 * Used to play back a stream from a Cloudflare WHEP endpoint.
 */
export class WHEPPlayer {
  private pc: RTCPeerConnection | null = null;
  private resourceUrl: string | null = null;
  private whepUrl: string;

  constructor(whepUrl: string) {
    this.whepUrl = whepUrl;
  }

  /**
   * Start playback. Returns the remote MediaStream to attach to a <video> element.
   */
  async play(): Promise<MediaStream> {
    this.pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.cloudflare.com:3478' }],
      bundlePolicy: 'max-bundle',
    });

    // We only receive. add transceivers in recvonly mode
    this.pc.addTransceiver('video', { direction: 'recvonly' });
    this.pc.addTransceiver('audio', { direction: 'recvonly' });

    // Collect remote stream
    const remoteStream = new MediaStream();
    this.pc.ontrack = (event) => {
      remoteStream.addTrack(event.track);
    };

    // Create offer
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);

    // Wait for ICE gathering
    await this.waitForIceGathering(3000);

    // Send offer to WHEP endpoint
    const response = await fetch(this.whepUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sdp',
      },
      body: this.pc.localDescription!.sdp,
    });

    if (!response.ok) {
      throw new Error(`WHEP play failed: ${response.status} ${response.statusText}`);
    }

    // Store resource URL for teardown
    const location = response.headers.get('Location');
    if (location) {
      this.resourceUrl = new URL(location, this.whepUrl).toString();
    }

    // Set remote answer
    const answerSdp = await response.text();
    await this.pc.setRemoteDescription(
      new RTCSessionDescription({ type: 'answer', sdp: answerSdp })
    );

    return remoteStream;
  }

  /**
   * Stop playback and clean up.
   */
  async stop(): Promise<void> {
    if (this.resourceUrl) {
      try {
        await fetch(this.resourceUrl, { method: 'DELETE' });
      } catch {
        // Best effort
      }
      this.resourceUrl = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  /**
   * Check if connected.
   */
  get isConnected(): boolean {
    return this.pc?.connectionState === 'connected';
  }

  /**
   * Wait for ICE gathering to complete or timeout.
   */
  private waitForIceGathering(timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.pc || this.pc.iceGatheringState === 'complete') {
        resolve();
        return;
      }
      const timeout = setTimeout(resolve, timeoutMs);
      this.pc.addEventListener('icegatheringstatechange', () => {
        if (this.pc?.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          resolve();
        }
      });
    });
  }
}
