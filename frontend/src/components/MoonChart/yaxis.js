import React, { Component } from 'react';
import styled from 'styled-components';

const YAxisLabel = styled.text`
  font-family: "Comic Sans MS", cursive, sans-serif;
  font-size: 13px;
  text-anchor: end;
  fill: #333333;
  stroke: none;
`

export default class YAxis extends Component {

  render() {
    return (
      <g class="y-axis">
        <rect x={0} y={0} width={this.props.width} height={this.props.height} fill="white" stroke="none" />
        <line x1={this.props.width - 1} y1={0} x2={this.props.width - 1} y2={this.props.height} shapeRendering="crispEdges" stroke={this.props.color} strokeWidth="1"/>

        <YAxisLabel x={this.props.width - 7} y={this.props.height + 5}>0</YAxisLabel>
        <line x1={this.props.width - 4} y1={this.props.height} x2={this.props.width} y2={this.props.height} shapeRendering="crispEdges" stroke={this.props.color} strokeWidth="1"/>

        <YAxisLabel x={this.props.width - 7} y={this.props.height - 50 + 5}>100</YAxisLabel>
        <line x1={this.props.width - 4} y1={this.props.height - 50} x2={this.props.width} y2={this.props.height - 50} shapeRendering="crispEdges" stroke={this.props.color} strokeWidth="1"/>
      </g>
    );
  }
}

