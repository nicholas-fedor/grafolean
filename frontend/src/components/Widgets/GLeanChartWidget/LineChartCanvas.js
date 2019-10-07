import React from 'react';
import { withRouter } from 'react-router-dom';

import { generateSerieColor } from './utils';
import { PersistentFetcher } from '../../../utils/fetch/PersistentFetcher';

export class LineChartCanvases extends React.Component {
  CANVAS_WIDTH_PX = 1000;
  N_ADDITIONAL = 0; // n additional canvases to each of the sides

  getCanvasIntervals() {
    // each canvas covers a smaller part of the whole area, and we draw each one of them with a separate transform:
    const { fromTs, toTs, scale } = this.props;
    // the width of each canvas influences the timespan we draw on each of the canvases:
    const diffTs = Math.round(this.CANVAS_WIDTH_PX / scale);

    let result = [];
    for (
      let i = Math.floor(fromTs / diffTs) - this.N_ADDITIONAL;
      i < Math.ceil(toTs / diffTs) + this.N_ADDITIONAL;
      i++
    ) {
      const fromTsCanvas = i * diffTs;
      const toTsCanvas = (i + 1) * diffTs;
      result.push({ fromTsCanvas: fromTsCanvas, toTsCanvas: toTsCanvas });
    }
    return result;
  }

  render() {
    const { fromTs, toTs, ...rest } = this.props;
    const canvasIntervals = this.getCanvasIntervals();
    return (
      <>
        {canvasIntervals.map(ci => (
          <g
            key={ci.fromTsCanvas}
            transform={`translate(${(ci.fromTsCanvas - fromTs) * this.props.scale} 0)`}
          >
            <LineChartSingleCanvas {...rest} fromTs={ci.fromTsCanvas} toTs={ci.toTsCanvas} />
          </g>
        ))}
      </>
    );
  }
}

class _LineChartSingleCanvas extends React.PureComponent {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.canvasContext = this.canvasRef.current.getContext('2d');
    this.drawOnCanvas();
  }

  componentDidUpdate() {
    this.drawOnCanvas();
  }

  drawOnCanvas() {
    const ctx = this.canvasContext;
    const { fromTs, scale } = this.props;
    const ts2x = ts => (ts - fromTs) * scale;
    ctx.clearRect(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
    // debugging:
    // ctx.strokeStyle = `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, 0)}`; // random color
    // ctx.rect(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
    // ctx.stroke();
    this.props.drawnChartSeries.forEach(cs => {
      this.props.intervals.forEach(interval => {
        if (!interval.csData.hasOwnProperty(cs.chartSerieId)) {
          return;
        }
        const v2y = this.props.yAxesProperties[cs.unit].derived.v2y;
        const pathPoints = interval.csData[cs.chartSerieId].map(p => ({
          x: ts2x(p.t),
          y: v2y(p.v),
          minY: v2y(p.minv),
          maxY: v2y(p.maxv),
        }));
        //pathPoints.sort((a, b) => (a.x < b.x ? -1 : 1)); // seems like the points weren't sorted by now... we should fix this properly
        const linePoints = pathPoints.map(p => `${p.x},${p.y}`);
        const areaMinPoints = pathPoints.map(p => `${p.x},${p.minY}`);
        const areaMaxPointsReversed = pathPoints.map(p => `${p.x},${p.maxY}`).reverse();
        const serieColor = generateSerieColor(cs.path, cs.index);
        ctx.strokeStyle = serieColor;
        ctx.fillStyle = serieColor;

        if (this.props.isAggr) {
          ctx.beginPath();
          ctx.globalAlpha = 0.2;
          const areaPath = new Path2D(`M${areaMinPoints.join('L')}L${areaMaxPointsReversed}Z`);
          ctx.fill(areaPath);
          ctx.globalAlpha = 1.0;
        }

        ctx.beginPath();
        const linePath = new Path2D(`M${linePoints.join('L')}`);
        ctx.stroke(linePath);

        pathPoints.forEach(p => {
          ctx.beginPath();
          ctx.lineWidth = 0;
          ctx.arc(p.x, p.y, 1, 0, 2 * Math.PI);
          ctx.fill();
        });
      });
    });
  }

  onNotification = (mqttPayload, topic) => {
    console.log('GOT LOAD', mqttPayload, topic);
  };
  onFetchError = errorMsg => {
    console.error(errorMsg);
  };
  onUpdateData = json => {
    console.log(json);
  };

  render() {
    const { fromTs, toTs, scale, height, drawnChartSeries, aggrLevel } = this.props;
    const width = Math.round((toTs - fromTs) * scale);
    const allPaths = drawnChartSeries.map(cs => cs.path);
    const queryParams = {
      p: allPaths.join(','),
      t0: fromTs,
      t1: toTs,
      a: aggrLevel < 0 ? 'no' : aggrLevel,
    };
    return (
      <foreignObject width={width} height={height}>
        <PersistentFetcher
          resource={`accounts/${this.props.match.params.accountId}/values`}
          mqttTopic={`accounts/${this.props.match.params.accountId}/values/+`}
          queryParams={queryParams}
          onNotification={this.onNotification}
          onUpdate={this.onUpdateData}
          onError={this.onFetchError}
        />
        <canvas ref={this.canvasRef} width={width} height={height} />
      </foreignObject>
    );
  }
}
const LineChartSingleCanvas = withRouter(_LineChartSingleCanvas);
