import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import isWidget from '../isWidget';
import { PersistentFetcher } from '../../../utils/fetch/PersistentFetcher';
import MatchingPaths from '../GLeanChartWidget/ChartForm/MatchingPaths';
import Loading from '../../Loading';

import './NetFlowNavigationWidget.scss';

class NetFlowNavigationWidget extends React.Component {
  /*
    - fetch the IDs of those entities that have ever collected any netflow traffic (check "netflow.1min.ingress.entity.?" paths)
      - when done, set shared value "selectedEntityId"
    - fetch extended information about these entities
    - fetch the IDs of interfaces from paths (check "netflow.1min.ingress.entity.<entity-id>.if.?" paths)
  */
  state = {
    entitiesIds: null,
    entities: null,
    interfaces: null,
  };

  DIRECTIONS = ['ingress', 'egress'];
  INTERVALS = ['1min', '15min', '1h', '4h', '24h'];
  PATH_FILTER_ENTITIES = 'netflow.1min.ingress.entity.?';
  DEFAULT_DIRECTION = 'ingress';
  DEFAULT_INTERVAL = '1min';

  componentDidMount() {
    this.initDefaultSharedValues();
  }

  initDefaultSharedValues() {
    const { netflowSelectedDirection, netflowSelectedInterval } = this.props.sharedValues;
    if (!netflowSelectedDirection) {
      this.props.setSharedValue('netflowSelectedDirection', this.DEFAULT_DIRECTION);
    }
    if (!netflowSelectedInterval) {
      this.props.setSharedValue('netflowSelectedInterval', this.DEFAULT_INTERVAL);
    }
  }

  onEntitiesPathsUpdate = json => {
    let entitiesIds;
    if (Object.keys(json.paths).length === 0) {
      entitiesIds = [];
    } else {
      entitiesIds = json.paths[this.PATH_FILTER_ENTITIES].map(p =>
        parseInt(MatchingPaths.constructChartSerieName(p.path, this.PATH_FILTER_ENTITIES, '$1', [])),
      );
    }
    this.setState(
      {
        entitiesIds: entitiesIds,
      },
      () => this.props.setSharedValue('selectedEntityId', entitiesIds.length > 0 ? entitiesIds[0] : null),
    );
  };

  onEntityUpdate = json => {
    const entityId = json.id;
    this.setState(prevState => ({
      entities: {
        ...prevState.entities,
        [entityId]: json,
      },
    }));
  };

  onEntitiesInterfacesUpdate = json => {
    const {
      sharedValues: { selectedEntityId },
    } = this.props;
    const filter = `netflow.1min.ingress.entity.${selectedEntityId}.if.?`;
    this.setState({
      interfaces: json.paths[filter].map(p =>
        MatchingPaths.constructChartSerieName(p.path, filter, '$1', []),
      ),
    });
  };

  onChangeDirection = ev => {
    this.props.setSharedValue('netflowSelectedDirection', ev.target.value);
  };

  onChangeSelectedInterval = ev => {
    this.props.setSharedValue('netflowSelectedInterval', ev.target.value);
  };

  onChangeEntity = ev => {
    this.props.setSharedValue('selectedEntityId', parseInt(ev.target.value));
    this.props.setSharedValue('selectedInterface', null);
  };

  onChangeInterface = ev => {
    const newInterface = ev.target.value;
    if (newInterface === '') {
      this.props.setPage('default');
    } else {
      this.props.setPage('netflow_interface');
    }
    this.props.setSharedValue('selectedInterface', newInterface);
  };

  renderDirectionsRadios() {
    const {
      widgetId,
      sharedValues: { netflowSelectedDirection = this.DEFAULT_DIRECTION },
    } = this.props;
    return (
      <div className="radios directions">
        {this.DIRECTIONS.map(direction => (
          <div key={direction}>
            <input
              type="radio"
              name={`${widgetId}-direction`}
              value={direction}
              checked={direction === netflowSelectedDirection}
              onChange={this.onChangeDirection}
            />
            {direction}
          </div>
        ))}
      </div>
    );
  }

