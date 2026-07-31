/*
 * Independent predicates for the Part Two teaching models.
 *
 * The browser widgets publish raw fixtures and rendered state. These functions
 * derive the verdict from those bytes; they never consume a widget-supplied
 * pass/fail flag.
 */

import { createHash } from "node:crypto";
import {
  CHECKPOINT_TEACHING_CASES_SHA256,
} from "./checkpoint-production-oracle.mjs";

export const PHASE6_STATUS_COMMIT =
  "8c781b166db2c72d2fa86cef001e2e8c48ac96c3";
export const PHASE6_ARM2_VALUES_PIN_COMMIT =
  "0cb52bf821073b7bda79cddc0c47708cd6ecc239";
export const PHASE6_ARM2_PROTOCOL_SHA256 =
  "b09a932ec7345eddf838ee2de1c0ef4731212c625a1069e62193c06ae950fdec";
export const PHASE6_ARM2_VALUES_SHA256 =
  "13e678d5eec467a391958a18c71c8d170900d6efd0d5c23bb4362d863b9acd76";

const TIMELINE_GG_FIXTURE = Object.freeze({
  trigger: { kind: "zExtent", value: 25 },
  beforeEnvironment: {
    rho: 0.1,
    phi: 0,
    kappa: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    mu: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01],
    ggThreshBeta: [1, 2, 0.5, 2, 0.5, 0.5, 1],
  },
  afterEnvironment: {
    rho: 0.1,
    phi: 0,
    kappa: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
    mu: [0.001, 0.001, 0.001, 0.001, 0.001, 0.001, 0.001],
    ggThreshBeta: [5, 2.4, 2.4, 2.4, 1, 1, 1],
  },
  state: {
    tick: 42,
    a: [1, 0, 0, 1, 0, 0],
    b: [1, 0.25, 0.5, 1, 0.125, 0.375],
    d: [0, 0.75, 0.5, 0, 0.875, 0.625],
  },
});

const TIMELINE_LK_FIXTURE = Object.freeze({
  trigger: { kind: "tick", value: 42 },
  beforeEnvironment: { tempC: -15, sigmaInfinity: 0.002 },
  afterEnvironment: { tempC: -5, sigmaInfinity: 0.003 },
  paramSet: "CAK",
  facetParametersByTempC: [
    {
      tempC: -15,
      basal: { sigma0: 0.024, prefactor: 1 },
      prism: { sigma0: 0.032, prefactor: 1 },
    },
    {
      tempC: -5,
      basal: { sigma0: 0.007, prefactor: 1 },
      prism: { sigma0: 0.0027, prefactor: 0.18 },
    },
  ],
  pressurePa: 101325,
  dxM: 0.35e-6,
  state: {
    tick: 42,
    simTimeSeconds: 6.25,
    a: [0, 0, 0, 1, 0],
    f: [0.125, 0.25, 0.5, 1, 0],
  },
  exampleInterfaceStep: {
    deltaTimeSeconds: 0.2,
  },
  cells: [
    {
      id: "interior-low",
      kind: "active interior",
      active: true,
      attached: false,
      wall: false,
      shell: false,
      sigmaOld: 0.002,
    },
    {
      id: "interior-high",
      kind: "active interior",
      active: true,
      attached: false,
      wall: false,
      shell: false,
      sigmaOld: 0.25,
    },
    {
      id: "dirichlet-shell",
      kind: "active Dirichlet shell",
      active: true,
      attached: false,
      wall: false,
      shell: true,
      sigmaOld: 0.002,
    },
    {
      id: "attached-ice",
      kind: "attached ice",
      active: false,
      attached: true,
      wall: false,
      shell: false,
      sigmaOld: 0,
    },
    {
      id: "inactive-wall",
      kind: "inactive wall",
      active: false,
      attached: false,
      wall: true,
      shell: false,
      sigmaOld: 0.4,
    },
  ],
  fillSegments: [
    {
      label: "interface step before event",
      tempC: -15,
      placedFillIceCells: 0.18,
    },
    {
      label: "interface step after event",
      tempC: -5,
      placedFillIceCells: 0.07,
    },
  ],
});

const CHECKPOINT_STAGES = Object.freeze([
  "framing",
  "header",
  "fields",
  "state",
  "evidence-context",
]);

const CHECKPOINT_EXPECTATIONS = Object.freeze({
  "clean-lk-v2": Object.freeze({
    failureStage: "none",
    codecOutcome: "accepted",
    contextOutcome: "accepted",
    target: "none",
  }),
  "corrupt-magic": Object.freeze({
    failureStage: "framing",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "bytes[0]",
  }),
  "missing-surface-policy": Object.freeze({
    failureStage: "header",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "header.surfacePolicy",
  }),
  "short-fill-descriptor": Object.freeze({
    failureStage: "fields",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "header.fields[1].length",
  }),
  "negative-density": Object.freeze({
    failureStage: "state",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "payload.sigma[activeUnattachedCell]",
  }),
  "reflecting-diagnostic": Object.freeze({
    failureStage: "evidence-context",
    codecOutcome: "accepted",
    contextOutcome: "rejected",
    target: "header.farField",
  }),
  "legacy-v1-clean": Object.freeze({
    failureStage: "evidence-context",
    codecOutcome: "accepted",
    contextOutcome: "rejected",
    target: "none",
  }),
  "legacy-v1-policy-injected": Object.freeze({
    failureStage: "header",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "header.surfacePolicy",
  }),
  "registered-config-mismatch": Object.freeze({
    failureStage: "evidence-context",
    codecOutcome: "accepted",
    contextOutcome: "rejected",
    target: "header.surfacePolicy",
  }),
  "unknown-gg-metric": Object.freeze({
    failureStage: "header",
    codecOutcome: "rejected",
    contextOutcome: "not-run",
    target: "header.metrics.depletionRatio",
  }),
});

const TRANSFER_AXES = Object.freeze([
  "claim",
  "modelArm",
  "paramSet",
  "temperatureCases",
  "sigmaCases",
  "waterFraction",
  "farField",
  "surfacePolicy",
  "domainShape",
  "domainStudy",
  "registeredDomain",
  "dxUm",
  "measurementExtent",
  "stopValidity",
  "domainContactGuard",
  "cflFill",
  "pressurePa",
  "latentHeating",
  "timelineSchedule",
  "noiseEpsilon",
  "rngSeed",
  "seedShape",
  "seedRadius",
  "seedThickness",
  "seedSites",
  "seedEnsemble",
  "relaxTol",
  "divTol",
  "relaxMaxSweeps",
  "stepCap",
  "habitMetric",
  "codeVersion",
  "engine",
  "runtimeIdentity",
  "hostScope",
  "workload",
]);
export const TRANSFER_AXIS_COUNT = TRANSFER_AXES.length;

const TRANSFER_AXIS_RECORDS = Object.freeze([
  { key: "claim", label: "claim · requested inference" },
  { key: "modelArm", label: "physics · model arm" },
  { key: "paramSet", label: "physics · parameter set" },
  { key: "temperatureCases", label: "cases · temperatures" },
  { key: "sigmaCases", label: "cases · far-field supersaturations" },
  { key: "waterFraction", label: "cases · water-relative fraction" },
  { key: "farField", label: "boundary · far field" },
  { key: "surfacePolicy", label: "surface · coupled policy" },
  { key: "domainShape", label: "domain · shape" },
  { key: "domainStudy", label: "domain · ladder" },
  { key: "registeredDomain", label: "domain · budget being supported" },
  { key: "dxUm", label: "grid · spacing" },
  { key: "measurementExtent", label: "measurement · extent" },
  { key: "stopValidity", label: "measurement · valid stop" },
  { key: "domainContactGuard", label: "measurement · contact guard" },
  { key: "cflFill", label: "numerics · fill-CFL" },
  { key: "pressurePa", label: "physics · pressure" },
  { key: "latentHeating", label: "physics · latent heating" },
  { key: "timelineSchedule", label: "environment · within-run history" },
  { key: "noiseEpsilon", label: "stochastic · noise amplitude" },
  { key: "rngSeed", label: "stochastic · RNG seed" },
  { key: "seedShape", label: "initial state · seed shape" },
  { key: "seedRadius", label: "initial state · seed radius" },
  { key: "seedThickness", label: "initial state · seed thickness" },
  { key: "seedSites", label: "initial state · seeded sites" },
  { key: "seedEnsemble", label: "statistics · seed ensemble" },
  { key: "relaxTol", label: "numerics · iterate tolerance and norm" },
  { key: "divTol", label: "numerics · divergence tolerance and norm" },
  { key: "relaxMaxSweeps", label: "numerics · relaxation cap" },
  { key: "stepCap", label: "execution · interface-step safety cap" },
  { key: "habitMetric", label: "claim · habit metric" },
  { key: "codeVersion", label: "provenance · executed code" },
  { key: "engine", label: "execution · engine / arithmetic" },
  { key: "runtimeIdentity", label: "provenance · Node/V8 identity" },
  { key: "hostScope", label: "execution · portability scope" },
  { key: "workload", label: "execution · study workload" },
]);

