import React from "react";
import { Link } from "react-router-dom";
import katex from 'katex';

const MathEq = ({ math, displayMode = false }) => {
  try {
    const html = katex.renderToString(math, { throwOnError: false, displayMode });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  } catch (e) {
    return <span>{math}</span>;
  }
};
import { Card, CardContent } from "@/components/ui/card";
import { Map, GitBranch, Clock, ExternalLink } from "lucide-react";
import DocsLayout from "@/layouts/DocsLayout";

export default function AggregationMethodology() {
  const toc = [
    { id: "geospatial", label: "Geospatial Data Handling" },
    { id: "network", label: "Congestion Analysis" },
    { id: "temporal", label: "Temporal Normalization" }
  ];

  return (
    <DocsLayout
      title="Data Aggregation & Methodology"
      description="A comprehensive technical reference documenting the SQL queries, transformations, normalizations, and statistical assumptions executed before data is rendered in the interface."
      toc={toc}
    >
      {/* Section A: Geospatial Data Handling */}
      <section id="geospatial" className="scroll-mt-8">
        <div className="mb-10 border-b pb-6 mt-8">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Map className="w-8 h-8 text-muted-foreground/50" />
            1. Geospatial Data Handling
          </h2>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
            Methods defining spatial grouping, anomaly detection, and vector matching within the <Link to="/analytics/geospatial" className="text-primary hover:underline font-medium inline-flex items-center">Geospatial Analysis <ExternalLink className="w-3 h-3 ml-1" /></Link> module.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Station Bubble Averaging</h3>
            <p className="text-base text-foreground/90 leading-relaxed mb-4">
              Rather than rendering thousands of distinct overlapping violation points across the city in the macroscopic view, the system aggregates points into "station bubbles" grouped by the `center_code` representing specific police jurisdictions.
            </p>
            <p className="text-base text-foreground/90 leading-relaxed">
              Crucially, the exact latitude and longitude of these jurisdiction bubbles are <strong>not hardcoded</strong>. The coordinates are calculated dynamically at query-time using DuckDB's spatial averaging: <code className="bg-muted px-1.5 py-0.5 rounded text-sm">AVG(latitude)</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-sm">AVG(longitude)</code> across all currently filtered violations. This ensures the bubble centers itself automatically at the true "center of mass" of the active violations, organically shifting if traffic enforcement hotspots move.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Predictability Entropy</h3>
            <p className="text-base text-foreground/90 leading-relaxed mb-4">
              Within the station drill-down view, a "Predictability Entropy" score is calculated to determine how scattered a station's violations are across the 24-hour cycle. A lower entropy indicates a highly predictable temporal pattern (e.g., all violations strictly occur between 8 AM and 9 AM), while a higher entropy indicates a flat, unpredictable distribution throughout the day.
            </p>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">Shannon Entropy Formula</p>
                <div className="text-center py-4 overflow-x-auto text-lg">
                  <MathEq math={String.raw`H = \sum \left( -p_i \cdot \log_2(p_i) \right)`} displayMode={true} />
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Where <MathEq math={String.raw`p_i`} /> is the proportion of total violations occurring in the <MathEq math={String.raw`i`} />-th hour bin.
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Behavioural Twins (Cosine Similarity)</h3>
            <p className="text-base text-foreground/90 leading-relaxed mb-4">
              The system can automatically identify other police stations experiencing the exact same daily ebbs and flows of traffic congestion. This is achieved by generating a 24-dimensional vector representing the hourly violation counts for every station.
            </p>
            <p className="text-base text-foreground/90 leading-relaxed">
              The engine then computes the <strong>Cosine Similarity</strong> between the target station's vector and all other station vectors across the network. Stations returning a similarity score closest to 1.0 are surfaced as "Behavioural Twins," regardless of whether their absolute violation volumes are vastly different.
            </p>
          </div>
        </div>
      </section>

      {/* Section B: Congestion Analysis */}
      <section id="network" className="scroll-mt-8">
        <div className="mb-10 border-b pb-6 mt-16">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <GitBranch className="w-8 h-8 text-muted-foreground/50" />
            2. Congestion Analysis & Geometry
          </h2>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
            The preprocessing mechanics bridging geographical road segments with the mathematical simulation engine inside <Link to="/simulation/network" className="text-primary hover:underline font-medium inline-flex items-center">Congestion Analysis <ExternalLink className="w-3 h-3 ml-1" /></Link>.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Passenger Car Unit (PCU) Aggregation</h3>
            <p className="text-base text-foreground/90 leading-relaxed mb-4">
              The underlying database strictly stores raw vehicle types (`CAR`, `BUS`, `TWO_WHEELER`). To convert these into usable physical obstructions, the system executes a Left Join against a static dimension table (`dim_vehicle_type_to_pcu_value`). 
            </p>
            <p className="text-base text-foreground/90 leading-relaxed">
              For any given road segment and temporal window, the engine aggregates the total blockage footprint by summing these discrete values (`SUM(p.pcu_value) as total_pcu`). This single concurrent PCU value is then injected directly into the Greenberg equation pipeline to calculate the resulting capacity loss.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Spatial Geometry Extraction</h3>
            <p className="text-base text-foreground/90 leading-relaxed">
              Road corridors are stored in DuckDB utilizing the geospatial `geometry` data type. To rapidly render these multi-line strings onto the interactive Deck.gl mapping interface, the backend SQL layer leverages DuckDB's spatial extension to convert the binary geometries directly into browser-ready JSON formats utilizing the <code className="bg-muted px-1.5 py-0.5 rounded text-sm">ST_AsGeoJSON(geometry)</code> function.
            </p>
          </div>
        </div>
      </section>

      {/* Section C: Temporal Analysis */}
      <section id="temporal" className="scroll-mt-8">
        <div className="mb-10 border-b pb-6 mt-16">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-muted-foreground/50" />
            3. Temporal Normalization
          </h2>
          <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
            Techniques utilized for time-series extraction and multi-dimensional analysis within the <Link to="/analytics/temporal" className="text-primary hover:underline font-medium inline-flex items-center">Temporal Analysis <ExternalLink className="w-3 h-3 ml-1" /></Link> and Sandbox modules.
          </p>
        </div>

        <div className="space-y-12">
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Global Z-Score and Heatmap Benchmarking</h3>
            <p className="text-base text-foreground/90 leading-relaxed mb-4">
              To power the weekly congestion heatmap, the system aggregates total volumes into a 2D matrix combining Day of the Week (`dow`) and Hour (`hour_val`). 
            </p>
            <p className="text-base text-foreground/90 leading-relaxed">
              Rather than rendering raw counts—which can be misleading without context—the query simultaneously computes the global average (`avg(count)`) and standard deviation (`stddev(count)`) across the entire matrix. This allows the frontend to compute standard Z-scores and accurately color-code the severity of specific time slots relative to the overarching network baseline.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-3 text-foreground">Offence Array Unnesting</h3>
            <p className="text-base text-foreground/90 leading-relaxed mb-4">
              The primary `violations` table is optimized for storage, capturing multiple concurrent offence codes against a single vehicle as a DuckDB `VARCHAR[]` list column. 
            </p>
            <p className="text-base text-foreground/90 leading-relaxed">
              When analysts utilize the Exploratory Sandbox to cross-tabulate specific offences against vehicle types, the backend SQL engine dynamically flattens these arrays using the <code className="bg-muted px-1.5 py-0.5 rounded text-sm">UNNEST(offence_code)</code> function. This ensures that a single vehicle committing both an illegal parking and a registration violation correctly registers as two independent tallies within the resulting pivot table, preventing severe statistical undercounting.
            </p>
          </div>
        </div>
      </section>
    </DocsLayout>
  );
}
