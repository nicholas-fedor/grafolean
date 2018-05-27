import React from 'react';
import moment from 'moment';
import { stringify } from 'qs';

import store from '../../store';
import { ROOT_URL, handleFetchErrors, onSuccess, onFailure } from '../../store/actions';

import RePinchy from '../RePinchy';
import TimestampXAxis from './TimestampXAxis';
import YAxis from './yaxis';
import Legend from './legend';
import { getSuggestedAggrLevel, getMissingIntervals, generateSerieColor } from './utils';
import TooltipPopup from '../TooltipPopup';
import ChartForm from '../ChartForm';

import './index.css';
import MatchingPaths from '../ChartForm/MatchingPaths';

class ChartWidgetTitle extends React.Component {

  deleteChart = (ev) => {
    ev.preventDefault();

    fetch(`${ROOT_URL}/dashboards/${this.props.dashboardSlug}/charts/${this.props.chartId}`, { method: 'DELETE' })
      .then(handleFetchErrors)
      .then(() => {
        store.dispatch(onSuccess('Chart successfully removed.'));
        this.props.onDeleteChart();
      })
      .catch(errorMsg => store.dispatch(onFailure(errorMsg.toString())))
  }

  render() {
    return (
      <div className="widget-title">
        <h1>{this.props.title}</h1>
        <a onClick={this.props.onEditChart}>
          <i className="fa fa-edit" />
        </a>
        <a onClick={(ev) => { if (window.confirm("Are you sure you want to delete this chart? This can't be undone!")) this.deleteChart(ev); }}>
          <i className="fa fa-trash" />
        </a>
        <a>
          <i className="fa fa-arrows-alt" />
        </a>
      </div>
    )
  }
}

class WidgetDialog extends React.Component {
  static defaultProps = {
    width: 100,
    height: 100,
    padding: 20,
    onCloseAttempt: () => {},
  }

  render() {
    return (
      <div>
        <div
          className="widget-dialog-overlay"
          style={{
            width: this.props.width,
            height: this.props.opened ? this.props.height + 2*this.props.padding : 0,
            opacity: this.props.opened ? 0.1 : 0,
          }}
          onClick={this.props.onCloseAttempt}
        >
        </div>

        <div
          className="widget-dialog"
          style={{
            width: this.props.width - 2*this.props.padding,
            opacity: this.props.opened ? 1 : 0,
            zIndex: this.props.opened ? 9999 : -1,  // you need to send it to back, otherwise it floats before our chart
          }}
        >
          {this.props.children}
        </div>
      </div>
    )
  }
}

export default class MoonChartWidget extends React.Component {

  constructor(props) {
    super(props);
    this.allPaths = [].concat(...this.props.chartContent.map(c => c.paths));

    // construct a better representation of the data for display in the chart:
    const allChartSeries = this.props.chartContent.reduce((result, c, contentIndex) => {
      return result.concat(c.paths.map(path => ({
        chartSeriesId: `${contentIndex}-${path}`,
        path: path,
        serieName: MatchingPaths.constructChartSerieName(path, c.path_filter, c.renaming),
        unit: c.unit,
      })));
    }, []);
    const indexedAllChartSeries = allChartSeries.map((cs, i) => ({...cs, index: i }));

    this.state = {
      drawnChartSeries: indexedAllChartSeries,
      showChartSettings: false,
      allChartSeries: indexedAllChartSeries,
      yAxesCount: 1,
    }
  }

  toggleChartSettings = () => {
    this.setState(oldState => ({
      showChartSettings: !oldState.showChartSettings,
    }))
  }

