import type { DisciplineId, Note, Vault } from "./palette";

const DAY = 86_400_000;
const BASE = Date.parse("2026-02-14T09:00:00Z");

let counter = 0;
function note(
  discipline: DisciplineId,
  title: string,
  tags: string[],
  body: string,
  aliases: string[] = []
): Note {
  counter += 1;
  const created = BASE - (counter * 3.7 + 4) * DAY;
  const fm = [
    "---",
    `aliases: [${[title, ...aliases].map((a) => `"${a}"`).join(", ")}]`,
    `tags: [${tags.map((t) => `"${t}"`).join(", ")}]`,
    "---",
    "",
  ].join("\n");
  return {
    id: title,
    title,
    discipline,
    content: fm + body.trim() + "\n",
    created,
    modified: BASE - Math.round(counter * 0.6) * 3_600_000,
  };
}

const NOTES: Note[] = [
  // ── 0 Magic ────────────────────────────────────────────────────────────
  note("0", "Sympathetic Resonance", ["magic/resonance", "systems/coupling"], `
# Resources
- Frazer, *The Golden Bough* — chapter on homeopathic magic
- [[Alchemical Tradition]] §§ correspondence tables

# Summary
- Two systems tuned to a shared frequency exchange energy without contact.
- The magical claim ("like affects like") is a pre-scientific theory of **coupling**; the physics claim is [[Phase Transition|critical coupling]].

## Mechanism
### Entrainment
- Two oscillators within a narrow bandwidth pull toward a common period.
### Cost
- Energy is conserved: resonance is a *transfer*, never a creation.

> Sympathy is what coupling looks like from the inside.

See also [[Control Loop]] and [[Emergence]].
`),
  note("0", "Sigil Mechanics", ["magic/sigil", "language/notation"], `
# Summary
- A sigil is a **compressed intention**: a glyph produced by deleting repeated letters from a statement until only strokes remain.
- Functionally identical to a hash: irreversible, fixed-width, collision-prone.

# Overview
## Construction
- Write desire → strike vowels and doubles → ligate the residue.
## Reading
- The glyph is not read, it is *recognised* — the same asymmetry as [[Semantic Drift]].

Related: [[Grimm's Law]] (sound → shape reduction), [[Hermetic Correspondence]].
`),
  note("0", "Grimoire Index", ["magic/index", "misc/zettelkasten"], `
# Summary
- A grimoire is a database with a bad query language. Every [[Hermetic Correspondence|correspondence table]] is a join across seven columns.

## Cross-references
- Metals ↔ planets ↔ hours ↔ organs → the original many-to-many schema.
- Retrieval was by *association*, which is exactly what a [[Zettelkasten]] does with links instead of tables.

See [[Atomic Notes]], [[Library of Alexandria]].
`),
  note("0", "Hermetic Correspondence", ["magic/correspondence", "anthropology/structure"], `
# Summary
- "As above, so below" is a claim that a map preserves structure — a **functor** between two categories of experience.

# Overview
## Formal reading
- If *F* : Above → Below preserves composition, then any true statement upstairs has a shadow downstairs.
- That is precisely [[Category Theory]] in ritual clothing.
## Failure modes
- Correspondence without constraint is [[Semantic Drift]] with incense.

Links: [[Structuralism]], [[Symmetry Breaking]], [[Grimoire Index]].
`),

  // ── 1 Cosmology ────────────────────────────────────────────────────────
  note("1", "Cosmological Constant", ["cosmology/lambda", "physics/field"], `
# Summary
- Λ is the energy density of empty space: a term Einstein added to hold the universe still, then discarded as his "greatest blunder", then resurrected by [[Observable Horizon|accelerating expansion]].

# Overview
## The discrepancy
- Vacuum energy from [[Renormalization|field theory]] overshoots observation by ~120 orders of magnitude.
- The worst prediction in physics; see [[Emergence]] for why bulk quantities can hide microscopic nonsense.
## Observables
- Λ enters the Friedmann equation alongside [[Dark Matter Halo|matter density]].

Related: [[Inflation]], [[Entropy]].
`),
  note("1", "Inflation", ["cosmology/inflation", "physics/phase"], `
# Summary
- A brief exponential expansion that flattens curvature and stretches quantum noise into galactic seeds.

## Why it explains things
1. Horizon problem — distant regions share a past light cone.
2. Flatness — curvature diluted to invisibility.
3. Structure — fluctuations seeded by [[Quantum Decoherence|decohering]] fields.

> The universe is a [[Phase Transition]] that never finished cooling.

See [[Cosmological Constant]], [[Great Attractor]], [[Symmetry Breaking]].
`),
  note("1", "Dark Matter Halo", ["cosmology/darkmatter"], `
# Summary
- Galaxies are embedded in roughly spherical halos that outweigh their visible matter ~6:1 and are inferred only from rotation curves and lensing.

## Structure
- NFW profile: dense cusp, extended tail.
- Halos merge → hierarchical clustering → the filamentary web that feeds the [[Great Attractor]].

Related: [[Finite Element Method]] (how the simulations are actually solved), [[Inflation]].
`),
  note("1", "Great Attractor", ["cosmology/flows", "systems/gravity"], `
# Summary
- A gravitational anomaly ~250 Mpc away pulling the Local Group at ~600 km/s, largely hidden behind the zone of avoidance.

## Interpretation
- Not a single object: a *confluence* of mass — Shapley Concentration plus the filament.
- A good example of [[Emergence]] at the largest scale: no single cause, only summed geometry.

See [[Dark Matter Halo]], [[Observable Horizon]].
`),
  note("1", "Observable Horizon", ["cosmology/horizon", "physics/information"], `
# Summary
- The particle horizon is the largest distance from which light has reached us in 13.8 Gyr; the cosmological event horizon is what we will *never* see.

## Consequences
- Λ-driven acceleration means ~97% of galaxies are already causally unreachable.
- Horizon area bounds information — the same bookkeeping as [[Entropy]] and [[Information Entropy]].

Related: [[Inflation]], [[Cosmological Constant]].
`),

  // ── 2 Physics ──────────────────────────────────────────────────────────
  note("2", "Entropy", ["physics/thermodynamics", "systems/irreversibility"], `
# Resources
- Boltzmann, *Lectures on Gas Theory*
- Schrödinger, *What is Life?*

# Summary
- Entropy counts the microstates compatible with a macrostate: S = k·ln W.
- The Second Law is not a law about energy but about **counting** — improbable things stay improbable.

# Overview
## Primary header
### Statistical reading
- Disorder is a measure of our coarse-graining, not of dirt.
### Information reading
- Shannon's H is the same functional form; see [[Information Entropy]].

## Consequences
- Life exports entropy: [[ATP Synthase]] runs downhill to build uphill.
- Cosmology inherits the arrow: [[Observable Horizon]].
- The devil's advocate: [[Maxwell's Demon]] — sorting molecules without paying, until Landauer made erasure expensive.

Related: [[Second Law]], [[Phase Transition]], [[Emergence]].
`),
  note("2", "Second Law", ["physics/thermodynamics"], `
# Summary
- No cyclic process whose only effect is to move heat from cold to hot. Equivalently: total entropy of a closed system does not decrease.

## Local loopholes
- Fluctuation theorems permit temporary decreases; the probability is exponential in the violation.
- Living systems are open systems — see [[Allosteric Regulation]] for a molecular ratchet.

See [[Entropy]], [[Control Loop]], [[Feedback Stability]].
`),
  note("2", "Phase Transition", ["physics/phase", "systems/criticality"], `
# Summary
- Qualitative change of state at a critical parameter: water/ice, paramagnet/ferromagnet, [[Symmetry Breaking|broken symmetry]].

## Universality
- Near criticality, details wash out; only dimensionality and symmetry class matter.
- Exponents are shared across wildly different systems — a triumph of [[Renormalization]].

Examples: [[Inflation]], [[Emergence]], [[Market Clearing]].
`),
  note("2", "Symmetry Breaking", ["physics/symmetry"], `
# Summary
- The laws keep a symmetry the state does not. A pencil balanced on its tip is rotationally symmetric; the fallen pencil is not.

## Where it appears
- Higgs mechanism, magnetism, crystallisation, [[Chirality]] in biochemistry.
- Culturally: [[Structuralism]] treats binary oppositions as broken symmetries of meaning.

Related: [[Category Theory]] (symmetry as automorphism), [[Phase Transition]].
`),
  note("2", "Renormalization", ["physics/field", "mathematics/scaling"], `
# Summary
- A procedure for ignoring scales you cannot see while keeping predictions honest: integrate out short distances, rescale, repeat.

## The deep idea
- Theories have **fixed points** under rescaling — see [[Fixed Point Theorem]].
- Universality classes in [[Phase Transition]] are just basins of attraction.

Related: [[Cosmological Constant]], [[Network Effects]], [[Complex Adaptive Systems]].
`),
  note("2", "Quantum Decoherence", ["physics/quantum"], `
# Summary
- Interaction with an environment suppresses interference between branches, turning superposition into apparent classicality without any collapse postulate.

## Timescales
- Decoherence for a dust grain in air: ~10⁻³¹ s. Measurement is not the mystery; isolation is.

Related: [[Entropy]], [[Information Entropy]], [[Inflation]].
`),

  // ── 3 Language ─────────────────────────────────────────────────────────
  note("3", "Grimm's Law", ["language/soundchange", "history/indo-european"], `
# Summary
- Regular correspondence between PIE stops and Germanic stops: p→f, t→θ, k→h (and voiced counterparts shift up).

## Why it matters
- Regularity implies **law**, not accident — the moment linguistics became a science.
- The same regularity assumption underlies [[Proto-Indo-European Roots]] reconstruction.

Related: [[Semantic Drift]], [[Sigil Mechanics]].
`),
  note("3", "Semantic Drift", ["language/semantics"], `
# Summary
- Meanings wander: *silly* went from "blessed" to "foolish"; *awful* from "awe-full" to "bad".

## Mechanisms
- Generalisation, specialisation, pejoration, amelioration.
- Metaphor is the engine — the same leap [[Hermetic Correspondence]] formalises.

Related: [[Ergativity]], [[Grimm's Law]], [[Grimoire Index]].
`),
  note("3", "Ergativity", ["language/typology"], `
# Summary
- Some languages group the subject of an intransitive with the *object* of a transitive, marking the transitive subject separately.

## Consequence
- "Who did it" is not a universal category; grammar encodes an ontology.

Related: [[Structuralism]], [[Semantic Drift]], [[Proto-Indo-European Roots]].
`),
  note("3", "Proto-Indo-European Roots", ["language/reconstruction", "history/indo-european"], `
# Summary
- Reconstructed morphemes (*\*bʰer-* "to carry") inferred from systematic correspondences across daughter languages.

## Method
- Compare cognate sets → apply [[Grimm's Law]] and its exceptions (Verner) → posit the ancestor.
- A **latent variable model** built a century before latent variable models had names.

Related: [[Semantic Drift]], [[Category Theory]], [[Bronze Age Collapse]].
`),

  // ── 4 Art ──────────────────────────────────────────────────────────────
  note("4", "Chiaroscuro", ["art/light", "art/technique"], `
# Summary
- Modelling form with extreme contrast between light and dark; Caravaggio's innovation was to make shadow a *subject*.

## Mechanics
- Perception of volume depends on gradient, not absolute luminance.
- The same contrast law governs graph legibility — which is why this vault dims unrelated nodes.

Related: [[Negative Space]], [[Golden Section]], [[Pigment Chemistry]].
`),
  note("4", "Golden Section", ["art/proportion", "mathematics/number"], `
# Summary
- φ ≈ 1.618; the ratio where the whole is to the larger part as the larger is to the smaller.

## Honest assessment
- Genuinely present in some composition and in phyllotaxis; wildly overclaimed in logo myths.
- It emerges from the simplest non-trivial recurrence — see [[Fibers and Bundles]] for the honest maths.

Related: [[Negative Space]], [[Chiaroscuro]].
`),
  note("4", "Negative Space", ["art/composition"], `
# Summary
- The empty region that gives the figure its edge. Removing content is a *design operation*, not a lack.

## Application
- In note-taking: whitespace between atoms is what makes the [[Zettelkasten|graph]] readable.
- In [[Chiaroscuro]]: shadow is negative space with a gradient.

Related: [[Atomic Notes]], [[Golden Section]].
`),
  note("4", "Pigment Chemistry", ["art/material", "biochem/synthesis"], `
# Summary
- Colour is a materials science: lead white, vermilion (HgS), lapis lazuli, and the 19th-century coal-tar revolution.

## Notes
- Ultramarine was priced like gold; synthetic ultramarine (1828) collapsed the market.
- Fading is oxidation — an [[Enzyme Catalysis|enzymatic]] problem in reverse.
- [[Melanin Synthesis]] is biology making pigment under the same constraints.

Related: [[Chirality]], [[Chiaroscuro]].
`),

  // ── 5 Anthropology ─────────────────────────────────────────────────────
  note("5", "Liminality", ["anthropology/ritual"], `
# Summary
- Turner's threshold state: betwixt and between, where ordinary structure is suspended and communitas appears.

## Sequence
1. Separation
2. **Liminal phase** — no status, no property, high ambiguity
3. Reaggregation

Related: [[Rite of Passage]], [[Structuralism]], [[Gift Economy]].
`),
  note("5", "Gift Economy", ["anthropology/exchange", "systems/economics"], `
# Summary
- Mauss: the gift obliges. Giving creates a debt that binds parties; refusing to reciprocate severs the relation.

## Contrast
- Market exchange clears and closes; gift exchange **stays open** — see [[Market Clearing]].
- Open source and [[Network Effects]] are gift economies with version control.

Related: [[Emergence]], [[Liminality]], [[Bronze Age Collapse]].
`),
  note("5", "Structuralism", ["anthropology/structure", "language/semantics"], `
# Summary
- Meaning is differential: a term means what it is *not*. Systems of opposition precede individual items.

## Consequence
- [[Hermetic Correspondence]] and [[Ergativity]] are both structuralist objects.
- Critique: structure without history freezes change — see [[Semantic Drift]].

Related: [[Symmetry Breaking]], [[Category Theory]].
`),
  note("5", "Rite of Passage", ["anthropology/ritual"], `
# Summary
- Van Gennep's tripartite schema for transitions of status: preliminal, liminal, postliminal.

## Examples
- Initiation, ordination, graduation, deployment, onboarding.

Related: [[Liminality]], [[Gift Economy]], [[History]].
`),

  // ── 6 Mathematics ──────────────────────────────────────────────────────
  note("6", "Category Theory", ["mathematics/structure", "misc/abstraction"], `
# Summary
- Study structure-preserving maps rather than the insides of objects. A category is objects + morphisms + composition + identities.

## Why it matters here
- A knowledge graph is a category whose morphisms are \`[[links]]\`; a vault reorganisation that preserves links is a functor.

Related: [[Fibers and Bundles]], [[Fixed Point Theorem]], [[Hermetic Correspondence]], [[Structuralism]].
`),
  note("6", "Fibers and Bundles", ["mathematics/topology", "physics/field"], `
# Summary
- A bundle attaches a space (the fiber) to each point of a base space; connections on bundles are how physicists write forces.

## Intuition
- The electromagnetic potential is a connection on a U(1) bundle; curvature = field strength.

Related: [[Manifold]], [[Symmetry Breaking]], [[Golden Section]].
`),
  note("6", "Fixed Point Theorem", ["mathematics/analysis"], `
# Summary
- Under mild conditions a continuous self-map of a nice space has a point that stays put (Brouwer, Banach, Kakutani).

## Applications
- Contraction mappings → iterative solvers in [[Finite Element Method]].
- Equilibria in [[Market Clearing]]; attractors in [[Complex Adaptive Systems]].
- Scale-invariant theories in [[Renormalization]].

Related: [[Feedback Stability]], [[Control Loop]].
`),
  note("6", "Manifold", ["mathematics/topology"], `
# Summary
- A space that looks locally like ℝⁿ but may be globally twisted.

## Examples
- Sphere, torus, configuration spaces of linkages, phase space in mechanics.

Related: [[Fibers and Bundles]], [[Category Theory]], [[Finite Element Method]].
`),
  note("6", "Information Entropy", ["mathematics/information", "physics/information"], `
# Summary
- H(X) = −Σ p log p: the expected surprise, the optimal compression length, the size of the description.

## Bridges
- Identical in form to thermodynamic [[Entropy]]; the bridge is Landauer's principle — erasure costs kT ln 2.
- [[Quantum Decoherence]] is information leaking into the environment.

Related: [[Observable Horizon]], [[Second Law]], [[Network Effects]].
`),

  // ── 7 Engineering ──────────────────────────────────────────────────────
  note("7", "Control Loop", ["engineering/control", "systems/feedback"], `
# Summary
- Sense → compare to setpoint → actuate → repeat. Everything from thermostats to glucose regulation to editorial practice.

## Design tensions
- Gain vs stability: push too hard and you oscillate. See [[Feedback Stability]].

Related: [[Allosteric Regulation]], [[Fixed Point Theorem]], [[Second Law]], [[Market Clearing]].
`),
  note("7", "Feedback Stability", ["engineering/control"], `
# Summary
- A loop is stable if its open-loop gain stays under 1 at the phase-crossover frequency (Nyquist).

## Practical rules
- Add phase margin, not just gain margin.
- Delay is the enemy; every transport lag eats phase.

Related: [[Control Loop]], [[Sympathetic Resonance]], [[Complex Adaptive Systems]].
`),
  note("7", "Finite Element Method", ["engineering/simulation", "mathematics/numerics"], `
# Summary
- Discretise a domain into elements, approximate the field per element, assemble a global sparse system, solve.

## Notes
- Convergence proofs are fixed-point arguments — [[Fixed Point Theorem]].
- Used for [[Dark Matter Halo]] simulations, crash models, and heat exchangers alike.

Related: [[Manifold]], [[Metamaterials]].
`),
  note("7", "Metamaterials", ["engineering/materials"], `
# Summary
- Structures whose effective properties come from geometry, not chemistry: negative index, cloaking shells, auxetics.

## Principle
- Averaging over sub-wavelength structure gives an emergent constitutive tensor — [[Emergence]] as a product spec.

Related: [[Chirality]], [[Finite Element Method]], [[Phase Transition]].
`),

  // ── 8 Biochem (flat) ───────────────────────────────────────────────────
  note("8", "Enzyme Catalysis", ["biochem/catalysis", "physics/kinetics"], `
# Summary
- Enzymes lower activation barriers by stabilising the transition state, not by changing ΔG.

## Mechanisms
- Proximity and orientation, electrostatic preorganisation, strain, covalent intermediates.
- Rates up to 10¹⁷× uncatalysed — see [[Allosteric Regulation]] for how this is *gated*.

Related: [[Second Law]], [[ATP Synthase]], [[Pigment Chemistry]].
`),
  note("8", "Allosteric Regulation", ["biochem/regulation", "systems/feedback"], `
# Summary
- Binding at one site changes the shape — and therefore the activity — of a distant site. Cooperativity gives sigmoidal response curves.

## Why it matters
- It is a molecular [[Control Loop]]: feedback inhibition tunes flux without new hardware.
- Sigmoid response = a biological [[Phase Transition]].

Related: [[Enzyme Catalysis]], [[ATP Synthase]], [[Feedback Stability]].
`),
  note("8", "ATP Synthase", ["biochem/energy", "physics/thermodynamics"], `
# Summary
- A rotary motor that converts proton-motive force into chemical bond energy at ~100 rev/s with near-perfect efficiency.

## Structure
- F₁ catalytic head (α₃β₃γδε) + F₀ membrane rotor; ~3 protons per ATP.

> A turbine at the end of a 3-billion-year supply chain.

Related: [[Entropy]], [[Second Law]], [[Enzyme Catalysis]].
`),
  note("8", "Chirality", ["biochem/stereochemistry", "physics/symmetry"], `
# Summary
- Molecules that are mirror images but not superimposable; biology is almost entirely homochiral (L-amino acids, D-sugars).

## Notes
- A broken symmetry with no obvious energetic preference — [[Symmetry Breaking]] at molecular scale.
- Consequences are absolute: thalidomide, smell, drug design.

Related: [[Pigment Chemistry]], [[Metamaterials]].
`),
  note("8", "Melanin Synthesis", ["biochem/synthesis", "history/anthropology"], `
# Summary
- Tyrosine → DOPA → dopaquinone → eumelanin/pheomelanin, regulated by MC1R and UV exposure.

## Notes
- Latitudinal cline: UV-B for vitamin D vs folate protection — an optimisation under [[Phase Transition|competing constraints]].
- Pigment as engineering: compare [[Pigment Chemistry]].

Related: [[Enzyme Catalysis]], [[Chirality]].
`),

  // ── 9 Misc (flat) ──────────────────────────────────────────────────────
  note("9", "Zettelkasten", ["misc/zettelkasten", "misc/method"], `
# Summary
- Luhmann's slip-box: many small, self-contained notes that are **addressed** and **linked**, so the archive can talk back.

## Rules
1. One idea per note (atomicity).
2. Give it a permanent address.
3. Link at the moment of writing, not later.
4. Prefer links over folders.

Related: [[Atomic Notes]], [[Negative Space]], [[Grimoire Index]], [[Second Brain]].
`),
  note("9", "Atomic Notes", ["misc/method", "misc/zettelkasten"], `
# Summary
- A note is atomic if it can be understood, cited and reused alone. If it needs a heading from another note to make sense, split it.

## Test
- Could this note be the *only* link target from three different parents? If not, it is a fragment, not an atom.

Related: [[Zettelkasten]], [[Negative Space]], [[Emergence]], [[Second Brain]].
`),
  note("9", "Second Brain", ["misc/method"], `
# Summary
- Capture → organise → distil → express. Useful as a pipeline; weak as a theory of thought.

## Critique
- Retrieval is cheap, comprehension is not. A [[Zettelkasten]] forces rewriting, which is where the learning happens.

Related: [[Atomic Notes]], [[Library of Alexandria]].
`),

  // ── A Systems (flat) ───────────────────────────────────────────────────
  note("A", "Emergence", ["systems/emergence", "systems/complexity"], `
# Summary
- Properties of a whole that no part possesses and that persist under changes of microscopic detail.

## Weak vs strong
- Weak emergence is simulable in principle (traffic waves, [[Phase Transition|criticality]]).
- Strong emergence claims irreducible downward causation — still contested.

## Instances in this vault
- [[Great Attractor]], [[Metamaterials]], [[Gift Economy]], [[Entropy]], [[Network Effects]].

Related: [[Complex Adaptive Systems]], [[Cosmological Constant]].
`),
  note("A", "Complex Adaptive Systems", ["systems/complexity", "systems/adaptation"], `
# Summary
- Many interacting agents adapting to each other produce memory, path dependence and regime shifts.

## Signatures
- Power-law distributions, hysteresis, punctuated equilibria, no stable optimum.

Related: [[Emergence]], [[Renormalization]], [[Feedback Stability]], [[Market Clearing]].
`),
  note("A", "Market Clearing", ["systems/economics", "mathematics/equilibrium"], `
# Summary
- A price at which quantity supplied equals quantity demanded; existence is a fixed-point result.

## Notes
- Arrow–Debreu needs convexity and completeness — assumptions reality fails daily.
- Clearing closes the loop; [[Gift Economy]] deliberately does not.

Related: [[Fixed Point Theorem]], [[Network Effects]], [[Complex Adaptive Systems]], [[Control Loop]].
`),
  note("A", "Network Effects", ["systems/networks", "systems/economics"], `
# Summary
- Value per user rises with the number of users: telephones, protocols, shared vocabularies, citation graphs.

## Dynamics
- Superlinear returns, lock-in, and a [[Phase Transition|tipping point]].
- A vault's graph is a network effect on your own attention — see [[Zettelkasten]].

Related: [[Information Entropy]], [[Emergence]], [[Gift Economy]].
`),

  // ── B History ──────────────────────────────────────────────────────────
  note("B", "Bronze Age Collapse", ["history/antiquity", "systems/collapse"], `
# Summary
- c. 1177 BCE: within a few decades Mycenae, Hatti, Ugarit and Egypt's Levantine holdings fail together.

## Causes (multi-causal)
- Drought and famine, the [[Sea Peoples]], earthquake storms, and above all **interdependence**: a tightly coupled trade network transmits local shocks globally.

Related: [[Complex Adaptive Systems]], [[Gift Economy]], [[Library of Alexandria]], [[Proto-Indo-European Roots]].
`),
  note("B", "Library of Alexandria", ["history/knowledge", "misc/method"], `
# Summary
- A state-funded project to copy every scroll arriving in port. Its loss was gradual — neglect, funding cuts, and several separate destructions.

## Lesson
- Redundancy and links beat centralised storage. The web is the anti-Alexandria.

Related: [[Grimoire Index]], [[Second Brain]], [[Zettelkasten]].
`),
  note("B", "Alchemical Tradition", ["history/alchemy", "magic/correspondence"], `
# Summary
- Two thousand years of laboratory practice wrapped in allegory: transmutation as both metallurgy and self-cultivation.

## Notes
- Its apparatus (retorts, baths, distillation) survives intact in [[Enzyme Catalysis|biochemical]] labs.
- Its symbolic system is a [[Grimoire Index]] over [[Hermetic Correspondence|correspondences]].

Related: [[Pigment Chemistry]], [[Chirality]], [[Bacon's Novum Organum]].
`),
  note("B", "Bacon's Novum Organum", ["history/science", "misc/method"], `
# Summary
- 1620: replace syllogism with structured induction; catalogue instances, tabulate absences, eliminate idols.

## Notes
- Bacon was the hinge between [[Alchemical Tradition]] and laboratory science.
- His tables are an early [[Atomic Notes|atomic]] data structure.

Related: [[Library of Alexandria]], [[Entropy]].
`),
  note("B", "History", ["history/meta"], `
# Summary
- The discipline of inferring causes from incomplete, biased and non-repeatable records.

## Method notes
- Source criticism, stratigraphy, prosopography, and increasingly cliometrics.
- Its central difficulty is [[Emergence]]: the unit of analysis is never stable.

Related: [[Bronze Age Collapse]], [[Rite of Passage]], [[Bacon's Novum Organum]].
`),
];

export function buildSeedVault(): Vault {
  const vault: Vault = {};
  for (const n of NOTES) vault[n.id] = n;
  return vault;
}

export const NOTE_TEMPLATE = `# Resources
- 

# Summary
- 

# Overview

## Primary header

### Secondary

- Content
`;
