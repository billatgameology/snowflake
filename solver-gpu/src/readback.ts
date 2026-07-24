export type GpuReadbackPurpose =
  | "test"
  | "named-probe"
  | "compact-metric"
  | "evidence-snapshot"
  | "checkpoint";

export interface GpuReadbackRequest {
  readonly purpose: GpuReadbackPurpose;
  readonly label: string;
  readonly generation: number;
  readonly byteOffset: number;
  readonly byteLength: number;
  readonly fullField: boolean;
  readonly displayFrame: boolean;
}

export interface GpuReadbackRecord extends GpuReadbackRequest {
  readonly sequence: number;
}

export class GpuReadbackAudit {
  private readonly entries: GpuReadbackRecord[] = [];

  authorize(request: GpuReadbackRequest): GpuReadbackRecord {
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
    if (request.fullField && request.displayFrame) {
      throw new Error("full-field display-frame readback is forbidden");
    }
    const record = { ...request, sequence: this.entries.length };
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
  request: GpuReadbackRequest,
  audit: GpuReadbackAudit,
): Promise<ArrayBuffer> {
  audit.authorize(request);
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
