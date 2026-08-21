import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parsePhase10CallableRegistry,
  parsePhase10ExecutionReceipt,
  parsePhase10ObligationMatrix,
  parsePhase10PacketProtocol,
} from "../src/phase10-contracts.ts";
import {
  phase10ObligationFreezePreflight,
  phase10ObligationReceiptPreflight,
  phase10ObligationRunPreflight,
  phase10ValidateObligationMatrix,
} from "../src/phase10-obligation-preflight.ts";

interface MutableCallable {
  callableId: string;
  role: string;
  resolution: "planned" | "resolved";
  modulePath: string;
  exportName: string;
  identity: { byteLength: number; sha256: string } | null;
  producedOutputIds: string[];
  invokedCheckIds: string[];
  evaluatedCheckIds: string[];
  executedNegativeControlIds: string[];
  [key: string]: unknown;
}

interface MutableRegistry {
  schema: string;
  registryId: string;
  matrixId: string;
  protocolId: string;
  packetId: string;
  callables: MutableCallable[];
  [key: string]: unknown;
}

interface MutableProtocol {
  artifactSchemaRegistry: {
    path: string;
    byteLength: number;
    sha256: string;
  };
  selectedBranches: Array<{ groupId: string; branch: string }>;
  registeredOutputIds: string[];
  registeredCheckIds: string[];
  registeredNegativeControlIds: string[];
  boundDependencyPacketIds: string[];
  [key: string]: unknown;
}

interface MutableReceipt {
  terminalState: string;
  producedOutputIds: string[];
  executedCheckIds: string[];
  evaluatedCheckIds: string[];
  executedNegativeControlIds: string[];
  [key: string]: unknown;
}