  renderIntervalsRadios() {
    const {
      widgetId,
      sharedValues: { netflowSelectedInterval = this.DEFAULT_INTERVAL },
    } = this.props;
    return (
      <div className="radios intervals">
        {this.INTERVALS.map(interval => (
          <div key={interval}>
            <input
              type="radio"
              name={`${widgetId}-interval`}
              value={interval}
              checked={interval === netflowSelectedInterval}
              onChange={this.onChangeSelectedInterval}
            />{' '}
            {interval}
          </div>
        ))}
      </div>
    );
  }

  renderEntitiesDropdown() {
    const {
      sharedValues: { selectedEntityId = null },
    } = this.props;
    const { entities } = this.state;
    if (entities === null) {
      return <Loading overlayParent={true} />;
    }
    if (Object.keys(entities).length === 0) {
      return <select></select>;
    }
    return (
      <select value={selectedEntityId === null ? '' : selectedEntityId} onChange={this.onChangeEntity}>
        {Object.keys(entities).map(entityId => (
          <option key={entityId} value={entityId}>
            {entities[entityId].name}
          </option>
        ))}
      </select>
    );
  }

  renderInterfacesDropdown() {
    const {
      sharedValues,
      sharedValues: { selectedEntityId = null, selectedInterface = null },
      accountEntities,
    } = this.props;
    const { interfaces } = this.state;
    if (selectedEntityId === null) {
      return null;
    }
    if (interfaces === null) {
      return <Loading overlayParent={true} />;
    }
    if (interfaces.length === 0) {
      return <select></select>;
    }
    return (
      <select value={selectedInterface === null ? '' : selectedInterface} onChange={this.onChangeInterface}>
        <option value="">-- all interfaces --</option>
        {interfaces.map(iface => (
          <option key={iface} value={iface}>
            Interface:{' '}
            {MatchingPaths.constructChartSerieName(
              '',
              '',
              MatchingPaths.substituteSharedValues(
                `\${interfaceName(${selectedEntityId}, ${iface})}`,
                sharedValues,
              ),
              accountEntities,
            )}
          </option>
        ))}
      </select>
    );
  }

  render() {
    const {
      sharedValues: { selectedEntityId = null },
    } = this.props;
    const { entitiesIds } = this.state;
    const accountId = this.props.match.params.accountId;
    return (
      <div className="netflow-navigation-widget">
        <PersistentFetcher
          resource={`accounts/${accountId}/paths`}
          queryParams={{
            filter: this.PATH_FILTER_ENTITIES,
            limit: 101,
            failover_trailing: false,
          }}
          onUpdate={this.onEntitiesPathsUpdate}
        />
        {entitiesIds === null ? (
          <Loading />
        ) : entitiesIds.length === 0 ? (
          <p>There is no NetFlow data available for any entity.</p>
        ) : (
          <>
            {entitiesIds.map(entityId => (
              <React.Fragment key={entityId}>
                <PersistentFetcher
                  resource={`accounts/${accountId}/entities/${entityId}`}
                  onUpdate={this.onEntityUpdate}
                />
                {selectedEntityId === entityId && (
                  <PersistentFetcher
                    resource={`accounts/${accountId}/paths`}
                    queryParams={{
                      filter: `netflow.1min.ingress.entity.${selectedEntityId}.if.?`,
                      limit: 101,
                      failover_trailing: false,
                    }}
                    onUpdate={this.onEntitiesInterfacesUpdate}
                  />
                )}
              </React.Fragment>
            ))}
            {this.renderDirectionsRadios()}
            {this.renderIntervalsRadios()}
            {this.renderEntitiesDropdown()}
            {this.renderInterfacesDropdown()}
          </>
        )}
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  accountEntities: store.accountEntities,
});
const _NetFlowNavigationWidget = connect(mapStoreToProps)(NetFlowNavigationWidget);
export default withRouter(isWidget(_NetFlowNavigationWidget));
