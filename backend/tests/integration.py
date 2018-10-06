#!/usr/bin/python3
import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import pytest
from pprint import pprint
import time

from moonthor import app
from utils import db, migrate_if_needed, log
from auth import JWT


TEST_USERNAME = 'admin'
TEST_PASSWORD = 'asdf123'


def _delete_all_from_db():
    # initialize DB:
    with db.cursor() as c:
        c.execute("SELECT tablename, schemaname FROM pg_tables WHERE schemaname = 'public';")
        results = list(c)
        log.info(results)
        for tablename,_ in results:
            sql = "DROP TABLE IF EXISTS {} CASCADE;".format(tablename)
            log.info(sql)
            c.execute(sql)
        sql = "DROP DOMAIN IF EXISTS AGGR_LEVEL;"
        log.info(sql)
        c.execute(sql)
    migrate_if_needed()


def setup_module():
    _delete_all_from_db()


def teardown_module():
    _delete_all_from_db()


@pytest.fixture
def app_client():
    app.testing = True
    return app.test_client()

def test_values_put_get(app_client):
    """
        Put a value, get a value.
    """
    data = [{'p': 'qqqq.wwww', 't': 1234567890.123456, 'v': 111.22}]
    app_client.put('/api/values/', data=json.dumps(data), content_type='application/json')
    r = app_client.get('/api/values/?p=qqqq.wwww&t0=1234567890&t1=1234567891&a=no')
    expected = {
        'paths': {
            'qqqq.wwww': {
                'next_data_point': None,
                'data': [
                    {'t': 1234567890.123456, 'v': 111.22 }
                ]
            }
        }
    }
    actual = json.loads(r.data.decode('utf-8'))
    assert expected == actual

def test_values_put_get_noaggrparam_redirect(app_client):
    """
        Try to get values without aggr param, get redirected.
    """
    t_from = 1330000000
    t_to = 1330000000 + 100*15*60 + 1
    url = '/api/values/?p=aaaa.bbbb&t0={}&t1={}&max=10'.format(t_from, t_to)
    r = app_client.get(url)

    assert r.status_code == 301

    redirect_location = None
    for header, value in r.headers:
        if header == 'Location':
            redirect_location = value
    assert redirect_location[-len(url)-5:] == url + '&a=no'

def test_values_put_get_sort_limit(app_client):
    """
        Try to get values without aggr param, get redirected.
    """
    TEST_PATH = 'test.values.put.few.sort.limit'
    data = [
        {'p': TEST_PATH, 't': 1330002000 + 160, 'v': 100},
        {'p': TEST_PATH, 't': 1330002000 + 360, 'v': 120},
        {'p': TEST_PATH, 't': 1330002000 + 560, 'v': 140},
        {'p': TEST_PATH, 't': 1330002000 + 760, 'v': 160},
    ]
    app_client.put('/api/values/', data=json.dumps(data), content_type='application/json')

    url = '/api/values/?p={}&a=no&sort=desc&limit=2'.format(TEST_PATH)
    r = app_client.get(url)

    expected = {
        'paths': {
            TEST_PATH: {
                'next_data_point': 1330002000 + 360,
                'data': [
                    {'t': 1330002000.0 + 760.0, 'v': 160},
                    {'t': 1330002000.0 + 560.0, 'v': 140},
                ],
            },
        },
    }

    assert r.status_code == 200
    actual = json.loads(r.data.decode('utf-8'))
    #pprint(actual)
    assert expected == actual