interface MutableMatrix {
  outputs: Array<Record<string, unknown> & {
    artifact?: { schemaId?: string };
  }>;
  checks: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

interface ArtifactSchemaRegistry {
  readonly artifactSchemas: readonly { readonly schemaId: string }[];
  readonly schemaAliases: readonly { readonly schemaId: string }[];
  readonly externalSchemaDefinitions: readonly { readonly schemaId: string }[];
  readonly externalSchemaReservations: readonly { readonly schemaId: string }[];
}

interface MutableArtifactSchemaRegistry extends Record<string, unknown> {
  artifactSchemas: Array<Record<string, unknown> & { schemaId: string }>;
  schemaAliases: Array<Record<string, unknown> & { schemaId: string }>;
  externalSchemaDefinitions: Array<Record<string, unknown> & {
    schemaId: string;
    contractPath: string;
  }>;
  externalSchemaReservations: Array<Record<string, unknown> & { schemaId: string }>;
  schemaAvailability: Array<Record<string, unknown> & { schemaId: string }>;
}

interface CleanFixture {
  readonly schema: string;
  readonly matrix: MutableMatrix;
  readonly protocol: MutableProtocol;
  readonly registry: MutableRegistry;
  readonly receipt: MutableReceipt;
}

interface RemoveCallableFixture {
  readonly schema: string;
  readonly fixtureId: string;
  readonly mutation: {
    readonly kind: "remove-callable";
    readonly callableId: string;
  };
}

interface RemoveInvokedCheckFixture {
  readonly schema: string;
  readonly fixtureId: string;
  readonly mutation: {
    readonly kind: "remove-invoked-check";
    readonly callableId: string;
    readonly checkId: string;
  };
}

const FIXTURE_ROOT = resolve("runner/test/fixtures/phase10-ap");

function json<T>(path: string): T {
  return JSON.parse(readFileSync(resolve(path), "utf8")) as T;
}

function fixture(): CleanFixture {
  const value = json<CleanFixture>(resolve(FIXTURE_ROOT, "clean.json"));
  if (value.schema !== "phase10-ap-test-fixture-v1") {
    throw new Error("unexpected clean Phase 10 A-P fixture schema");
  }
  const registryBytes = readFileSync(resolve(value.protocol.artifactSchemaRegistry.path));
  value.protocol.artifactSchemaRegistry = {
    ...value.protocol.artifactSchemaRegistry,
    byteLength: registryBytes.byteLength,
    sha256: createHash("sha256").update(registryBytes).digest("hex"),
  };
  return value;
}

function clone<T>(value: T): T {
  return structuredClone(value);
}

function resolveCallables(
  registryValue: MutableRegistry,
  repositoryRoot = process.cwd(),
): MutableRegistry {
  const registry = clone(registryValue);
  for (const callable of registry.callables) {
    const bytes = readFileSync(resolve(repositoryRoot, callable.modulePath));
    callable.resolution = "resolved";
    callable.identity = {
      byteLength: bytes.byteLength,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }
  return registry;
}

function copyRegistryDependencies(
  registry: MutableArtifactSchemaRegistry,
  repositoryRoot: string,
): void {
  for (const contractPath of new Set(
    registry.externalSchemaDefinitions.map((row) => row.contractPath),
  )) {
    const destination = resolve(repositoryRoot, contractPath);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(resolve(contractPath), destination);
  }
}

function bindTemporarySchemaRegistry(
  protocolValue: MutableProtocol,
  registry: MutableArtifactSchemaRegistry,
  repositoryRoot: string,
): MutableProtocol {
  const protocol = clone(protocolValue);
  const bytes = Buffer.from(`${JSON.stringify(registry, null, 2)}\n`, "utf8");
  const destination = resolve(repositoryRoot, protocol.artifactSchemaRegistry.path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, bytes);
  copyRegistryDependencies(registry, repositoryRoot);
  protocol.artifactSchemaRegistry = {
    ...protocol.artifactSchemaRegistry,
    byteLength: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
  return protocol;
}

function copyCallableModules(registry: MutableRegistry, repositoryRoot: string): void {
  for (const callable of registry.callables) {
    const destination = resolve(repositoryRoot, callable.modulePath);
    mkdirSync(dirname(destination), { recursive: true });
    copyFileSync(resolve(callable.modulePath), destination);
  }
}

function rowById(
  rows: Array<Record<string, unknown>>,
  key: string,
  id: string,
): Record<string, unknown> {
  const row = rows.find((candidate) => candidate[key] === id);
  if (row === undefined) throw new Error(`fixture lacks ${key}=${id}`);
  return row;
}

describe("Phase 10 A-P strict contracts", () => {
  it("rejects unknown keys at every layer, including command-string injection", () => {
    const clean = fixture();
    expect(() => parsePhase10ObligationMatrix({ ...clean.matrix, unexpected: true }))
      .toThrow(/keys differ/u);
    expect(() => parsePhase10PacketProtocol({ ...clean.protocol, unexpected: true }))
      .toThrow(/keys differ/u);
    expect(() => parsePhase10CallableRegistry({ ...clean.registry, unexpected: true }))
      .toThrow(/keys differ/u);
    expect(() => parsePhase10ExecutionReceipt({ ...clean.receipt, unexpected: true }))
      .toThrow(/keys differ/u);

    const registry = clone(clean.registry);
    registry.callables[0] = {
      ...(registry.callables[0] as MutableCallable),
      command: "node arbitrary-command.ts",
    };
    expect(() => parsePhase10CallableRegistry(registry)).toThrow(/keys differ/u);
  });

  it("loads and structurally validates the tracked package matrix", () => {
    const matrix = json<MutableMatrix>("research/phase10-obligation-matrix-v1.json");
    expect(phase10ValidateObligationMatrix(matrix)).toEqual({
      pass: true,
      matrixId: "phase10-selected-package-obligations-v1",
      packetCount: 21,
      outputCount: 112,
      checkCount: 140,
      negativeControlCount: 23,
      conditionalGroupCount: 3,
    });

    const registry = json<ArtifactSchemaRegistry>(
      "research/phase10-artifact-schema-registry-v1.json",
    );
    const registeredSchemaIds = [
      ...registry.artifactSchemas,
      ...registry.schemaAliases,
      ...registry.externalSchemaDefinitions,
      ...registry.externalSchemaReservations,
    ].map((row) => row.schemaId);
    expect(new Set(registeredSchemaIds).size).toBe(registeredSchemaIds.length);
    expect(
      [...new Set(matrix.outputs.map((row) => row.artifact?.schemaId))]
        .filter((schemaId): schemaId is string => schemaId !== undefined)
        .filter((schemaId) => !registeredSchemaIds.includes(schemaId)),
    ).toEqual([]);
  });

  it("freezes the tracked A-P bootstrap against its bound schema registry", () => {
    const matrix = json<MutableMatrix>("research/phase10-obligation-matrix-v1.json");
    const protocol = json<MutableProtocol>(
      "research/phase10-execution-v1/packets/a-p/protocol.json",
    );
    const registry = json<MutableRegistry>(
      "research/phase10-execution-v1/packets/a-p/callable-registry.json",
    );
    const frozen = phase10ObligationFreezePreflight(matrix, protocol, registry);
    expect(frozen).toMatchObject({
      pass: true,
      stage: "freeze",
      matrixId: "phase10-selected-package-obligations-v1",
      protocolId: "phase10-a-p-s1-freeze-v1",
      packetId: "a-p",
      receiptId: null,
      terminalState: null,
    });
    expect(frozen.outputIds).toEqual(protocol.registeredOutputIds);
    expect(frozen.checkIds).toEqual(protocol.registeredCheckIds);
    expect(frozen.negativeControlIds).toEqual(protocol.registeredNegativeControlIds);
    expect(frozen.unresolvedCallableIds).toEqual(registry.callables.map((row) => row.callableId));
  });

  it("keeps every registered research output trackable with raw-byte-stable attributes", () => {
    const matrix = json<MutableMatrix>("research/phase10-obligation-matrix-v1.json");
    const paths = [...new Set(matrix.outputs
      .map((row) => (row.artifact as { path?: string } | undefined)?.path)
      .filter((path): path is string => path?.startsWith("research/") === true))].sort();
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      const ignored = spawnSync(
        "git",
        ["check-ignore", "--no-index", "--quiet", "--", path],
        { cwd: process.cwd(), encoding: "utf8" },
      );
      expect(ignored.error, `${path} git check-ignore invocation`).toBeUndefined();
      expect(ignored.status, `${path} must not be ignored`).toBe(1);

      const attribute = spawnSync(
        "git",
        ["check-attr", "text", "--", path],
        { cwd: process.cwd(), encoding: "utf8" },
      );
      expect(attribute.error, `${path} git check-attr invocation`).toBeUndefined();
      expect(attribute.status, `${path} git check-attr status`).toBe(0);
      expect(attribute.stdout.trim(), `${path} must carry -text`)
        .toBe(`${path}: text: unset`);
    }
  });
});

describe("Phase 10 A-P matrix and packet binding", () => {
  it("enforces uniqueness, dependency acyclicity, and exact registered sets", () => {
    const duplicate = clone(fixture().matrix);
    duplicate.outputs.push(clone(duplicate.outputs[0] as Record<string, unknown>));
    expect(() => phase10ValidateObligationMatrix(duplicate))
      .toThrow(/matrix output IDs must be sorted and unique/u);

    const cyclic = json<MutableMatrix>("research/phase10-obligation-matrix-v1.json");
    rowById(cyclic.outputs, "outputId", "out-ai-currency").dependsOnOutputIds = [
      "out-ai-report",
    ];
    expect(() => phase10ValidateObligationMatrix(cyclic))
      .toThrow(/obligation dependency graph contains a cycle/u);

    const disconnected = clone(fixture().matrix);
    rowById(disconnected.outputs, "outputId", "output.reference").dependsOnOutputIds = [];
    expect(() => phase10ValidateObligationMatrix(disconnected))
      .toThrow(/output graph is disconnected/u);

    const roleConflict = clone(fixture().matrix);
    rowById(roleConflict.checks, "checkId", "check.base").callerCallableId = "producer.base";
    expect(() => phase10ValidateObligationMatrix(roleConflict))
      .toThrow(/callable producer.base is assigned conflicting matrix roles/u);

    const clean = fixture();
    const incompleteProtocol = clone(clean.protocol);
    incompleteProtocol.registeredOutputIds = ["output.base"];
    expect(() => phase10ObligationFreezePreflight(
      clean.matrix,
      incompleteProtocol,
      clean.registry,
    )).toThrow(/registered outputs differs; missing \[output.reference\]/u);
  });

  it("requires the independent-reference branch to bind output, evaluator, and control", () => {
    const clean = fixture();
    const matrix = clone(clean.matrix);
    rowById(matrix.checks, "checkId", "check.reference").independentEvaluatorCallableId = null;
    expect(() => phase10ValidateObligationMatrix(matrix))
      .toThrow(/independent-reference lacks a check that binds a branch output/u);
  });

  it("rejects a packet branch whose outputs admit no common receipt terminal state", () => {
    const matrix = clone(fixture().matrix);
    rowById(matrix.outputs, "outputId", "output.base").terminalStates = ["complete"];
    expect(() => phase10ValidateObligationMatrix(matrix))
      .toThrow(/has no common receipt terminal state/u);

    const notApplicableOnly = clone(fixture().matrix);
    rowById(notApplicableOnly.outputs, "outputId", "output.base").terminalStates = [
      "not-applicable",
    ];
    rowById(notApplicableOnly.outputs, "outputId", "output.reference").terminalStates = [
      "not-applicable",
    ];
    expect(() => phase10ValidateObligationMatrix(notApplicableOnly))
      .toThrow(/must be one of complete, fail, pass, refusal/u);

    const unknown = clone(fixture().matrix);
    rowById(unknown.outputs, "outputId", "output.base").terminalStates = ["invented"];
    expect(() => phase10ValidateObligationMatrix(unknown))
      .toThrow(/must be one of complete, fail, pass, refusal/u);

    const unreachable = clone(fixture().matrix);
    rowById(unreachable.outputs, "outputId", "output.base").terminalStates = [
      "pass",
      "refusal",
    ];
    expect(() => phase10ValidateObligationMatrix(unreachable))
      .toThrow(/output.reference lists unreachable receipt terminal states \[fail\]/u);
  });

  it("accepts the explicit reference-refusal branch without inventing an evaluator", () => {
    const clean = fixture();
    const protocol = clone(clean.protocol);
    (protocol.selectedBranches[0] as { groupId: string; branch: string }).branch =
      "reference-refusal";
    protocol.registeredOutputIds = ["output.base", "output.refusal"];
    protocol.registeredCheckIds = ["check.base", "check.refusal"];
    protocol.registeredNegativeControlIds = [];

    const baseCaller = clone(clean.registry.callables.find((row) =>
      row.callableId === "caller.base") as MutableCallable);
    const refusalCaller = clone(clean.registry.callables.find((row) =>
      row.callableId === "caller.reference") as MutableCallable);
    refusalCaller.callableId = "caller.refusal";
    refusalCaller.invokedCheckIds = ["check.refusal"];
    const baseProducer = clone(clean.registry.callables.find((row) =>
      row.callableId === "producer.base") as MutableCallable);
    const refusalProducer = clone(clean.registry.callables.find((row) =>
      row.callableId === "producer.reference") as MutableCallable);
    refusalProducer.callableId = "producer.refusal";
    refusalProducer.producedOutputIds = ["output.refusal"];
    const registry = resolveCallables({
      ...clone(clean.registry),
      callables: [baseCaller, refusalCaller, baseProducer, refusalProducer],
    });

    expect(phase10ObligationRunPreflight(
      clean.matrix,
      protocol,
      registry,
    )).toMatchObject({
      pass: true,
      stage: "run",
      selectedBranches: { "static.reference": "reference-refusal" },
      outputIds: ["output.base", "output.refusal"],
      checkIds: ["check.base", "check.refusal"],
      negativeControlIds: [],
    });

    const receipt = clone(clean.receipt);
    receipt.terminalState = "refusal";
    receipt.producedOutputIds = ["output.base", "output.refusal"];
    receipt.executedCheckIds = ["check.base", "check.refusal"];
    receipt.evaluatedCheckIds = [];
    receipt.executedNegativeControlIds = [];
    expect(phase10ObligationReceiptPreflight(
      clean.matrix,
      protocol,
      registry,
      receipt,
    )).toMatchObject({ pass: true, stage: "receipt", terminalState: "refusal" });
  });
});

describe("Phase 10 A-P callable and receipt preflight", () => {
  it("binds registry bytes and derives availability from concrete schema contracts", () => {
    const clean = fixture();
    const staleProtocol = clone(clean.protocol);
    staleProtocol.artifactSchemaRegistry.sha256 = "0".repeat(64);
    expect(() => phase10ObligationFreezePreflight(
      clean.matrix,
      staleProtocol,
      clean.registry,
    )).toThrow(/artifact-schema registry byte identity differs/u);

    const temporaryRoot = mkdtempSync(join(tmpdir(), "phase10-schema-registry-"));
    try {
      copyCallableModules(clean.registry, temporaryRoot);
      const sourceRegistry = json<MutableArtifactSchemaRegistry>(
        clean.protocol.artifactSchemaRegistry.path,
      );
      const projectedOnly = clone(sourceRegistry);
      projectedOnly.artifactSchemas = projectedOnly.artifactSchemas.filter((row) =>
        row.schemaId !== "phase10-callable-registry-v1");
      const projectedOnlyProtocol = bindTemporarySchemaRegistry(
        clean.protocol,
        projectedOnly,
        temporaryRoot,
      );
      expect(() => phase10ObligationRunPreflight(
        clean.matrix,
        projectedOnlyProtocol,
        resolveCallables(clean.registry, temporaryRoot),
        temporaryRoot,
      )).toThrow(/schemaAvailability concrete IDs differs/u);

      const reserved = clone(sourceRegistry);
      reserved.artifactSchemas = reserved.artifactSchemas.filter((row) =>
        row.schemaId !== "phase10-callable-registry-v1");
      reserved.externalSchemaReservations.push({
        schemaId: "phase10-callable-registry-v1",
        owner: "synthetic promotion fixture",
        state: "reserved",
        requiredBeforePacketIds: ["c0v-static-produce"],
      });
      const availability = reserved.schemaAvailability.find((row) =>
        row.schemaId === "phase10-callable-registry-v1");
      if (availability === undefined) throw new Error("fixture lacks callable-registry availability");
      availability.state = "reserved";
      availability.requiredBeforePacketIds = ["c0v-static-produce"];
      const reservedProtocol = bindTemporarySchemaRegistry(
        clean.protocol,
        reserved,
        temporaryRoot,
      );
      expect(phase10ObligationFreezePreflight(
        clean.matrix,
        reservedProtocol,
        clean.registry,
        temporaryRoot,
      )).toMatchObject({ pass: true, stage: "freeze" });
      expect(() => phase10ObligationRunPreflight(
        clean.matrix,
        reservedProtocol,
        resolveCallables(clean.registry, temporaryRoot),
        temporaryRoot,
      )).toThrow(/run preflight found reserved artifact schema phase10-callable-registry-v1/u);
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("allows planned callables only at freeze and verifies resolved module identities for launch", () => {
    const clean = fixture();
    const frozen = phase10ObligationFreezePreflight(
      clean.matrix,
      clean.protocol,
      clean.registry,
    );
    expect(frozen).toMatchObject({ pass: true, stage: "freeze" });
    expect(frozen.unresolvedCallableIds).toEqual(clean.registry.callables.map((row) => row.callableId));
    expect(() => phase10ObligationRunPreflight(
      clean.matrix,
      clean.protocol,
      clean.registry,
    )).toThrow(/run preflight found unresolved callable/u);

    const registry = resolveCallables(clean.registry);
    expect(phase10ObligationRunPreflight(
      clean.matrix,
      clean.protocol,
      registry,
    )).toMatchObject({
      pass: true,
      stage: "run",
      unresolvedCallableIds: [],
    });

    const stale = clone(registry);
    (stale.callables[0] as MutableCallable).identity = {
      ...((stale.callables[0] as MutableCallable).identity as { byteLength: number; sha256: string }),
      sha256: "0".repeat(64),
    };
    expect(() => phase10ObligationRunPreflight(
      clean.matrix,
      clean.protocol,
      stale,
    ))
      .toThrow(/module byte identity differs/u);

    const missingExport = clone(registry);
    (missingExport.callables[0] as MutableCallable).exportName =
      "definitelyMissingPhase10Export";
    expect(() => phase10ObligationRunPreflight(
      clean.matrix,
      clean.protocol,
      missingExport,
    )).toThrow(/is not a directly exported function/u);

    for (const { modulePath, exportName, source, error } of [
      {
        modulePath: "runner/src/non-runtime-default-export.ts",
        exportName: "namedDefaultFixture",
        source: "export default function namedDefaultFixture(): void {}\n",
        error: /is not a directly exported function/u,
      },
      {
        modulePath: "runner/src/non-runtime-declare-export.ts",
        exportName: "declaredOnlyFixture",
        source: "export declare function declaredOnlyFixture(): void;\n",
        error: /is not a directly exported function/u,
      },
      {
        modulePath: "runner/src/non-runtime-aliased-default-export.ts",
        exportName: "default",
        source: "function aliasedDefaultFixture(): void {}\nexport { aliasedDefaultFixture as default };\n",
        error: /exportName must name a direct non-default export/u,
      },
      {
        modulePath: "runner/src/non-runtime-syntax-error.ts",
        exportName: "syntacticallyBrokenFixture",
        source: "export function syntacticallyBrokenFixture(): void {}\nconst broken = ;\n",
        error: /module contains TypeScript parse errors/u,
      },
    ] as const) {
      const temporaryRoot = mkdtempSync(join(tmpdir(), "phase10-export-check-"));
      const nonRuntime = clone(clean.registry);
      for (const callable of nonRuntime.callables) {
        const destination = resolve(temporaryRoot, callable.modulePath);
        mkdirSync(dirname(destination), { recursive: true });
        copyFileSync(resolve(callable.modulePath), destination);
      }
      const schemaRegistryDestination = resolve(
        temporaryRoot,
        clean.protocol.artifactSchemaRegistry.path,
      );
      mkdirSync(dirname(schemaRegistryDestination), { recursive: true });
      copyFileSync(
        resolve(clean.protocol.artifactSchemaRegistry.path),
        schemaRegistryDestination,
      );
      (nonRuntime.callables[0] as MutableCallable).modulePath = modulePath;
      (nonRuntime.callables[0] as MutableCallable).exportName = exportName;
      const nonRuntimePath = resolve(temporaryRoot, modulePath);
      mkdirSync(dirname(nonRuntimePath), { recursive: true });
      writeFileSync(nonRuntimePath, source, "utf8");
      expect(() => phase10ObligationRunPreflight(
        clean.matrix,
        clean.protocol,
        resolveCallables(nonRuntime, temporaryRoot),
        temporaryRoot,
      )).toThrow(error);
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("rejects evaluator modules aliased to active producers or negative controls", () => {
    const clean = fixture();
    const producerAlias = clone(clean.registry);
    const producer = producerAlias.callables.find((row) => row.role === "producer");
    const evaluator = producerAlias.callables.find((row) => row.role === "independent-evaluator");
    if (producer === undefined || evaluator === undefined) {
      throw new Error("fixture lacks producer/evaluator callables");
    }
    evaluator.modulePath = producer.modulePath;
    evaluator.exportName = producer.exportName;
    expect(() => phase10ObligationRunPreflight(
      clean.matrix,
      clean.protocol,
      resolveCallables(producerAlias),
    )).toThrow(/evaluator evaluator.reference shares active producer module producer.base/u);

    const controlAlias = clone(clean.registry);
    const control = controlAlias.callables.find((row) => row.role === "negative-control");
    const independent = controlAlias.callables.find((row) => row.role === "independent-evaluator");
    if (control === undefined || independent === undefined) {
      throw new Error("fixture lacks control/evaluator callables");
    }
    control.modulePath = independent.modulePath;
    control.exportName = independent.exportName;
    expect(() => phase10ObligationRunPreflight(
      clean.matrix,
      clean.protocol,
      resolveCallables(controlAlias),
    )).toThrow(/evaluator evaluator.reference shares negative-control module negative.reference/u);
  });

  it("derives receipt completion from exact executed sets and admitted terminal states", () => {
    const clean = fixture();
    const registry = resolveCallables(clean.registry);
    expect(phase10ObligationReceiptPreflight(
      clean.matrix,
      clean.protocol,
      registry,
      clean.receipt,
    )).toMatchObject({ pass: true, stage: "receipt", terminalState: "pass" });

    const incomplete = clone(clean.receipt);
    incomplete.executedCheckIds = ["check.base"];
    expect(() => phase10ObligationReceiptPreflight(
      clean.matrix,
      clean.protocol,
      registry,
      incomplete,
    )).toThrow(/receipt executed checks differs; missing \[check.reference\]/u);

    const inadmissible = clone(clean.receipt);
    inadmissible.terminalState = "complete";
    expect(() => phase10ObligationReceiptPreflight(
      clean.matrix,
      clean.protocol,
      registry,
      inadmissible,
    )).toThrow(/terminal state complete is not admitted by output output.base/u);
  });

  it("executes the missing-producer fixture and refuses the witnessed removal", () => {
    const clean = fixture();
    const negative = json<RemoveCallableFixture>(resolve(FIXTURE_ROOT, "missing-producer.json"));
    expect(negative).toMatchObject({
      schema: "phase10-ap-negative-fixture-v1",
      fixtureId: "missing-producer",
      mutation: { kind: "remove-callable", callableId: "producer.reference" },
    });

    const registry = clone(clean.registry);
    const before = registry.callables.map((row) => row.callableId);
    registry.callables = registry.callables.filter((row) =>
      row.callableId !== negative.mutation.callableId);
    const after = registry.callables.map((row) => row.callableId);
    expect(before.filter((callableId) => !after.includes(callableId)),
      "fixture must remove exactly its named producer independently of preflight")
      .toEqual([negative.mutation.callableId]);
    expect(after).toHaveLength(before.length - 1);

    expect(() => phase10ObligationRunPreflight(
      clean.matrix,
      clean.protocol,
      resolveCallables(registry),
    )).toThrow(/output output.reference has no callable producer producer.reference/u);
  });

  it("executes the uncalled-check fixture and refuses the witnessed missing invocation", () => {
    const clean = fixture();
    const negative = json<RemoveInvokedCheckFixture>(resolve(FIXTURE_ROOT, "uncalled-check.json"));
    expect(negative).toMatchObject({
      schema: "phase10-ap-negative-fixture-v1",
      fixtureId: "uncalled-check",
      mutation: {
        kind: "remove-invoked-check",
        callableId: "caller.reference",
        checkId: "check.reference",
      },
    });

    const registry = clone(clean.registry);
    const caller = registry.callables.find((row) =>
      row.callableId === negative.mutation.callableId);
    if (caller === undefined) throw new Error("uncalled-check fixture names an absent caller");
    const rosterBefore = registry.callables.map((row) => row.callableId);
    const checksBefore = [...caller.invokedCheckIds];
    caller.invokedCheckIds = caller.invokedCheckIds.filter((checkId) =>
      checkId !== negative.mutation.checkId);
    expect(checksBefore.filter((checkId) => !caller.invokedCheckIds.includes(checkId)),
      "fixture must remove exactly its named invocation independently of preflight")
      .toEqual([negative.mutation.checkId]);
    expect(registry.callables.map((row) => row.callableId)).toEqual(rosterBefore);

    expect(() => phase10ObligationRunPreflight(
      clean.matrix,
      clean.protocol,
      resolveCallables(registry),
    )).toThrow(/registered check check.reference is uncalled by caller.reference/u);
  });
});
