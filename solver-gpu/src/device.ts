export interface GpuRequirementSet {
  readonly requiredFeatures: readonly GPUFeatureName[];
  readonly requiredLimits: Readonly<Record<string, number>>;
}

export interface GpuCapabilityView {
  readonly features: ReadonlySet<string>;
  readonly limits: Readonly<Record<string, number>>;
}

export interface GpuRequirementResult {
  readonly supported: boolean;
  readonly missingFeatures: readonly string[];
  readonly insufficientLimits: readonly {
    readonly name: string;
    readonly required: number;
    readonly observed: number | null;
  }[];
}

export function validateGpuRequirements(
  capability: GpuCapabilityView,
  requirements: GpuRequirementSet,
): GpuRequirementResult {
  const missingFeatures = requirements.requiredFeatures.filter(
    (feature) => !capability.features.has(feature),
  );
  const insufficientLimits: {
    name: string;
    required: number;
    observed: number | null;
  }[] = [];
  for (const [name, required] of Object.entries(requirements.requiredLimits)) {
    if (!Number.isFinite(required) || required <= 0) {
      throw new Error(`required GPU limit ${name} must be finite and positive`);
    }
    const observed = capability.limits[name];
    if (observed === undefined || !Number.isFinite(observed) || observed < required) {
      insufficientLimits.push({
        name,
        required,
        observed:
          observed === undefined || !Number.isFinite(observed) ? null : observed,
      });
    }
  }
  return {
    supported: missingFeatures.length === 0 && insufficientLimits.length === 0,
    missingFeatures,
    insufficientLimits,
  };
}

function adapterLimitRecord(
  adapter: GPUAdapter,
  requiredLimitNames: readonly string[],
): Record<string, number> {
  const record: Record<string, number> = {};
  for (const name of requiredLimitNames) {
    const value = adapter.limits[name as keyof GPUSupportedLimits];
    if (typeof value === "number") record[name] = value;
  }
  return record;
}

export async function requestCheckedGpuDevice(
  adapter: GPUAdapter,
  requirements: GpuRequirementSet,
  label = "vcc-phase5-device",
): Promise<GPUDevice> {
  const result = validateGpuRequirements(
    {
      features: new Set([...adapter.features]),
      limits: adapterLimitRecord(
        adapter,
        Object.keys(requirements.requiredLimits),
      ),
    },
    requirements,
  );
  if (!result.supported) {
    throw new Error(
      `GPU requirements are not supported: missingFeatures=` +
        `${result.missingFeatures.join(",") || "none"}; insufficientLimits=` +
        `${result.insufficientLimits
          .map(
            (entry) =>
              `${entry.name}:${String(entry.observed)}<${entry.required}`,
          )
          .join(",") || "none"}`,
    );
  }
  return adapter.requestDevice({
    label,
    requiredFeatures: [...requirements.requiredFeatures],
    requiredLimits: { ...requirements.requiredLimits },
  });
}