def test_values_put_few_get_aggr(app_client):
    """
        Put a few values, get aggregated value.
    """
    TEST_PATH = 'test.values.put.few.get.aggr'
    data = [
        {'p': TEST_PATH, 't': 1330002000 + 160, 'v': 100},
        {'p': TEST_PATH, 't': 1330002000 + 360, 'v': 120},
        {'p': TEST_PATH, 't': 1330002000 + 560, 'v': 140},
        {'p': TEST_PATH, 't': 1330002000 + 760, 'v': 160},
    ]

    app_client.put('/api/values/', data=json.dumps(data), content_type='application/json')
    t_from = 1330002000  # aggr level 0 - every 1 hour
    t_to = t_from + 1*3600
    url = '/api/values/?p={}&t0={}&t1={}&a=0'.format(TEST_PATH, t_from, t_to)
    r = app_client.get(url)

    expected = {
        'paths': {
            TEST_PATH: {
                'next_data_point': None,
                'data': [
                    {'t': 1330002000.0 + 1800.0, 'v': 130.0, 'minv': 100., 'maxv': 160. },
                ],
            },
        },
    }

    assert r.status_code == 200
    actual = json.loads(r.data.decode('utf-8'))
    # pprint(actual)
    assert expected == actual

#@pytest.mark.skip(reason="removing aggregated data is not implemented, so this test fails when repeated! Otherwise it works with fresh DB.")
def test_values_put_many_get_aggr(app_client):
    """
        Put many values, get aggregated value. Delete path and values.
    """
    try:
        TEST_PATH = 'test.values.put.many.get.aggr'
        t_from = 1330000000 - 1330000000 % (27*3600)  # aggr level 3 - every 3 hours
        t_to = t_from + 27 * 3600
        data = [{'p': TEST_PATH, 't': t_from + 1 + i*5, 'v': 111 + i} for i in range(0, 100)]
        #pprint(data)
        #import pprint
        #pprint.pprint(data)
        # expected = {'aggregation_level': 1, 'data': {'aaaa.bbbb': [
        #     {'t': 1234567890.123456, 'v': 111.22}
        # ]}}

        app_client.put('/api/values/', data=json.dumps(data), content_type='application/json')
        #print(t_from, t_to)
        url = '/api/values/?p={}&t0={}&t1={}&max=10&a=3'.format(TEST_PATH, t_from, t_to)
        r = app_client.get(url)

        expected = {
            'paths': {
                TEST_PATH: {
                    'next_data_point': None,
                    'data': [
                        {'t': t_from + 27 * 3600. / 2., 'v': 111. + (99. / 2.), 'minv': 111., 'maxv': 111. + 99. }
                    ]
                }
            }
        }

        assert r.status_code == 200
        actual = json.loads(r.data.decode('utf-8'))
        #pprint(actual)
        assert expected == actual
    finally:
        app_client.delete('/api/paths/?p={}'.format(TEST_PATH))
        assert r.status_code == 200

