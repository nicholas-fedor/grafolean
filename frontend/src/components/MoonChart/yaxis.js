import React from 'react';
import styled from 'styled-components';

const YAxisLabel = styled.text`
  font-family: "Comic Sans MS", cursive, sans-serif;
  font-size: 13px;
  text-anchor: end;
  fill: #333333;
  stroke: none;
`
YAxisLabel.displayName = 'YAxisLabel'

export default class YAxis extends React.Component {

  render() {
    return (
      <g>
        <rect x={0} y={0} width={this.props.width} height={this.props.height} fill="white" stroke="none" />
        <line x1={this.props.width - 1} y1={0} x2={this.props.width - 1} y2={this.props.height} shapeRendering="crispEdges" stroke={this.props.color} strokeWidth="1"/>

        {this.props.yTicks !== null && this.props.yTicks.map(v => {
          const y = this.props.v2y(v);
          return (
            <g key={v}>
              <YAxisLabel x={this.props.width - 7} y={y + 5}>{v}</YAxisLabel>
              <line x1={this.props.width - 4} y1={y} x2={this.props.width} y2={y} shapeRendering="crispEdges" stroke={this.props.color} strokeWidth="1"/>
            </g>
          )
        })}
      </g>
    );
  }
}

