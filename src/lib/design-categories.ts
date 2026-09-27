export type DesignCategory = {
  slug: string;
  label: string;
};

export const designCategories: DesignCategory[] = [
  { slug: "jerseys", label: "Jerseys" },
  { slug: "basketball-shirts", label: "Basketball Shirts" },
  { slug: "shorts", label: "Shorts" },
  { slug: "hoodies", label: "Hoodies" },
  { slug: "tracksuits", label: "Tracksuits" },
  { slug: "custom-uniforms", label: "Custom Uniforms" },
];

export function getDesignCategory(slug: string): DesignCategory | undefined {
  return designCategories.find((c) => c.slug === slug);
}
