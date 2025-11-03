import React, { useState, useEffect, useRef } from 'react';

// --- Helper Components & Icons ---

const SearchIcon = () => (
  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4-4.816A6 6 0 012 8z" clipRule="evenodd" />
  </svg>
);

const NavigationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
    </svg>
);

const ReportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 101.414 1.414L5 6.414V8a1 1 0 002 0V6.414l.293.293a1 1 0 001.414-1.414L7 4.586V3a1 1 0 00-1-1H5zM10 2a.75.75 0 01.75.75V4h-1.5V2.75A.75.75 0 0110 2zM15 3a1 1 0 00-1-1h-1a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 101.414 1.414L13 6.414V8a1 1 0 002 0V6.414l.293.293a1 1 0 001.414-1.414L15 4.586V3zM5 10a.75.75 0 01.75.75V12h-1.5v-1.25A.75.75 0 015 10zM10 12a1 1 0 00-1 1v1.586l-1.293 1.293a1 1 0 101.414 1.414L10 16.414V18a1 1 0 002 0v-1.586l.293.293a1 1 0 101.414-1.414L12 14.586V13a1 1 0 00-1-1h-1zM15 10a.75.75 0 01.75.75V12h-1.5v-1.25A.75.75 0 0115 10z" clipRule="evenodd" />
    </svg>
);


// --- Main App Component ---

