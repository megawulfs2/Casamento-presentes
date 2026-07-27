/**
 * Temas pré-definidos para o assistente de aparência.
 * Para adicionar um novo tema, basta incluir um item neste array —
 * a interface e a persistência se adaptam automaticamente.
 */
export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export const THEMES: Theme[] = [
  {
    id: "classico",
    name: "Clássico (vinho e dourado)",
    primaryColor: "#6E2A3A",
    secondaryColor: "#B8945F",
    fontFamily: "Cormorant Garamond",
  },
  {
    id: "romantico",
    name: "Romântico (rosé)",
    primaryColor: "#A64D6B",
    secondaryColor: "#D9A5B3",
    fontFamily: "Cormorant Garamond",
  },
  {
    id: "sereno",
    name: "Sereno (verde-oliva)",
    primaryColor: "#4B6043",
    secondaryColor: "#A6B58A",
    fontFamily: "Cormorant Garamond",
  },
  {
    id: "moderno",
    name: "Moderno (azul-marinho)",
    primaryColor: "#20304A",
    secondaryColor: "#C7A25A",
    fontFamily: "Nunito Sans",
  },
];

export const FONT_OPTIONS = [
  "Cormorant Garamond",
  "Nunito Sans",
  "Playfair Display",
  "Georgia",
];

export const BUTTON_STYLES = [
  { id: "pill", name: "Arredondado (pill)" },
  { id: "rounded", name: "Cantos suaves" },
  { id: "square", name: "Reto" },
];

export function buttonRadius(style: string): string {
  if (style === "square") return "0.25rem";
  if (style === "rounded") return "0.5rem";
  return "9999px";
}
