"use client";

import { DesignProfile } from "../../../../../lib/types/profile";
import { generateExports } from "../../../../../lib/analysis/exports";
import CodeBlock from "@/components/CodeBlock";

export default function DeveloperTab({ profile }: { profile: DesignProfile }) {
  const exports = generateExports(profile);

  return (
    <div className="flex flex-col gap-10 animate-in fade-in duration-500 w-full">
      <CodeBlock 
        label="CSS Variables" 
        language="css" 
        code={exports.css_variables} 
      />
      <CodeBlock 
        label="tailwind.config.js" 
        language="javascript" 
        code={exports.tailwind_config} 
      />
      <CodeBlock 
        label="SCSS Variables" 
        language="scss" 
        code={exports.scss_variables} 
      />
      <CodeBlock 
        label="Raw JSON" 
        language="json" 
        code={JSON.stringify(profile, null, 2)} 
        collapsible={true}
      />
    </div>
  );
}