const TRANSFER_TARGET = Object.freeze({
  claim: "domain convergence for the registered no-SDAK Phase 6 habit-class sweep",
  modelArm: "no SDAK",
  paramSet: "CAK",
  temperatureCases: "warm -5 °C; cold -15 °C",
  sigmaCases: "warm 0.007500; cold 0.023550",
  waterFraction: "f=0.15 of Table 2.1 water saturation at each temperature",
  farField: "monopole-matched",
  surfacePolicy: "aggregate-hv-g1h1-v6",
  domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
  domainStudy: "N=40,48,56,64,80",
  registeredDomain: "N=48 (48×48×48)",
  dxUm: "0.35 µm",
  measurementExtent: "largestExtent=max(tExtent,zExtent)=21 (7.35 µm)",
  stopValidity: "size-target; final largestExtent >=21; every other stop reason is invalid",
  domainContactGuard: "exclude largestExtent/N >0.65; collision guard only",
  cflFill: "0.1",
  pressurePa: "101325 Pa (1 atm)",
  latentHeating: "not applied; carried as a stated systematic",
  timelineSchedule: "none; temperature and sigmaInfinity stay constant within each run; no events or ramps",
  noiseEpsilon: "0 (off)",
  rngSeed: "1 (pinned although noise is off)",
  seedShape: "centred canonical hexagonal plate",
  seedRadius: "2 lattice cells (0.7 µm at registered dx)",
  seedThickness: "1 layer",
  seedSites: "19",
  seedEnsemble: "1 deterministic run per (temperature, supersaturation, N)",
  relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
  divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
  relaxMaxSweeps: "200000 (refusal cap)",
  stepCap: "100000 (safety cap; a valid run must stop earlier on size-target)",
  habitMetric: "AR=zExtent/tExtent; plate <=1/1.5; column >=1.5; otherwise neutral",
  codeVersion: "record execution commit; require Phase 6 freeze e2f1bfc as its ancestor",
  engine: "CPU float64 oracle",
  runtimeIdentity: "recorded per run: Node v24.13.1; V8 13.6.233.17-node.40",
  hostScope: "registered win32 x64 host; cross-platform reproducibility not established",
  workload: "2 cases × 5 domain sizes = 10 runs; grow each to size-target extent 21",
});

export const TRANSFER_SOURCE_AUTHORITY = Object.freeze({
  revision: PHASE6_STATUS_COMMIT,
  blobs: Object.freeze({
    "research/phase6-convergence.md": "a509b0d5111368c01281a9d0b359fb89ae6bc03c",
    "runner/src/phase6-protocol.ts": "6d1e1b7a390b0b6b4de4d722e1d6e64306f7d8d2",
    "runner/src/phase6-crossplatform.ts": "2840d4c287503e9cf24ab543b83afb5274a1daf4",
    "runner/src/phase6-sweep.ts": "5cb0cfa48380695fdc6ffcbd91a08d9516b41861",
    "runner/src/grow-lk-defaults.ts": "51844d02d3c9e7d59be2156cc2a3ddc6160eba4c",
    "runner/test/phase6-protocol.test.ts": "84b3d879bac37fd5ecf59f3269bc28ee43481baa",
    "runner/test/phase6-sweep.test.ts": "4a5e93c1de898a08dc24690fb76e7391f457504d",
  }),
});

const TRANSFER_ROWS = Object.freeze({
  "required-shape": Object.freeze({
    id: "required-shape",
    label: "Exact-config study shape",
    evidenceStatus: "requirement example, not executed evidence",
    source: "AGENTS.md Rule 11",
    config: { ...TRANSFER_TARGET },
  }),
  "cak-a1-domain": Object.freeze({
    id: "cak-a1-domain",
    label: "Historical extent-21 domain ladder",
    evidenceStatus: "measured under superseded inputs; execution revision and runtime were not recorded",
    source: "research/phase6-convergence.md §§opening, 1.2, 5 (result recorded at 675288f); ADR 0031",
    config: {
      claim: "domain convergence for the registered no-SDAK Phase 6 habit-class sweep",
      modelArm: "no SDAK",
      paramSet: "CAK_A1",
      temperatureCases: "warm -5 °C; cold -15 °C",
      sigmaCases: "warm 0.007500; cold 0.023550",
      waterFraction: "f=0.15 of Table 2.1 water saturation at each temperature",
      farField: "monopole-matched",
      surfacePolicy: "aggregate-hv-g1h1-v6",
      domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
      domainStudy: "N=40,48,56,64,80",
      registeredDomain: "N=48 (48×48×48)",
      dxUm: "0.35 µm",
      measurementExtent: "largestExtent=max(tExtent,zExtent)=21 (7.35 µm)",
      stopValidity: "size-target; final largestExtent >=21; every other stop reason is invalid",
      domainContactGuard: "exclude largestExtent/N >0.65; collision guard only",
      cflFill: "0.1",
      pressurePa: "not recorded by cited evidence (pressure unknown)",
      latentHeating: "not recorded by cited evidence",
      timelineSchedule: "not recorded by cited evidence (within-run history unknown)",
      noiseEpsilon: "0 (off)",
      rngSeed: "not recorded by cited evidence (noise is off)",
      seedShape: "centred canonical hexagonal plate",
      seedRadius: "2 lattice cells (0.7 µm at registered dx)",
      seedThickness: "1 layer",
      seedSites: "19",
      seedEnsemble: "1 deterministic run per (temperature, supersaturation, N)",
      relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
      divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
      relaxMaxSweeps: "not recorded by cited evidence",
      stepCap: "not recorded by cited evidence",
      habitMetric: "AR=zExtent/tExtent; plate <=1/1.5; column >=1.5; otherwise neutral",
      codeVersion: "results recorded at 675288f; execution commit not recorded; freeze ancestry unverified",
      engine: "not recorded by cited evidence (arithmetic/runtime unknown)",
      runtimeIdentity: "not recorded by cited evidence (Node/V8 unknown)",
      hostScope: "registered win32 x64 host; cross-platform reproducibility not established",
      workload: "2 cases × 5 domain sizes = 10 runs; grow each to size-target extent 21",
    },
  }),
  "extent-15-domain": Object.freeze({
    id: "extent-15-domain",
    label: "Earlier convenient-size ladder",
    evidenceStatus: "superseded and off measurement size",
    source: "research/phase6-convergence.md §1.1",
    config: {
      claim: "domain convergence at a convenient, later-superseded measurement size",
      modelArm: "no SDAK",
      paramSet: "CAK_A1",
      temperatureCases: "warm -5 °C; cold -15 °C",
      sigmaCases: "warm 0.007500; cold 0.023550",
      waterFraction: "f=0.15 of Table 2.1 water saturation at each temperature",
      farField: "monopole-matched",
      surfacePolicy: "aggregate-hv-g1h1-v6",
      domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
      domainStudy: "N=28,32,40,48,64",
      registeredDomain: "no budget result at the target configuration",
      dxUm: "0.35 µm",
      measurementExtent: "largestExtent=max(tExtent,zExtent)=15 (5.25 µm)",
      stopValidity: "size-target at largestExtent >=15; not the registered measurement size",
      domainContactGuard: "exclude largestExtent/N >0.65; collision guard only",
      cflFill: "not recorded by cited evidence",
      pressurePa: "not recorded by cited evidence (pressure unknown)",
      latentHeating: "not recorded by cited evidence",
      timelineSchedule: "not recorded by cited evidence (within-run history unknown)",
      noiseEpsilon: "0 (off)",
      rngSeed: "not recorded by cited evidence (noise is off)",
      seedShape: "centred canonical hexagonal plate",
      seedRadius: "2 lattice cells (0.7 µm at registered dx)",
      seedThickness: "1 layer",
      seedSites: "19",
      seedEnsemble: "1 deterministic run per (temperature, supersaturation, N)",
      relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
      divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
      relaxMaxSweeps: "not recorded by cited evidence",
      stepCap: "not recorded by cited evidence",
      habitMetric: "AR=zExtent/tExtent; plate <=1/1.5; column >=1.5; otherwise neutral",
      codeVersion: "execution commit not recorded in cited extent-15 study; freeze ancestry unverified",
      engine: "not recorded by cited evidence (arithmetic/runtime unknown)",
      runtimeIdentity: "not recorded by cited evidence (Node/V8 unknown)",
      hostScope: "registered win32 x64 host; cross-platform reproducibility not established",
      workload: "2 cases × 5 domain sizes = 10 runs; grow each to size-target extent 15",
    },
  }),
  "dirichlet-calibration": Object.freeze({
    id: "dirichlet-calibration",
    label: "Fixed-value-wall calibration",
    evidenceStatus: "different boundary experiment",
    source: "ADR 0024; solver-cpu/test/monopole-far-field.test.ts at 8c781b1",
    config: {
      claim: "far-field domain-dependence A/B after a fixed step count",
      modelArm: "no SDAK",
      paramSet: "CAK_A1",
      temperatureCases: "warm -5 °C only",
      sigmaCases: "0.007500 only",
      waterFraction: "not recorded by cited evidence; raw sigmaInfinity=0.007500",
      farField: "dirichlet versus monopole-matched A/B",
      surfacePolicy: "aggregate-hv-g1h1-v6",
      domainShape: "centred hexPrism active domain in a cubic N×N×N lattice",
      domainStudy: "N=28,40",
      registeredDomain: "no registered sweep-domain budget",
      dxUm: "0.35 µm",
      measurementExtent: "not size-controlled; sampled after 60 interface steps",
      stopValidity: "completed-interface-step cap at 60; not size-target",
      domainContactGuard: "not the registered size-target/contact experiment",
      cflFill: "0.1",
      pressurePa: "101325 Pa (1 atm)",
      latentHeating: "not represented in cited fixture",
      timelineSchedule: "none; temperature and sigmaInfinity stay constant within each run; no events or ramps",
      noiseEpsilon: "0 (off)",
      rngSeed: "1 (pinned although noise is off)",
      seedShape: "centred canonical hexagonal plate",
      seedRadius: "2 lattice cells (0.7 µm at registered dx)",
      seedThickness: "1 layer",
      seedSites: "19",
      seedEnsemble: "1 deterministic run per (far field, N)",
      relaxTol: "1e-8 relative max-norm of successive-iterate change / sigmaInfinity",
      divTol: "1e-6 relative divergence identity",
      relaxMaxSweeps: "200000 (refusal cap)",
      stepCap: "60 completed interface steps",
      habitMetric: "attached count and AR after 60 steps; not the registered habit measurement",
      codeVersion: "test source at main@8c781b1; no evidence execution commit recorded",
      engine: "CPU float64 oracle",
      runtimeIdentity: "not recorded for cited test execution (Node/V8 unknown)",
      hostScope: "host/runtime not pinned by the cited test result",
      workload: "2 far fields × 2 domain sizes × 60 interface steps = 4 runs",
    },
  }),
  "gpu-four-step": Object.freeze({
    id: "gpu-four-step",
    label: "Phase 5 GPU fixture",
    evidenceStatus: "certified only for its four-step fixture",
    source: "runner/src/phase5-protocol.ts; Phase 6 plan",
    config: {
      claim: "Phase 5 CPU/GPU conformance for one four-step fixture",
      modelArm: "no SDAK",
      paramSet: "CAK_A1",
      temperatureCases: "warm -5 °C only",
      sigmaCases: "0.002000 only",
      waterFraction: "not a registered Table 2.1 fraction",
      farField: "dirichlet",
      surfacePolicy: "aggregate-hv-g1h1-v5",
      domainShape: "hexPrism active domain in a 24×24×18 lattice",
      domainStudy: "24×24×18 single fixture",
      registeredDomain: "no Phase 6 domain budget",
      dxUm: "0.35 µm",
      measurementExtent: "not measured",
      stopValidity: "completed-interface-step cap at 4; not size-target",
      domainContactGuard: "not the registered Phase 6 contact experiment",
      cflFill: "0.1",
      pressurePa: "101325 Pa (1 atm)",
      latentHeating: "not represented in cited fixture",
      timelineSchedule: "none; temperature and sigmaInfinity stay constant within each run; no events or ramps",
      noiseEpsilon: "0 (off)",
      rngSeed: "1 (pinned although noise is off)",
      seedShape: "centred canonical hexagonal plate",
      seedRadius: "2 lattice cells (0.7 µm at registered dx)",
      seedThickness: "1 layer",
      seedSites: "19",
      seedEnsemble: "1 deterministic fixture run per engine",
      relaxTol: "1e-9 relative max-norm of successive-iterate change / sigmaInfinity",
      divTol: "1e-7 relative |injection + smoother drift - surface exchange| / |surface exchange|",
      relaxMaxSweeps: "200000 (refusal cap)",
      stepCap: "4 completed interface steps",
      habitMetric: "CPU/GPU conformance observables; not a domain-habit measurement",
      codeVersion: "Phase 5 evidence revision; not the Phase 6 freeze/execution identity",
      engine: "GPU float32 against CPU float64",
      runtimeIdentity: "Playwright 1.61.1 / Chromium 1228; not the Phase 6 Node/V8 identity",
      hostScope: "Phase 5 Windows D3D12 fixture scope",
      workload: "one 24×24×18 fixture for 4 interface steps",
    },
  }),
});

