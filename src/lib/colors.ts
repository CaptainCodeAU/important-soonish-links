import type { ColorId } from "../types";

export interface NotionColorTokens {
  solid:   string;
  lightBg: string;
  darkBg:  string;
  label:   string;
}

export const NOTION_PALETTE: Record<ColorId, NotionColorTokens> = {
  default: { solid: "#9B9A97", lightBg: "#F1F1EF", darkBg: "#2F2F2F", label: "Default"  },
  gray:    { solid: "#9B9A97", lightBg: "#F1F1EF", darkBg: "#2F2F2F", label: "Gray"     },
  brown:   { solid: "#64473A", lightBg: "#F4EEEE", darkBg: "#3A2726", label: "Brown"    },
  orange:  { solid: "#D9730D", lightBg: "#FAEBDD", darkBg: "#3D2314", label: "Orange"   },
  yellow:  { solid: "#DFAB01", lightBg: "#FBF3DB", darkBg: "#3B2F00", label: "Yellow"   },
  green:   { solid: "#0F7B6C", lightBg: "#DDEDEA", darkBg: "#1C3830", label: "Green"    },
  blue:    { solid: "#0B6E99", lightBg: "#DDEBF1", darkBg: "#143A47", label: "Blue"     },
  purple:  { solid: "#6940A5", lightBg: "#EAE4F2", darkBg: "#2E2043", label: "Purple"   },
  pink:    { solid: "#AD1A72", lightBg: "#F4DFEB", darkBg: "#3A0D27", label: "Pink"     },
  red:     { solid: "#E03E3E", lightBg: "#FBE4E4", darkBg: "#3E1414", label: "Red"      },
};
