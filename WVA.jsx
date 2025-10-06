import React, { useState, useMemo } from 'react';

// Constanten voor veelgebruikte materialen en vloeistoffen (in kg/m³)
const MATERIAL_DENSITIES = [
    { label: 'Aangepast (Blok)', density: 800, color: 'bg-amber-500' },
    { label: 'Hout (800)', density: 800, color: 'bg-amber-500' },
    { label: 'IJs (917)', density: 917, color: 'bg-blue-300' },
    { label: 'Water (1000)', density: 1000, color: 'bg-blue-500' },
    { label: 'Baksteen (1800)', density: 1800, color: 'bg-red-600' },
    { label: 'Aluminium (2700)', density: 2700, color: 'bg-gray-400' },
    { label: 'IJzer (7870)', density: 7870, color: 'bg-gray-700' },
];

const FLUID_DENSITIES = [
    { label: 'Aangepast (Vloeistof)', density: 1000, color: 'bg-blue-500' },
    { label: 'Kerosine (820)', density: 820, color: 'bg-yellow-800' },
    { label: 'Zoet water (1000)', density: 1000, color: 'bg-blue-500' },
    { label: 'Zout water (1025)', density: 1025, color: 'bg-blue-700' },
    { label: 'Glycerine (1260)', density: 1260, color: 'bg-purple-800' },
    { label: 'Kwik (13534)', density: 13534, color: 'bg-gray-900' },
];


// Component voor het tonen van berekende waarden
const ResultDisplay = ({ label, value, unit, color, isPercentage = false }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">
            {/* Het label is nu een eenvoudige string met platte tekst */}
            {label}:
        </span>
        <span className={`font-semibold ${color}`}>
            {isPercentage ? value.toFixed(1) : value.toFixed(2)} {unit}
        </span>
    </div>
);

// Component voor de status (drijft/zinkt)
const StatusDisplay = ({ isSinking, submergedRatio }) => {
    let statusText;
    let statusColor;

    if (isSinking) {
        statusText = "Het blok zinkt";
        statusColor = "bg-red-100 text-red-800";
    } else if (submergedRatio === 1) {
        statusText = "Het blok zweeft (neutraal drijfvermogen)";
        statusColor = "bg-yellow-100 text-yellow-800";
    } else {
        statusText = "Het blok drijft";
        statusColor = "bg-green-100 text-green-800";
    }

    return (
        <div className={`mt-3 p-2 text-center rounded-lg font-medium ${statusColor}`}>
            {statusText}
        </div>
    );
};

