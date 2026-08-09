import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface InterestsCloudWidgetProps {
  interests: string[];
  mustHaves: string[];
}

export function InterestsCloudWidget({ interests, mustHaves }: InterestsCloudWidgetProps) {
  const d3Container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!interests || interests.length === 0 || !d3Container.current) return;

    // Clear previous
    d3.select(d3Container.current).selectAll('*').remove();

    const width = d3Container.current.clientWidth;
    const height = 200;

    const data = interests.map(i => ({
      text: i,
      value: mustHaves.includes(i) ? 40 : 20 + Math.random() * 10
    }));

    const svg = d3.select(d3Container.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Color scale
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.text))
      .range(['#a855f7', '#d946ef', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#6366f1']);

    // Create bubbles
    const node = svg.append('g')
      .selectAll('g')
      .data(data)
      .enter()
      .append('g')
      .call(d3.drag<SVGGElement, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    node.append('circle')
      .attr('r', d => d.value)
      .style('fill', d => mustHaves.includes(d.text) ? '#a855f7' : (color(d.text) as string))
      .style('fill-opacity', 0.8)
      .style('stroke', d => mustHaves.includes(d.text) ? '#9333ea' : 'none')
      .style('stroke-width', 2);

    node.append('text')
      .text(d => d.text)
      .attr('text-anchor', 'middle')
      .style('fill', '#fff')
      .style('font-size', d => Math.min(d.value / 2, 14) + 'px')
      .style('font-weight', d => mustHaves.includes(d.text) ? 'bold' : 'normal')
      .attr('dy', '.3em');

    const simulation = d3.forceSimulation<any>(data)
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('charge', d3.forceManyBody().strength(10))
      .force('collide', d3.forceCollide().radius((d: any) => d.value + 2).iterations(2));

    simulation.on('tick', () => {
      node.attr('transform', d => `translate(${Math.max(d.value, Math.min(width - d.value, (d as any).x))},${Math.max(d.value, Math.min(height - d.value, (d as any).y))})`);
    });

    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      (d as any).fx = (d as any).x;
      (d as any).fy = (d as any).y;
    }

    function dragged(event: any, d: any) {
      (d as any).fx = event.x;
      (d as any).fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      (d as any).fx = null;
      (d as any).fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [interests, mustHaves]);

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-sm border border-stone-100 dark:border-stone-800">
      <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm mb-4">Interessen-Wolke</h3>
      {interests.length > 0 ? (
        <div ref={d3Container} className="w-full h-[200px] overflow-hidden" />
      ) : (
        <p className="text-sm text-stone-500 dark:text-stone-400">Füge Interessen hinzu, um sie hier zu visualisieren.</p>
      )}
    </div>
  );
}
