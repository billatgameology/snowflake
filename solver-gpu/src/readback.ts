export type GpuReadbackPurpose =
  | "test"
  | "named-probe"
  | "compact-metric"
  | "evidence-snapshot"
  | "checkpoint";

export const GPU_READBACK_PURPOSES = [
  "test",
  "named-probe",
  "compact-metric",
  "evidence-snapshot",
  "checkpoint",
] as const satisfies readonly GpuReadbackPurpose[];

declare const GPU_DISPLAY_FRAME_TOKEN: unique symbol;

export interface GpuDisplayFrameToken {
  readonly [GPU_DISPLAY_FRAME_TOKEN]: true;
}

export interface GpuReadbackIntent {
  readonly purpose: GpuReadbackPurpose;
  readonly label: string;
  readonly generation: number;
  readonly byteOffset: number;
  readonly byteLength: number;
  readonly displayFrame?: GpuDisplayFrameToken;
}

export interface GpuReadbackRecord
  extends Omit<GpuReadbackIntent, "displayFrame"> {
  readonly sequence: number;
  readonly sourceId: number;
  readonly sourceByteLength: number;
  readonly fullField: boolean;
  readonly displayFrame: boolean;
  readonly displayFrameSequence: number | null;
  readonly displayFrameLabel: string | null;
}

interface ActiveDisplayFrame {
  readonly token: GpuDisplayFrameToken;
  readonly sequence: number;
  readonly label: string;
  readonly sourceRanges: Map<number, [number, number][]>;
}

export class GpuReadbackAudit {
  private readonly entries: GpuReadbackRecord[] = [];
  private readonly sourceIds = new WeakMap<object, number>();
  private nextSourceId = 0;
  private nextDisplayFrameSequence = 0;
  private activeDisplayFrame: ActiveDisplayFrame | null = null;

  beginDisplayFrame(label: string): GpuDisplayFrameToken {
    if (typeof label !== "string" || label.length === 0) {
      throw new Error("GPU display-frame label is required");
    }
    if (this.activeDisplayFrame !== null) {
      throw new Error("a GPU display frame is already active");
    }
    const token = Object.freeze({}) as GpuDisplayFrameToken;
    this.activeDisplayFrame = {
      token,
      sequence: this.nextDisplayFrameSequence++,
      label,
      sourceRanges: new Map(),
    };
    return token;
  }

  endDisplayFrame(token: GpuDisplayFrameToken): void {
    if (
      this.activeDisplayFrame === null ||
      token !== this.activeDisplayFrame.token
    ) {
      throw new Error("GPU display-frame token is not active");
    }
    this.activeDisplayFrame = null;
  }

