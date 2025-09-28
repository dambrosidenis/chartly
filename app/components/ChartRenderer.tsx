'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { ChartSpec } from '@/server/validator';
import WorldMap from './WorldMap';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ChartRendererProps {
  chartSpec: ChartSpec;
  rows: Record<string, any>[];
}

export default function ChartRenderer({ chartSpec, rows }: ChartRendererProps) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
        <p className="text-gray-500">No data to display</p>
      </div>
    );
  }

  if (chartSpec.chartType === 'table') {
    return <TableRenderer rows={rows} />;
  }

  try {
    const chartData = prepareChartData(chartSpec, rows);
    const options = getChartOptions(chartSpec);

    switch (chartSpec.chartType) {
      case 'line':
      case 'area':
        return (
          <div className="h-96">
            <Line data={chartData} options={options} />
          </div>
        );
      case 'bar':
        return (
          <div className="h-96">
            <Bar data={chartData} options={options} />
          </div>
        );
      case 'pie':
        return (
          <div className="h-96">
            <Pie data={chartData} options={options} />
          </div>
        );
      case 'geo':
        // Convert chart data to map format
        const mapData = rows.map(row => ({
          country: row[chartSpec.mapping.x],
          value: row[chartSpec.mapping.y as string],
        }));
        return <WorldMap data={mapData} title={chartSpec.title} />;
      default:
        return <TableRenderer rows={rows} />;
    }
  } catch (error) {
    console.error('Chart rendering error:', error);
    return <TableRenderer rows={rows} />;
  }
}

// Country code to name mapping
const COUNTRY_NAMES: Record<string, string> = {
  'US': 'United States',
  'DE': 'Germany', 
  'GB': 'United Kingdom',
  'FR': 'France',
  'CA': 'Canada',
  'UK': 'United Kingdom', // Alternative
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code?.toUpperCase()] || code;
}

function prepareChartData(chartSpec: ChartSpec, rows: Record<string, any>[]) {
  const { mapping } = chartSpec;
  
  // For geographical charts, enhance country codes with full names
  const isGeoChart = chartSpec.chartType === 'geo';
  const isCountryData = mapping.x.toLowerCase().includes('country') || 
                       rows.some(row => typeof row[mapping.x] === 'string' && 
                                      row[mapping.x]?.length === 2 && 
                                      COUNTRY_NAMES[row[mapping.x]?.toUpperCase()]);
  
  const enhanceLabels = isGeoChart || isCountryData;
  
  if (chartSpec.chartType === 'pie') {
    return {
      labels: rows.map(row => enhanceLabels ? getCountryName(row[mapping.x]) : row[mapping.x]),
      datasets: [{
        data: rows.map(row => row[mapping.y as string]),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF',
        ],
      }],
    };
  }

  // Handle multi-series data
  if (mapping.series) {
    // Long format: group by series column
    const seriesMap = new Map<string, { x: any; y: any }[]>();
    
    rows.forEach(row => {
      const seriesValue = row[mapping.series!];
      if (!seriesMap.has(seriesValue)) {
        seriesMap.set(seriesValue, []);
      }
      seriesMap.get(seriesValue)!.push({
        x: row[mapping.x],
        y: row[mapping.y as string],
      });
    });

    const datasets = Array.from(seriesMap.entries()).map(([series, data], index) => ({
      label: series,
      data: data.map(d => ({ x: d.x, y: d.y })),
      backgroundColor: getColor(index),
      borderColor: getColor(index),
      fill: chartSpec.chartType === 'area',
    }));

    return {
      datasets,
    };
  } else if (Array.isArray(mapping.y)) {
    // Wide format: multiple y columns
    const datasets = mapping.y.map((yCol, index) => ({
      label: yCol,
      data: rows.map(row => ({ x: row[mapping.x], y: row[yCol] })),
      backgroundColor: getColor(index),
      borderColor: getColor(index),
      fill: chartSpec.chartType === 'area',
    }));

    return {
      datasets,
    };
  } else {
    // Single series
    return {
      labels: rows.map(row => enhanceLabels ? getCountryName(row[mapping.x]) : row[mapping.x]),
      datasets: [{
        label: mapping.y as string,
        data: rows.map(row => row[mapping.y as string]),
        backgroundColor: '#36A2EB',
        borderColor: '#36A2EB',
        fill: chartSpec.chartType === 'area',
      }],
    };
  }
}

function getChartOptions(chartSpec: ChartSpec) {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: chartSpec.title,
      },
    },
  };

  // Special styling for geographical charts
  if (chartSpec.chartType === 'geo') {
    return {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        title: {
          display: true,
          text: `🌍 ${chartSpec.title}`,
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Countries',
          },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: chartSpec.mapping.y as string,
          },
        },
      },
    };
  }

  // Check if x-axis might be time-based
  const isTimeBased = chartSpec.mapping.x.toLowerCase().includes('date') || 
                      chartSpec.mapping.x.toLowerCase().includes('time') ||
                      chartSpec.mapping.x === 'x'; // Common time alias

  if (isTimeBased && (chartSpec.chartType === 'line' || chartSpec.chartType === 'area')) {
    return {
      ...baseOptions,
      scales: {
        x: {
          type: 'time' as const,
          time: {
            displayFormats: {
              day: 'MMM dd',
              week: 'MMM dd',
              month: 'MMM yyyy',
            },
          },
        },
        y: {
          beginAtZero: true,
        },
      },
    };
  }

  return {
    ...baseOptions,
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
      },
    },
  };
}

function getColor(index: number): string {
  const colors = [
    '#36A2EB',
    '#FF6384',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#C9CBCF',
    '#4BC0C0',
  ];
  return colors[index % colors.length];
}

function TableRenderer({ rows }: { rows: Record<string, any>[] }) {
  if (rows.length === 0) {
    return <p className="text-gray-500">No data to display</p>;
  }

  const columns = Object.keys(rows[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rows.slice(0, 100).map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td
                  key={column}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {formatCellValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 100 && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          Showing first 100 of {rows.length} rows
        </p>
      )}
    </div>
  );
}

function formatCellValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}