def test_dashboards_widgets_post_get(app_client):
    """
        Create a dashboard, get a dashboard, create a widget, get a widget. Delete the dashboard, get 404.
    """
    DASHBOARD = 'dashboard1'
    try:
        WIDGET = 'chart1'
        data = {'name': DASHBOARD + ' name', 'slug': DASHBOARD}
        r = app_client.post('/api/dashboards/', data=json.dumps(data), content_type='application/json')
        assert r.status_code == 201

        r = app_client.get('/api/dashboards/{}'.format(DASHBOARD))
        expected = {
            'name': DASHBOARD + ' name',
            'slug': DASHBOARD,
            'widgets': [],
        }
        actual = json.loads(r.data.decode('utf-8'))
        assert expected == actual

        # create widget:
        widget_post_data = {
            'type': 'chart',
            'title': WIDGET + ' name',
            'content': json.dumps([
                {
                    'path_filter': 'do.not.match.*',
                    'renaming': 'to.rename',
                    'unit': 'µ',
                    'metric_prefix': 'm',
                }
            ])
        }
        r = app_client.post('/api/dashboards/{}/widgets/'.format(DASHBOARD), data=json.dumps(widget_post_data), content_type='application/json')
        assert r.status_code == 201
        widget_id = json.loads(r.data.decode('utf-8'))['id']

        r = app_client.get('/api/dashboards/{}/widgets/'.format(DASHBOARD))
        actual = json.loads(r.data.decode('utf-8'))
        widget_post_data['id'] = widget_id
        expected = {
            'list': [
                widget_post_data,
            ]
        }
        assert r.status_code == 200
        assert expected == actual

        # update widget:
        widget_post_data = {
            'type': 'chart',
            'title': WIDGET + ' name2',
            'content': json.dumps([
                {
                    'path_filter': 'do.not.match2.*',
                    'renaming': 'to.rename2',
                    'unit': 'µ2',
                    'metric_prefix': '',
                }
            ])
        }
        r = app_client.put('/api/dashboards/{}/widgets/{}'.format(DASHBOARD, widget_id), data=json.dumps(widget_post_data), content_type='application/json')
        assert r.status_code == 204

        # make sure it was updated:
        r = app_client.get('/api/dashboards/{}/widgets/'.format(DASHBOARD))
        actual = json.loads(r.data.decode('utf-8'))
        widget_post_data['id'] = widget_id
        expected = {
            'list': [
                widget_post_data,
            ]
        }
        assert r.status_code == 200
        assert expected == actual

        # get a single widget:
        r = app_client.get('/api/dashboards/{}/widgets/{}/'.format(DASHBOARD, widget_id))
        actual = json.loads(r.data.decode('utf-8'))
        expected = widget_post_data
        assert r.status_code == 200
        assert expected == actual

        # delete dashboard:
        app_client.delete('/api/dashboards/{}'.format(DASHBOARD))
        r = app_client.get('/api/dashboards/{}'.format(DASHBOARD))
        assert r.status_code == 404

    except:
        # if something went wrong, delete dashboard so the next run can succeed:
        app_client.delete('/api/dashboards/{}'.format(DASHBOARD))
        r = app_client.get('/api/dashboards/{}'.format(DASHBOARD))
        raise

@pytest.mark.skip(reason="no idea.")
def test_values_put_paths_get(app_client):
    """
        Put values, get paths.
    """
    PATH = 'test.values.put.paths.get.aaaa.bbbb.cccc'
    data = [{'p': PATH, 't': 1234567890.123456, 'v': 111.22}]
    app_client.put('/api/values/', data=json.dumps(data), content_type='application/json')

    r = app_client.get('/api/paths/?filter=test.values.put.paths.get.*')
    expected = {
        'paths': {
            'test.values.put.paths.get.*': [
                PATH,
            ],
        },
        'limit_reached': False,
    }
    actual = json.loads(r.data.decode('utf-8'))
    assert expected == actual

    r = app_client.get('/api/paths/?filter=test.*&failover_trailing=false')
    actual = json.loads(r.data.decode('utf-8'))
    assert PATH in actual['paths']['test.*']

    r = app_client.get('/api/paths/?filter=test.&failover_trailing=false')
    assert r.status_code == 400
    r = app_client.get('/api/paths/?filter=test.')  # same - failover_trailing=false is default option
    assert r.status_code == 400

    for prefix in ['t', 'te', 'tes', 'test', 'test.', 'test.v']:
        r = app_client.get('/api/paths/?filter={}&failover_trailing=true'.format(prefix))
        actual = json.loads(r.data.decode('utf-8'))
        assert actual['paths'] == {}
        assert PATH in actual['paths_with_trailing'][prefix]
        for path in actual['paths_with_trailing'][prefix]:
           assert path[:len(prefix)] == prefix

    r = app_client.get('/api/paths/?filter=test.*,test.values.*')
    actual = json.loads(r.data.decode('utf-8'))
    assert PATH in actual['paths']['test.*']
    assert PATH in actual['paths']['test.values.*']

