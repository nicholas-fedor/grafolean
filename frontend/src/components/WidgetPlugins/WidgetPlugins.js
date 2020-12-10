import React from 'react';
import { Link } from 'react-router-dom';

import store from '../../store';
import { handleFetchErrors, onFailure, ROOT_URL } from '../../store/actions';
import { fetchAuth } from '../../utils/fetch';
import { PersistentFetcher } from '../../utils/fetch/PersistentFetcher';
import Button from '../Button';
import ExternalLink from '../ExternalLink/ExternalLink';
import Loading from '../Loading';

export default class WidgetPlugins extends React.Component {
  state = {
    widgetPlugins: null,
    upgrading: false,
  };

  onWidgetPluginsUpdate = json => {
    this.setState({ widgetPlugins: json.list });
  };

  handleDelete = (ev, wpId) => {
    ev.preventDefault();
    const wp = this.state.widgetPlugins.find(wp => wp.id === wpId);
    if (!window.confirm(`Are you sure you want to uninstall plugin "${wp.label}" ? This can't be undone!`)) {
      return;
    }

    fetchAuth(`${ROOT_URL}/plugins/widgets/${wpId}`, { method: 'DELETE' })
      .then(handleFetchErrors)
      .catch(errorMsg => store.dispatch(onFailure(errorMsg.toString())));
  };

  handleUpgrade = async (ev, wpId) => {
    ev.preventDefault();
    this.setState({ upgrading: true });
    try {
      const response = await fetchAuth(`${ROOT_URL}/plugins/widgets/${wpId}`, { method: 'POST' });
      handleFetchErrors(response);
    } catch (errorMsg) {
      store.dispatch(onFailure(errorMsg.toString()));
    }
    this.setState({ upgrading: false });
  };

  render() {
    const { widgetPlugins, upgrading } = this.state;
    return (
      <>
        <PersistentFetcher resource="plugins/widgets" onUpdate={this.onWidgetPluginsUpdate} />
        {widgetPlugins === null ? (
          <Loading />
        ) : (
          <>
            {widgetPlugins.length > 0 && (
              <div className="widget-plugins frame">
                <table className="list">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Repository</th>
                      <th>Version</th>
                      <th />
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {widgetPlugins.map(wp => (
                      <tr key={wp.id}>
                        <td data-label="Name">
                          <i className={`fa fa-fw fa-${wp.icon}`} /> {wp.label}
                        </td>
                        <td data-label="Repository">
                          <ExternalLink to={wp.repo_url}>{wp.repo_url}</ExternalLink>
                        </td>
                        <td data-label="Version">{wp.version}</td>
                        <td>
                          <Button
                            isLoading={upgrading}
                            className="green"
                            onClick={ev => this.handleUpgrade(ev, wp.id)}
                          >
                            <i className="fa fa-fw fa-level-up" /> Upgrade
                          </Button>
                        </td>
                        <td data-label="">
                          <Button className="red" onClick={ev => this.handleDelete(ev, wp.id)}>
                            <i className="fa fa-fw fa-trash" /> Uninstall
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Link className="button green" to={`/plugins/widgets/new`}>
              <i className="fa fa-fw fa-plus" /> Install widget plugin
            </Link>
          </>
        )}
      </>
    );
  }
}
