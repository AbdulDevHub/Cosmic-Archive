# Cosmic Archive — Spaceship Class Design Brief

> **What this file is:** the owner's design brief for the five ships on the start page, and which reference each one follows. Read it before touching `src/scene/scenes/atlas/ships.ts`. Update the table in section 0 only when the owner changes a reference.

The owner's brief for the five ship classes (from their ChatGPT brainstorm and image generation, 2026-11-22). Reference images live in the owner's `owner/reference-images/` (kept out of git). Where this brief and `DECISIONS.md` disagree, the decision log wins.

## 0. Owner's Choices (2026-11-22, overrides the brief where they differ)

Which reference each ship follows (files in `owner/reference-images/`):

| Ship | Reference | Notes |
|---|---|---|
| Sovereign | `V1 Spaceship.png` | Saucer and twin nacelles, as close to the sheet as possible (owner's call, replacing D-118's "role, not shape"). |
| Predator | `V1 Spaceship.png` | The flat, angular blade cruiser, not V2's crescent wings. |
| Celestial | `V2 Spaceship.png` + `Celestial.jpg` | V2's flowing gold yacht; Celestial.jpg for the rings and gold craftsmanship. |
| Discovery | `Discovery.jpg` | Chunky modules, round engines, tall fins; its orange recoloured to the brief's white, silver and blue. |
| Colossus | `V2 Spaceship.png` | The long, layered fortress with no tower and engines built into the rear. |

**Build method:** richer procedural geometry in code for now (lathed and extruded hulls, panel lines and lights in a shader). **Future path:** model the ships in Blender and load them as `.glb` with three's `GLTFLoader` (no new npm package), when the procedural versions stop being enough.

## 1. Purpose and Context

The Cosmic Archive features five distinct spaceship classes that visitors can choose from to personalize their exploration experience.

These ships are not simply cosmetic variations of one another. Each represents a different philosophy of space exploration, with its own silhouette, personality, visual identity, and presence.

The ships belong in the same universe and should share a consistent level of visual quality, material detail, and overall artistic direction. However, their designs must remain immediately distinguishable.

The visual references provided alongside this document should be treated as the primary references for each ship's appearance. This document explains the creative intention behind those references and the characteristics that should be preserved when interpreting or implementing them.

## 2. The Five Ship Classes

### Class 01 — Sovereign
**Role:** The Elegant Flagship

**Core identity:** Elegance, balance, familiarity, and prestige.

The Sovereign is the classic flagship of the fleet. Its design takes inspiration from the graceful proportions of traditional science-fiction exploration vessels, particularly the elegance of saucer-shaped starships.

Key characteristics:
- A prominent, recognizable saucer-shaped primary hull.
- A balanced and symmetrical overall silhouette.
- Twin warp nacelles integrated into the design.
- Refined proportions rather than excessive bulk or aggressive geometry.
- Silver, white, and cool blue detailing.
- Blue propulsion lighting.

The Sovereign should feel like a sophisticated, capable, and dependable flagship. It is the most traditionally recognizable starship in the collection.

**Important:** The approved reference design is already close to the desired result. Preserve its overall silhouette and proportions rather than redesigning it unnecessarily.

### Class 02 — Predator
**Role:** The Intimidating Cruiser

**Core identity:** Power, intimidation, aggression, and unconventional design.

The Predator is the most intimidating ship in the fleet. It should look like a vessel that commands respect simply by entering a system.

Its design should feel alien, dangerous, and deliberately imposing, without looking like a conventional aircraft or fighter jet.

Key characteristics:
- A distinctive, sweeping silhouette.
- Large curved or crescent-like wings.
- Sharp, aggressive geometry balanced with flowing curves.
- Dark metallic, graphite, and other subdued materials.
- Carefully integrated blue propulsion lighting.
- An imposing central hull that gives the ship a substantial presence.

The wings are particularly important. They should have elegant curves and sweeping contours rather than straight, angular fighter-jet wings.

The Predator should communicate that it is a powerful capital-class spacecraft, not a small fighter.

**Avoid:**
- Conventional aircraft proportions.
- Cockpit-like fighter noses.
- Straight fighter-jet wings.
- Excessive visual resemblance to existing science-fiction ships.

The goal is an original, intimidating spacecraft with a predatory silhouette.

### Class 03 — Celestial
**Role:** The Legendary Vessel

**Core identity:** Beauty, luxury, refinement, and grandeur.

The Celestial is the most visually elegant and luxurious ship in the fleet. It should feel almost legendary, like a remarkable vessel that visitors would immediately associate with beauty and prestige.

Its design combines a pearl-white exterior with carefully placed gold accents.

Key characteristics:
- Pearl-white or polished ivory hull materials.
- Elegant gold detailing and trim.
- Smooth, flowing contours.
- Refined, elongated proportions.
- A luxurious yacht-like silhouette.
- Sophisticated lighting and subtle propulsion effects.

The design should feel more like a magnificent spacecraft yacht than a military vessel.

Its elegance should come from the shape and craftsmanship of the hull, not simply from adding gold decorations.

