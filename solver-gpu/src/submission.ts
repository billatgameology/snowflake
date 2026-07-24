export const GPU_WORKGROUP_SIZE = 256;
export const GPU_MAX_WORKGROUPS_PER_DISPATCH = 16_384;
export const GPU_MAX_CELLS_PER_DISPATCH =
  GPU_WORKGROUP_SIZE * GPU_MAX_WORKGROUPS_PER_DISPATCH;

export interface GpuDispatchRange {
  readonly baseCell: number;
  readonly cellCount: number;
  readonly workgroupCount: number;
}

export function planGpuDispatchRanges(
  cellCount: number,
  maxWorkgroups = GPU_MAX_WORKGROUPS_PER_DISPATCH,
): readonly GpuDispatchRange[] {
  if (!Number.isSafeInteger(cellCount) || cellCount <= 0 || cellCount > 0xffff_ffff) {
    throw new Error("cellCount must be a positive WGSL-u32-safe integer");
  }
  if (
    !Number.isSafeInteger(maxWorkgroups) ||
    maxWorkgroups <= 0 ||
    maxWorkgroups > GPU_MAX_WORKGROUPS_PER_DISPATCH
  ) {
    throw new Error(
      `maxWorkgroups must be an integer in [1,${GPU_MAX_WORKGROUPS_PER_DISPATCH}]`,
    );
  }
  const maxCells = maxWorkgroups * GPU_WORKGROUP_SIZE;
  const ranges: GpuDispatchRange[] = [];
  for (let baseCell = 0; baseCell < cellCount; baseCell += maxCells) {
    const count = Math.min(maxCells, cellCount - baseCell);
    ranges.push({
      baseCell,
      cellCount: count,
      workgroupCount: Math.ceil(count / GPU_WORKGROUP_SIZE),
    });
  }
  return ranges;
}

export interface GpuSubmissionRecord {
  readonly label: string;
  readonly generation: number;
  readonly startedMs: number;
  readonly completedMs: number;
  readonly wallMs: number;
}

export type Phase5Clock = () => number;

export class GpuSubmissionController {
  private generation = 0;
  private destroyed = false;
  private lostReason: string | null = null;
  private readonly recordsInternal: GpuSubmissionRecord[] = [];
  private readonly device: GPUDevice;
  private readonly clock: Phase5Clock;

  constructor(
    device: GPUDevice,
    clock: Phase5Clock = () => performance.now(),
  ) {
    this.device = device;
    this.clock = clock;
    void device.lost.then((info) => {
      if (!this.destroyed) {
        this.lostReason = `${info.reason}:${info.message}`;
      }
    });
  }

  assertDevice(device: GPUDevice): void {
    if (device !== this.device) {
      throw new Error("GPU submission controller belongs to a different device");
    }
  }

  unexpectedLossReason(): string | null {
    return this.lostReason;
  }

  currentGeneration(): number {
    return this.generation;
  }

  acknowledgeEdit(nextGeneration: number): number {
    this.assertUsable();
    if (
      !Number.isSafeInteger(nextGeneration) ||
      nextGeneration <= this.generation ||
      nextGeneration > 0xffff_ffff
    ) {
      throw new Error("GPU edit generations must increase monotonically as u32 values");
    }
    this.generation = nextGeneration;
    return this.clock();
  }

  async submit(
    label: string,
    generation: number,
    commandBuffers: readonly GPUCommandBuffer[],
  ): Promise<GpuSubmissionRecord> {
    this.assertUsable();
    if (label.length === 0 || commandBuffers.length === 0) {
      throw new Error("GPU submission requires a label and at least one command buffer");
    }
    if (generation !== this.generation) {
      throw new Error(
        `stale GPU generation ${generation}; current generation is ${this.generation}`,
      );
    }
    const startedMs = this.clock();
    this.device.queue.submit([...commandBuffers]);
    await this.device.queue.onSubmittedWorkDone();
    this.assertUsable();
    if (generation !== this.generation) {
      throw new Error(
        `GPU submission generation ${generation} became stale while in flight; ` +
          `current generation is ${this.generation}`,
      );
    }
    const completedMs = this.clock();
    const record = {
      label,
      generation,
      startedMs,
      completedMs,
      wallMs: completedMs - startedMs,
    };
    if (!Number.isFinite(record.wallMs) || record.wallMs < 0) {
      throw new Error("GPU submission clock moved backwards or became non-finite");
    }
    this.recordsInternal.push(record);
    return record;
  }

  records(): readonly GpuSubmissionRecord[] {
    return [...this.recordsInternal];
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.device.destroy();
  }

  private assertUsable(): void {
    if (this.destroyed) throw new Error("GPU submission controller is destroyed");
    if (this.lostReason !== null) {
      throw new Error(`GPU device was lost: ${this.lostReason}`);
    }
  }
}
