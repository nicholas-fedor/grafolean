import React from 'react';

import './legend.css';

import { generateSerieColor } from './utils';

export default class Legend extends React.Component {
  static defaultProps = {
    chartSeries: [],
    onDrawnChartSeriesChange: (selectedChartSeries) => {},
  }

  constructor(props) {
    super(props);
    this.state = {
      selectedChartSeries: new Set(this.props.chartSeries),
      filter: "",
    }
  }

  componentDidMount() {
    this.onPathFilterChange = this.onPathFilterChange.bind(this);
    this.setStateCallbackOnDrawnPathsChange = this.setStateCallbackOnDrawnPathsChange.bind(this);
  }

  setStateCallbackOnDrawnPathsChange() {
    const drawnChartSeries = [ ...this.state.selectedChartSeries ].filter(cs => (this.state.filter === "" || cs.serieName.includes(this.state.filter)));
    this.props.onDrawnChartSeriesChange(drawnChartSeries);
  }

  onPathFilterChange(ev) {
    this.setState(
      {
        filter: ev.target.value,
      },
      this.setStateCallbackOnDrawnPathsChange
    );
  }

  toggleChartSerieSelected(cs) {
    this.setState(
      oldState => {
        const newSelectedChartSeries = new Set(oldState.selectedChartSeries);
        if (newSelectedChartSeries.has(cs)) {
          newSelectedChartSeries.delete(cs);
        } else {
          newSelectedChartSeries.add(cs);
        }
        return {
          selectedChartSeries: newSelectedChartSeries,
        }
      },
      this.setStateCallbackOnDrawnPathsChange
    );
  }

  render() {
    const filteredChartSeries = this.props.chartSeries.filter(cs => (this.state.filter === "" || cs.serieName.includes(this.state.filter)));
    return (
      <div>
        <div className="path-filter">
          <input
            type="text"
            name="pathFilter"
            onChange={ev => this.onPathFilterChange(ev)}
          />
          <i className="fa fa-filter" />
        </div>

        {(filteredChartSeries.length === 0) ? (
          <div className="path-filter-noresults">
            No paths match the filter "{this.state.filter}"
          </div>
        ) : (
          filteredChartSeries.map(cs => (
            <div
              key={cs.chartSeriesId}
              style={{
                position: 'relative',
              }}
              onClick={() => this.toggleChartSerieSelected(cs)}
            >
              <div className="path-checkbox"
                style={{
                  borderColor: generateSerieColor(cs.path, cs.index),
                }}
              >
                <div
                  style={{
                    backgroundColor: (this.state.selectedChartSeries.has(cs)) ? (generateSerieColor(cs.path, cs.index)) : ('#fff'),
                  }}
                />
              </div>
              <div style={{
                  paddingLeft: 35,
                  marginBottom: 5,
                }}
              >
                <span className="legend-label">{cs.serieName}</span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }
}