def test_accounts(app_client):
    """
        Create first admin, login, make sure you get X-JWT-Token. Try to create another first admin, fail.
    """
    data = { 'name': 'First User - Admin', 'username': TEST_USERNAME, 'password': TEST_PASSWORD, 'email': 'test@example.com' }
    r = app_client.post('/api/admin/first', data=json.dumps(data), content_type='application/json')
    assert r.status_code == 201
    admin_id = json.loads(r.data.decode('utf-8'))['id']
    assert int(admin_id) == 1

    # next fails:
    data = { 'name': 'Second User', 'username': 'aaa', 'password': 'bbb', 'email': 'test2@example.com' }
    r = app_client.post('/api/admin/first', data=json.dumps(data), content_type='application/json')
    assert r.status_code == 401

    # invalid login:
    data = { 'username': TEST_USERNAME, 'password': TEST_PASSWORD + 'nooot' }
    r = app_client.post('/api/auth/login', data=json.dumps(data), content_type='application/json')
    assert r.status_code == 401

    # valid login:
    data = { 'username': TEST_USERNAME, 'password': TEST_PASSWORD }
    r = app_client.post('/api/auth/login', data=json.dumps(data), content_type='application/json')
    assert r.status_code == 204
    authorization_header = dict(r.headers).get('X-JWT-Token', None)
    assert authorization_header[:9] == 'Bearer 1:'

    # now request some resource without auth:
    r = app_client.get('/api/admin/accounts')
    assert r.status_code == 401
    # request resource with valid auth:
    r = app_client.get('/api/admin/accounts', headers={'Authorization': authorization_header})
    assert r.status_code == 200


def test_jwt_expiry_refresh(app_client):
    """
        Login, get X-JWT-Token which expired before 1s, make sure you get 401 on resource request,
        hit /auth/refrest, make sure the new token works
        WARNING: depends on test_accounts() being run first
    """
    # fake the expiry:
    original_jwt_token_valid_for = JWT.TOKEN_VALID_FOR
    JWT.TOKEN_VALID_FOR = -1

    # valid login, but get the expired token:
    data = { 'username': TEST_USERNAME, 'password': TEST_PASSWORD }
    r = app_client.post('/api/auth/login', data=json.dumps(data), content_type='application/json')
    assert r.status_code == 204
    authorization_header = dict(r.headers).get('X-JWT-Token', None)
    assert authorization_header[:9] == 'Bearer 1:'

    # you got the (expired) token, reset the expiry timediff:
    JWT.TOKEN_VALID_FOR = original_jwt_token_valid_for

    # request resource - access denied because token has expired:
    r = app_client.get('/api/admin/accounts', headers={'Authorization': authorization_header})
    assert r.status_code == 401

    r = app_client.post('/api/auth/refresh', headers={'Authorization': authorization_header})
    assert r.status_code == 200
    new_authorization_header = dict(r.headers).get('X-JWT-Token', None)
    assert new_authorization_header[:7] == 'Bearer '
    assert new_authorization_header[8:9] == ':'

    # successful access, no refresh with the new token:
    r = app_client.get('/api/admin/accounts', headers={'Authorization': new_authorization_header})
    assert r.status_code == 200


def test_jwt_total_expiry(app_client):
    """
        Login, get X-JWT-Token which expired before 1s, read the new token from header, check it
        WARNING: depends on test_accounts() being run first
    """

    # fake the expiry:
    original_jwt_token_valid_for = JWT.TOKEN_VALID_FOR
    JWT.TOKEN_VALID_FOR = -JWT.TOKEN_CAN_BE_REFRESHED_FOR - 1  # the token will be too old to even refresh it

    # valid login, but get the expired token:
    data = { 'username': TEST_USERNAME, 'password': TEST_PASSWORD }
    r = app_client.post('/api/auth/login', data=json.dumps(data), content_type='application/json')
    assert r.status_code == 204
    authorization_header = dict(r.headers).get('X-JWT-Token', None)
    assert authorization_header[:9] == 'Bearer 1:'

    # you got the (expired) token, reset the expiry timediff:
    JWT.TOKEN_VALID_FOR = original_jwt_token_valid_for

    # request resource - it should not work because leeway is past:
    r = app_client.get('/api/admin/accounts', headers={'Authorization': authorization_header})
    assert r.status_code == 401

    # refresh also fails because the token is too old:
    r = app_client.post('/api/auth/refresh', headers={'Authorization': authorization_header})
    assert r.status_code == 401

