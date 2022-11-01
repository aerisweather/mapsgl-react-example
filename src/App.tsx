import './App.css';
import MapView from './components/MapView';

function App() {
    return (
        <div className="App">
            <div style={{ height: '100%' }}>
                <MapView 
                    token={process.env.REACT_APP_MAPBOX_TOKEN}
                    center={{ lat: 40, lon: -95 }}
                    zoom={4}
                    data={{
                        aeris: {
                            keys: {
                                id: process.env.REACT_APP_AERIS_API_ID,
                                secret: process.env.REACT_APP_AERIS_API_SECRET
                            },
                            mapsgl: [
                                {
                                    code: 'temperatures',
                                    options: {
                                        paint: {
                                            sample: {
                                                colorscale: {
                                                    interval: 1
                                                }
                                            }
                                        }
                                    }
                                },
                                'wind-particles'
                            ],
                            dataInspector: {
                                enabled: true,
                                event: 'move'
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
}

export default App;
