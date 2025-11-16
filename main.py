from flask import Flask, request, jsonify
import joblib
import pandas as pd
import numpy as np
import os

app = Flask(__name__)

# Load the trained model and encoders at startup
MODEL_PATH = 'energy_prediction_model.pkl'
ENCODERS_PATH = 'label_encoders.pkl'

print("Loading model and encoders...")
try:
    model = joblib.load(MODEL_PATH)
    encoders = joblib.load(ENCODERS_PATH)
    room_encoder = encoders['room_encoder']
    type_encoder = encoders['type_encoder']
    print("✓ Model and encoders loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    room_encoder = None
    type_encoder = None


@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Energy Prediction API is running',
        'model_loaded': model is not None
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict energy consumption based on input features
    
    Expected JSON format:
    {
        "room_id": "BR 116",
        "room_type": "Classroom",
        "duration": 2.0,
        "ambient_temp": 85.0,
        "base_temp": 72.0,
        "occupancy": 24
    }
    
    Or for batch predictions:
    {
        "predictions": [
            {
                "room_id": "BR 116",
                "room_type": "Classroom",
                "duration": 2.0,
                "ambient_temp": 85.0,
                "base_temp": 72.0,
                "occupancy": 24
            },
            {...}
        ]
    }
    """
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.get_json()
        
        # Check if it's a batch prediction request
        if 'predictions' in data:
            # Batch prediction
            predictions_data = data['predictions']
            input_df = pd.DataFrame(predictions_data)
            input_df.columns = ['room_id', 'room_type', 'duration', 'ambient_temp', 'base_temp', 'occupancy']
        else:
            # Single prediction
            input_df = pd.DataFrame([{
                'room_id': data.get('room_id'),
                'room_type': data.get('room_type'),
                'duration': data.get('duration'),
                'ambient_temp': data.get('ambient_temp'),
                'base_temp': data.get('base_temp', 72.0),  # Default base temp
                'occupancy': data.get('occupancy')
            }])
        
        # Validate required fields
        required_fields = ['room_id', 'room_type', 'duration', 'ambient_temp', 'occupancy']
        for field in required_fields:
            if field not in input_df.columns or input_df[field].isnull().any():
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Prepare features in the correct order
        features_df = pd.DataFrame({
            'Room ID': input_df['room_id'],
            'Room Type': input_df['room_type'],
            'Duration (hrs)': input_df['duration'],
            'Ambient Temp (°F)': input_df['ambient_temp'],
            'Base Temp (°F)': input_df['base_temp'],
            'Occupancy': input_df['occupancy']
        })
        
        # Encode categorical variables
        try:
            features_df['Room ID'] = room_encoder.transform(features_df['Room ID'])
            features_df['Room Type'] = type_encoder.transform(features_df['Room Type'])
        except ValueError as e:
            return jsonify({'error': f'Unknown room or room type: {str(e)}'}), 400
        
        # Make prediction
        predictions = model.predict(features_df)
        
        # Format response
        if len(predictions) == 1:
            # Single prediction response
            response = {
                'predicted_energy_wh': float(predictions[0]),
                'input': data
            }
        else:
            # Batch prediction response
            response = {
                'predictions': [
                    {
                        'predicted_energy_wh': float(pred),
                        'input': input_df.iloc[i].to_dict()
                    }
                    for i, pred in enumerate(predictions)
                ]
            }
        
        return jsonify(response)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/available_rooms', methods=['GET'])
def available_rooms():
    """Get list of available room IDs and room types"""
    if room_encoder is None or type_encoder is None:
        return jsonify({'error': 'Encoders not loaded'}), 500
    
    return jsonify({
        'room_ids': room_encoder.classes_.tolist(),
        'room_types': type_encoder.classes_.tolist()
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False)

