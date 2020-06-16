import React from 'react';
import { connect } from 'react-redux';
import { Switch, Route, withRouter } from 'react-router-dom';

import { ROOT_URL, doRequestBackendStatus } from '../../store/actions';
import Main from './Main';
import CORSWarningPage from '../WarningPages/CORSWarningPage';
import Loading from '../Loading';
import HostnameWarningPage from '../WarningPages/HostnameWarningPage';
import AdminMigrateDB from '../AdminMigrateDB';
import AdminFirst from '../AdminFirst';
import PageNotFound from '../PageNotFound';
import store from '../../store';

class MainWrapper extends React.Component {
  componentDidMount() {
    store.dispatch(doRequestBackendStatus());
  }

  backendIsCrossOrigin() {
    const backendUrl = new URL(ROOT_URL, window.location); // if ROOT_URL is relative, use window.location as base url
    return backendUrl.origin !== window.location.origin;
  }

  render() {
    const { isDarkMode, backendStatus, ...rest } = this.props;

    // When we enter the main part of the page, we need to check a set of conditions that should be met:
    // (like having connection to backend, being logged in and similar)

    if (!backendStatus) {
      return <Loading overlayParent={true} message={`Trying to connect to backend at: ${ROOT_URL}`} />;
    }
    // We want to be nice and display a warning when we are reaching a backend that we do not have access to (due
    // to CORS). For this reason /api/status/info backend endpoint is accessible from anywhere, and we can check
    // if our domain is in the list of CORS allowed domains, before we even request any CORS-protected resource.
    // This of course applies only if backend really is on a different domain (which it is not, for example, if
    // backend and frontend are behind the same nginx reverse proxy) - so this can't happen in default install.
    if (
      this.backendIsCrossOrigin() &&
      !backendStatus.cors_domains.includes(window.location.origin.toLowerCase())
    ) {
      return <CORSWarningPage />;
    }
    // If user has misconfigured "EXTERNAL_HOSTNAME" setting, we can detect this by comparing it to the domain in
    // URL. Otherwise MQTT connection would fail and user would be immediately logged out.
    if (backendStatus.mqtt_ws_hostname !== window.location.hostname) {
      return <HostnameWarningPage />;
    }
    if (backendStatus.db_migration_needed === true) {
      return <AdminMigrateDB />;
    }
    if (backendStatus.user_exists === false) {
      return <AdminFirst />;
    }

    return (
      <Switch>
        <Route exact path="/signup" component={PageNotFound} />
        <Route render={() => <Main {...rest} />} />
      </Switch>
    );
  }
}

const mapDarkModeToProps = store => ({
  isDarkMode: store.preferences.colorScheme === 'dark',
  backendStatus: store.backendStatus.status,
});
// withRouter is needed to force re-rendering of this component when URL changes:
export default withRouter(connect(mapDarkModeToProps)(MainWrapper));