export default function App() {
  const API_BASE_URL = 'http://localhost:5000';

  const [startPoint, setStartPoint] = useState('');
  const [destination, setDestination] = useState('');
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mapStatus, setMapStatus] = useState('loading'); // 'loading', 'loaded', 'error'
  
  const [aiSummary, setAiSummary] = useState('');
  const [isAiSummaryLoading, setIsAiSummaryLoading] = useState(false);
  const [showReportConfirmation, setShowReportConfirmation] = useState(false);
  
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [isReportingModalOpen, setIsReportingModalOpen] = useState(false);
  const searchContainerRef = useRef(null);

  const [reportedHazards, setReportedHazards] = useState([]);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);

  const mapContainer = useRef(null);
  const map = useRef(null);
  const routeMarkerLayer = useRef(null);
  const reportedHazardsLayer = useRef(null);
  const routingControl = useRef(null);

  useEffect(() => {
    // --- Dynamic Script Loading ---
    const cssFiles = [
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css',
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.css'
    ];
    cssFiles.forEach(href => {
        if (!document.querySelector(`link[href="${href}"]`)) {
            const link = document.createElement('link');
            link.href = href;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
    });

    const loadScript = (src, onLoad, onError) => {
        if (document.querySelector(`script[src="${src}"]`)) {
            onLoad();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = onLoad;
        script.onerror = onError;
        document.body.appendChild(script);
    };

    loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.min.js',
        () => {
            loadScript(
                'https://cdnjs.cloudflare.com/ajax/libs/leaflet-routing-machine/3.2.12/leaflet-routing-machine.min.js',
                () => setMapStatus('loaded'),
                () => setMapStatus('error')
            );
        },
        () => setMapStatus('error')
    );

    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("Could not get user location:", err.message)
    );
  }, []);

  useEffect(() => {
    if (mapStatus === 'loaded' && mapContainer.current && !map.current) {
      try {
        const leafletMap = window.L.map(mapContainer.current).setView([20.5937, 78.9629], 5);
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { attribution: '&copy; OSM &copy; CARTO', maxZoom: 19 }).addTo(leafletMap);
        map.current = leafletMap;
        routeMarkerLayer.current = window.L.layerGroup().addTo(leafletMap);
        reportedHazardsLayer.current = window.L.layerGroup().addTo(leafletMap);
      } catch (e) { 
        console.error("Map initialization failed:", e);
        setMapStatus('error');
      }
    }
  }, [mapStatus]);
  
  const fetchReportedHazards = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-hazards`);
      const data = await response.json();
      setReportedHazards(data);
    } catch (err) {
      console.error("Failed to fetch reported hazards:", err);
    }
  };

  useEffect(() => {
    if (mapStatus === 'loaded') fetchReportedHazards();
  }, [mapStatus]);

  useEffect(() => {
    if (mapStatus !== 'loaded' || !map.current || !reportedHazardsLayer.current) return;
    reportedHazardsLayer.current.clearLayers();
    const userReportIcon = window.L.divIcon({
      className: 'custom-div-icon',
      html: `<div style='background-color:#9333ea;width:15px;height:15px;border-radius:50%;border:2px solid white;opacity:0.8'></div>`,
      iconSize: [15, 15], iconAnchor: [8, 8]
    });
    reportedHazards.forEach(report => {
      window.L.marker([report.latitude, report.longitude], { icon: userReportIcon })
        .bindPopup(`<b>${report.hazardType} (User Report):</b><br>${report.description}`)
        .addTo(reportedHazardsLayer.current);
    });
  }, [reportedHazards, mapStatus]);

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!activeInput) return;
      const query = activeInput === 'start' ? startPoint : destination;
      const setSuggestions = activeInput === 'start' ? setStartSuggestions : setDestSuggestions;
      if (query.length < 3) { setSuggestions([]); return; }
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
        setSuggestions((await resp.json()).map(item => item.display_name));
      } catch (err) { console.error(err) }
    }, 300);
    return () => clearTimeout(handler);
  }, [startPoint, destination, activeInput]);
  
  useEffect(() => {
    const handleClickOutside = (e) => { if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setActiveInput(null); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (mapStatus !== 'loaded' || !routeMarkerLayer.current || !routeInfo) return;
    routeMarkerLayer.current.clearLayers();
    if (routeInfo.hazardZones.length > 0) {
      const getMarkerColor = (level) => level === "High" ? '#f44336' : level === "Medium" ? '#ffeb3b' : '#4caf50';
      routeInfo.hazardZones.forEach(zone => {
        const hazardIcon = window.L.divIcon({
            className: 'custom-div-icon',
            html: `<div style='background-color:${getMarkerColor(zone.riskLevel)};width:20px;height:20px;border-radius:50%;border:2px solid white;'></div>`,
            iconSize: [20, 20], iconAnchor: [10, 10]
        });
        window.L.marker([zone.lat, zone.lng], { icon: hazardIcon }).bindPopup(`<b>${zone.riskLevel} Risk:</b> ${zone.description}`).addTo(routeMarkerLayer.current);
      });
    }
  }, [routeInfo, mapStatus]);

  const findSafestRoute = async () => {
    if (!startPoint || !destination) return;
    setIsLoading(true); setRouteInfo(null); setError(null); setAiSummary('');
    routeMarkerLayer.current.clearLayers();
    if (routingControl.current) map.current.removeControl(routingControl.current);
    
    const geocode = async (addr) => (await (await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1&countrycodes=in`)).json())[0];
    try {
      const [startData, destData] = await Promise.all([geocode(startPoint), geocode(destination)]);
      if (!startData || !destData) throw new Error("One or more locations could not be found.");
      routingControl.current = window.L.Routing.control({
          waypoints: [window.L.latLng(startData.lat, startData.lon), window.L.latLng(destData.lat, destData.lon)],
          routeWhileDragging: false, addWaypoints: false, draggableWaypoints: false,
          lineOptions: { styles: [{color: '#00FFFF', opacity: 0.8, weight: 6}] }, createMarker: () => null
      }).on('routesfound', (e) => {
          const { routes: [route] } = e; const { summary } = route;
          const newRouteInfo = { start: startPoint, end: destination, distance: (summary.totalDistance / 1000).toFixed(1) + " km", duration: Math.round(summary.totalTime / 60) + " mins", riskScore: Math.floor(Math.random() * 50) + 25, riskLevel: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)], hazardZones: generateMockHazards(route.coordinates, startPoint, destination), };
          setRouteInfo(newRouteInfo); setIsLoading(false); fetchAiSummary(newRouteInfo);
      }).on('routingerror', () => { setError("Could not find a route."); setIsLoading(false); }).addTo(map.current);
    } catch (err) { setError(err.message); setIsLoading(false); }
  };

  const fetchAiSummary = async (currentRouteInfo) => {
      setIsAiSummaryLoading(true);
      setAiSummary('');
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      const hazardsText = currentRouteInfo.hazardZones.map(h => `- ${h.description} (${h.riskLevel} risk)`).join('\n');
      const prompt = `You are a helpful and concise AI safety co-pilot for a navigation app called ZeroCrash. Your goal is to provide a brief, easy-to-read safety summary for the user's upcoming trip. Do not repeat the distance or duration. Focus on the key risks. Be friendly and encouraging.
      Trip Details: From: ${currentRouteInfo.start} To: ${currentRouteInfo.end}, Distance: ${currentRouteInfo.distance}, Duration: ${currentRouteInfo.duration}
      Identified Hazards:\n${hazardsText}\nProvide a 2-3 sentence summary of the key things to watch out for on this route.`;
      
      try {
          const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
          const result = await response.json();
          const summaryText = result.candidates?.[0]?.content?.parts?.[0]?.text;
          setAiSummary(summaryText || "Could not generate an AI summary for this route.");
      } catch (err) { setAiSummary("Could not generate an AI summary due to a network error."); }
      finally { setIsAiSummaryLoading(false); }
  };

  const generateMockHazards = (routeCoordinates, startAddress, endAddress) => {
    const hazards = []; const numHazards = Math.floor(Math.random() * 6) + 3;
    const riskLevels = ["High", "Medium", "Low"];
    const descriptions = { High: ["Blind curve ahead", "High-traffic intersection", "Known accident blackspot", "Poor road surface"], Medium: ["School zone nearby", "Frequent pedestrian crossings", "Narrow lane section", "Possible congestion"], Low: ["Good visibility", "Well-maintained road", "Low traffic area", "Clear signage"], };
    for (let i = 0; i < numHazards; i++) {
        const coordIndex = Math.floor(Math.random() * routeCoordinates.length);
        const baseCoord = routeCoordinates[coordIndex];
        const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
        let description = descriptions[riskLevel][Math.floor(Math.random() * descriptions[riskLevel].length)];
        const routePercentage = (coordIndex / routeCoordinates.length) * 100;
        let locationContext = (routePercentage < 20) ? `near ${startAddress.split(',')[0]}` : (routePercentage > 80) ? `approaching ${endAddress.split(',')[0]}` : "along your route";
        description = `${description} (${locationContext})`;
        hazards.push({ lat: baseCoord.lat + (Math.random() - 0.5) * 0.001, lng: baseCoord.lng + (Math.random() - 0.5) * 0.001, description, riskLevel, });
    }
    return hazards;
  };
  
  const getRiskColor = (level) => level === "High" ? "bg-red-500" : level === "Medium" ? "bg-yellow-500" : "bg-green-500";
  
  const ReportHazardModal = ({ onClose, onReportSubmitted }) => {
    const [hazardType, setHazardType] = useState('Accident');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const reportData = { hazardType, description, latitude: currentUserLocation?.lat, longitude: currentUserLocation?.lng, };
        try {
            const response = await fetch(`${API_BASE_URL}/report-hazard`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(reportData) });
            if (!response.ok) throw new Error("Failed to submit report.");
            onReportSubmitted();
            onClose();
        } catch (err) { console.error(err); } 
        finally { setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-bold text-cyan-400 mb-4">Report a Hazard</h2>
                <form onSubmit={handleSubmit}>
                    <p className="text-xs text-gray-400 mb-4">Your approximate location will be shared with this report.</p>
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Hazard Type</label>
                        <select value={hazardType} onChange={e => setHazardType(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                            <option>Accident</option> <option>Pothole</option> <option>Traffic Jam</option> <option>Road Closure</option> <option>Other</option>
                        </select>
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-300 mb-2">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows="3" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500" placeholder="e.g., Large pothole on the right lane"></textarea>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md font-semibold">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md font-semibold disabled:bg-gray-500">{isSubmitting ? 'Submitting...' : 'Submit Report'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
  };
  
  const ConfirmationToast = ({ message }) => (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-fade-in">
        {message}
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white font-sans">
      
      {isReportingModalOpen && <ReportHazardModal onClose={() => setIsReportingModalOpen(false)} onReportSubmitted={() => { setShowReportConfirmation(true); fetchReportedHazards(); setTimeout(() => setShowReportConfirmation(false), 3000); }}/>}
      {showReportConfirmation && <ConfirmationToast message="Hazard reported successfully!" />}
      
      <div className="w-full md:w-1/3 lg:w-1/4 p-4 bg-gray-800 shadow-2xl flex flex-col space-y-4 overflow-y-auto">
        <header>
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center"><NavigationIcon /> ZeroCrash</h1>
          <p className="text-sm text-gray-400">Your guide to safer journeys.</p>
        </header>
        
        <div ref={searchContainerRef} className="space-y-3">
          <div className="relative">
            <label className="text-xs font-semibold text-gray-300">STARTING POINT</label>
            <div className="relative">
              <input type="text" placeholder="Enter starting point..." value={startPoint} onChange={e => {setStartPoint(e.target.value); setActiveInput('start');}} onFocus={() => setActiveInput('start')} className="w-full bg-gray-700 border rounded-md p-2 pl-8 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><SearchIcon /></div>
            </div>
            {activeInput === 'start' && startSuggestions.length > 0 && (<ul className="absolute z-20 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-48 overflow-y-auto">{startSuggestions.map((s, i) => (<li key={i} onClick={() => {setStartPoint(s); setStartSuggestions([]); setActiveInput(null);}} className="px-3 py-2 text-sm cursor-pointer hover:bg-cyan-700">{s}</li>))}</ul>)}
          </div>
          <div className="relative">
            <label className="text-xs font-semibold text-gray-300">DESTINATION</label>
            <div className="relative">
              <input type="text" placeholder="Enter destination..." value={destination} onChange={e => {setDestination(e.target.value); setActiveInput('destination');}} onFocus={() => setActiveInput('destination')} className="w-full bg-gray-700 border rounded-md p-2 pl-8 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none"><SearchIcon /></div>
            </div>
            {activeInput === 'destination' && destSuggestions.length > 0 && (<ul className="absolute z-20 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-48 overflow-y-auto">{destSuggestions.map((s, i) => (<li key={i} onClick={() => {setDestination(s); setDestSuggestions([]); setActiveInput(null);}} className="px-3 py-2 text-sm cursor-pointer hover:bg-cyan-700">{s}</li>))}</ul>)}
          </div>
        </div>

        <div className="flex space-x-2">
            <button onClick={findSafestRoute} disabled={isLoading || mapStatus !== 'loaded'} className="flex-grow bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-md transition disabled:bg-gray-500 flex items-center justify-center">
              {isLoading ? 'Searching...' : 'Find Safest Route'}
            </button>
            <button onClick={() => setIsReportingModalOpen(true)} className="bg-red-600 hover:bg-red-500 text-white font-bold p-3 rounded-md transition" title="Report Hazard"><ReportIcon /></button>
        </div>

        {error && (<div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md"><strong className="font-bold">Error: </strong><span>{error}</span></div>)}
        
        {routeInfo && (<div className="bg-gray-700 rounded-lg p-4 animate-fade-in"><h2 className="text-lg font-bold text-cyan-300 border-b border-gray-600 pb-2 mb-3">Route Analysis</h2><div className="grid grid-cols-2 gap-4 mb-4"><div><p className="text-sm text-gray-400">Distance</p><p className="text-lg font-semibold">{routeInfo.distance}</p></div><div><p className="text-sm text-gray-400">Duration</p><p className="text-lg font-semibold">{routeInfo.duration}</p></div></div><div><p className="text-sm text-gray-400">Overall Risk Level</p><div className="flex items-center space-x-2"><span className={`px-3 py-1 text-sm font-bold text-gray-900 rounded-full ${getRiskColor(routeInfo.riskLevel)}`}>{routeInfo.riskLevel}</span><div className="w-full bg-gray-600 rounded-full h-2.5"><div className={`h-2.5 rounded-full ${getRiskColor(routeInfo.riskLevel)}`} style={{width: `${routeInfo.riskScore}%`}}></div></div></div></div>
        <div className="mt-4 pt-4 border-t border-gray-600"><h3 className="text-md font-semibold text-cyan-300 flex items-center"><SparklesIcon /> AI Safety Briefing</h3>{isAiSummaryLoading ? (<p className="text-sm text-gray-400 italic mt-2">Generating summary...</p>) : (<p className="text-sm text-gray-300 mt-2 whitespace-pre-wrap">{aiSummary}</p>)}</div>
        <div className="mt-4 pt-4 border-t border-gray-600"><h3 className="text-md font-semibold text-gray-300">Potential Hazard Zones:</h3><ul className="list-disc list-inside mt-2 text-sm text-gray-400 space-y-1">{routeInfo.hazardZones.map((z, i) => ( <li key={i}>{z.description}</li> ))}</ul></div></div>)}
      </div>

      <div className="flex-1 bg-gray-700 relative flex items-center justify-center">
        {mapStatus === 'loading' && (<div className="text-center text-gray-400">Loading Map...</div>)}
        {mapStatus === 'error' && (<div className="text-center text-red-400 p-4 bg-red-900 bg-opacity-50 rounded-lg"><h3>Map Error</h3><p>Could not load map library. Check network and try again.</p></div>)}
        <div ref={mapContainer} className={`w-full h-full ${mapStatus === 'loaded' ? '' : 'hidden'}`} />
        { mapStatus === 'loaded' && <div className="absolute bottom-4 right-4 bg-gray-800 bg-opacity-80 p-3 rounded-lg shadow-lg z-[1000]"><h4 className="font-bold text-sm mb-2">Risk Legend</h4><div className="flex items-center space-x-2"><div className="w-4 h-4 rounded-full bg-purple-500"></div><span className="text-xs">User Reports</span></div><div className="flex items-center space-x-2 mt-1"><div className="w-4 h-4 rounded-full bg-red-500"></div><span className="text-xs">High Risk</span></div><div className="flex items-center space-x-2 mt-1"><div className="w-4 h-4 rounded-full bg-yellow-500"></div><span className="text-xs">Medium Risk</span></div><div className="flex items-center space-x-2 mt-1"><div className="w-4 h-4 rounded-full bg-green-500"></div><span className="text-xs">Low Risk</span></div></div>}
      </div>
      <style>{`.animate-fade-in { animation: fadeIn 0.5s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .leaflet-control-attribution a { color: #aaa !important; } .leaflet-routing-container { display: none; }`}</style>
    </div>
  );
}

