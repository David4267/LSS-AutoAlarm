// ==UserScript==
// @name         LSS Auto Alarm
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Zeigt die Fahrzeuganforderungen und alarmiert entsprechend.
// @author       DVFX
// @match        https://www.leitstellenspiel.de/missions/*
// @grant        GM_xmlhttpRequest
// @grant        GM_log
// ==/UserScript==

(function () {
    'use strict';

    const vehicleTypeMapping = {
        battalion_chief_vehicles: "ELW 1",
        firetrucks: "LF 20",
        water_tankers: "GW-L2-Wasser",
        police_cars: "FuStW",
        heavy_rescue_vehicles: "RW",
        platform_trucks: "DLK 23",
        mobile_air_vehicles: "GW-A",
        fwk: "FwK",
        height_rescue_units: "GW-Höhenrettung",
        gwoil: "GW-Öl",
        hazmat_vehicles: "GW-Gefahrgut",
        mobile_command_vehicles: "ELW 2",
        hazmat_dekon: "Dekon-P",
		ambulances: "RTW",
        gwmess: "GW-Messtechnik",
		
		//more cars, not done yet
    };

    function ladeFahrzeuge() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.leitstellenspiel.de/api/vehicles",
            onload: function(response) {
                const vehicles = JSON.parse(response.responseText);
                const fahrzeugeImEinsatz = vehicles.filter(vehicle => vehicle.status === 2);
                zeigeEinsatzAnforderungen(fahrzeugeImEinsatz);
            }
        });
    }

    async function zeigeEinsatzAnforderungen(fahrzeugeImEinsatz) {
        const einsatzId = getEinsatzIdFromMissionPage();
        if (!einsatzId) return;

        const response = await fetch('https://www.leitstellenspiel.de/einsaetze.json');
        const einsaetze = await response.json();
        const einsatz = einsaetze.find(einsatz => einsatz.id.toString() === einsatzId.toString());
        if (!einsatz) return;

        const fahrzeugAnforderungen = einsatz.requirements;
        let fahrzeugInfo = "";

        for (const [fahrzeug, anzahl] of Object.entries(fahrzeugAnforderungen)) {
            const besitzteFahrzeuge = fahrzeugeImEinsatz.filter(fahrzeugData => fahrzeugData.name === fahrzeug);
            const besitzteAnzahl = besitzteFahrzeuge.length;
            fahrzeugInfo += `${anzahl}x ${fahrzeug} (Besitz: ${besitzteAnzahl})<br>`;
            const vehicleType = vehicleTypeMapping[fahrzeug];
            if (vehicleType) {
                waehleFahrzeuge(vehicleType, anzahl);
            }
        }

        const anforderungenDiv = document.createElement('div');
        anforderungenDiv.className = 'fahrzeug-info';
        anforderungenDiv.style.marginTop = '10px';
        anforderungenDiv.style.padding = '10px';
        anforderungenDiv.style.background = '#f8f9fa';
        anforderungenDiv.style.border = '1px solid #ddd';
        anforderungenDiv.style.borderRadius = '5px';
        anforderungenDiv.style.fontSize = '14px';
        anforderungenDiv.innerHTML = `<strong>Benötigte Fahrzeuge:</strong><br>${fahrzeugInfo}`;

        const colLeftContainer = document.querySelector('#col_left');
        if (colLeftContainer) {
            colLeftContainer.appendChild(anforderungenDiv);
        }

        drueckeAlarmierenButton();
    }

    function waehleFahrzeuge(vehicleType, count) {
        const vehicleTable = document.getElementById('vehicle_show_table_body_all');
        if (!vehicleTable) return;

        let selectedCount = 0;
        const rows = vehicleTable.querySelectorAll(`tr[vehicle_type="${vehicleType}"]`);
        rows.forEach(row => {
            if (selectedCount < count) {
                const checkbox = row.querySelector('input[type="checkbox"]');
                if (checkbox && !checkbox.checked) {
                    checkbox.checked = true;
                    selectedCount++;
                }
            }
        });
    }

    function drueckeAlarmierenButton() {
        const alarmButton = document.querySelector('input[type="submit"][value="Alarmieren"]');
        if (alarmButton) {
            const form = alarmButton.closest('form');
            if (form) {
                form.submit();
            }
        }
    }

    function getEinsatzIdFromMissionPage() {
        const einsatzLink = document.querySelector('a[href^="/einsaetze/"]');
        if (!einsatzLink) return null;
        const href = einsatzLink.getAttribute('href');
        return href.split('/')[2].split('?')[0];
    }

    window.addEventListener('load', () => {
        const button = document.createElement('button');
        button.innerText = 'Fahrzeuge auswählen und alarmieren';
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.zIndex = 1000;
        button.style.padding = '10px';
        button.style.backgroundColor = 'green';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.cursor = 'pointer';

        button.addEventListener('click', () => {
            ladeFahrzeuge();
        });

        document.body.appendChild(button);
    });
})();
