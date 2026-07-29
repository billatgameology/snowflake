import {
  validateGpuAllocation,
  type GpuBufferPlan,
} from "./layout.ts";

export const GPU_CELL_BUFFER_USAGE =
  0x0004 | // COPY_SRC
  0x0008 | // COPY_DST
  0x0080; // STORAGE

export const GPU_UNIFORM_BUFFER_USAGE =
  0x0008 | // COPY_DST
  0x0040; // UNIFORM

export interface GpuOwnedBuffer {
  readonly name: string;
  readonly buffer: GPUBuffer;
  readonly byteLength: number;
}

export class GpuBufferArena {
  private destroyed = false;
  private readonly device: GPUDevice;
  private readonly owned = new Map<string, GpuOwnedBuffer>();
  readonly generation: number;
  readonly plan: GpuBufferPlan;

  private constructor(
    device: GPUDevice,
    generation: number,
    plan: GpuBufferPlan,
  ) {
    this.device = device;
    this.generation = generation;
    this.plan = plan;
  }

  static create(
    device: GPUDevice,
    generation: number,
    plan: GpuBufferPlan,
  ): GpuBufferArena {
    if (
      !Number.isSafeInteger(generation) ||
      generation < 0 ||
      generation > 0xffff_ffff
    ) {
      throw new Error("GPU arena generation must be a u32-safe integer");
    }
    const support = validateGpuAllocation(plan, {
      maxBufferSize: Number(device.limits.maxBufferSize),
      maxStorageBufferBindingSize: Number(
        device.limits.maxStorageBufferBindingSize,
      ),
    });
    if (!support.supported) {
      throw new Error(`GPU allocation is unsupported: ${support.reasons.join("; ")}`);
    }
    const arena = new GpuBufferArena(device, generation, plan);
    try {
      for (const descriptor of plan.buffers) {
        const buffer = device.createBuffer({
          label: `vcc:${plan.operator}:${generation}:${descriptor.name}`,
          size: descriptor.byteLength,
          usage: GPU_CELL_BUFFER_USAGE,
        });
        arena.owned.set(descriptor.name, {
          name: descriptor.name,
          buffer,
          byteLength: descriptor.byteLength,
        });
      }
      return arena;
    } catch (error) {
      arena.destroy();
      throw error;
    }
  }

  names(): readonly string[] {
    this.assertAlive();
    return [...this.owned.keys()];
  }

  get(name: string): GPUBuffer {
    this.assertAlive();
    const entry = this.owned.get(name);
    if (entry === undefined) throw new Error(`GPU buffer is not owned: ${name}`);
    return entry.buffer;
  }

  byteLength(name: string): number {
    this.assertAlive();
    const entry = this.owned.get(name);
    if (entry === undefined) throw new Error(`GPU buffer is not owned: ${name}`);
    return entry.byteLength;
  }

  upload(
    device: GPUDevice,
    name: string,
    source: ArrayBufferView,
    destinationOffset = 0,
  ): void {
    this.assertAlive();
    this.assertDevice(device);
    const entry = this.owned.get(name);
    if (entry === undefined) throw new Error(`GPU buffer is not owned: ${name}`);
    if (
      !Number.isSafeInteger(destinationOffset) ||
      destinationOffset < 0 ||
      destinationOffset % 4 !== 0 ||
      source.byteLength % 4 !== 0 ||
      destinationOffset + source.byteLength > entry.byteLength
    ) {
      throw new Error(`GPU upload range is invalid for ${name}`);
    }
    device.queue.writeBuffer(
      entry.buffer,
      destinationOffset,
      source.buffer,
      source.byteOffset,
      source.byteLength,
    );
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    for (const entry of this.owned.values()) entry.buffer.destroy();
    this.owned.clear();
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  assertDevice(device: GPUDevice): void {
    if (device !== this.device) {
      throw new Error("GPU buffer arena belongs to a different device");
    }
  }

  private assertAlive(): void {
    if (this.destroyed) throw new Error("GPU buffer arena is destroyed");
  }
}