const TRANSFER_EXPECTED_MISMATCHES = Object.freeze({
  "required-shape": Object.freeze([]),
  "cak-a1-domain": Object.freeze([
    "paramSet",
    "pressurePa",
    "latentHeating",
    "timelineSchedule",
    "rngSeed",
    "relaxMaxSweeps",
    "stepCap",
    "codeVersion",
    "engine",
    "runtimeIdentity",
  ]),
  "extent-15-domain": Object.freeze([
    "claim",
    "paramSet",
    "domainStudy",
    "registeredDomain",
    "measurementExtent",
    "stopValidity",
    "cflFill",
    "pressurePa",
    "latentHeating",
    "timelineSchedule",
    "rngSeed",
    "relaxMaxSweeps",
    "stepCap",
    "codeVersion",
    "engine",
    "runtimeIdentity",
    "workload",
  ]),
  "dirichlet-calibration": Object.freeze([
    "claim",
    "paramSet",
    "temperatureCases",
    "sigmaCases",
    "waterFraction",
    "farField",
    "domainStudy",
    "registeredDomain",
    "measurementExtent",
    "stopValidity",
    "domainContactGuard",
    "latentHeating",
    "seedEnsemble",
    "relaxTol",
    "divTol",
    "stepCap",
    "habitMetric",
    "codeVersion",
    "runtimeIdentity",
    "hostScope",
    "workload",
  ]),
  "gpu-four-step": Object.freeze([
    "claim",
    "paramSet",
    "temperatureCases",
    "sigmaCases",
    "waterFraction",
    "farField",
    "surfacePolicy",
    "domainShape",
    "domainStudy",
    "registeredDomain",
    "measurementExtent",
    "stopValidity",
    "domainContactGuard",
    "latentHeating",
    "seedEnsemble",
    "stepCap",
    "habitMetric",
    "codeVersion",
    "engine",
    "runtimeIdentity",
    "hostScope",
    "workload",
  ]),
});

const LEDGER_EXPECTATIONS = Object.freeze({
  "cold-fixed-point": Object.freeze({
    numericalCloses: true,
    demandCloses: true,
    holeFillSeparate: false,
  }),
  "clipped-demand": Object.freeze({
    numericalCloses: true,
    demandCloses: true,
    holeFillSeparate: false,
  }),
  "hole-fill-separate": Object.freeze({
    numericalCloses: true,
    demandCloses: true,
    holeFillSeparate: true,
  }),
  "missing-excess": Object.freeze({
    numericalCloses: true,
    demandCloses: false,
    holeFillSeparate: false,
  }),
  "numerical-mismatch": Object.freeze({
    numericalCloses: false,
    demandCloses: true,
    holeFillSeparate: false,
  }),
});

const LEDGER_FIXTURES = Object.freeze({
  "cold-fixed-point": Object.freeze({
    id: "cold-fixed-point",
    label: "Cold fixed point",
    note: "The numerical terms are the retained ADR 0013 checkpoint witness.",
    shellInjection: 3.679402302324622e-7,
    smootherDrift: -1.1395225041344048e-13,
    boundaryExchange: 3.679401162802118e-7,
    divTol: 1e-7,
    localExchangeSign: -1,
    placedFillUnits: 80000,
    saturationExcessUnits: 20000,
    kineticDemandUnits: 100000,
    holeFillDeficitUnits: 0,
  }),
  "clipped-demand": Object.freeze({
    id: "clipped-demand",
    label: "Saturating cell",
    note: "The interface example records the part of demand that cannot be placed.",
    shellInjection: 3.679402302324622e-7,
    smootherDrift: -1.1395225041344048e-13,
    boundaryExchange: 3.679401162802118e-7,
    divTol: 1e-7,
    localExchangeSign: -1,
    placedFillUnits: 65000,
    saturationExcessUnits: 35000,
    kineticDemandUnits: 100000,
    holeFillDeficitUnits: 0,
  }),
  "hole-fill-separate": Object.freeze({
    id: "hole-fill-separate",
    label: "Hole-fill event",
    note: "Geometric hole fill is reported beside, never inside, the kinetic identity.",
    shellInjection: 3.679402302324622e-7,
    smootherDrift: -1.1395225041344048e-13,
    boundaryExchange: 3.679401162802118e-7,
    divTol: 1e-7,
    localExchangeSign: -1,
    placedFillUnits: 100000,
    saturationExcessUnits: 0,
    kineticDemandUnits: 100000,
    holeFillDeficitUnits: 250000,
  }),
  "missing-excess": Object.freeze({
    id: "missing-excess",
    label: "Drop the excess",
    note: "Negative control: the numerical solve still closes while demand bookkeeping fails.",
    shellInjection: 3.679402302324622e-7,
    smootherDrift: -1.1395225041344048e-13,
    boundaryExchange: 3.679401162802118e-7,
    divTol: 1e-7,
    localExchangeSign: -1,
    placedFillUnits: 65000,
    saturationExcessUnits: 0,
    kineticDemandUnits: 100000,
    holeFillDeficitUnits: 0,
  }),
  "numerical-mismatch": Object.freeze({
    id: "numerical-mismatch",
    label: "Break the solve",
    note: "Negative control: demand bookkeeping closes while the numerical identity fails.",
    shellInjection: 4e-6,
    smootherDrift: 0,
    boundaryExchange: 3e-6,
    divTol: 1e-7,
    localExchangeSign: -1,
    placedFillUnits: 80000,
    saturationExcessUnits: 20000,
    kineticDemandUnits: 100000,
    holeFillDeficitUnits: 0,
  }),
});

