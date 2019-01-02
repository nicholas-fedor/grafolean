import React from 'react';
import { connect } from 'react-redux';

import { onLogout } from '../../store/actions';
import store from '../../store';
import Button from '../Button';

class Profile extends React.Component {
  onLogoutClick = () => {
    window.sessionStorage.removeItem('grafolean_jwt_token');
    store.dispatch(onLogout());
  };

  render() {
    return (
      <div>
        <p>User ID: {this.props.userData.user_id}</p>
        <Button onClick={this.onLogoutClick}>Logout</Button>
      </div>
    );
  }
}

const mapStoreToProps = store => ({
  userData: store.user,
});
export default connect(mapStoreToProps)(Profile);