// Tailwind CSS Utility Component voor invoer sliders
const DensitySlider = ({ label, value, min, max, step, onChange, densityType, solidInfo, onPresetChange, presets }) => {
    
    // Splits het label op in hoofdtekst en subscript voor correcte weergave
    const densitySymbol = 'ρ'; // Unicode Rho
    const subScript = densityType === 'fluid' ? 'L' : 'O'; // L voor Vloeistof, O voor Object
    const labelText = densityType === 'fluid' ? "Vloeistofdichtheid" : "Blokdichtheid";

    // Bepaal de naam van het actieve preset
    const currentPreset = presets.find(p => p.density === value);
    const presetLabel = currentPreset ? currentPreset.label : presets[0].label;

    const handleSelectChange = (e) => {
        const selectedDensity = parseFloat(e.target.value);
        // Roep de onPresetChange handler aan (deze is nu verplicht voor beide types)
        if (onPresetChange) {
            onPresetChange(selectedDensity);
        }
    };

    return (
        <div className="mb-6 p-4 bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
                {/* GEFIXED: Gebruikt nu <sub> tag voor correcte subscript weergave */}
                {labelText} (
                {densitySymbol}
                <sub className="text-xs">{subScript}</sub>
                ): {!isNaN(value) ? value.toFixed(0) : '0'} kg/m³
            </label>

            {/* Selectiemenu voor Presets - Nu actief voor beide types */}
            {onPresetChange && presets && (
                <div className="mb-4">
                    <select
                        onChange={handleSelectChange}
                        value={value}
                        className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm cursor-pointer"
                    >
                        {presets.map(p => (
                            // Kwik heeft een zeer hoge dichtheid en wordt buiten de max van 1800 geplaatst
                            <option key={p.label} value={p.density}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                    {/* Toon de preset naam als het niet "Aangepast" is */}
                    {presetLabel !== presets[0].label && (
                         <p className="mt-1 text-xs text-indigo-600 font-medium">Geselecteerd: {presetLabel}</p>
                    )}
                </div>
            )}
            
            <div className="flex items-center space-x-3">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg"
                    // Gebruik solidInfo.color voor de accentkleur indien van toepassing
                    style={{ accentColor: densityType === 'solid' && solidInfo ? solidInfo.color.split('-')[1] : 'blue' }}
                />
            </div>
            {densityType === 'solid' && solidInfo && (
                <p className="mt-2 text-xs font-medium text-gray-500">
                    Huidige categorie: {solidInfo.label}
                </p>
            )}
        </div>
    );
};

// De visualisatie component
const Visualization = ({
    isZinkend,
    objectHoogte,
    bovensteHoogte,
    solidInfo,
    ondergedompeldeHoogte,
    fluidColor,
    fluidDensity 
}) => (
    <div className="flex justify-center items-end h-[350px] w-full p-4">
        {/* Het containerbekken */}
        <div className="relative w-full max-w-sm h-full bg-gray-100 rounded-b-xl border-x-4 border-b-4 border-gray-400 overflow-hidden">
            {/* De vloeistof */}
            <div
                className={`absolute bottom-0 left-0 right-0 h-4/5 ${fluidColor} opacity-70`}
                style={{
                    boxShadow: 'inset 0 0 20px rgba(0,0,255,0.4)',
                    transition: 'background-color 0.5s ease'
                }}
            >
                <div className="absolute top-0 left-0 right-0 h-1 bg-white/50"></div> {/* Wateroppervlak glans */}

                {/* Het drijvende/zinkende blok */}
                <div
                    className={`absolute left-1/2 -translate-x-1/2 rounded-md transition-all duration-500 ease-out shadow-xl`}
                    style={{
                        width: '80px',
                        height: objectHoogte + 'px',
                        bottom: isZinkend ? '-40px' : bovensteHoogte + 'px', // Visualisatiepositie
                        transform: `translateX(-50%) translateZ(0)`, // Forceer hardwareversnelling
                    }}
                >
                    {/* Zichtbaar (boven) deel van het blok */}
                    <div
                        className={`w-full ${solidInfo.color} rounded-t-md`}
                        style={{ height: bovensteHoogte + 'px', opacity: 1 }}
                    ></div>
                    {/* Ondergedompeld (onzichtbaar) deel van het blok - helpt bij schaduw/overgang */}
                    <div
                        className={`w-full ${solidInfo.color} rounded-b-md`}
                        style={{ height: ondergedompeldeHoogte + 'px', opacity: 0.6 }}
                    ></div>
                </div>
            </div>

            {/* Duidelijke label voor de vloeistof op de container - gebruikt platte tekst */}
            <div className="absolute top-4 left-4 text-xs font-mono text-gray-600">
                {/* GEFIXED: Gebruikt nu <sub> tag */}
                ρ<sub className="text-xs">L</sub>: {fluidDensity.toFixed(0)} kg/m³
            </div>
        </div>
    </div>
);


// De hoofdcomponent voor de Simulatie van de Wet van Archimedes
const App = () => {
    // Standaardwaarden voor de simulatie (eenheid: SI)
    const ZWAARTEKRACHT = 9.81; // m/s²
    const MAX_VOLUME = 0.1; // Vast blokvolume voor eenvoud (100 liter)
    // De maximale schuifregelaarwaarde voor vloeistof is nu de maximumdichtheid van onze presets minus kwik, om de slider relevant te houden
    const MAX_FLUID_DENSITY = 2000; 
    const MAX_OBJECT_DENSITY = 8000; // max dichtheid blok (Nu verhoogd naar 8000 om IJzer te accommoderen)

    // State voor de instelbare parameters
    const [fluidDensity, setFluidDensity] = useState(FLUID_DENSITIES[2].density); // Zoet water
    const [objectDensity, setObjectDensity] = useState(MATERIAL_DENSITIES[0].density); // Aangepast Blok (800)

    // Functie om de dichtheidscategorie te bepalen voor de kleur/label
    const getDensityType = (density) => {
        if (density <= 500) return { label: 'Zeer Licht', color: 'bg-yellow-400' };
        if (density <= 800) return { label: 'Licht', color: 'bg-amber-500' };
        if (density <= 1000) return { label: 'Neutraal/Licht', color: 'bg-blue-300' };
        if (density <= 2000) return { label: 'Gemiddeld', color: 'bg-red-600' };
        return { label: 'Zwaar', color: 'bg-gray-700' };
    };

    const solidInfo = getDensityType(objectDensity);

    // Berekende waarden voor de simulatie
    const {
        objectGewicht,
        opwaartseKracht,
        ondergedompeldAandeel,
        nettoKracht,
        isZinkend
    } = useMemo(() => {
        // 1. Gewicht (W = rho_O * V_O * g)
        const gewicht = objectDensity * MAX_VOLUME * ZWAARTEKRACHT;

        // 2. Bepaal het ondergedompelde volume en de opwaartse kracht
        let verhouding = objectDensity / fluidDensity; 
        let ondergedompeld = 0;
        let F_b = 0;
        let zinkend = false;

        if (verhouding >= 1) {
            // Het blok zinkt of is neutraal drijvend (volledig ondergedompeld)
            ondergedompeld = 1;
            zinkend = (verhouding > 1); // Zinkt als blokdichtheid > fluidDensity
            // Opwaartse Kracht = rho_L * V_O * g (volledig volume)
            F_b = fluidDensity * MAX_VOLUME * ZWAARTEKRACHT; 
        } else {
            // Het blok drijft (gedeeltelijk ondergedompeld)
            ondergedompeld = verhouding;
            // Opwaartse Kracht = Gewicht van het blok (F_b = W)
            F_b = gewicht;
        }

        // 3. Netto Kracht
        const F_netto = gewicht - F_b;

        return {
            objectGewicht: gewicht,
            opwaartseKracht: F_b,
            ondergedompeldAandeel: ondergedompeld,
            nettoKracht: F_netto,
            isZinkend: zinkend,
        };
    }, [fluidDensity, objectDensity]); 

    // De hoogte van het blok in de visualisatie (CSS-percentage)
    const objectHoogte = 200; // Vaste hoogte in pixels voor de visualisatie
    const ondergedompeldeHoogte = ondergedompeldAandeel * objectHoogte;
    const bovensteHoogte = objectHoogte - ondergedompeldeHoogte;

    // Bepaal de vloeistofkleur
    const fluidColor = fluidDensity > 1200 ? 'bg-purple-800' : fluidDensity > 1000 ? 'bg-blue-700' : 'bg-blue-500'; 

    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-4 text-center">
                    Simulatie van de Wet van Archimedes
                </h1>
                <p className="text-gray-600 mb-8 text-center">
                    {/* GEFIXED: Gebruikt nu <sub> tag voor correcte subscript weergave */}
                    Experimenteer met de dichtheid van de vloeistof (ρ<sub className="text-xs">L</sub>) en het blok (ρ<sub className="text-xs">O</sub>).
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Linkerkolom: Invoerbesturingen */}
                    <div className="bg-white p-6 rounded-xl shadow-2xl space-y-4">
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                            Instellingen
                        </h2>
                        {/* Vloeistofdichtheid Slider MET Presets */}
                        <DensitySlider
                            label="Vloeistofdichtheid"
                            value={fluidDensity} 
                            min={500}
                            max={MAX_FLUID_DENSITY}
                            step={50}
                            onChange={setFluidDensity} 
                            onPresetChange={setFluidDensity} // TOEGEVOEGD: maakt de selectie van presets mogelijk
                            densityType="fluid"
                            solidInfo={solidInfo}
                            presets={FLUID_DENSITIES}
                        />
                        
                        {/* Blokdichtheid Slider met Presets */}
                        <DensitySlider
                            label="Blokdichtheid"
                            value={objectDensity} 
                            min={100}
                            max={MAX_OBJECT_DENSITY}
                            step={50}
                            onChange={setObjectDensity} 
                            onPresetChange={setObjectDensity}
                            densityType="solid"
                            solidInfo={solidInfo}
                            presets={MATERIAL_DENSITIES}
                        />
                         <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800">
                            {/* CORRECTIE: Gebruikt nu m³ en cursieve g */}
                            Volume (V<sub className="text-xs">O</sub>): {MAX_VOLUME.toFixed(3)} m³ <br/>
                            Zwaartekracht (<span className="italic">g</span>): {ZWAARTEKRACHT.toFixed(2)} m/s²
                        </div>
                    </div>

                    {/* Rechterkolom: Visualisatie en Resultaten */}
                    <div className="bg-white p-6 rounded-xl shadow-2xl">
                        <h2 className="text-xl font-semibold text-gray-800 border-b pb-2 mb-4">
                            Resultaten & Visualisatie
                        </h2>
                        <div className="flex flex-col gap-6">
                            <Visualization 
                                isZinkend={isZinkend}
                                objectHoogte={objectHoogte}
                                bovensteHoogte={bovensteHoogte}
                                solidInfo={solidInfo}
                                ondergedompeldeHoogte={ondergedompeldeHoogte}
                                fluidColor={fluidColor}
                                fluidDensity={fluidDensity} 
                            />
                            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <ResultDisplay label="Blokgewicht W" value={objectGewicht} unit="N" color="text-red-600" />
                                {/* GEFIXED: De opwaartse kracht F_b is nu F met subscript b */}
                                <ResultDisplay 
                                    label={
                                        <>
                                            Opwaartse kracht F<sub className="text-xs">b</sub>
                                        </>
                                    } 
                                    value={opwaartseKracht} 
                                    unit="N" 
                                    color="text-green-600" 
                                />
                                {/* DE NIEUWE FIX: Netto Kracht W - F_b is nu W - F met subscript b */}
                                <ResultDisplay 
                                    label={
                                        <>
                                            Netto Kracht W - F<sub className="text-xs">b</sub>
                                        </>
                                    } 
                                    value={nettoKracht} 
                                    unit="N" 
                                    color={nettoKracht > 0 ? 'text-red-700 font-bold' : 'text-gray-700'} 
                                />
                                <ResultDisplay label="Ondergedompeld Aandeel" value={ondergedompeldAandeel * 100} unit="%" color="text-indigo-600" isPercentage={true} />
                                <StatusDisplay isSinking={isZinkend} submergedRatio={ondergedompeldAandeel}/>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
