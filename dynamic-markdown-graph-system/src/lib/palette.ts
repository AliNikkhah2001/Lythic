export type DisciplineId =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "A"
  | "B";

export interface Discipline {
  id: DisciplineId;
  name: string;
  color: string;
  /** true = flattened into vault root (no directory) */
  flat: boolean;
  blurb: string;
}

export interface Note {
  id: string; // == title, links resolve by filename
  title: string;
  discipline: DisciplineId;
  content: string;
  created: number;
  modified: number;
}

export type Vault = Record<string, Note>;

export const DISCIPLINES: Record<DisciplineId, Discipline> = {
  "0": {
    id: "0",
    name: "Magic",
    color: "#a97bff",
    flat: false,
    blurb: "operative symbolism, resonance, sigil craft",
  },
  "1": {
    id: "1",
    name: "Cosmology",
    color: "#6f8cff",
    flat: false,
    blurb: "structure and history of the whole",
  },
  "2": {
    id: "2",
    name: "Physics",
    color: "#4fd1c5",
    flat: false,
    blurb: "law, symmetry, thermodynamics",
  },
  "3": {
    id: "3",
    name: "Language",
    color: "#ff8f6b",
    flat: false,
    blurb: "sound change, meaning, grammar",
  },
  "4": {
    id: "4",
    name: "Art",
    color: "#ff6ba9",
    flat: false,
    blurb: "composition, pigment, perception",
  },
  "5": {
    id: "5",
    name: "Anthropology",
    color: "#d9a441",
    flat: false,
    blurb: "ritual, kinship, exchange",
  },
  "6": {
    id: "6",
    name: "Mathematics",
    color: "#58d0ff",
    flat: false,
    blurb: "structure preserving maps",
  },
  "7": {
    id: "7",
    name: "Engineering",
    color: "#ff5f5f",
    flat: false,
    blurb: "control, materials, tolerance",
  },
  "8": {
    id: "8",
    name: "Biochem",
    color: "#6ee07a",
    flat: true,
    blurb: "biology + chemistry, flattened into root",
  },
  "9": {
    id: "9",
    name: "Misc",
    color: "#9aa3b2",
    flat: true,
    blurb: "unsorted atoms, flattened into root",
  },
  A: {
    id: "A",
    name: "Systems",
    color: "#ffd166",
    flat: true,
    blurb: "economics + emergence, flattened into root",
  },
  B: {
    id: "B",
    name: "History",
    color: "#c08552",
    flat: false,
    blurb: "personal and world",
  },
};

export const DISCIPLINE_LIST = Object.values(DISCIPLINES);
export const ROOT_COLOR = "#e3b062";

export function colorOf(id: DisciplineId | undefined): string {
  if (!id) return ROOT_COLOR;
  return DISCIPLINES[id]?.color ?? ROOT_COLOR;
}
