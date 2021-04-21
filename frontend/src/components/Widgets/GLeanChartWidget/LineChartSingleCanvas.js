import React from 'react';

import { generateSerieColor } from './utils';

export const CHART_TYPE_LINE = 0;
export const CHART_TYPE_POINTS = 1;

class LineChartSingleCanvas extends React.PureComponent {
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
    const { chartType = CHART_TYPE_LINE } = this.props;
    const ctx = this.canvasContext;
    const { fromTs, scale } = this.props;
    const ts2x = ts => (ts - fromTs) * scale;
    ctx.clearRect(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
    // debugging:
    // ctx.strokeStyle = `#${Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, 0)}`; // random color
    // ctx.rect(0, 0, this.canvasRef.current.width, this.canvasRef.current.height);
    // ctx.stroke();
    this.props.drawnChartSeries.forEach(cs => {
      const serieColor = generateSerieColor(cs.path, cs.index);
      ctx.strokeStyle = serieColor;
      ctx.fillStyle = serieColor;

      this.props.intervals.forEach(interval => {
        if (!interval.csData.hasOwnProperty(cs.chartSerieId)) {
          return;
        }
        if (!this.props.yAxesProperties[cs.unit]) {
          return;
        }
        const v2y = this.props.yAxesProperties[cs.unit].derived.v2y;
        const pathPoints = interval.csData[cs.chartSerieId].map(p => ({
          x: ts2x(p.t),
          y: v2y(p.v),
          minY: v2y(p.minv),
          maxY: v2y(p.maxv),
        }));

        if (chartType === CHART_TYPE_POINTS) {
          pathPoints.forEach(p => {
            ctx.beginPath();
            ctx.lineWidth = 0;
            ctx.arc(p.x, p.y, 1, 0, 2 * Math.PI);
            ctx.fill();
          });
        } else {
          if (this.props.isAggr) {
            const areaMinPoints = pathPoints.map(p => `${p.x},${p.minY}`);
            const areaMaxPointsReversed = pathPoints.map(p => `${p.x},${p.maxY}`).reverse();
            ctx.beginPath();
            ctx.globalAlpha = 0.2;
            ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
            for (let i = 0; i < pathPoints.length; i++) {
              ctx.lineTo(pathPoints[i].x, pathPoints[i].minY);
            }
            for (let i = pathPoints.length - 1; i >= 0; i--) {
              ctx.lineTo(pathPoints[i].x, pathPoints[i].maxY);
            }
            ctx.fill();
            ctx.globalAlpha = 1.0;
          }

          ctx.beginPath();
          ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
          for (let i = 0; i < pathPoints.length; i++) {
            ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
          }
          ctx.stroke();
        }
      });
    });
  }

  render() {
    const { fromTs, toTs, scale, height } = this.props;
    const width = Math.round((toTs - fromTs) * scale);
    return (
      <foreignObject width={width} height={height}>
        <canvas ref={this.canvasRef} width={width} height={height} />
      </foreignObject>
    );
  }
}
export default LineChartSingleCanvas;
