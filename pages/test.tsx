import React from 'react';
import { RadialChart } from 'react-vis';
import GridLayout from 'react-grid-layout';

const Test = () => {
  // dummy data for the charts
  const data = [
    { angle: 75, label: 'Active' },
    { angle: 25, label: 'Inactive' },
  ];

  // define the grid layout
  const layout = [
    { i: 'chart1', x: 0, y: 0, w: 1, h: 1 },
    { i: 'chart2', x: 1, y: 0, w: 1, h: 1 },
    { i: 'chart3', x: 0, y: 1, w: 1, h: 1 },
    { i: 'chart4', x: 1, y: 1, w: 1, h: 1 },
  ];

  return (
    <div>
      <h2>Meeting Activity</h2>
      <GridLayout className="layout" layout={layout} cols={2} rowHeight={300} width={600}>
        <div key="chart1">
          <RadialChart data={data} width={300} height={300} />
        </div>
        <div key="chart2">
          <RadialChart data={data} width={300} height={300} />
        </div>
        <div key="chart3">
          <RadialChart data={data} width={300} height={300} />
        </div>
        <div key="chart4">
          <RadialChart data={data} width={300} height={300} />
        </div>
      </GridLayout>
    </div>
  );
};

export default Test;