  authorize(
    request: GpuReadbackIntent,
    source: Pick<GPUBuffer, "size">,
  ): GpuReadbackRecord {
    if (
      !GPU_READBACK_PURPOSES.includes(
        request.purpose as (typeof GPU_READBACK_PURPOSES)[number],
      )
    ) {
      throw new Error(`unsupported GPU readback purpose: ${String(request.purpose)}`);
    }
    if (request.label.length === 0) throw new Error("GPU readback label is required");
    if (
      !Number.isSafeInteger(request.generation) ||
      request.generation < 0 ||
      request.generation > 0xffff_ffff
    ) {
      throw new Error("GPU readback generation must be a u32-safe integer");
    }
    if (
      !Number.isSafeInteger(request.byteOffset) ||
      request.byteOffset < 0 ||
      request.byteOffset % 4 !== 0 ||
      !Number.isSafeInteger(request.byteLength) ||
      request.byteLength <= 0 ||
      request.byteLength % 4 !== 0
    ) {
      throw new Error("GPU readback range must be positive and 4-byte aligned");
    }
    const sourceByteLength = Number(source.size);
    if (
      !Number.isSafeInteger(sourceByteLength) ||
      sourceByteLength <= 0 ||
      sourceByteLength % 4 !== 0 ||
      request.byteOffset + request.byteLength > sourceByteLength
    ) {
      throw new Error("GPU readback range exceeds the actual source buffer");
    }
    const sourceObject = source as object;
    let sourceId = this.sourceIds.get(sourceObject);
    if (sourceId === undefined) {
      sourceId = this.nextSourceId++;
      this.sourceIds.set(sourceObject, sourceId);
    }
    const fullField =
      request.byteOffset === 0 && request.byteLength === sourceByteLength;
    const frame = this.activeDisplayFrame;
    if (frame !== null && request.displayFrame !== frame.token) {
      throw new Error(
        "every GPU readback during an active display frame requires its token",
      );
    }
    if (frame === null && request.displayFrame !== undefined) {
      throw new Error("GPU display-frame token is not active");
    }
    const displayFrame = frame !== null;
    let displayFrameSequence: number | null = null;
    let displayFrameLabel: string | null = null;
    if (displayFrame) {
      // The checks above make this narrowing exact without trusting caller classification.
      if (frame === null) throw new Error("GPU display-frame state became inconsistent");
      const currentRanges = frame.sourceRanges.get(sourceId) ?? [];
      const candidateRanges: [number, number][] = [
        ...currentRanges,
        [
          request.byteOffset,
          request.byteOffset + request.byteLength,
        ] as [number, number],
      ];
      candidateRanges.sort((left, right) => left[0] - right[0]);
      const merged: [number, number][] = [];
      for (const range of candidateRanges) {
        const previous = merged.at(-1);
        if (previous === undefined || range[0] > previous[1]) {
          merged.push([range[0], range[1]]);
        } else {
          previous[1] = Math.max(previous[1], range[1]);
        }
      }
      const coveredBytes = merged.reduce(
        (sum, range) => sum + range[1] - range[0],
        0,
      );
      if (coveredBytes >= sourceByteLength) {
        throw new Error(
          "cumulative full-field display-frame readback is forbidden",
        );
      }
      frame.sourceRanges.set(sourceId, merged);
      displayFrameSequence = frame.sequence;
      displayFrameLabel = frame.label;
    }
    const record = {
      purpose: request.purpose,
      label: request.label,
      generation: request.generation,
      byteOffset: request.byteOffset,
      byteLength: request.byteLength,
      sequence: this.entries.length,
      sourceId,
      sourceByteLength,
      fullField,
      displayFrame,
      displayFrameSequence,
      displayFrameLabel,
    };
    this.entries.push(record);
    return record;
  }

  records(): readonly GpuReadbackRecord[] {
    return [...this.entries];
  }

  fullFieldDisplayFrameCount(): number {
    return this.entries.filter((entry) => entry.fullField && entry.displayFrame).length;
  }

  totalBytes(): number {
    return this.entries.reduce((sum, entry) => sum + entry.byteLength, 0);
  }
}

const GPU_MAP_READ = 0x0001;
const GPU_COPY_DST = 0x0008;

export async function readGpuBuffer(
  device: GPUDevice,
  source: GPUBuffer,
  request: GpuReadbackIntent,
  audit: GpuReadbackAudit,
): Promise<ArrayBuffer> {
  audit.authorize(request, source);
  const staging = device.createBuffer({
    label: `vcc:readback:${request.label}`,
    size: request.byteLength,
    usage: GPU_MAP_READ | GPU_COPY_DST,
  });
  try {
    const encoder = device.createCommandEncoder({
      label: `vcc:readback:${request.label}`,
    });
    encoder.copyBufferToBuffer(
      source,
      request.byteOffset,
      staging,
      0,
      request.byteLength,
    );
    device.queue.submit([encoder.finish()]);
    await device.queue.onSubmittedWorkDone();
    await staging.mapAsync(1, 0, request.byteLength);
    const copy = staging.getMappedRange(0, request.byteLength).slice(0);
    staging.unmap();
    return copy;
  } finally {
    staging.destroy();
  }
}
