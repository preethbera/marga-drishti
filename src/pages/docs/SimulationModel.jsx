import React from "react";
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
import { ArrowRight, ArrowDown } from "lucide-react";
import DocsLayout from "@/layouts/DocsLayout";

export default function SimulationModel() {
  const toc = [
    { id: "introduction", label: "Introduction" },
    { id: "problem-definition", label: "Problem Definition" },
    { id: "modeling-approach", label: "Modeling Approach" },
    { id: "data-inputs", label: "Data Inputs" },
    { id: "parameters-and-variables", label: "Parameters and Variables" },
    { id: "derivation", label: "Derivation and Calibration" },
    { id: "workflow-and-formulation", label: "Calculation Workflow" },
    { id: "interpretation", label: "Interpretation of Results" },
    { id: "limitations", label: "Limitations and Assumptions" },
    { id: "references", label: "References" }
  ];

  return (
    <DocsLayout
      title="Traffic Simulation & Calculation Methodology"
      description=""
      toc={toc}
    >
      <section id="introduction" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 mb-4">Introduction</h2>
        <p className="text-base text-foreground/90 leading-7">
          The dynamic traffic simulation engine is designed to predict vehicle speeds across urban road networks. While traditional traffic models treat roads as static pipelines, real-world urban corridors experience constant fluctuations in physical capacity due to roadside activities. This model bridges classical macroscopic traffic flow theory with geometric capacity constraints, specifically focusing on the lateral friction caused by parking violations.
        </p>
      </section>

      <section id="problem-definition" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 mb-4">Problem Definition</h2>
        <div className="space-y-4 text-base text-foreground/90 leading-7">
          <p>
            Traffic congestion is not solely a product of high vehicle volume. In urban environments, illegally parked vehicles act as physical bottlenecks, choking the available width of the roadway. A single double-parked car can effectively destroy the capacity of an entire lane.
          </p>
          <p>
            Standard macroscopic models, such as the Greenberg model, assume a constant physical road space and predict speed purely based on vehicle density. To accurately simulate urban traffic jams, the system required a mathematical bridge that dynamically shrinks the road's theoretical capacity in real-time as parking violations occur.
          </p>
        </div>
      </section>

      <section id="modeling-approach" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 mb-4">Modeling Approach</h2>
        <div className="space-y-4 text-base text-foreground/90 leading-7">
          <p>
            The simulation utilizes an adapted version of the <strong>Greenberg Macroscopic Traffic Flow Model</strong>. The Greenberg model is highly effective for congested urban conditions because it models speed as a logarithmic function of density, meaning speed drops precipitously as the road approaches its physical limit (Jam Density).
          </p>
          <p>
            To account for parking violations, we introduced a geometric deduction step before the Greenberg equation is applied. The model converts parked vehicles into spatial measurements, subtracts this from the total road width, and calculates a dynamic "Effective Jam Density." This approach ensures that a physical obstruction on the road directly chokes the mathematical flow of traffic.
          </p>
        </div>
      </section>

      <section id="data-inputs" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 mb-4">Data Inputs</h2>
        <p className="text-base text-foreground/90 leading-7 mb-4">
          The simulation engine requires three dynamic variables evaluated at every timestamp:
        </p>
        <ol className="list-decimal list-outside ml-6 space-y-2 text-base text-foreground/90 leading-7">
          <li><strong>Total Road Width:</strong> The physical width of the road segment measured in meters.</li>
          <li><strong>Parked Vehicle Blockage:</strong> The maximum accumulated Passenger Car Units (PCU) of parked vehicles obstructing the lane at any single cross-section.</li>
          <li><strong>Current Traffic Density:</strong> The active number of vehicles attempting to use the road, measured in vehicles per kilometer.</li>
        </ol>
      </section>

      <section id="parameters-and-variables" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 mb-4">Parameters and Variables</h2>
        <p className="text-base text-foreground/90 leading-7 mb-4">
          To ensure accuracy, the model distinguishes between baseline constants and dynamic parameters.
        </p>
        <ul className="list-disc list-outside ml-6 space-y-2 text-base text-foreground/90 leading-7">
          <li><strong>Free-Flow Speed (<MathEq math={String.raw`U_f`} />):</strong> The speed of a vehicle when there is zero traffic or obstruction. Set at 67 km/h based on empirical calibration.</li>
          <li><strong>Optimum Speed (<MathEq math={String.raw`V_o`} />):</strong> The speed at which the road processes the absolute maximum volume of traffic.</li>
          <li><strong>Base Jam Density (<MathEq math={String.raw`K_{j, base}`} />):</strong> The maximum number of vehicles that can physically fit into a kilometer of a standard unobstructed road.</li>
          <li><strong>Jam Density per Meter (<MathEq math={String.raw`K_{j, meter}`} />):</strong> A derived constant defining how many jammed vehicles fit per longitudinal meter of asphalt width.</li>
          <li><strong>Effective Usable Width (<MathEq math={String.raw`W_{eff}`} />):</strong> The remaining drivable width of the road after subtracting parked vehicles.</li>
          <li><strong>Effective Jam Density (<MathEq math={String.raw`K_{j,eff}`} />):</strong> The dynamic capacity limit of the road under current parking conditions.</li>
        </ul>
      </section>

      <section id="derivation" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 mb-4">Derivation and Calibration of Constants</h2>
        <p className="text-base text-foreground/90 leading-7 mb-4">
          The system constants are anchored in empirical field data from a comprehensive study of mixed-traffic urban corridors [1].
        </p>
        <ul className="list-disc list-outside ml-6 space-y-2 text-base text-foreground/90 leading-7">
          <li><strong>Free-Flow Speed (66.99 km/h):</strong> Calibrated from field observations where the Greenberg model demonstrated the strongest statistical fit (<MathEq math={String.raw`R^2 = 0.695`} />) [1]. For simulation simplicity, this is rounded to 67 km/h.</li>
          <li><strong>Optimum Speed (33.5 km/h):</strong> Derived from the standard macroscopic assumption that maximum flow occurs at exactly half the free-flow speed [1].</li>
          <li><strong>Jam Density per Meter (10.86 veh/km/m):</strong> The research established a baseline jam density of 78.24 veh/km for a standard two-lane urban highway [1]. Assuming a standard width of 7.2 meters (two 3.6-meter lanes), dividing 78.24 by 7.2 yields exactly 10.86 vehicles per kilometer for every meter of road width.</li>
          <li><strong>PCU Physical Width (3.0 meters):</strong> A standard scalar equating 1.0 Passenger Car Unit to the approximate lateral space a parked car occupies, including the door-opening buffer zone.</li>
        </ul>
      </section>

      <section id="workflow-and-formulation" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 mb-6">Calculation Workflow and Mathematical Formulation</h2>

        {/* Diagram */}
        <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6 text-center">Calculation Pipeline</h3>
          
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-background p-4 rounded-lg border shadow-sm flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-semibold shrink-0">INPUT</div>
              <p className="font-medium">Road Width & PCU Values</p>
            </div>

            <div className="flex justify-center">
              <ArrowDown className="text-muted-foreground w-5 h-5" />
            </div>

            <div className="bg-background p-4 rounded-lg border shadow-sm flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-sm font-semibold shrink-0">STEP 1</div>
              <p className="font-medium">Calculate Effective Width</p>
            </div>

            <div className="flex justify-center">
              <ArrowDown className="text-muted-foreground w-5 h-5" />
            </div>

            <div className="bg-background p-4 rounded-lg border shadow-sm flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-sm font-semibold shrink-0">STEP 2</div>
              <p className="font-medium">Determine Effective Jam Density</p>
            </div>

            <div className="flex justify-center">
              <ArrowDown className="text-muted-foreground w-5 h-5" />
            </div>

            <div className="bg-background p-4 rounded-lg border shadow-sm flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-4 text-center sm:text-left">
              <div className="bg-primary/10 text-primary px-3 py-1 rounded text-sm font-semibold shrink-0">INPUT</div>
              <p className="font-medium">Current Traffic Density</p>
              <ArrowRight className="hidden sm:block text-muted-foreground w-5 h-5 mx-2" />
              <ArrowDown className="sm:hidden text-muted-foreground w-5 h-5" />
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded text-sm font-semibold shrink-0">STEP 3</div>
              <p className="font-medium">Apply Greenberg Speed Model</p>
            </div>

            <div className="flex justify-center">
              <ArrowDown className="text-muted-foreground w-5 h-5" />
            </div>

            <div className="bg-green-500/10 border-green-500/30 border p-4 rounded-lg flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="bg-green-500/20 text-green-700 dark:text-green-400 px-3 py-1 rounded text-sm font-bold shrink-0">OUTPUT</div>
              <p className="font-bold text-green-700 dark:text-green-400">Predicted Vehicle Speed</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          
          {/* Step 1 */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight mb-4">Step 1: Calculate Effective Usable Width</h3>
            <p className="text-base text-foreground/90 leading-7 mb-4">
              The system first determines how much physical space remains available for moving traffic.
            </p>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-center py-4 overflow-x-auto text-lg">
                  <MathEq math={String.raw`W_{eff} = W_{total} - (PCU_{parked} \times 3.0)`} displayMode={true} />
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-4">
                  <li><strong><MathEq math={String.raw`W_{eff}`} /></strong>: Effective usable width (meters).</li>
                  <li><strong><MathEq math={String.raw`W_{total}`} /></strong>: Total physical width of the road (meters).</li>
                  <li><strong><MathEq math={String.raw`PCU_{parked}`} /></strong>: The PCU value of the parked obstruction.</li>
                  <li><strong>Interpretation:</strong> Each parked PCU unit essentially nullifies 3.0 meters of physical road width, representing both the physical space taken by the vehicle and the psychological buffer space avoided by moving drivers.</li>
                  <li><strong>System Constraint:</strong> <MathEq math={String.raw`W_{eff}`} /> is programmatically clamped to a minimum of 1.0 meter to prevent mathematical errors in the subsequent steps if a road is completely blocked.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Step 2 */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight mb-4">Step 2: Calculate Effective Jam Density</h3>
            <p className="text-base text-foreground/90 leading-7 mb-4">
              The model scales the road's ability to hold vehicles based on the new, narrower usable width.
            </p>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-center py-4 overflow-x-auto text-lg">
                  <MathEq math={String.raw`K_{j,eff} = W_{eff} \times 10.86`} displayMode={true} />
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-4">
                  <li><strong><MathEq math={String.raw`K_{j,eff}`} /></strong>: Effective jam density (veh/km).</li>
                  <li><strong>10.86</strong>: The derived jam density per meter constant.</li>
                  <li><strong>Physical Meaning:</strong> A narrower road physically holds fewer vehicles before coming to a complete standstill. This translates the physical blockage into a traffic flow parameter.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Step 3 */}
          <div>
            <h3 className="text-lg font-semibold tracking-tight mb-4">Step 3: Predict Vehicle Speed</h3>
            <p className="text-base text-foreground/90 leading-7 mb-4">
              The modified Greenberg equation is applied to predict the final speed of the traffic stream.
            </p>
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <div className="text-center py-4 overflow-x-auto text-lg">
                  <MathEq math={String.raw`V = V_o \times \ln\left(\frac{K_{j,eff}}{K}\right)`} displayMode={true} />
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground mt-4">
                  <li><strong><MathEq math={String.raw`V`} /></strong>: Predicted average vehicle speed (km/h).</li>
                  <li><strong><MathEq math={String.raw`V_o`} /></strong>: Optimum speed (33.5 km/h).</li>
                  <li><strong><MathEq math={String.raw`K`} /></strong>: Current active traffic density (veh/km).</li>
                  <li><strong>Interpretation:</strong> The natural logarithm ensures that as the current density (<MathEq math={String.raw`K`} />) approaches the absolute limit (<MathEq math={String.raw`K_{j,eff}`} />), the speed decays rapidly toward zero, perfectly mimicking urban gridlock.</li>
                  <li><strong>System Constraint:</strong> If <MathEq math={String.raw`K \ge K_{j,eff}`} />, the formula evaluates to zero or a negative number. The simulation catches this and forces <MathEq math={String.raw`V = 0`} />, indicating total gridlock.</li>
                </ul>
              </CardContent>
            </Card>
          </div>

        </div>
      </section>

      <section id="interpretation" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 mb-4">Interpretation of Results</h2>
        <p className="text-base text-foreground/90 leading-7 mb-4">
          The primary output is the <strong>Predicted Speed (<MathEq math={String.raw`V`} />)</strong>.
        </p>
        <ul className="list-disc list-outside ml-6 space-y-2 text-base text-foreground/90 leading-7 mb-4">
          <li>Speeds near 33.5 km/h indicate optimal, smooth flow.</li>
          <li>Speeds below 15 km/h indicate severe congestion and stop-and-go conditions.</li>
          <li>A speed of 0 km/h triggers a system-wide "Gridlock Warning" for that specific segment.</li>
        </ul>
        <p className="text-base text-foreground/90 leading-7">
          By combining the predicted speed with the physical length of the road segment, the dashboard calculates the <strong>Estimated Travel Time</strong>, providing a highly intuitive metric for congestion impact.
        </p>
      </section>

      <section id="limitations" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 mb-4">Limitations and Assumptions</h2>
        <ul className="list-disc list-outside ml-6 space-y-2 text-base text-foreground/90 leading-7">
          <li><strong>Pedestrian Friction is Excluded:</strong> The model strictly isolates the impact of parked vehicles. Real-world speeds may be lower if heavy pedestrian flow is present.</li>
          <li><strong>Linear Blockage Assumption:</strong> The model assumes parked vehicles cause a static, linear reduction in width. It does not account for the dynamic shockwaves caused by the exact moment a vehicle pulls into or out of a parking space.</li>
          <li><strong>Homogeneous Distribution:</strong> It assumes moving traffic fluidly utilizes the remaining <MathEq math={String.raw`W_{eff}`} /> space without lane-switching delays.</li>
        </ul>
      </section>

      <section id="references" className="scroll-mt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-2 mb-4">References</h2>
        <p className="text-base text-foreground/90 leading-7">
          [1] <a href="https://www.researchgate.net/publication/400641588_Modeling_and_analyzing_of_vehicle_speed_under_roadside_interactions_and_traffic_stream_parameters_along_the_main_highway_in_Finote_Selam_Ethiopia" target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">Modeling and analyzing of vehicle speed under roadside interactions and traffic stream parameters along the main highway in Finote Selam, Ethiopia</a>
        </p>
      </section>
    </DocsLayout>
  );
}