**Important:** Gold is a defining visual feature of the Celestial. Do not apply this same white-and-gold identity to the other ships.

Preserve the approved visual direction while exploring the more luxurious, flowing yacht-like qualities shown in the additional reference.

### Class 04 — Discovery
**Role:** The Experimental Explorer

**Core identity:** Curiosity, exploration, practicality, and innovation.

The Discovery is designed for exploration. Unlike the traditional flagship silhouette of the Sovereign, it should have a more unconventional shuttle-like structure.

Its shape should communicate that it is a purpose-built spacecraft designed to travel into unfamiliar environments.

Key characteristics:
- A recognizable central shuttle-like body.
- A somewhat boxier, more substantial fuselage.
- Narrower, restrained wings.
- An elongated and streamlined overall structure.
- Experimental but believable spacecraft proportions.
- White, silver, and cool blue detailing.
- Blue propulsion lighting.

The Discovery should look like a futuristic long-range exploration shuttle, not an aircraft and not a conventional NASA-style space shuttle.

Its wings should be relatively narrow and integrated into the body rather than dominating the silhouette.

**Important:** Maintain the shuttle-like identity. Do not turn it into another fighter, cruiser, or saucer-shaped starship.

### Class 05 — Colossus
**Role:** The Mobile Expedition Fortress

**Core identity:** Immensity, durability, security, and overwhelming scale.

The Colossus is the largest and most imposing vessel in the fleet. It is effectively a mobile space fortress capable of undertaking enormous expeditions across the universe.

It should feel less like a conventional starship and more like a colossal structure that happens to be capable of interstellar travel.

Key characteristics:
- An exceptionally broad and bulky hull.
- Massive, layered structural sections.
- A fortress-like silhouette.
- Heavy armour and substantial exterior architecture.
- A strong, continuous upper hull.
- Symmetrical, integrated propulsion architecture.
- Steel, silver, deep navy, and cool blue lighting.

The Colossus should communicate immense scale even when displayed alongside the other ships.

It should feel capable of carrying extensive exploration infrastructure and smaller vessels within its structure.

**Important structural considerations:**
- Avoid a raised bridge or command tower on top of the ship. It creates an apparent structural weak point and interrupts the fortress-like silhouette.
- Keep the upper structure low, continuous, and heavily integrated into the main hull.
- Propulsion should be symmetrical and integrated into the rear of the vessel.
- Avoid multiple exposed engine clusters that make the rear appear vulnerable.
- Do not make the ship look like a conventional starship that has simply been enlarged.

The Colossus should be a fortress first and a spacecraft second.

## 3. Fleet-Wide Design Principles

Although the five classes have different identities, they should belong to the same visual universe.

### Visual consistency
- Maintain a consistent level of 3D detail and material quality.
- Use believable spacecraft construction and integrated mechanical details.
- Give each vessel carefully considered proportions.
- Use cinematic lighting and subtle propulsion effects.
- Avoid overly synthetic holographic appearances.

### Distinct silhouettes

The ships must be recognizable from their silhouettes alone.

| Class | Defining silhouette |
|---|---|
| Sovereign | Saucer-shaped flagship with twin nacelles |
| Predator | Aggressive vessel with sweeping curved wings |
| Celestial | Flowing, luxurious spacecraft yacht |
| Discovery | Compact, boxier exploration shuttle |
| Colossus | Massive, broad mobile fortress |

Do not make the five designs feel like the same underlying ship with different wings, colours, or engine arrangements.

### Colour identities

- Sovereign: Silver, white, and blue.
- Predator: Dark metallic and graphite.
- Celestial: Pearl-white and gold.
- Discovery: White, silver, and blue.
- Colossus: Steel, silver, deep navy, and blue.

Gold should remain strongly associated with the Celestial.

## 4. Role in the Cosmic Archive Experience

The ships are part of the homepage's visual identity and help visitors personalize their exploration experience.

The visitor should be able to choose which ship represents their Cosmic Archive journey.

The selected ship should appear in the homepage's cosmic environment, complementing the surrounding galaxies, nebulae, planets, and other celestial objects.

The ships should enhance the feeling of exploring an enormous and beautiful universe rather than compete with the universe for attention.

They are not intended to become persistent companions throughout every page of the website. Their primary purpose is to establish the visitor's chosen identity on the homepage.

## 5. Creative Direction and Final Guidance

The most important requirement is that each ship should have a recognizable personality.

- The Sovereign represents traditional starship elegance.
- The Predator represents intimidation and unconventional power.
- The Celestial represents extraordinary beauty and luxury.
- The Discovery represents curiosity and exploration.
- The Colossus represents immense scale and security.

Use the supplied reference images to guide the actual visual implementation. This document should help interpret the design intent, not override the approved references.

Do not unnecessarily redesign ships that have already been approved. Preserve their defining characteristics and focus future refinement on areas that remain unfinished.

**The overall goal:** Five distinctive, memorable spacecraft that feel as though they belong in the same universe, while each offering a completely different way to experience the vastness of the Cosmic Archive.
