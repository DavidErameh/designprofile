export default function FeatureRow() {
  const features = [
    "Design DNA",
    "Tailwind Config",
    "Figma Tokens",
    "CSS Variables",
    "SCSS",
  ];

  return (
    <div className="w-full flex items-center justify-center gap-6 sm:gap-10 mt-12 mb-8">
      {features.map((feature) => (
        <span
          key={feature}
          className="text-[13px] text-[#394739]/50 font-medium whitespace-nowrap"
        >
          {feature}
        </span>
      ))}
    </div>
  );
}
