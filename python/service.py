from time import sleep
from flask import Flask
from flask import request
import json
import random

app = Flask(__name__)

@app.route('/getPrediction', methods=['POST'])
def get_prediction():
    try:
        given_points = request.json['given_points']     # needs Content-Type: application/json header
        n_pred = request.json['n_pred']
        time = random.randint(1, 20)                   # random time between 10 seconds and 3 minutes
        sleep(time)                                     # simulate long-running prediction

        error_probability = random.random()             # random probability of error
        if error_probability < 0.1:                     # 10% probability of error
            raise Exception('Error: prediction failed')
            # return json.dumps({
            #     'error': 'error occurred'
            # })
        return json.dumps(given_points[::-1])           # reverse the given points
    except KeyError:
        raise Exception('Error: pred_points missing')
        # return json.dumps({
        #     'error': 'no given_points in json request'
        # })
        # raise Exception('No given points')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)