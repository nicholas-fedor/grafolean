#!/usr/bin/python3
import argparse
import flask
import json
import re
from datatypes import Measurement, Path, Timestamp
import utils


app = flask.Flask(__name__)
# since this is API, we don't care about trailing slashes - and we don't want redirects:
app.url_map.strict_slashes = False

# allow cross-origin requests:
@app.after_request
def after_request(response):
    header = response.headers
    header['Access-Control-Allow-Origin'] = '*'
    return response

@app.route("/api/values", methods=['PUT'])
def values_put():
    data = flask.request.get_json()
    # let's just pretend our data is of correct form, otherwise Exception will be thrown and Flash will return error response:
    Measurement.save_put_data_to_db(data)
    return ""

@app.route("/api/values", methods=['GET'])
def values_get():
    """
        curl 'https://moonthor.com/api/values/?p=<Path0[,Path1...]>&t0=<TimestampFrom>&t1=<TimestampTo>&max=<MaxPoints>'

        Parameters:

            PathN: path that the data was connected to
            TimestampFrom: start timestamp (included) - optional
            TimestampTo: end timestamp (included) - optional
            MaxPoints: max. number of values returned - should reflect the client resolution and design choices. The idea is to limit the max. number of points on
                charts for screens with smaller width (mobile). Backend will use this parameter and the selected time interval to determine the level of aggregation 
                used. Note that the results might be returned in batches (paginated) on backend discretion. Value of 0 means no aggregation (raw results). Default: 100. 

        JSON response:

        {
            aggregation_level: <AggregationLevel>,  // -`: raw data, >=0: 3^L hours are aggregated in a single data point
            pagination_timestamp: <LastTimestamp>,  // if not null, use LastTimestamp as TimestampFrom to fetch another batch of data
            data: {
                <Path0>: [
                    { t: <Timestamp>, v: [<Value>, <MinValue>, <MaxValue>] }  // if data was aggregated
                    { t: <Timestamp>, v: <Value> }  // if raw data was returned
                ],
                ...
            }
        }
    """
    kwargs = {}

    # validate input parameters:
    paths_input = flask.request.args.get('p')
    if paths_input is None:
        return "Missing parameter: p\n\n", 400
    try:
        kwargs['paths'] = [Path(p) for p in paths_input.split(',')]
    except:
        return "Invalid parameter: p\n\n", 400

    t_from = flask.request.args.get('t0')
    if t_from:
        kwargs['t_from'] = Timestamp(t_from)

    t_to = flask.request.args.get('t1')
    if t_to:
        kwargs['t_to'] = Timestamp(t_to)

    max_points = max(0, int(flask.request.args.get('max', 100)))
    kwargs['max_points'] = max_points
    return Measurement.get_data(**kwargs)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("operation", type=str, choices=['migrate', 'serve'])
    args = parser.parse_args()

    if args.operation == 'migrate':
        utils.migrate_if_needed()
    elif args.operation == 'serve':
        app.run()