const PHASE6_EXPECTED_RECORDS = Object.freeze({
  historical: Object.freeze({
    id: "historical",
    label: "Arm 1 report snapshot",
    authority: {
      artifact: "research/phase6-sweep-report.md",
      executionCommit: "390fe35",
      snapshotMeaning: "what the published Arm 1 report said when written",
    },
    arm1: {
      runState: "complete",
      points: "204/204",
      measuredHeadline: "3/90",
      evidenceClass: "measured result with verified provenance; not gate evidence",
      reportInventory: "report text says no independent verifier and six controls not executed",
    },
    arm2: {
      runState: "not present in this snapshot",
      measurement: "none",
    },
    closure: {
      flaglessCanonicalGate: "not run",
      independentReview: "not complete",
      crossPlatformArm64: "not run",
    },
  }),
  current: Object.freeze({
    id: "current",
      label: "Authority at the audit cutoff",
    authority: {
      commit: PHASE6_STATUS_COMMIT,
      verifierCommit: "990840a",
      inputRepairCommit: "b701285",
      sourceFingerprintCommit: "154359d",
      arm2ValuesFreezeCommit: "483f7ee",
      arm2ValuesPinCommit: "0cb52bf",
      arm2CombinedProtocolCommit: "8c781b1",
      progressDisagreement: "docs/PROGRESS.md still asks for the already-landed freeze; commits 483f7ee, 0cb52bf and 8c781b1 are the later artifact record",
      liveObservation: "2026-07-30 10:23 PDT: corrected Arm 2 sweep running; local output still mutable and incomplete",
      snapshotMeaning: "committed authority through 8c781b1 plus a dated, read-only execution observation",
    },
    arm1: {
      runState: "historical bytes unchanged",
      points: "204/204",
      measuredHeadline: "3/90",
      verifier: "hardened independent re-derivation passes and rejects both named real forgeries",
      controls: "seven executed",
      historicalGaps: "no per-row config/stopReason fields; no completion-time source fingerprint",
      retroUpgrade: "forbidden — later safeguards do not rewrite what Arm 1 recorded",
    },
    arm2: {
      runState: "corrected canonical sweep observed in progress at the 2026-07-30 10:23 PDT cutoff",
      measurement: "partial mutable point rows existed; no completed, reviewed sweep result",
      model: "M1 all-facets-narrow",
      recordedCombinedProtocolSha256: PHASE6_ARM2_PROTOCOL_SHA256,
      forecast: "42/90 on Arm 1's common denominator; 42/78 under Arm 2's own bistable exclusion",
      forecastClass: "registered before execution; partial live rows are not a completed or accepted result",
    },
    closure: {
      flaglessCanonicalGate: "Arm 1 closure not run; Arm 2 sweep in progress at cutoff",
      independentReview: "zero-blocker closing review not complete",
      crossPlatformArm64: "not run; runbook still says MAC RUN NEEDED",
    },
  }),
});

const K_BOLTZMANN = 1.380649e-23;
const WATER_MOLECULE_MASS_KG = 3.0e-26;
const ICE_NUMBER_DENSITY = 3.1e28;
const AIR_DIFFUSIVITY_ONE_ATMOSPHERE = 2.0e-5;
const ONE_ATMOSPHERE_PA = 101325;

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((record, key) => {
    record[key] = canonicalize(value[key]);
    return record;
  }, {});
}

function sameRecord(left, right) {
  return JSON.stringify(canonicalize(left))
    === JSON.stringify(canonicalize(right));
}

function jsonSha256(value) {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex");
}

