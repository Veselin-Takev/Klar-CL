// ═══════════════════════════════════════════════════════════════════════════
// P2-BEFUND, NICHT BEHOBEN: Dieses Widget erzeugt Daten, die es nicht gibt.
// Angezeigte Verläufe, Werte und Trends sind erfunden — für die bedienende
// Person aber nicht von echten zu unterscheiden.
//
// Nicht stillschweigend entfernt, weil das eine Produktentscheidung ist:
// entweder echte Daten anbinden oder das Widget streichen. Ein drittes
// „Demodaten mit Hinweis" gibt es nicht — ein Hinweis, den man wegklickt,
// macht die Zahl nicht wahr.
// ═══════════════════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarChart3 } from 'lucide-react';

interface DataPoint {
  date: Date;
  conversations: number;
  responseRate: number;
}

function generateMockData(): DataPoint[] {
  const data: DataPoint[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    data.push({
      date: d,
      conversations: Math.floor(Math.random() * 8) + 1, // 1 to 8 conversations
      responseRate: Math.floor(Math.random() * 40) + 40 // 40% to 80% response rate
    });
  }
  return data;
}

export function ConversationStatsWidget() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data] = useState<DataPoint[]>(generateMockData());

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const margin = { top: 20, right: 40, bottom: 30, left: 30 };
    const width = 400 - margin.left - margin.right;
    const height = 250 - margin.top - margin.bottom;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const yLeft = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.conversations) as number + 2])
      .range([height, 0]);

    const yRight = d3.scaleLinear()
      .domain([0, 100])
      .range([height, 0]);

    // X Axis
    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%d.%m") as any))
      .attr("class", "text-stone-500 text-[10px]")
      .call(g => g.select(".domain").attr("stroke", "#e5e7eb"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#e5e7eb"));

    // Y Axis Left
    svg.append("g")
      .call(d3.axisLeft(yLeft).ticks(5))
      .attr("class", "text-stone-500 text-[10px]")
      .call(g => g.select(".domain").attr("stroke", "transparent"))
      .call(g => g.selectAll(".tick line").attr("stroke", "#e5e7eb").attr("x2", width).attr("stroke-dasharray", "2,2")); // Grid lines

    // Y Axis Right
    svg.append("g")
      .attr("transform", `translate(${width},0)`)
      .call(d3.axisRight(yRight).ticks(5).tickFormat(d => d + "%"))
      .attr("class", "text-stone-500 text-[10px]")
      .call(g => g.select(".domain").attr("stroke", "transparent"))
      .call(g => g.selectAll(".tick line").attr("stroke", "transparent"));

    // Add Bars for conversations
    const barWidth = width / data.length * 0.6;
    
    // We use a safe fallback color if CSS variable fails in D3
    const brandColor = "#f43f5e"; 
    
    svg.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", d => x(d.date) - barWidth / 2)
      .attr("y", d => yLeft(d.conversations))
      .attr("width", barWidth)
      .attr("height", d => height - yLeft(d.conversations))
      .attr("fill", brandColor)
      .attr("opacity", 0.6)
      .attr("rx", 2);

    // Add Line for response rate
    const line = d3.line<DataPoint>()
      .x(d => x(d.date))
      .y(d => yRight(d.responseRate))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#f59e0b") // amber-500
      .attr("stroke-width", 2.5)
      .attr("d", line);

    // Add dots for line
    svg.selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", d => x(d.date))
      .attr("cy", d => yRight(d.responseRate))
      .attr("r", 3)
      .attr("fill", "#fff")
      .attr("stroke", "#f59e0b")
      .attr("stroke-width", 2);

  }, [data]);

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-brand/10 dark:bg-brand-light/10 p-2.5 rounded-2xl text-brand dark:text-brand-light">
          <BarChart3 size={24} />
        </div>
        <div>
          <h3 className="font-semibold text-stone-900 dark:text-stone-100 text-base">Gesprächs-Performance</h3>
          <p className="text-xs text-stone-500 dark:text-stone-400">Letzte 30 Tage (Gespräche vs. Antwortrate)</p>
        </div>
      </div>
      
      <div className="flex justify-center items-center w-full mt-4">
        <svg ref={svgRef} className="w-full h-full min-h-[250px]" style={{ overflow: "visible" }}></svg>
      </div>

      <div className="flex justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-brand/60 rounded-sm"></div>
          <span className="text-stone-600 dark:text-stone-400 font-medium">Gespräche</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 bg-amber-500 rounded-sm"></div>
          <span className="text-stone-600 dark:text-stone-400 font-medium">Antwortrate</span>
        </div>
      </div>
    </div>
  );
}
