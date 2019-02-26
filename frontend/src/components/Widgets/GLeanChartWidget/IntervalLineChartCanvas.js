import React from 'react';

import { generateSerieColor } from './utils';

export default class IntervalLineChartCanvas extends React.Component {
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

  shouldComponentUpdate(nextProps) {
    for (let propName in this.props) {
      // this.props.v2y is anonymous function and changes every time parent rerenders, so
      // we ignore it as a signal for update:
      if (this.props[propName] !== nextProps[propName] && propName !== 'v2y') {
        return true;
      }
    }
    return false;
  }

  drawOnCanvas() {
    const ctx = this.canvasContext;
    const ts2x = ts => (ts - this.props.minKnownTs) * this.props.scale;
    this.props.drawnChartSeries.forEach(cs => {
      if (!this.props.interval.pathsData.hasOwnProperty(cs.path)) {
        return;
      }
      const v2y = this.props.v2y[cs.unit];
      const pathPoints = this.props.interval.pathsData[cs.path].map(p => ({
        x: ts2x(p.t),
        y: v2y(p.v),
        minY: v2y(p.minv),
        maxY: v2y(p.maxv),
      }));
      pathPoints.sort((a, b) => (a.x < b.x ? -1 : 1)); // seems like the points weren't sorted by now... we should fix this properly
      const linePoints = pathPoints.map(p => `${p.x},${p.y}`);
      const areaMinPoints = pathPoints.map(p => `${p.x},${p.minY}`);
      const areaMaxPointsReversed = pathPoints.map(p => `${p.x},${p.maxY}`).reverse();
      const serieColor = generateSerieColor(cs.path, cs.index);

      if (this.props.isAggr) {
        const areaPath = new Path2D(`M${areaMinPoints.join('L')}L${areaMaxPointsReversed}`);
        ctx.fill(areaPath);
      }

      const linePath = new Path2D(`M${linePoints.join('L')}`);
      ctx.strokeStyle = serieColor;
      ctx.stroke(linePath);

      pathPoints.forEach(p => {
        ctx.beginPath();
        ctx.lineWidth = 0;
        ctx.arc(p.x, p.y, 1, 0, 2 * Math.PI);
        ctx.fillStyle = serieColor;
        ctx.fill();
      });
    });
  }

  render() {
    const { width, height } = this.props;
    return (
      <foreignObject width={width} height={height}>
        <canvas ref={this.canvasRef} width={width} height={height} />
      </foreignObject>
    );
  }
}