function sorted(values) {
  return [...values].sort();
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function near(left, right, relative = 1e-12, absolute = 1e-15) {
  return Math.abs(left - right) <= Math.max(
    absolute,
    relative * Math.max(Math.abs(left), Math.abs(right)),
  );
}

function ownKeysDeep(value, out = []) {
  if (!value || typeof value !== "object") return out;
  for (const key of Object.keys(value)) {
    out.push(key);
    ownKeysDeep(value[key], out);
  }
  return out;
}

function saturationDensity(tempC) {
  const tempK = tempC + 273.15;
  const pressurePa = 3.7e10 * Math.exp(-6150 / tempK) * 100;
  return pressurePa / (K_BOLTZMANN * tempK);
}

function kineticVelocity(tempC) {
  const tempK = tempC + 273.15;
  return (saturationDensity(tempC) / ICE_NUMBER_DENSITY)
    * Math.sqrt(
      (K_BOLTZMANN * tempK)
      / (2 * Math.PI * WATER_MOLECULE_MASS_KG),
    );
}

function kineticLength(tempC, pressurePa) {
  const diffusivity =
    AIR_DIFFUSIVITY_ONE_ATMOSPHERE * ONE_ATMOSPHERE_PA / pressurePa;
  return (saturationDensity(tempC) / ICE_NUMBER_DENSITY)
    * diffusivity / kineticVelocity(tempC);
}

function iceCellVaporUnits(tempC) {
  return ICE_NUMBER_DENSITY / saturationDensity(tempC);
}

function transformedSigma(sigmaOld, oldTempC, newTempC) {
  return (1 + sigmaOld)
    * saturationDensity(oldTempC)
    / saturationDensity(newTempC)
    - 1;
}

function timelineDatasetMatches(state, dom) {
  return dom
    && dom.operator === state.operator
    && dom.stage === state.stage
    && dom.eventMode === "abrupt";
}

function teachingNumber(value) {
  if (typeof value !== "number") return String(value);
  if (value === 0) return "0";
  if (Math.abs(value) >= 0.001 && Math.abs(value) < 1000) {
    return value.toPrecision(8).replace(/0+$/, "").replace(/\.$/, "");
  }
  return value.toExponential(6);
}

function normalizedText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function includesEvery(text, fragments) {
  const normalized = normalizedText(text);
  return fragments.every((fragment) => normalized.includes(fragment));
}

function timelineVisibleViolations(label, snapshot, fixture) {
  const violations = [];
  const visibleText = snapshot?.dom?.visibleText;
  if (!visibleText) return [`timeline ${label} visible body`];
  if (snapshot.operator === "GGThreshold") {
    const environment = snapshot.stage === "before"
      ? fixture.beforeEnvironment
      : fixture.afterEnvironment;
    const title = snapshot.stage === "before"
      ? "Before event"
      : "After event";
    if (!includesEvery(visibleText, [
      title,
      `z extent = ${fixture.trigger.value}`,
      `completed tick ${fixture.state.tick}`,
      `[${environment.mu.map(teachingNumber).join(", ")}]`,
      `[${fixture.state.a.map(teachingNumber).join(", ")}]`,
      "State bytes around the event",
    ])) {
      violations.push(`timeline ${label} visible G-G values`);
    }
    return violations;
  }

  const expectedRows = snapshot.lk.cells.map((cell) => {
    const density = cell.active && !cell.attached && !cell.wall
      ? (1 + cell.sigmaCurrent)
        * saturationDensity(snapshot.lk.environment.tempC)
      : null;
    return [
      cell.id,
      cell.kind,
      teachingNumber(cell.sigmaOld),
      teachingNumber(cell.sigmaCurrent),
      density === null ? "excluded" : teachingNumber(density),
    ];
  });
  if (!sameJson(snapshot.dom.visibleCellRows, expectedRows)) {
    violations.push(`timeline ${label} visible LK cell table`);
  }
  const fragments = [
    `stage ${snapshot.stage}`,
    `temperature ${teachingNumber(snapshot.lk.environment.tempC)}`,
    "interior-low",
    "interior-high",
    "dirichlet-shell",
    "attached-ice",
    "inactive-wall",
    "Topology, fill, time and completed ledgers",
    `[${snapshot.lk.state.a.map(teachingNumber).join(", ")}]`,
    `[${snapshot.lk.state.f.map(teachingNumber).join(", ")}]`,
    `completed tick ${snapshot.lk.state.tick}`,
    `physical time ${teachingNumber(snapshot.lk.state.simTimeSeconds)} s`,
    `completed ledger segments ${snapshot.lk.fillSegments.length}`,
    "Step-local vapor-equivalent fill bookkeeping",
  ];
  if (snapshot.stage === "stepped") {
    const weighted = fixture.fillSegments.reduce(
      (sum, segment) =>
        sum + segment.placedFillIceCells * iceCellVaporUnits(segment.tempC),
      0,
    );
    const shortcut = fixture.fillSegments.reduce(
      (sum, segment) => sum + segment.placedFillIceCells,
      0,
    ) * iceCellVaporUnits(fixture.afterEnvironment.tempC);
    fragments.push(
      "step-local weighted total",
      teachingNumber(weighted),
      "counterfactual",
      teachingNumber(shortcut),
      "deposited its 0.07-cell increment into f[0]",
      "No cell saturated",
      "a stayed unchanged",
    );
  } else {
    fragments.push("byte-for-byte unchanged");
  }
  if (!includesEvery(visibleText, fragments)) {
    violations.push(`timeline ${label} visible LK values`);
  }
  return violations;
}

function timelineScaleViolations(label, snapshot, fixture) {
  const violations = [];
  const tempC = snapshot.lk.environment.tempC;
  const expected = {
    cSatPerCubicMeter: saturationDensity(tempC),
    vKinMS: kineticVelocity(tempC),
    x0M: kineticLength(tempC, fixture.pressurePa),
    mIceLedger: iceCellVaporUnits(tempC),
  };
  for (const [key, value] of Object.entries(expected)) {
    if (!near(snapshot.lk.derived[key], value, 1e-14, 0)) {
      violations.push(`timeline ${label} ${key}`);
    }
  }
  const expectedFacets = tempC === -15
    ? {
        paramSet: "CAK",
        basal: { sigma0: 0.024, prefactor: 1 },
        prism: { sigma0: 0.032, prefactor: 1 },
      }
    : tempC === -5
      ? {
          paramSet: "CAK",
          basal: { sigma0: 0.007, prefactor: 1 },
          prism: { sigma0: 0.0027, prefactor: 0.18 },
        }
      : null;
  if (
    !expectedFacets
    || !sameJson(snapshot.lk.derived.facetParameters, expectedFacets)
  ) {
    violations.push(`timeline ${label} facet kinetics`);
  }
  return violations;
}

export function timelineViolations(evidence) {
  const violations = [];
  if (!evidence || evidence.version !== 1) return ["timeline hook/schema"];
  const constants = evidence.fixtures?.constants;
  const ggFixture = evidence.fixtures?.gg;
  const lkFixture = evidence.fixtures?.lk;
  if (
    constants?.kBoltzmann !== K_BOLTZMANN
    || constants?.waterMoleculeMassKg !== WATER_MOLECULE_MASS_KG
    || constants?.iceNumberDensityPerCubicMeter !== ICE_NUMBER_DENSITY
    || constants?.airDiffusivityAtOneAtmosphereM2PerS
      !== AIR_DIFFUSIVITY_ONE_ATMOSPHERE
    || constants?.referencePressurePa !== ONE_ATMOSPHERE_PA
    || !sameRecord(ggFixture, TIMELINE_GG_FIXTURE)
    || !sameRecord(lkFixture, TIMELINE_LK_FIXTURE)
  ) {
    return ["timeline raw constants/fixtures"];
  }
  if (
    !Array.isArray(evidence.formulaSamples)
    || !sameJson(
      evidence.formulaSamples.map((sample) => [sample.tempC, sample.sigmaOld]),
      [[-15, 0.002], [-5, 0.002]],
    )
  ) {
    return ["timeline formula sample inventory"];
  }

  const ggBefore = evidence.ggBefore;
  const ggApplied = evidence.ggApplied;
  const ggReset = evidence.ggReset;
  const lkBefore = evidence.lkBefore;
  const lkTransformed = evidence.lkTransformed;
  const lkReclamped = evidence.lkReclamped;
  const lkStepped = evidence.lkStepped;
  const lkReset = evidence.lkReset;
  const expectedSteppedState = {
    tick: lkFixture.state.tick + 1,
    simTimeSeconds:
      lkFixture.state.simTimeSeconds
      + lkFixture.exampleInterfaceStep.deltaTimeSeconds,
    a: [...lkFixture.state.a],
    f: lkFixture.state.f.map((value, index) =>
      index === 0
        ? value + lkFixture.fillSegments[1].placedFillIceCells
        : value),
  };
  if (
    !ggBefore?.gg
    || !ggApplied?.gg
    || !ggReset?.gg
    || !lkBefore?.lk
    || !lkTransformed?.lk
    || !lkReclamped?.lk
    || !lkStepped?.lk
    || !lkReset?.lk
  ) {
    return ["timeline snapshot inventory"];
  }
  if (
    !timelineDatasetMatches(ggBefore, ggBefore.dom)
    || ggBefore.operator !== "GGThreshold"
    || ggBefore.stage !== "before"
    || !sameJson(ggBefore.gg.environment, ggFixture.beforeEnvironment)
    || ggBefore.gg.tick !== ggFixture.state.tick
    || !sameJson(ggBefore.gg.a, ggFixture.state.a)
    || !sameJson(ggBefore.gg.b, ggFixture.state.b)
    || !sameJson(ggBefore.gg.d, ggFixture.state.d)
  ) {
    violations.push("timeline G-G initial state");
  }
  violations.push(
    ...timelineVisibleViolations("G-G before", ggBefore, ggFixture),
  );
  if (
    !timelineDatasetMatches(ggApplied, ggApplied.dom)
    || ggApplied.operator !== "GGThreshold"
    || ggApplied.stage !== "applied"
    || !sameJson(ggApplied.gg.environment, ggFixture.afterEnvironment)
    || ggApplied.gg.tick !== ggBefore.gg.tick
    || !sameJson(ggApplied.gg.a, ggBefore.gg.a)
    || !sameJson(ggApplied.gg.b, ggBefore.gg.b)
    || !sameJson(ggApplied.gg.d, ggBefore.gg.d)
  ) {
    violations.push("timeline G-G event preservation");
  }
  violations.push(
    ...timelineVisibleViolations("G-G applied", ggApplied, ggFixture),
  );
  if (
    !sameJson(ggReset.gg, ggBefore.gg)
    || ggReset.stage !== "before"
    || !timelineDatasetMatches(ggReset, ggReset.dom)
  ) {
    violations.push("timeline G-G reset");
  }
  violations.push(
    ...timelineVisibleViolations("G-G reset", ggReset, ggFixture),
  );
  if (
    !timelineDatasetMatches(lkBefore, lkBefore.dom)
    || lkBefore.operator !== "LibbrechtKinetics"
    || lkBefore.stage !== "before"
    || !sameJson(lkBefore.lk.environment, lkFixture.beforeEnvironment)
    || lkBefore.lk.cells.some(
      (cell, index) => cell.sigmaCurrent !== lkFixture.cells[index].sigmaOld,
    )
    || !sameJson(lkBefore.lk.state, lkFixture.state)
    || !sameJson(lkBefore.lk.fillSegments, [lkFixture.fillSegments[0]])
    || lkBefore.lk.shellClampDelta !== null
  ) {
    violations.push("timeline LK initial state");
  }
  violations.push(...timelineScaleViolations("before", lkBefore, lkFixture));
  violations.push(
    ...timelineVisibleViolations("LK before", lkBefore, lkFixture),
  );

  let observedNegative = false;
  for (let index = 0; index < lkFixture.cells.length; index++) {
    const source = lkFixture.cells[index];
    const transformed = lkTransformed.lk.cells[index];
    const eligible = source.active && !source.attached && !source.wall;
    const expectedSigma = eligible
      ? transformedSigma(
          source.sigmaOld,
          lkFixture.beforeEnvironment.tempC,
          lkFixture.afterEnvironment.tempC,
        )
      : source.sigmaOld;
    if (!near(transformed.sigmaCurrent, expectedSigma, 1e-14, 0)) {
      violations.push(`timeline LK cell transform ${source.id}`);
    }
    if (eligible) {
      const densityBefore =
        (1 + source.sigmaOld)
        * saturationDensity(lkFixture.beforeEnvironment.tempC);
      const densityAfter =
        (1 + transformed.sigmaCurrent)
        * saturationDensity(lkFixture.afterEnvironment.tempC);
      if (!near(densityBefore, densityAfter, 2e-15, 0)) {
        violations.push(`timeline LK density conservation ${source.id}`);
      }
      if (transformed.sigmaCurrent < 0) observedNegative = true;
    }
  }
  if (
    !timelineDatasetMatches(lkTransformed, lkTransformed.dom)
    || lkTransformed.stage !== "transformed"
    || !sameJson(lkTransformed.lk.environment, lkFixture.afterEnvironment)
    || !sameJson(lkTransformed.lk.state, lkFixture.state)
    || lkTransformed.lk.shellClampDelta !== null
    || !sameJson(
      lkTransformed.lk.fillSegments,
      [lkFixture.fillSegments[0]],
    )
    || !observedNegative
  ) {
    violations.push("timeline LK transformed state");
  }
  violations.push(
    ...timelineScaleViolations("transformed", lkTransformed, lkFixture),
    ...timelineVisibleViolations(
      "LK transformed",
      lkTransformed,
      lkFixture,
    ),
  );

  let expectedClampDelta = 0;
  for (let index = 0; index < lkFixture.cells.length; index++) {
    const source = lkFixture.cells[index];
    const transformed = lkTransformed.lk.cells[index];
    const reclamped = lkReclamped.lk.cells[index];
    const clamped = source.active
      && !source.attached
      && !source.wall
      && source.shell;
    const expectedSigma = clamped
      ? lkFixture.afterEnvironment.sigmaInfinity
      : transformed.sigmaCurrent;
    if (clamped) {
      expectedClampDelta += expectedSigma - transformed.sigmaCurrent;
    }
    if (!near(reclamped.sigmaCurrent, expectedSigma, 1e-14, 0)) {
      violations.push(`timeline LK shell clamp ${source.id}`);
    }
  }
  if (
    !timelineDatasetMatches(lkReclamped, lkReclamped.dom)
    || lkReclamped.stage !== "reclamped"
    || !sameJson(lkReclamped.lk.environment, lkFixture.afterEnvironment)
    || !sameJson(lkReclamped.lk.state, lkFixture.state)
    || !near(lkReclamped.lk.shellClampDelta, expectedClampDelta, 1e-14, 0)
    || !sameJson(
      lkReclamped.lk.fillSegments,
      [lkFixture.fillSegments[0]],
    )
  ) {
    violations.push("timeline LK reclamped state");
  }
  violations.push(
    ...timelineScaleViolations("reclamped", lkReclamped, lkFixture),
    ...timelineVisibleViolations("LK reclamped", lkReclamped, lkFixture),
  );

  const expectedSegments = lkFixture.fillSegments;
  const weighted = expectedSegments.reduce(
    (sum, segment) =>
      sum + segment.placedFillIceCells * iceCellVaporUnits(segment.tempC),
    0,
  );
  const finalTemperatureShortcut = expectedSegments.reduce(
    (sum, segment) => sum + segment.placedFillIceCells,
    0,
  ) * iceCellVaporUnits(lkFixture.afterEnvironment.tempC);
  if (
    !timelineDatasetMatches(lkStepped, lkStepped.dom)
    || lkStepped.stage !== "stepped"
    || !sameJson(lkStepped.lk.environment, lkFixture.afterEnvironment)
    || !sameJson(lkStepped.lk.state, expectedSteppedState)
    || !sameJson(lkStepped.lk.fillSegments, expectedSegments)
    || !sameJson(lkStepped.lk.cells, lkReclamped.lk.cells)
    || !near(
      lkStepped.lk.shellClampDelta,
      lkReclamped.lk.shellClampDelta,
      1e-14,
      0,
    )
    || !finiteNumber(weighted)
    || near(weighted, finalTemperatureShortcut, 1e-12, 0)
  ) {
    violations.push("timeline step-local ledger");
  }
  violations.push(
    ...timelineScaleViolations("stepped", lkStepped, lkFixture),
    ...timelineVisibleViolations("LK stepped", lkStepped, lkFixture),
  );
  if (
    lkReset.stage !== "before"
    || !timelineDatasetMatches(lkReset, lkReset.dom)
    || !sameJson(lkReset.lk, lkBefore.lk)
  ) {
    violations.push("timeline LK reset");
  }
  violations.push(
    ...timelineVisibleViolations("LK reset", lkReset, lkFixture),
  );

  for (const sample of evidence.formulaSamples) {
    if (
      !near(sample.cSat, saturationDensity(sample.tempC), 1e-14, 0)
      || !near(sample.vKin, kineticVelocity(sample.tempC), 1e-14, 0)
      || !near(
        sample.kineticLength,
        kineticLength(sample.tempC, lkFixture.pressurePa),
        1e-14,
        0,
      )
      || !near(sample.mIce, iceCellVaporUnits(sample.tempC), 1e-14, 0)
      || !near(
        sample.transformedSigma,
        transformedSigma(
          sample.sigmaOld,
          lkFixture.beforeEnvironment.tempC,
          lkFixture.afterEnvironment.tempC,
        ),
        1e-14,
        0,
      )
    ) {
      violations.push(`timeline formula sample ${sample.tempC}`);
    }
  }
  return violations;
}

export function deriveCheckpointOutcome(record) {
  const firstReject = record.observations.find(
    (observation) => observation.disposition === "reject",
  );
  const failureStage = firstReject?.stage ?? "none";
  const codecRejected =
    firstReject !== undefined && failureStage !== "evidence-context";
  const reachedContext = record.observations.some(
    (observation) => observation.stage === "evidence-context",
  );
  return {
    failureStage,
    codecOutcome: codecRejected ? "rejected" : "accepted",
    contextOutcome: codecRejected
      ? "not-run"
      : reachedContext && firstReject
        ? "rejected"
        : reachedContext
          ? "accepted"
          : "not-run",
  };
}

export function checkpointViolations(evidence) {
  const violations = [];
  if (!evidence || evidence.schemaVersion !== 1) return ["checkpoint hook/schema"];
  const expectedIds = Object.keys(CHECKPOINT_EXPECTATIONS);
  if (!Array.isArray(evidence.cases)) return ["checkpoint case inventory"];
  const actualIds = evidence.cases.map((record) => record.id);
  if (
    !sameJson(actualIds, expectedIds)
    || new Set(actualIds).size !== expectedIds.length
    || evidence.cases.length !== expectedIds.length
  ) {
    violations.push("checkpoint case inventory");
  }
  if (jsonSha256(evidence.cases) !== CHECKPOINT_TEACHING_CASES_SHA256) {
    violations.push("checkpoint source-pinned teaching cases");
  }

  for (const record of evidence.cases) {
    const expected = CHECKPOINT_EXPECTATIONS[record.id];
    if (!expected) {
      violations.push(`checkpoint unknown case ${record.id}`);
      continue;
    }
    if (
      typeof record.label !== "string"
      || typeof record.checkpointKind !== "string"
      || !record.mutation
      || record.mutation.target !== expected.target
      || !Array.isArray(record.requiredFields)
      || record.requiredFields.length === 0
      || !Array.isArray(record.observations)
      || record.observations.length === 0
    ) {
      violations.push(`checkpoint ${record.id} raw record`);
      continue;
    }
    let priorStage = -1;
    let rejected = false;
    for (const observation of record.observations) {
      const stage = CHECKPOINT_STAGES.indexOf(observation.stage);
      if (
        stage < 0
        || stage <= priorStage
        || !["accept", "reject"].includes(observation.disposition)
        || rejected
      ) {
        violations.push(`checkpoint ${record.id} fail-closed stage order`);
        break;
      }
      priorStage = stage;
      rejected = observation.disposition === "reject";
    }
    const derived = deriveCheckpointOutcome(record);
    if (
      derived.failureStage !== expected.failureStage
      || derived.codecOutcome !== expected.codecOutcome
      || derived.contextOutcome !== expected.contextOutcome
    ) {
      violations.push(`checkpoint ${record.id} outcome`);
    }
    const rendered = evidence.rendered?.[record.id];
    const observedByStage = Object.fromEntries(
      record.observations.map((observation) => [
        observation.stage,
        observation,
      ]),
    );
    let stopped = false;
    const expectedVisibleStages = CHECKPOINT_STAGES.map((stage) => {
      const observation = observedByStage[stage];
      let disposition = observation?.disposition ?? "not-run";
      if (stopped) disposition = "not-run";
      const text = disposition === "not-run"
        ? `${stage.replace("-", " ").toUpperCase()} not reached`
        : `${stage.replace("-", " ").toUpperCase()} ${observation.requirement} → `
          + `${observation.observed} [${disposition.toUpperCase()}]`;
      if (disposition === "reject") stopped = true;
      return { stage, disposition, text: normalizedText(text) };
    });
    const expectedMutationRows = [
      `checkpoint: ${record.checkpointKind}`,
      `target: ${record.mutation.target}`,
      `operation: ${record.mutation.operation}`,
      `before: ${record.mutation.before}`,
      `after: ${record.mutation.after}`,
    ];
    if (
      !rendered
      || rendered.selectedMutation !== record.id
      || rendered.checkpointKind !== record.checkpointKind
      || rendered.codecOutcome !== derived.codecOutcome
      || rendered.contextOutcome !== derived.contextOutcome
      || rendered.failureStage !== derived.failureStage
      || rendered.requiredFields !== record.requiredFields.join("|")
      || !sameJson(rendered.visibleMutationRows, expectedMutationRows)
      || !sameJson(rendered.visibleRequiredFields, record.requiredFields)
      || !sameRecord(rendered.visibleStages, expectedVisibleStages)
      || !includesEvery(rendered.visibleResult, [
        `Codec: ${derived.codecOutcome}`,
        `evidence context: ${derived.contextOutcome}`,
      ])
      || normalizedText(rendered.visibleNote) !== normalizedText(record.note)
    ) {
      violations.push(`checkpoint ${record.id} rendered state`);
    }
  }

  if (
    evidence.reset?.selectedMutation !== "clean-lk-v2"
    || evidence.reset?.codecOutcome !== "accepted"
    || evidence.reset?.contextOutcome !== "accepted"
    || evidence.reset?.failureStage !== "none"
    || !includesEvery(evidence.reset?.visibleResult, [
      "Codec: accepted",
      "evidence context: accepted",
    ])
  ) {
    violations.push("checkpoint reset");
  }
  return violations;
}

function ledgerNumerical(row, floor) {
  const numerator =
    row.shellInjection + row.smootherDrift - row.boundaryExchange;
  return {
    numerator,
    residual:
      Math.abs(numerator) / Math.max(Math.abs(row.boundaryExchange), floor),
  };
}

function ledgerDemand(row) {
  return row.placedFillUnits
    + row.saturationExcessUnits
    - row.kineticDemandUnits;
}

export function ledgerViolations(evidence) {
  const violations = [];
  if (
    !evidence
    || evidence.schema !== "part2-ledger-separation-v1"
    || evidence.fillUnitScale !== 1_000_000
    || evidence.divergenceFloor !== 1e-300
  ) {
    return ["ledger hook/schema"];
  }
  const expectedIds = Object.keys(LEDGER_EXPECTATIONS);
  if (!sameJson(evidence.scenarioIds, expectedIds)) {
    violations.push("ledger scenario inventory");
  }
  if (
    !Array.isArray(evidence.rows)
    || evidence.rows.length !== expectedIds.length
    || !sameJson(
      evidence.rows.map((entry) => entry?.raw?.id),
      expectedIds,
    )
    || new Set(evidence.rows.map((entry) => entry?.raw?.id)).size
      !== expectedIds.length
  ) {
    violations.push("ledger row coverage");
  }

  for (const entry of evidence.rows ?? []) {
    const row = entry.raw;
    const expected = LEDGER_EXPECTATIONS[row?.id];
    const expectedFixture = LEDGER_FIXTURES[row?.id];
    if (!expected) {
      violations.push(`ledger unknown scenario ${row?.id}`);
      continue;
    }
    if (!sameRecord(row, expectedFixture)) {
      violations.push(`ledger ${row.id} source-pinned fixture`);
    }
    const numericFields = [
      "shellInjection",
      "smootherDrift",
      "boundaryExchange",
      "divTol",
      "localExchangeSign",
      "placedFillUnits",
      "saturationExcessUnits",
      "kineticDemandUnits",
      "holeFillDeficitUnits",
    ];
    if (!numericFields.every((field) => finiteNumber(row[field]))) {
      violations.push(`ledger ${row.id} finite raw terms`);
      continue;
    }
    const numerical = ledgerNumerical(row, evidence.divergenceFloor);
    const demandClosure = ledgerDemand(row);
    const numericalCloses = numerical.residual < row.divTol;
    const demandCloses = demandClosure === 0;
    if (
      numericalCloses !== expected.numericalCloses
      || demandCloses !== expected.demandCloses
      || (row.holeFillDeficitUnits > 0) !== expected.holeFillSeparate
      || row.localExchangeSign >= 0
    ) {
      violations.push(`ledger ${row.id} independent identities`);
    }
    const dom = entry.dom;
    if (
      !dom
      || dom.scenarioId !== row.id
      || Number(dom.shellInjection) !== row.shellInjection
      || Number(dom.smootherDrift) !== row.smootherDrift
      || Number(dom.boundaryExchange) !== row.boundaryExchange
      || Number(dom.divTol) !== row.divTol
      || Number(dom.localExchangeSign) !== row.localExchangeSign
      || Number(dom.placedFillUnits) !== row.placedFillUnits
      || Number(dom.saturationExcessUnits) !== row.saturationExcessUnits
      || Number(dom.kineticDemandUnits) !== row.kineticDemandUnits
      || Number(dom.holeFillDeficitUnits) !== row.holeFillDeficitUnits
      || Number(dom.fillUnitScale) !== evidence.fillUnitScale
      || Number(dom.divergenceFloor) !== evidence.divergenceFloor
      || dom.crossLedgerPolicy !== "forbidden"
    ) {
      violations.push(`ledger ${row.id} rendered raw terms`);
    }
    const numericalClosesText = expected.numericalCloses
      ? "CLOSES"
      : "FAILS";
    const demandClosesText = expected.demandCloses
      ? "CLOSES"
      : "FAILS";
    if (
      !includesEvery(dom?.visibleText, [
        "Elliptic-solve diagnostics",
        "Interface-demand bookkeeping",
        row.shellInjection === 0
          ? "0"
          : row.shellInjection.toExponential(6),
        row.boundaryExchange === 0
          ? "0"
          : row.boundaryExchange.toExponential(6),
        (row.placedFillUnits / evidence.fillUnitScale).toFixed(6),
        (row.saturationExcessUnits / evidence.fillUnitScale).toFixed(6),
        (row.kineticDemandUnits / evidence.fillUnitScale).toFixed(6),
        (row.holeFillDeficitUnits / evidence.fillUnitScale).toFixed(6),
        numericalClosesText,
        demandClosesText,
        "Ledger firewall",
      ])
      || !includesEvery(dom?.visibleStatusText, [row.label, "Numerical residual"])
    ) {
      violations.push(`ledger ${row.id} visible teaching state`);
    }
  }

  if (
    evidence.crossAttempt?.attempted !== "true"
    || evidence.crossAttempt?.policy !== "forbidden"
    || !/REFUSED:/i.test(evidence.crossAttempt?.text ?? "")
    || !/REFUSED:/i.test(evidence.crossAttempt?.visibleText ?? "")
  ) {
    violations.push("ledger cross-ledger refusal");
  }
  return violations;
}

export function transferabilityViolations(evidence) {
  const violations = [];
  if (!evidence || evidence.schema !== "part2-transferability-v1") {
    return ["transferability hook/schema"];
  }
  if (!sameRecord(evidence.sourceAuthority, TRANSFER_SOURCE_AUTHORITY)) {
    violations.push("transferability source authority");
  }
  const axisKeys = evidence.axes.map((axis) => axis.key);
  if (
    !sameJson(axisKeys, TRANSFER_AXES)
    || !sameRecord(evidence.axes, TRANSFER_AXIS_RECORDS)
  ) {
    violations.push("transferability axis inventory");
  }
  if (!sameRecord(evidence.target, TRANSFER_TARGET)) {
    violations.push("transferability target configuration");
  }

  const expectedIds = Object.keys(TRANSFER_EXPECTED_MISMATCHES);
  if (!sameJson(evidence.evidenceIds, expectedIds)) {
    violations.push("transferability evidence inventory");
  }
  if (
    !Array.isArray(evidence.rows)
    || evidence.rows.length !== expectedIds.length
    || !sameJson(
      evidence.rows.map((entry) => entry?.raw?.id),
      expectedIds,
    )
    || new Set(evidence.rows.map((entry) => entry?.raw?.id)).size
      !== expectedIds.length
  ) {
    violations.push("transferability row coverage");
  }
  for (const entry of evidence.rows ?? []) {
    const row = entry.raw;
    const expectedMismatches = TRANSFER_EXPECTED_MISMATCHES[row?.id];
    const expectedRow = TRANSFER_ROWS[row?.id];
    if (!expectedMismatches) {
      violations.push(`transferability unknown evidence ${row?.id}`);
      continue;
    }
    if (!sameRecord(row, expectedRow)) {
      violations.push(`transferability ${row.id} source-pinned fixture`);
    }
    if (
      !row.config
      || !sameJson(sorted(Object.keys(row.config)), sorted(TRANSFER_AXES))
    ) {
      violations.push(`transferability ${row.id} configuration shape`);
      continue;
    }
    const mismatches = TRANSFER_AXES.filter(
      (key) => row.config[key] !== evidence.target[key],
    );
    if (!sameJson(mismatches, expectedMismatches)) {
      violations.push(`transferability ${row.id} mismatches`);
    }
    if (
      row.id === "required-shape"
      && !/not executed evidence/i.test(row.evidenceStatus)
    ) {
      violations.push("transferability matching shape is not evidence");
    }
    if (
      row.id === "cak-a1-domain"
      && (
        row.config.paramSet !== "CAK_A1"
        || row.config.codeVersion
          !== "results recorded at 675288f; execution commit not recorded; freeze ancestry unverified"
        || row.config.runtimeIdentity
          !== "not recorded by cited evidence (Node/V8 unknown)"
        || !["paramSet", "codeVersion", "runtimeIdentity"].every(
          (key) => mismatches.includes(key),
        )
      )
    ) {
      violations.push("transferability CAK_A1 ladder");
    }
    const dom = entry.dom;
    if (
      !dom
      || dom.selectedEvidenceId !== row.id
      || !sameJson(JSON.parse(dom.targetConfig), evidence.target)
      || !sameJson(JSON.parse(dom.selectedConfig), row.config)
      || dom.selectedSource !== row.source
      || dom.selectedEvidenceStatus !== row.evidenceStatus
      || !sameJson(
        JSON.parse(dom.sourceAuthority),
        TRANSFER_SOURCE_AUTHORITY,
      )
      || !sameJson(
        dom.tableRows.map((item) => item.key),
        TRANSFER_AXES,
      )
      || dom.tableRows.some(
        (item, index) =>
          item.label !== TRANSFER_AXIS_RECORDS[index].label
          ||
          item.target !== evidence.target[item.key]
          || item.evidence !== row.config[item.key]
          || item.match !== String(
            evidence.target[item.key] === row.config[item.key],
          ),
      )
    ) {
      violations.push(`transferability ${row.id} rendered matrix`);
    }
    const exact = expectedMismatches.length === 0;
    if (
      !includesEvery(dom?.visibleSummaryText, [
        exact ? "Configuration match." : "NON-TRANSFERABLE.",
      ])
      || !includesEvery(dom?.visibleStatusText, [row.label, row.source])
      || !includesEvery(dom?.visibleScrollCueText, [
        "swipe the table sideways",
        "selected evidence column",
      ])
      || !includesEvery(dom?.visibleAuthorityText, [
        `${TRANSFER_AXES.length} governing fields`,
        "main@8c781b1",
        "not itself evidence",
      ])
      || !includesEvery(dom?.visibleCaptionText, [
        `All ${TRANSFER_AXES.length} governing fields`,
        "exact match still needs executed evidence",
      ])
    ) {
      violations.push(`transferability ${row.id} visible teaching state`);
    }
  }
  return violations;
}

export function phase6StatusViolations(evidence) {
  const violations = [];
  if (!evidence || evidence.schemaVersion !== 1) {
    return ["Phase 6 status hook/schema"];
  }
  if (!sameRecord(evidence.records, PHASE6_EXPECTED_RECORDS)) {
    violations.push("Phase 6 source-pinned records");
  }
  const historical = evidence.records?.historical;
  const current = evidence.records?.current;
  if (
    !historical
    || historical.id !== "historical"
    || historical.authority.executionCommit !== "390fe35"
    || historical.arm1.runState !== "complete"
    || historical.arm1.points !== "204/204"
    || historical.arm1.measuredHeadline !== "3/90"
    || historical.arm2.measurement !== "none"
    || historical.closure.flaglessCanonicalGate !== "not run"
    || !/six controls not executed/i.test(historical.arm1.reportInventory)
  ) {
    violations.push("Phase 6 historical snapshot");
  }
  if (
    !current
    || current.id !== "current"
    || current.authority.commit !== PHASE6_STATUS_COMMIT
    || current.authority.arm2ValuesPinCommit !== "0cb52bf"
    || current.arm2.recordedCombinedProtocolSha256
      !== PHASE6_ARM2_PROTOCOL_SHA256
    || current.arm1.points !== "204/204"
    || current.arm1.measuredHeadline !== "3/90"
    || !/seven executed/i.test(current.arm1.controls)
    || !/forbidden/i.test(current.arm1.retroUpgrade)
    || !/observed in progress/i.test(current.arm2.runState)
    || current.arm2.model !== "M1 all-facets-narrow"
    || !/registered before execution/i.test(current.arm2.forecastClass)
    || !/partial live rows are not a completed or accepted result/i.test(
      current.arm2.forecastClass,
    )
    || !/Arm 2 sweep in progress at cutoff/i.test(current.closure.flaglessCanonicalGate)
    || !/not complete/i.test(current.closure.independentReview)
    || !/not run/i.test(current.closure.crossPlatformArm64)
  ) {
    violations.push("Phase 6 current snapshot");
  }

  const forbiddenKeys = ownKeysDeep(evidence.records).filter(
    (key) => /^(?:combinedScore|gatePass|overallPass|totalScore)$/i.test(key),
  );
  if (forbiddenKeys.length > 0) {
    violations.push("Phase 6 arms remain unmerged");
  }

  for (const view of ["historical", "current"]) {
    const record = evidence.records[view];
    const dom = evidence.rendered?.[view];
    if (
      !dom
      || dom.view !== view
      || dom.recordId !== record.id
      || dom.arm1Status !== record.arm1.runState
      || dom.arm2Status !== record.arm2.runState
      || dom.gateStatus !== record.closure.flaglessCanonicalGate
      || dom.reviewStatus !== record.closure.independentReview
      || dom.crossPlatformStatus !== record.closure.crossPlatformArm64
      || dom.arm1MeasuredHeadline !== record.arm1.measuredHeadline
      || dom.arm2Measurement !== (record.arm2.measurement || "none")
    ) {
      violations.push(`Phase 6 ${view} rendered state`);
    }
    const visibleRows = (values) => Object.keys(values).map((key) => ({
      label: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (character) => character.toUpperCase()),
      value: values[key],
    }));
    const expectedVisibleCards = [
      {
        title: "ARM 1 — MEASURED CONTROL",
        rows: visibleRows(record.arm1),
      },
      {
        title: "ARM 2 — SEPARATE TREATMENT",
        rows: visibleRows(record.arm2),
      },
      {
        title: "CLOSURE STILL OWED",
        rows: visibleRows(record.closure),
      },
      {
        title: "PROVENANCE FOR THIS VIEW",
        rows: visibleRows(record.authority),
      },
    ];
    if (
      !sameRecord(dom?.visibleCards, expectedVisibleCards)
      || !includesEvery(dom?.visibleStamp, [
        record.label,
        record.authority.snapshotMeaning,
      ])
      || !includesEvery(
        dom?.visibleBanner,
        view === "historical"
          ? ["Historical wording, preserved", "not a claim about the repository now"]
          : [
              "Audit-cutoff view, without retroactive repair",
              "observation, not a completed verdict",
              "forecast is not added",
            ],
      )
    ) {
      violations.push(`Phase 6 ${view} visible teaching state`);
    }
  }
  if (
    evidence.reset?.view !== "current"
    || !includesEvery(evidence.reset?.visibleStamp, [
      "Authority at the audit cutoff",
      "committed authority through 8c781b1",
    ])
  ) {
    violations.push("Phase 6 status reset");
  }
  return violations;
}

