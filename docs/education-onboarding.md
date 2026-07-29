# Snowflake Simulation Education Handoff

## Goal

Create beginner-friendly material so non-technical users can understand what the
Phase 2b / growth simulation is doing and why runs are long.

## Audience assumptions

- No formal CS/academic background required.
- Prior conversations introduced `rho` (vapor), `sigma` (supersaturation),
  and the idea of growth steps.

## Recommended teaching sequence

1. `rho`, `sigma`, and the lattice grid
2. Why the solver pauses to compute the air-vapor field
3. Diffusion solve vs growth step
4. Kinetic rules and `alphaHK` (attachment coefficient)
5. Why branches/plates differ
6. What residual/divergence mean in plain terms
7. Why checkpoints matter for scientific claims
8. Common failure modes and what to check in logs

## Core narrative in simple terms

- Think of each step like:  
  "First, the simulator asks what the air looks like around the crystal; then it lets
  crystal faces decide how much ice they can accept."
- The long "relaxation sweeps" are just the math work needed to get a stable, trustworthy
  air-vapor field before growth.
- The actual shape change occurs only after the solve passes quality checks.

## Starter glossary

- `rho`: local air-vapor density at each cell.
- `sigma`: supersaturation, i.e. how much vapor is available above equilibrium.
- residual: check for “equation fit quality” in the field solve.
- divergence: check for physical consistency of vapor flow.
- `alphaHK`: face-specific ice attachment efficiency (higher means faster attachment on that face).
- checkpoint: saved, verifiable state that lets runs be audited/replayed exactly.

## File plan (to create next)

- `docs/education/sim-quickstart.md`
- `docs/education/what-is-rho-sigma.md`
- `docs/education/growth-step-explained.md`
- `docs/education/why-evidence-only-is-credible.md`

