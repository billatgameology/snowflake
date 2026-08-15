# Post-Phase-9 source intake — unregistered future material

This record inventories source bytes acquired after the Phase 9 shelf and results froze. The
private NAS copy is at
`research-cache/post-phase9-intake/20260813-unregistered-v1/`; exact file identities and container
checks are in [the machine manifest](phase9-post-freeze-source-intake-v1.json).

## What changed

Fourteen distinct source payloads were worth keeping, along with acquisition metadata and one
malformed-download history. The most important update is the Voigtländer 2018 supplement: its S1
and S2 videos are now available. The frozen Phase 9 shelf accurately said they were absent at the
time. Their later acquisition improves a future protocol's starting point; it does not retroactively
change the shelf, any score, or the all-no-pass Phase 9 outcome.

Other future-use material includes carrier-gas and heat-transport papers, apparatus/systematics
papers, the Lamb et al. manuscript source, Zhao et al. pressure-conditioned surface-kinetics
supporting information, and two Pokrifka datasets. The 46-page *Snow Crystals* preview is retained
at low priority: its acquisition endpoint is unresolved and it lacks the chapters needed for the
deferred edition comparison.

The first Magee supplement download had a duplicated 794,624-byte tail. The raw bytes are retained
as acquisition history, while a fresh publisher download supplies the clean canonical ZIP. The
clean archive passes `unzip -t`; all eight member hashes match the recoverable members from the raw
download. Loose extracted copies were not retained.

## Scientific boundary

- Status: **unregistered post-Phase-9 intake**.
- These bytes were not consumed by a Phase 9 protocol, score, verifier, or interpretation.
- They supply no promotion, validation, Phase 6 credit, or revised Phase 9 result.
- Any future quantitative use needs a new committed protocol, source-eligibility decision, and
  claim boundary.
- Third-party redistribution rights were not established; source bytes stay on the private NAS.

## What was deliberately not copied

Exact duplicates already on the NAS, the previously archived IceNODE code snapshot, extracted
container members, PDF renders/text conversions, discovery tables, 404 pages, and temporary logs
were omitted. The record preserves hashes and limits rather than turning a cleanup cache into a new
evidence bundle.
