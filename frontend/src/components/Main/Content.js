import React from 'react';
import { Switch, Route, withRouter } from 'react-router-dom';

import './Content.scss';

import Bots from '../Bots/Bots';
import Changelog from '../About/Changelog';
import DashboardNewForm from '../DashboardNewForm';
import DashboardWidgetEdit from '../DashboardWidgetEdit';
import DashboardView from '../DashboardView/DashboardView';
import PageNotFound from '../PageNotFound';
import PersonNewForm from '../PersonNewForm/PersonNewForm';
import Persons from '../Persons/Persons';
import Profile from '../Profile';
import UserPermissions from '../UserPermissions/UserPermissions';
import UserPermissionsNewForm from '../UserPermissionsNewForm/UserPermissionsNewForm';
import Account from '../Account/Account';
import SelectAccount from './SelectAccount';
import Entities from '../Entities/Entities';
import EntityForm from '../EntityForm/EntityForm';
import AccountForm from '../AccountForm/AccountForm';
import BotForm from '../BotForm/BotForm';
import CredentialsForm from '../CredentialsForm/CredentialsForm';
import Credentials from '../Credentials/Credentials';
import Sensors from '../Sensors/Sensors';
import SensorForm from '../SensorForm/SensorForm';
import Entity from '../Entity/Entity';
import EntityProtocolsForm from '../EntityProtocolsForm/EntityProtocolsForm';
import Dashboards from '../Dashboards/Dashboards';
import Bot from '../Bot/Bot';
import ChangePassword from '../ChangePassword/ChangePassword';
import SystemwideBots from '../SystemwideBots/SystemwideBots';
import AccountEntitiesUpdater from '../AccountEntitiesUpdater/AccountEntitiesUpdater';
import WidgetPlugins from '../WidgetPlugins/WidgetPlugins';
import WidgetPluginNewForm from '../WidgetPluginNewForm/WidgetPluginNewForm';

// Our logged-in routes need to:
// - know about the content width that is available to them
// - be wrapped in a div with a suitable className so we can target pages with CSS selectors
class WrappedRoute extends React.Component {
  render() {
    const { component: Component, contentWidth, pageClassName, ...rest } = this.props;
    return (
      <Route
        {...rest}
        render={props => (
          // We need some className that will allow us to write CSS rules for specific pages if needed. In theory
          // we could use `Component.name` here, but when we build for production, names are obfuscated
          <div
            className={`page ${
              pageClassName ||
              rest.path
                .replace(/[^a-z0-9A-Z]+/g, ' ')
                .trim()
                .replace(/[ ]/g, '-')
            }`}
          >
            {/* we need information about all of the entities available live, all the time, so that we can show nice entity names dynamically: */}
            <AccountEntitiesUpdater />
            <Component {...props} width={contentWidth} />
          </div>
        )}
      />
    );
  }
}

class Content extends React.PureComponent {
  render() {
    const { contentWidth } = this.props;

    return (
      <div className="content centered">
        <Switch>
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/"
            component={SelectAccount}
            pageClassName="select-account"
          />
          <WrappedRoute exact contentWidth={contentWidth} path="/changelog" component={Changelog} />
          <WrappedRoute exact contentWidth={contentWidth} path="/profile" component={Profile} />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/profile/change-password"
            component={ChangePassword}
          />

          <WrappedRoute exact contentWidth={contentWidth} path="/bots" component={SystemwideBots} />
          <WrappedRoute exact contentWidth={contentWidth} path="/bots-new" component={BotForm} />
          <WrappedRoute exact contentWidth={contentWidth} path="/bots/:botId/edit" component={BotForm} />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/bots/:userId/permissions"
            component={UserPermissions}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/bots/:userId/permissions/new"
            component={UserPermissionsNewForm}
          />
          <WrappedRoute exact contentWidth={contentWidth} path="/users" component={Persons} />
          <WrappedRoute exact contentWidth={contentWidth} path="/users-new" component={PersonNewForm} />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/users/:userId/permissions"
            component={UserPermissions}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/users/:userId/permissions/new"
            component={UserPermissionsNewForm}
          />

          <WrappedRoute exact contentWidth={contentWidth} path="/plugins/widgets" component={WidgetPlugins} />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/plugins/widgets/new"
            component={WidgetPluginNewForm}
          />

          <WrappedRoute exact contentWidth={contentWidth} path="/accounts-new/" component={AccountForm} />
          <WrappedRoute exact contentWidth={contentWidth} path="/accounts/:accountId/" component={Account} />
          <WrappedRoute exact contentWidth={contentWidth} path="/accounts/:accountId/bots" component={Bots} />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/entities"
            component={Entities}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/entities/new"
            component={EntityForm}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/entities/edit/:entityId"
            component={EntityForm}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/entities/view/:entityId"
            component={Entity}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/entities/view/:entityId/protocols"
            component={EntityProtocolsForm}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/bots-new"
            component={BotForm}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/bots/:botId/view"
            component={Bot}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/credentials"
            component={Credentials}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/credentials/new"
            component={CredentialsForm}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/credentials/edit/:credentialId"
            component={CredentialsForm}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/sensors"
            component={Sensors}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/sensors/new"
            component={SensorForm}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/sensors/edit/:sensorId"
            component={SensorForm}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/dashboards"
            component={Dashboards}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/dashboards/new"
            component={DashboardNewForm}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/dashboards/view/:slug"
            component={DashboardView}
          />
          <WrappedRoute
            exact
            contentWidth={contentWidth}
            path="/accounts/:accountId/dashboards/view/:slug/widget/:widgetId/edit"
            component={DashboardWidgetEdit}
          />

          <Route component={PageNotFound} />
        </Switch>
      </div>
    );
  }
}

export default withRouter(Content);