function crossingValue(state, temperature) {
  const baseBasal =
    0.02 * Math.pow(temperature, 1.75) + 0.3;
  const basePrism = state.mode === "corrected"
    ? 0.015 * temperature * temperature + 0.02 * Math.pow(temperature, 0.6)
    : 0.02 * Math.pow(temperature, 1.9) - 0.025 * (temperature - 0.3);

  let basalFactor = 1;
  let prismFactor = 1;
  if (state.mode === "corrected") {
    if (state.bOn) {
      basalFactor = 1 - 0.87 * Math.exp(
        -Math.pow(
          Math.log10(temperature) - Math.log10(state.bC),
          2,
        ) / 0.07,
      );
    }
    if (state.pOn) {
      prismFactor = 1 - 0.95 * Math.exp(
        -Math.pow(
          Math.log10(temperature) - Math.log10(state.pC),
          2,
        ) / 0.06,
      );
    }
  } else {
    if (state.bOn) {
      const basalZ = (temperature - state.bC) / 1.6;
      basalFactor = 1 - state.depth * Math.exp(-basalZ * basalZ);
    }
    if (state.pOn) {
      const prismZ = (temperature - state.pC) / 1.6;
      prismFactor = 1 - state.depth * Math.exp(-prismZ * prismZ);
    }
  }
  return baseBasal * basalFactor - basePrism * prismFactor;
}

