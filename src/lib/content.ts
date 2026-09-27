export const sports = [
  { name: "Cricket", description: "Custom jerseys, team kits and performance wear." },
  { name: "Basketball", description: "Jerseys, shorts and team apparel." },
  { name: "Soccer", description: "Custom team jerseys and coordinated kits." },
  { name: "Volleyball", description: "Lightweight jerseys and shorts." },
  { name: "Rugby", description: "Durable customized team wear." },
  { name: "Tennis", description: "Performance tops, shorts and coordinated apparel." },
  { name: "Beyond Sports", description: "T-shirts, tracks, shorts and custom shirts." },
  { name: "Future Apparel", description: "School shirts, office wear and party wear." },
];

export const strengths = [
  { title: "1,000+ Designs", description: "A large design library helps you move quickly from idea to product." },
  { title: "Fully Custom Designs", description: "New colors, patterns, names, numbers and concepts based on your preference." },
  { title: "Small-Order Customization", description: "Test or order smaller quantities without starting at very high volumes." },
  { title: "Samples in Hand", description: "See and feel product quality before you commit." },
  { title: "Sample Before Final Order", description: "We manufacture a sample for your approval before bulk production." },
  { title: "Fabric Choice", description: "Different fabric samples let you choose the feel, weight and performance." },
  { title: "Competitive Cost", description: "Efficient manufacturing helps us deliver stronger value." },
  { title: "Broad Production Capability", description: "Access to cost-effective manufacturing across many apparel categories." },
];

export const steps = [
  { title: "Imagine", description: "Share your sport, colors, logo, style and quantity." },
  { title: "Design", description: "We select from 1,000+ designs or create a new custom concept." },
  { title: "Choose Fabric", description: "Compare the available fabric options and quality." },
  { title: "Sample", description: "We produce a sample before the final bulk order." },
  { title: "Approve", description: "Confirm design, fabric, fit and finishing." },
  { title: "Manufacture", description: "Your approved order moves to production and delivery." },
];

export type Fabric = { slug: string; name: string; description: string; image: string };

export const fabrics: Fabric[] = [
  { slug: "smooth-interlock", name: "Smooth Interlock / Dri-Fit", description: "Smooth performance knit; good for sublimated jerseys.", image: "/fabrics/smooth-interlock.jpg" },
  { slug: "fine-interlock", name: "Fine Interlock / Performance Knit", description: "Soft, smooth sports fabric with a clean finish.", image: "/fabrics/fine-interlock.jpg" },
  { slug: "smooth-sublimation-knit", name: "Smooth Sublimation Knit", description: "Fine surface suited to detailed all-over printing.", image: "/fabrics/smooth-sublimation-knit.jpg" },
  { slug: "chevron-jacquard", name: "Chevron Jacquard Knit", description: "Premium textured pattern with a distinctive visual finish.", image: "/fabrics/chevron-jacquard.jpg" },
  { slug: "striped-mesh-jacquard", name: "Striped Mesh / Jacquard", description: "Textured stripe construction for a sporty look.", image: "/fabrics/striped-mesh-jacquard.jpg" },
  { slug: "ribbed-performance-mesh", name: "Ribbed Performance Mesh", description: "Fine linear texture; breathable athletic appearance.", image: "/fabrics/ribbed-performance-mesh.jpg" },
  { slug: "lightweight-stretch-knit", name: "Lightweight Stretch Knit", description: "Smooth lightweight performance fabric.", image: "/fabrics/lightweight-stretch-knit.jpg" },
  { slug: "micro-mesh", name: "Micro-Mesh / Bird-Eye Mesh", description: "Visible ventilation holes; a strong choice for active sports.", image: "/fabrics/micro-mesh.jpg" },
  { slug: "premium-smooth-interlock", name: "Premium Smooth Interlock", description: "Dense smooth face; clean, professional jersey finish.", image: "/fabrics/premium-smooth-interlock.jpg" },
  { slug: "vertical-texture-mesh", name: "Vertical-Texture Mesh", description: "Subtle vertical channels with breathable construction.", image: "/fabrics/vertical-texture-mesh.jpg" },
];

export const audiences = [
  "Local sports teams and recreational leagues",
  "Cricket, basketball, soccer, volleyball, rugby and tennis academies",
  "Schools and student groups",
  "Corporate and office teams",
  "Event and party organizers",
  "Apparel sellers and resellers",
];
