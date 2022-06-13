from time import sleep
from flask import Flask, request
import random
from dateutil import parser

app = Flask(__name__)

@app.route('/getPrediction', methods=['POST'])
def get_prediction():
    print(request.json)
    try:
        given_points = request.json['given_points']     # needs Content-Type: application/json header
        n_pred = request.json['n_pred']
        time = random.randint(1, 20)                    # random time between 10 seconds and 3 minutes
        print("Waiting for {} seconds".format(time))
        sleep(time)                                     # simulate long-running prediction

        error_probability = random.random()             # random probability of error
        if error_probability < 0.1:                     # 10% probability of error
            raise Exception('Error: prediction failed')
            # return json.dumps({
            #     'error': 'error occurred'
            # })

        last_two_points = given_points[-2:]            # last two points
        delta_long = last_two_points[1]['long'] - last_two_points[0]['long']
        delta_lat = last_two_points[1]['lat'] - last_two_points[0]['lat']
        delta_timestamp = parser.parse(last_two_points[1]['timestamp']) - parser.parse(last_two_points[0]['timestamp'])
        
        pred_points = []
        for i in range(n_pred):
            pred_points.append({
                'point_id': last_two_points[-1]['point_id'] + 1 + i,
                'long': last_two_points[-1]['long'] + delta_long * (i+1),
                'lat': last_two_points[-1]['lat'] + delta_lat * (i+1),
                'timestamp': (parser.parse(last_two_points[-1]['timestamp']) + delta_timestamp * (i+1)).isoformat()
            })
        return {"pred_points":pred_points}           # returns the predicted points
    except KeyError:
        raise Exception('Error: pred_points missing')
        # return json.dumps({
        #     'error': 'no given_points in json request'
        # })
        # raise Exception('No given points')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)