const CROSSING_DEFAULT_STATE = Object.freeze({
  bOn: false,
  pOn: false,
  bC: 4.5,
  pC: 14.4,
  depth: 0.7,
  mode: "approx",
});

const CROSSING_PUBLISHED_STATE = Object.freeze({
  bOn: true,
  pOn: true,
  bC: 4.5,
  pC: 14.4,
  depth: 0.7,
  mode: "corrected",
});

export function independentCrossings(state, range = [2, 35], step = 0.05) {
  const crossings = [];
  let previous = null;
  let previousTemperature = null;
  const count = Math.round((range[1] - range[0]) / step);
  for (let index = 0; index <= count; index++) {
    const temperature = range[0] + index * step;
    const difference = crossingValue(state, temperature);
    if (
      previous !== null
      && (previous > 0) !== (difference > 0)
    ) {
      crossings.push(
        previousTemperature
        + (temperature - previousTemperature)
          * (Math.abs(previous) / (Math.abs(previous) + Math.abs(difference))),
      );
    }
    previous = difference;
    previousTemperature = temperature;
  }
  return crossings;
}

function crossingStateViolations(label, stateEvidence, constants) {
  const violations = [];
  const expected = independentCrossings(
    stateEvidence.state,
    constants.range,
    constants.sampleStep,
  );
  if (
    stateEvidence.crossings.length !== expected.length
    || stateEvidence.crossings.some(
      (value, index) => !near(value, expected[index], 1e-12, 1e-12),
    )
  ) {
    violations.push(`crossing ${label} independent roots`);
  }
  const shouldBePublished =
    stateEvidence.state.mode === "corrected"
    && stateEvidence.state.bOn === true
    && stateEvidence.state.pOn === true
    && stateEvidence.state.bC === 4.5
    && stateEvidence.state.pC === 14.4
    && expected.length === 3;
  if (stateEvidence.publishedState !== shouldBePublished) {
    violations.push(`crossing ${label} published-state gate`);
  }
  if (
    stateEvidence.dom.formulaMode !== stateEvidence.state.mode
    || stateEvidence.dom.basalDip
      !== (stateEvidence.state.bOn ? "on" : "off")
    || stateEvidence.dom.prismDip
      !== (stateEvidence.state.pOn ? "on" : "off")
    || Number(stateEvidence.dom.basalCentre) !== stateEvidence.state.bC
    || Number(stateEvidence.dom.prismCentre) !== stateEvidence.state.pC
    || Number(stateEvidence.dom.depth) !== stateEvidence.state.depth
    || Number(stateEvidence.dom.crossingCount) !== expected.length
    || stateEvidence.dom.publishedState !== String(shouldBePublished)
    || (
      shouldBePublished
      && stateEvidence.dom.verdictKind !== "published-corrected"
    )
  ) {
    violations.push(`crossing ${label} rendered state`);
  }
  const domCrossings = stateEvidence.dom.crossings
    ? stateEvidence.dom.crossings.split(",").map(Number)
    : [];
  if (
    domCrossings.length !== expected.length
    || domCrossings.some(
      (value, index) => !near(value, expected[index], 0, 5e-7),
    )
  ) {
    violations.push(`crossing ${label} rendered roots`);
  }
  const roundedText = expected.length
    ? expected.map((value) => `−${value.toFixed(2)}°C`)
    : [];
  if (
    !includesEvery(stateEvidence.dom.visibleReadout, [
      `${expected.length} crossing${expected.length === 1 ? "" : "s"}`,
      ...roundedText,
    ])
    || !stateEvidence.dom.visibleBanner
    || stateEvidence.dom.visibleSeriesCount !== 2
    || stateEvidence.dom.visibleMarkerCount !== expected.length
    || stateEvidence.dom.visibleModelBandCount !== expected.length + 1
    || stateEvidence.dom.visibleSvg !== true
  ) {
    violations.push(`crossing ${label} visible chart state`);
  }
  return violations;
}

