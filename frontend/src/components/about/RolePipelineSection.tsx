export default function RolePipelineSection() {
  return (
    <div>
      <p
        className="text-[14px] text-ink leading-[1.6] mb-6"
      >
        Automatic handoffs between six AI agents. Each role owns a single responsibility and produces a verifiable artefact.
      </p>

      <svg
        data-testid="role-pipeline-svg"
        viewBox="0 0 900 200"
        width="100%"
        height="auto"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Role pipeline flow diagram"
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#8B7A6B" />
          </marker>
        </defs>

        {/* Main row pills */}
        <rect x="30" y="43" width="100" height="34" rx="5" fill="#2A2520" />
        <rect x="185" y="43" width="100" height="34" rx="5" fill="#2A2520" />
        <rect x="340" y="43" width="100" height="34" rx="5" fill="#2A2520" />
        <rect x="495" y="43" width="100" height="34" rx="5" fill="#2A2520" />
        <rect x="650" y="43" width="100" height="34" rx="5" fill="#2A2520" />

        {/* Main row labels */}
        <text x="80" y="60" fontFamily="Geist Mono, monospace" fontSize="12" fontWeight="700" fill="#F4EFE5" textAnchor="middle" dominantBaseline="middle">PM</text>
        <text x="235" y="60" fontFamily="Geist Mono, monospace" fontSize="12" fontWeight="700" fill="#F4EFE5" textAnchor="middle" dominantBaseline="middle">Architect</text>
        <text x="390" y="60" fontFamily="Geist Mono, monospace" fontSize="12" fontWeight="700" fill="#F4EFE5" textAnchor="middle" dominantBaseline="middle">Engineer</text>
        <text x="545" y="60" fontFamily="Geist Mono, monospace" fontSize="12" fontWeight="700" fill="#F4EFE5" textAnchor="middle" dominantBaseline="middle">Reviewer</text>
        <text x="700" y="60" fontFamily="Geist Mono, monospace" fontSize="12" fontWeight="700" fill="#F4EFE5" textAnchor="middle" dominantBaseline="middle">QA</text>

        {/* Forward arrows */}
        <line x1="130" y1="60" x2="185" y2="60" stroke="#8B7A6B" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
        <line x1="285" y1="60" x2="340" y2="60" stroke="#8B7A6B" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
        <line x1="440" y1="60" x2="495" y2="60" stroke="#8B7A6B" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />
        <line x1="595" y1="60" x2="650" y2="60" stroke="#8B7A6B" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />

        {/* Loop-back arrow: QA → PM */}
        <path d="M 750,77 C 750,115 30,115 30,77" stroke="#8B7A6B" strokeWidth="1.5" fill="none" markerEnd="url(#arrowhead)" />

        {/* Designer pill (on-demand, dashed border) */}
        <rect x="107" y="133" width="100" height="34" rx="5" fill="none" stroke="#8B7A6B" strokeWidth="1.5" strokeDasharray="4 3" />

        {/* ON DEMAND label */}
        <text x="157" y="126" fontFamily="Geist Mono, monospace" fontSize="9" fontWeight="700" fill="#8B7A6B" textAnchor="middle" letterSpacing="2">ON DEMAND</text>

        {/* PM → Designer (dotted) */}
        <line x1="80" y1="77" x2="157" y2="133" stroke="#8B7A6B" strokeWidth="1.5" fill="none" strokeDasharray="3 3" />

        {/* Designer → Architect (dotted + arrowhead) */}
        <line x1="207" y1="150" x2="235" y2="77" stroke="#8B7A6B" strokeWidth="1.5" fill="none" strokeDasharray="3 3" markerEnd="url(#arrowhead)" />

        {/* Designer label */}
        <text x="157" y="150" fontFamily="Geist Mono, monospace" fontSize="12" fontWeight="700" fill="#1A1814" textAnchor="middle" dominantBaseline="middle">Designer</text>
      </svg>
    </div>
  )
}