  render() {
    const PADDING = 20;
    const MAX_YAXIS_WIDTH = 70;
    const widgetWidth = this.props.width;
    const usableWidgetWidth = widgetWidth - 2 * PADDING;
    const chartWidth = usableWidgetWidth * 0.7;
    const chartHeight = this.props.height;
    const legendWidth = usableWidgetWidth * 0.3;
    const yAxisWidth = Math.min(Math.round(chartWidth * 0.10), MAX_YAXIS_WIDTH);  // 10% of chart width, max. 100px
    const xAxisHeight = Math.min(Math.round(chartHeight * 0.10), 50);  // 10% of chart height, max. 50px
    const yAxesWidth = this.state.yAxesCount * yAxisWidth;

    const toTs = moment().unix();
    const fromTs = moment().subtract(1, 'month').unix();
    const initialScale = chartWidth / (toTs - fromTs);
    const initialPanX = - fromTs * initialScale;
    return (
      <div className="moonchart-widget widget">
        <ChartWidgetTitle
          title={this.props.title}
          dashboardSlug={this.props.dashboardSlug}
          chartId={this.props.chartId}
          onEditChart={this.toggleChartSettings}
          onDeleteChart={this.props.refreshParent}
        />

        <div
          className="widget-dialog-container"
          style={{
            position: 'relative',
            minHeight: chartHeight + 2*PADDING,
            width: widgetWidth,
          }}
        >

          <div
            style={{ padding: PADDING }}
            className="widget-content"
          >
            <RePinchy
              width={usableWidgetWidth}
              height={chartHeight}
              activeArea={{
                x: yAxesWidth,
                y: 0,
                w: chartWidth - yAxesWidth,
                h: chartHeight - xAxisHeight,
              }}
              initialState={{
                x: initialPanX,
                y: 0.0,
                scale: initialScale,
              }}
            >
              {(x, y, scale, zoomInProgress, pointerPosition) => (
                <div className="repinchy-content">
                  <ChartContainer
                    chartSeries={this.state.allChartSeries}
                    drawnChartSeries={this.state.drawnChartSeries}
                    width={chartWidth}
                    height={chartHeight}
                    fromTs={Math.round(-x/scale)}
                    toTs={Math.round(-x/scale) + Math.round(chartWidth / scale)}
                    scale={scale}
                    zoomInProgress={zoomInProgress}
                    xAxisHeight={xAxisHeight}
                    yAxisWidth={yAxisWidth}
                    pointerPosition={pointerPosition}
                    onYAxesCountUpdate={(newCount) => this.setState({ yAxesCount: newCount })}
                  />
                  <div
                    className="legend"
                    style={{
                      width: legendWidth,
                      height: chartHeight,
                      float: 'right',
                    }}
                  >
                    <Legend
                      chartSeries={this.state.allChartSeries}
                      onDrawnChartSeriesChange={(drawnChartSeries) => {
                        this.setState({
                          drawnChartSeries: drawnChartSeries,
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </RePinchy>
          </div>

          <WidgetDialog
            opened={this.state.showChartSettings}
            width={widgetWidth}
            height={chartHeight}
            padding={PADDING}
            onCloseAttempt={this.toggleChartSettings}
          >
            <ChartForm
              dashboardSlug={this.props.dashboardSlug}
              chartId={this.props.chartId}
              initialFormData={{
                name: this.props.title,
                content: this.props.chartContent,
              }}
            />
          </WidgetDialog>

        </div>
      </div>
    )
  }
}

class ChartContainer extends React.Component {
  requestsInProgress = [
    // {
    //   aggrLevel: ...
    //   fromTs: ...,
    //   toTs: ...,
    // },
  ];
  fetchedData = {
    /*
    aggrLevel: [
      {
        fromTs,
        toTs,
        pathsData: {
          <path0> : [
            { t:..., v:..., vmin:..., max:... },  // aggregation
            { t:..., v:... },  // no aggregation
          ],
        },
      },
       ...
    ]
    */
  };
  paths = null;
  yAxesProperties = {};

  constructor(props) {
    super(props);
    this.state = {
      fetchedIntervalsData: [],
      errorMsg: null,
      minYValue: null,
      maxYValue: null,
    }
    // make sure paths never change - if they do, there should be no effect:
    // (because data fetching logic can't deal with changing paths)
    this.paths = props.chartSeries.map(cs => cs.path);
  }

  componentDidMount() {
    this.ensureData(this.props.fromTs, this.props.toTs);
  }

  componentWillReceiveProps(nextProps) {
    this.ensureData(nextProps.fromTs, nextProps.toTs);
  }

  ensureData(fromTs, toTs) {
    const aggrLevel = getSuggestedAggrLevel(this.props.fromTs, this.props.toTs);  // -1 for no aggregation
    this.setState((oldState) => ({
      aggrLevel: aggrLevel,
      fetchedIntervalsData: this.fetchedData[aggrLevel] || [],
    }));
    const existingIntervals = [
      // anything that we might have already fetched for this aggrLevel:
      ...(this.fetchedData[`${aggrLevel}`] || []),
      // and anything that is being fetched:
      ...this.requestsInProgress.filter((v) => (v.aggrLevel === aggrLevel)),
    ];

    const diffTs = toTs - fromTs;
    const wantedIntervals = getMissingIntervals(existingIntervals, { fromTs: fromTs - diffTs/2, toTs: toTs + diffTs/2 });  // do we have everything we need, plus some more?
    if (wantedIntervals.length === 0) {
      return;
    }

    const intervalsToFeFetched = getMissingIntervals(existingIntervals, { fromTs: fromTs - diffTs, toTs: toTs + diffTs });  // fetch a bit more than we checked for, we don't want to fetch too often
    for (let intervalToBeFetched of intervalsToFeFetched) {
      this.startFetchRequest(intervalToBeFetched.fromTs, intervalToBeFetched.toTs, aggrLevel);  // take exactly what is needed, so you'll be able to merge intervals easily
    };
  }

  saveResponseData(fromTs, toTs, aggrLevel, json) {
    // make sure aggregation level exists:
    this.fetchedData[aggrLevel] = this.fetchedData[aggrLevel] || [];

    // find all existing intervals which are touching our interval so you can merge
    // them to a single block:
    const existingBlockBefore = this.fetchedData[aggrLevel].find((b) => (b.toTs === fromTs));
    const existingBlockAfter = this.fetchedData[aggrLevel].find((b) => (b.fromTs === toTs));
    // if there are any, merge them together:
    let pathsData = {};
    for (let path of this.paths) {
      pathsData[path] = [
        ...(existingBlockBefore ? existingBlockBefore.pathsData[path] : []),
        ...json.paths[path].data,
        ...(existingBlockAfter ? existingBlockAfter.pathsData[path] : []),
      ]
    };
    const mergedBlock = {
      fromTs: (existingBlockBefore) ? (existingBlockBefore.fromTs) : (fromTs),
      toTs: (existingBlockAfter) ? (existingBlockAfter.toTs) : (toTs),
      pathsData: pathsData,
    }

    // then construct new this.fetchedData from data blocks that came before, our merged block and those that are after:
    this.fetchedData[aggrLevel] = [
      ...this.fetchedData[aggrLevel].filter((b) => (b.toTs < mergedBlock.fromTs)),
      mergedBlock,
      ...this.fetchedData[aggrLevel].filter((b) => (b.fromTs > mergedBlock.toTs)),
    ];

    // while you are saving data, update min/max value:
    for (let cs of this.props.chartSeries) {
      if (!this.yAxesProperties.hasOwnProperty(cs.unit)) {
        this.yAxesProperties[cs.unit] = {
          minYValue: 0,
          maxYValue: Number.NEGATIVE_INFINITY,
        }
      }
      this.yAxesProperties[cs.unit].minYValue = json.paths[cs.path].data.reduce((prevValue, d) => (
        Math.min(prevValue, (aggrLevel < 0) ? (d.v) : (d.minv))
      ), this.yAxesProperties[cs.unit].minYValue);
      this.yAxesProperties[cs.unit].maxYValue = json.paths[cs.path].data.reduce((prevValue, d) => (
        Math.max(prevValue, (aggrLevel < 0) ? (d.v) : (d.maxv))
      ), this.yAxesProperties[cs.unit].maxYValue);
    }

    this.setState(oldState => ({
      fetchedIntervalsData: this.fetchedData[aggrLevel],
    }));

    const yAxesCount = Object.keys(this.yAxesProperties).length;
    this.props.onYAxesCountUpdate(yAxesCount);
  }

  startFetchRequest(fromTs, toTs, aggrLevel) {
    const requestInProgress = {  // prepare an object and remember its reference; you will need it when removing it from the list
      aggrLevel,
      fromTs,
      toTs,
    };
    this.requestsInProgress.push(requestInProgress);
    this.setState({
      fetching: true,
    })

    fetch(`${ROOT_URL}/values?${stringify({
      p: this.paths.join(","),
      t0: fromTs,
      t1: toTs,
      a: (aggrLevel < 0) ? ('no') : (aggrLevel),
    })}`)
      .then(handleFetchErrors)
      .then(
        response => response.json().then(json => {
          this.saveResponseData(fromTs, toTs, aggrLevel, json);
          return null;
        }),
        errorMsg => {
          return errorMsg;
        }
      )
      .then(
        errorMsg => {
          // whatever happened, remove the info about this particular request:
          this.requestsInProgress = this.requestsInProgress.filter((r) => (r !== requestInProgress));
          this.setState({
            fetching: this.requestsInProgress.length > 0,
            errorMsg,
          });
        }
      )
  }

  render() {
    return (
      <ChartView
        {...this.props}
        fetching={this.state.fetching}
        fetchedIntervalsData={this.state.fetchedIntervalsData}
        errorMsg={this.state.errorMsg}
        aggrLevel={this.state.aggrLevel}
        minYValue={0}
        maxYValue={900}
        yAxesProperties={this.yAxesProperties}
      />
    )
  }
}

class IntervalLineChart extends React.PureComponent {
  render() {
    const ts2x = (ts) => ( ts * this.props.scale );
    return (
      <g>
        {/* draw every path: */}
        {this.props.drawnChartSeries
          .map((cs) => {
            if (!this.props.interval.pathsData.hasOwnProperty(cs.path)) {
              return null;
            };
            const path = cs.path;
            const pathPoints = this.props.interval.pathsData[cs.path].map(p => ({
              x: ts2x(p.t),
              y: this.props.v2y(p.v, cs.unit),
              minY: this.props.v2y(p.minv, cs.unit),
              maxY: this.props.v2y(p.maxv, cs.unit),
            }));
            pathPoints.sort((a, b) => (a.x < b.x) ? (-1) : (1));  // seems like the points weren't sorted by now... we should fix this properly
            const linePoints = pathPoints.map((p) => (`${p.x},${p.y}`));
            const areaMinPoints = pathPoints.map((p) => (`${p.x},${p.minY}`));
            const areaMaxPointsReversed = pathPoints.map((p) => (`${p.x},${p.maxY}`)).reverse();
            const serieColor = generateSerieColor(cs.path, cs.index);
            return (
              <g key={`g-${cs.index}`}>
                <path
                  d={`M${areaMinPoints.join("L")}L${areaMaxPointsReversed}`}
                  style={{
                    fill: serieColor,
                    opacity: 0.2,
                    stroke: 'none',
                  }}
                />
                <path
                  d={`M${linePoints.join("L")}`}
                  style={{
                    fill: 'none',
                    stroke: serieColor,
                  }}
                />
                {(!this.props.isAggr) ? (
                  pathPoints.map((p, pi) => (
                    // points:
                    <circle key={`p-${cs.ndex}-${pi}`} cx={p.x} cy={p.y} r={2} style={{
                      fill: serieColor,
                    }} />
                  ))
                ) : (null)}
              </g>
            );
          })}

      </g>
    );
  }
}

class Grid extends React.Component {
  render() {
    const v2y = (v) => ((1 - v / this.props.maxYValue) * this.props.height);
    return (
      <g>
        {this.props.yTicks !== null && this.props.yTicks.map(v => {
          const y = v2y(v);
          return (
            <line key={v} x1={0} y1={y} x2={this.props.width} y2={y} shapeRendering="crispEdges" stroke="#f3f3f3" strokeWidth="1"/>
          )
        })}
      </g>
    );
  }
}

class TooltipIndicator extends React.Component {
  render() {
    const x = Math.round(this.props.x);
    const y = Math.round(this.props.y);
    const serieColor = generateSerieColor(this.props.cs.path, this.props.cs.index);
    return (
      <g>
        <line x1={x} y1={0} x2={x} y2={this.props.yAxisHeight} shapeRendering="crispEdges" stroke="#e3e3e3" strokeWidth="1"/>
        <circle cx={x} cy={y} r={4} fill={serieColor}/>
      </g>
    )
  }
}

export class ChartView extends React.Component {
  static defaultProps = {
    nDecimals: 2,
  }

  constructor(props) {
    super(props);
    this.yAxisHeight = this.props.height - this.props.xAxisHeight;
    this.state = {
      overrideClosestPoint: null,
    }
  }

  dy2dv = (dy, unit) => (dy * (this.props.yAxesProperties[unit].maxYValue - this.props.yAxesProperties[unit].minYValue) / this.yAxisHeight)
  dv2dy = (dv, unit) => (dv * this.yAxisHeight / (this.props.yAxesProperties[unit].maxYValue - this.props.yAxesProperties[unit].minYValue))
  dx2dt = (dx) => (dx / this.props.scale)
  dt2dx = (dt) => (dt * this.props.scale)
  x2t = (x) => (this.props.fromTs + x / this.props.scale);
  t2x = (t) => ((t - this.props.fromTs) * this.props.scale);
  y2v = (y, unit) => ((this.props.yAxesProperties[unit].maxYValue - this.props.yAxesProperties[unit].minYValue) * (this.yAxisHeight - y) / this.yAxisHeight + this.props.yAxesProperties[unit].minYValue);
  v2y = (v, unit) => (this.yAxisHeight - (v - this.props.yAxesProperties[unit].minYValue) * this.yAxisHeight / (this.props.yAxesProperties[unit].maxYValue - this.props.yAxesProperties[unit].minYValue));

  static getYTicks(minYValue, maxYValue) {
    // returns an array of strings - values of Y ticks
    if ((minYValue === null) || (maxYValue === null)) {
      return null;
    };
    // - normalize values to interval 10.0 - 99.9
    // - determine the appropriate interval I (10, 5 or 2)
    // - return the smallest list of ticks so that ticks[0] <= minYValue, ticks[n+1] = ticks[n] + 1, ticks[last] >= maxYValue

    // interval:
    const diffValue = maxYValue - minYValue;
    const power10 = Math.floor(Math.log10(diffValue)) - 1;
    const normalizedDiff = Math.floor(diffValue / Math.pow(10, power10));
    let normalizedInterval;
    if (normalizedDiff >= 50) {
      normalizedInterval = 10;
    } else if (normalizedDiff >= 20) {
      normalizedInterval = 5;
    } else {
      normalizedInterval = 2;
    };

    const interval = normalizedInterval * Math.pow(10, power10);
    const minValueLimit = Math.floor(minYValue / interval) * interval;
    let ret = [];
    let i;
    const numberOfDecimals = Math.max(0, - power10 - ((normalizedInterval === 10) ? 1 : 0) )
    for (i = minValueLimit; i < maxYValue; i += interval) {
      ret.push(i.toFixed(numberOfDecimals));
    }
    ret.push(i.toFixed(numberOfDecimals));
    return ret;
  }

  getClosestValue(ts, y) {
    const MAX_DIST_PX = 10;
    const maxDistTs = this.dx2dt(MAX_DIST_PX);

    // brute-force search:
    const applicableIntervals = this.props.fetchedIntervalsData
      .filter(fid => !( fid.toTs < ts - maxDistTs || fid.fromTs > ts + maxDistTs ));  // only intervals which are close enough to our ts

    let closest = null;
    for (let interval of applicableIntervals) {
      for (let cs of this.props.drawnChartSeries) {
        if (!interval.pathsData.hasOwnProperty(cs.path)) {  // do we have fetched data for this cs?
          continue;
        };
        const v = this.y2v(y, cs.unit);
        const maxDistV = this.dy2dv(MAX_DIST_PX, cs.unit);
        for (let point of interval.pathsData[cs.path]) {
          const distV = Math.abs(point.v - v);
          const distTs = Math.abs(point.t - ts);
          if ((distTs > maxDistTs) || (distV > maxDistV))
            continue;
            // when we are searching for closest match, we want it to be in x/y space, not ts/v:
          const distX = this.dt2dx(distTs);
          const distY = this.dv2dy(distV, cs.unit);
          const dist = Math.sqrt(distX * distX + distY * distY);

          if (closest === null || dist < closest.dist) {
            closest = {
              cs,
              point,
              dist,
            }
          }
        }
      }
    }
    return closest;
  }

  render() {
    // with scale == 1, every second is one pixel exactly: (1 min == 60px, 1 h == 3600px, 1 day == 24*3600px,...)
    const xAxisTop = this.props.height - this.props.xAxisHeight;
    const yAxisHeight = xAxisTop;
    const yTicks = ChartView.getYTicks(0, 700);  // temporary

    /*
      this.props.fetchedIntervalsData:
        [
          {
            "fromTs": 1516870170,
            "toTs": 1524922170,
            "pathsData": {
              "rebalancer.rqww2054.46Bk9z0r6c8K8C9du9XCW3tACqsWMlKj.rate.buying": [
                {
                  "minv": 650.65,
                  "v": 662.0042527615335,
                  "maxv": 668.02,
                  "t": 1518118200
                },
                // ...
              ],
              "rebalancer.rqww2054.46Bk9z0r6c8K8C9du9XCW3tACqsWMlKj.rate.selling": [
                {
                  "minv": 650.6,
                  "v": 659.263127842755,
                  "maxv": 665.81,
                  "t": 1518118200
                },
                // ...
              ]
            }
          },
          //...
        ]
    */

    let closest = this.state.overrideClosestPoint;
    if (!closest && this.props.pointerPosition) {
      closest = this.getClosestValue(this.props.pointerPosition.x, this.props.pointerPosition.yArea, 3600*24, 100);
    }

    const yAxesCount = Object.keys(this.props.yAxesProperties).length;
    const yAxesWidth = this.props.yAxisWidth * yAxesCount;

    return (
      <div
        style={{
          ...this.props.style,
        }}
      >
        <div className="chart"
          style={{
            width: this.props.width,
            height: this.props.height,
            backgroundColor: (this.props.zoomInProgress) ? ('yellow') : ('white'),
            position: 'relative',
            float: 'left',
          }}
        >

          {(this.props.fetching || this.props.errorMsg) && (
            <div style={{
                position: 'absolute',
                right: 9,
                top: 9,
              }}
            >
              {(this.props.fetching) ? (
                <i className="fa fa-spinner fa-spin" style={{
                    color: '#666',
                    fontSize: 30,
                  }}
                />
              ) : (
                <i className="fa fa-exclamation-triangle" style={{
                    color: '#660000',
                    margin: 5,
                    fontSize: 20,
                  }}
                  title={this.props.errorMsg}
                />
              )}
            </div>
          )}

          <svg width={this.props.width} height={this.props.height}>

            <g transform={`translate(${yAxesWidth} 0)`}>
              <Grid
                width={this.props.width - yAxesWidth}
                height={yAxisHeight}
                maxYValue={this.props.maxYValue}
                yTicks={yTicks}
              />
            </g>
            {/*
              Always draw all intervals which are available in your state. Each of intervals is its own element (with its identifying key) and is
              only transposed; this way there is no need to re-render interval unless the data has changed, we just move it around.
            */}
            <g transform={`translate(${yAxesWidth - 1 - this.props.fromTs * this.props.scale} 0)`}>
              {this.props.fetchedIntervalsData
                .map((interval, intervalIndex) => (
                  <IntervalLineChart
                    key={`i-${this.props.aggrLevel}-${intervalIndex}`}
                    interval={interval}
                    yAxisHeight={yAxisHeight}
                    minYValue={this.props.minYValue}
                    maxYValue={this.props.maxYValue}
                    scale={this.props.scale}
                    isAggr={this.props.aggrLevel >= 0}
                    drawnChartSeries={this.props.drawnChartSeries}
                    v2y={this.v2y}
                  />
                ))
              }
              {(closest) && (
                <TooltipIndicator
                  {...closest}
                  x={this.dt2dx(closest.point.t)}
                  y={this.v2y(closest.point.v, closest.cs.unit)}
                  yAxisHeight={yAxisHeight}
                />
              )}
            </g>

            <rect x={0} y={xAxisTop} width={yAxesWidth} height={this.props.xAxisHeight} fill="white" stroke="white" />

            {Object.keys(this.props.yAxesProperties).map((unit, i) => (
              <g key={`${i}`} transform={`translate(${i * this.props.yAxisWidth} 0)`}>
                <YAxis
                  width={this.props.yAxisWidth}
                  height={yAxisHeight}
                  minYValue={this.props.yAxesProperties[unit].minYValue}
                  maxYValue={this.props.yAxesProperties[unit].maxYValue}
                  unit={unit}
                  v2y={(v) => this.v2y(v, unit)}
                  yTicks={ChartView.getYTicks(this.props.yAxesProperties[unit].minYValue, this.props.yAxesProperties[unit].maxYValue)}
                  color="#999999"
                />
              </g>
            ))}

            <g transform={`translate(${yAxesWidth - 1} ${xAxisTop})`}>
              <TimestampXAxis
                width={this.props.width - yAxesWidth}
                height={this.props.xAxisHeight}
                color="#999999"

                scale={this.props.scale}
                panX={
                  this.props.fromTs * this.props.scale // we should pass fromTs and toTs here
                }
              />
            </g>
          </svg>

          {(closest) && (
            <div
              style={{
                position: 'absolute',
                left: this.t2x(closest.point.t) + yAxesWidth,
                top: this.v2y(closest.point.v, closest.cs.unit),
              }}
              // when mouse enters tooltip popup, stop looking for closest point and keep the popup open:
              onMouseEnter={() => { this.setState({ overrideClosestPoint: closest }); }}
              onMouseLeave={() => { this.setState({ overrideClosestPoint: null }); }}
            >
              <TooltipPopup>
                {(closest.point.minv) ? (
                  <div>
                    <p>{closest.cs.serieName}</p>
                    <p>{closest.cs.path}</p>
                    <p>{closest.point.minv.toFixed(this.props.nDecimals)} {closest.cs.unit} - {closest.point.maxv.toFixed(this.props.nDecimals)} {closest.cs.unit} (Ø {closest.point.v.toFixed(this.props.nDecimals)} {closest.cs.unit})</p>
                    <p>At: {moment(closest.point.t * 1000).format('YYYY-MM-DD')}</p>
                  </div>
                ) : (
                  <div>
                    <p>{closest.cs.serieName}</p>
                    <p>{closest.cs.path}</p>
                    <p>Value: {closest.point.v.toFixed(this.props.nDecimals)} {closest.cs.unit}</p>
                    <p>At: {moment(closest.point.t * 1000).format('YYYY-MM-DD HH:mm:ss')}</p>
                  </div>
                )}
              </TooltipPopup>
            </div>
          )}
        </div>
      </div>
    );
  }
}