export function crossingViolations(evidence) {
  if (!evidence || evidence.schemaVersion !== 1) {
    return ["crossing hook/schema"];
  }
  const violations = [];
  const constants = evidence.constants;
  if (
    !constants
    || !sameJson(constants.range, [2, 35])
    || constants.sampleStep !== 0.05
    || constants.approximateWidth !== 1.6
    || !sameRecord(constants.defaultState, CROSSING_DEFAULT_STATE)
    || !sameRecord(constants.publishedState, CROSSING_PUBLISHED_STATE)
  ) {
    violations.push("crossing constants");
    return violations;
  }
  if (!sameRecord(evidence.default.state, CROSSING_DEFAULT_STATE)) {
    violations.push("crossing default state");
  }
  if (!sameRecord(evidence.published.state, CROSSING_PUBLISHED_STATE)) {
    violations.push("crossing published state");
  }
  const expectedControlStates = {
    default: {
      state: { ...CROSSING_DEFAULT_STATE },
      basalSliderDisabled: true,
      prismSliderDisabled: true,
      depthSliderDisabled: true,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    basalOn: {
      state: { ...CROSSING_DEFAULT_STATE, bOn: true },
      basalSliderDisabled: false,
      prismSliderDisabled: true,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    bothOn: {
      state: { ...CROSSING_DEFAULT_STATE, bOn: true, pOn: true },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    basalSlider: {
      state: {
        ...CROSSING_DEFAULT_STATE,
        bOn: true,
        pOn: true,
        bC: 6.2,
      },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    prismSlider: {
      state: {
        ...CROSSING_DEFAULT_STATE,
        bOn: true,
        pOn: true,
        bC: 6.2,
        pC: 16.1,
      },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    depthSlider: {
      state: {
        ...CROSSING_DEFAULT_STATE,
        bOn: true,
        pOn: true,
        bC: 6.2,
        pC: 16.1,
        depth: 0.5,
      },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
    correctedMode: {
      state: {
        ...CROSSING_DEFAULT_STATE,
        bOn: true,
        pOn: true,
        bC: 6.2,
        pC: 16.1,
        depth: 0.5,
        mode: "corrected",
      },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: true,
      approximatePressed: "false",
      correctedPressed: "true",
    },
    approximateMode: {
      state: {
        ...CROSSING_DEFAULT_STATE,
        bOn: true,
        pOn: true,
        bC: 6.2,
        pC: 16.1,
        depth: 0.5,
      },
      basalSliderDisabled: false,
      prismSliderDisabled: false,
      depthSliderDisabled: false,
      approximatePressed: "true",
      correctedPressed: "false",
    },
  };
  if (!sameRecord(evidence.controls, expectedControlStates)) {
    violations.push("crossing actual control wiring");
  }
  violations.push(
    ...crossingStateViolations("default", evidence.default, constants),
    ...crossingStateViolations("published", evidence.published, constants),
    ...crossingStateViolations("mutated", evidence.mutated, constants),
  );
  const expectedPublished = independentCrossings(
    constants.publishedState,
    constants.range,
    constants.sampleStep,
  );
  const rounded = expectedPublished.map((value) => Number(value.toFixed(2)));
  if (!sameJson(rounded, [3.08, 8.07, 24.73])) {
    violations.push("crossing published locations");
  }
  if (!sameRecord(evidence.reset.state, CROSSING_DEFAULT_STATE)) {
    violations.push("crossing reset");
  }
  return violations;
}
