import React, { Component } from 'react';
import {
  VictoryChart,
  VictoryLine,
  VictoryArea,
  VictoryAxis,
//  VictoryZoomContainer,
  VictorySelectionContainer,
} from 'victory';
import Loading from '../Loading'
import moment from 'moment';
import range from 'lodash/range';

const timeTickFormatter = (tick) => moment(tick * 1000).format('DD.MM.YY HH:mm')


class Chart extends Component {

  _domainXTickProps(domainXFrom, domainXTo) {
    // returns appropriate formatter and tick values based on X domain
    // the goal is to provide an intelligent way of marking X axis
    return {
      tickFormat: timeTickFormatter,
      tickValues: range(domainXFrom, domainXTo, (domainXTo - domainXFrom) / 5),
    }
  }

  render() {
    return (
        (this.props.loading) ? (
          <Loading />
        ) : (
          <VictoryChart
            domain={this.props.domain}
          >
            <VictoryAxis
              {...this._domainXTickProps(this.props.domain.x[0], this.props.domain.x[1])}
            />
            <VictoryAxis
              dependentAxis
              tickFormat={(tick) => `$${Math.round(tick)}M`}
            />

            {Object.keys(this.props.series).map((path) => {
              return ([
                <VictoryArea
                  data={this.props.series[path].data}
                  x="t" y="ymin" y0="ymax"
                  style={{
                    data: {
                      fill: "#c43a31", fillOpacity: 0.2, strokeWidth: 0
                    },
                  }}
                />,
                <VictoryLine
                  data={this.props.series[path].data}
                  x="t" y="y"
                  style={{
                    data: { stroke: "#c43a31", strokeWidth: 1 },
                    parent: { border: "1px solid #ccc"},
                  }}
                />
              ])
            })}
        </VictoryChart>
      )


    );
  }
}

export default Chart;
