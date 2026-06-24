import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Filter, GitCompare, TableProperties, Settings2 } from "lucide-react";
import DocsLayout from "@/layouts/DocsLayout";

export default function FeaturesCapabilities() {
  const toc = [
    { id: "global-filtering", label: "Global Filtering & State Management" },
    { id: "advanced-workflows", label: "Advanced Analysis Workflows" },
    { id: "data-mining", label: "Data Mining & Export" },
    { id: "interactive-simulation", label: "Interactive Simulation Mechanics" }
  ];

  return (
    <DocsLayout
      title="Features & Capabilities Guide"
      description="A comprehensive reference explaining the critical functional mechanics, exploration workflows, and advanced interactions available across the platform."
      toc={toc}
    >
      {/* Section 1: Global Filtering & State Management */}
      <section id="global-filtering" className="scroll-mt-8">
        <div className="mb-10 border-b pb-6">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Filter className="w-8 h-8 text-muted-foreground/50" />
            1. Global Filtering & State Management
          </h2>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
            Mechanisms dictating how data context is preserved and propagated across analytical views.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Global Date & Time Range Selection</h3>
            <p className="text-base text-foreground/90 leading-relaxed">
              Configured primarily on the <Link to="/analytics/executive" className="text-primary hover:underline font-medium inline-flex items-center">Executive Summary <ExternalLink className="w-3 h-3 ml-1" /></Link> page, the global date picker propagates its state via the global data store. This ensures that any subsequent analysis queries dynamically constrain themselves to the defined operational window, allowing seamless context-switching between high-level KPIs and deep-dives without losing the temporal frame of reference.
            </p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">URL-Synced Analysis State</h3>
            <p className="text-base text-foreground/90 leading-relaxed">
              In deeply interactive views like <Link to="/analytics/temporal" className="text-primary hover:underline font-medium inline-flex items-center">Temporal Analysis <ExternalLink className="w-3 h-3 ml-1" /></Link>, critical filter parameters—such as the exact hour range, selected day of the week, and active visualization layer—are seamlessly encoded directly into the browser's URL query string. This enables precise bookmarking and sharing of specific analytical insights with other stakeholders.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: Advanced Analysis Workflows */}
      <section id="advanced-workflows" className="scroll-mt-8">
        <div className="mb-10 border-b pb-6">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <GitCompare className="w-8 h-8 text-muted-foreground/50" />
            2. Advanced Analysis Workflows
          </h2>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
            Specialized tools designed to reveal hidden temporal patterns, correlations, and anomalies.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">A/B Comparison Mode</h3>
            <p className="text-base text-foreground/90 leading-relaxed">
              The Temporal Analysis engine supports a dual-state architecture, allowing analysts to define and visually compare two entirely distinct filter states side-by-side. For example, comparing peak weekday traffic patterns strictly against weekend distribution instantly reveals structural shifts in network load.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Time-Series Playback Engine</h3>
            <p className="text-base text-foreground/90 leading-relaxed">
              Instead of statically viewing isolated hours, the platform provides animation controls that automatically scrub through a selected temporal range. This transforms static spatial density maps into evolving visualizations, clearly illustrating the propagation of congestion and traffic flow dynamics over time.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Spatial Drill-Down</h3>
            <p className="text-base text-foreground/90 leading-relaxed">
              Within the <Link to="/analytics/geospatial" className="text-primary hover:underline font-medium inline-flex items-center">Geospatial Analysis <ExternalLink className="w-3 h-3 ml-1" /></Link> module, interactions are highly contextual. Clicking on a high-level aggregated station bubble triggers a smooth, interpolated map transition (adjusting both zoom and pitch) down to the specific jurisdiction, dynamically replacing aggregated bubbles with high-fidelity, localized data points for immediate forensic inspection.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: Data Mining & Export */}
      <section id="data-mining" className="scroll-mt-8">
        <div className="mb-10 border-b pb-6">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <TableProperties className="w-8 h-8 text-muted-foreground/50" />
            3. Data Mining & Export
          </h2>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
            Capabilities empowering analysts to structure raw data for external reporting.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Dynamic Cross-Tabulation</h3>
            <p className="text-base text-foreground/90 leading-relaxed">
              The <Link to="/analytics/sandbox" className="text-primary hover:underline font-medium inline-flex items-center">Exploratory Sandbox <ExternalLink className="w-3 h-3 ml-1" /></Link> features a responsive Query Builder capable of constructing on-the-fly pivot tables. By selecting arbitrary dimensions for the X and Y axes (e.g., crossing Vehicle Types against specific Offence Codes), users can instantly generate custom cross-tabulations that expose non-obvious correlations across the entire dataset.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">1-Click CSV Export</h3>
            <p className="text-base text-foreground/90 leading-relaxed">
              Any structured query or pivot table generated within the sandbox can be immediately exported to a standardized CSV format with a single click. This ensures seamless continuity for downstream processing, reporting, or ingestion into external business intelligence suites.
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: Interactive Simulation Mechanics */}
      <section id="interactive-simulation" className="scroll-mt-8">
        <div className="mb-10 border-b pb-6">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings2 className="w-8 h-8 text-muted-foreground/50" />
            4. Interactive Simulation Mechanics
          </h2>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
            Predictive engines used to forecast network strain and validate interventions.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Real-Time Parameter Sweeping</h3>
            <p className="text-base text-foreground/90 leading-relaxed">
              The <Link to="/simulation/studio" className="text-primary hover:underline font-medium inline-flex items-center">Simulation Studio <ExternalLink className="w-3 h-3 ml-1" /></Link> operates as a live macroscopic environment. Adjusting environmental or physical parameters via the control panel instantly recalculates the underlying mathematical models, triggering real-time updates across all gauges, curves, and attribution charts without requiring discrete reloading phases.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Network-Wide Subsetting</h3>
            <p className="text-base text-foreground/90 leading-relaxed">
              Rather than treating the city as a monolith, the <Link to="/simulation/network" className="text-primary hover:underline font-medium inline-flex items-center">Congestion Analysis <ExternalLink className="w-3 h-3 ml-1" /></Link> layer provides robust filtering tools. This allows operators to slice the entire geospatial network down to specific severity levels, instantly isolating critically congested bottlenecks and filtering out non-actionable, free-flowing corridors.
            </p>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
}
