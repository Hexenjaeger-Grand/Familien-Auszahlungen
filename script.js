// script.js - Verbunden mit Discord Bot API
const API_BASE_URL = 'http://localhost:5000/api';

// Event-Preise
const EVENT_PRICES = {
    'bizwar-win': 20000,
    'bizwar-lose': 10000,
    'ekz-win': 50000,
    '40er-win': 30000,
    '40er-lose': 10000,
    'hafen-drop': 40000,
    'giesserei-kill': 10000,
    'waffenfabrik-kill': 10000,
    'rp-fabrik': 8000000,
    'cayo-perico': 1000000
};

// Event-Namen
const EVENT_NAMES = {
    'bizwar-win': '🏢 Bizwar Win',
    'bizwar-lose': '🏢🔴 Bizwar Lose', 
    'ekz-win': '🏆 EKZ Win',
    '40er-win': '🔫 40er Win',
    '40er-lose': '🔫🔴 40er Lose',
    'hafen-drop': '⚓ Hafen Drop',
    'giesserei-kill': '🏭 Gießerei Kill',
    'waffenfabrik-kill': '🔫 Waffenfabrik Kill',
    'rp-fabrik': '💎 RP-Fabrik',
    'cayo-perico': '🏝️ Cayo Perico'
};

let currentEvent = null;
let isAuthenticated = false;

// Login mit Bot-API
async function checkPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    const password = passwordInput.value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: password })
        });

        const data = await response.json();

        if (data.success) {
            isAuthenticated = true;
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadDashboard();
        } else {
            loginError.textContent = '❌ ' + data.message;
            passwordInput.value = '';
        }
    } catch (error) {
        loginError.textContent = '❌ Verbindung zum Bot fehlgeschlagen!';
        console.error('Login error:', error);
    }
}

// Enter-Taste für Login
document.getElementById('passwordInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkPassword();
    }
});

// Dashboard laden
async function loadDashboard() {
    await updateStats();
    updateWeekInfo();
}

// Statistiken vom Bot abrufen
async function updateStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        const data = await response.json();
        
        if (data.success) {
            renderMembersList(data.payouts || []);
            updateTotalPayout(data.total_payouts || 0);
        }
    } catch (error) {
        console.error('Stats error:', error);
        document.getElementById('membersList').innerHTML = 
            '<p class="no-data">❌ Bot nicht erreichbar. Stelle sicher dass der Bot läuft!</p>';
    }
}

// Wocheninfo aktualisieren
function updateWeekInfo() {
    const weekNumber = getCurrentWeek();
    document.getElementById('currentWeek').textContent = `Woche ${weekNumber}`;
}

// Aktuelle Kalenderwoche
function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
}

// Gesamtsumme aktualisieren
function updateTotalPayout(total) {
    document.getElementById('totalPayout').textContent = `Gesamt: ${formatMoney(total)}`;
}

// Geld formatieren
function formatMoney(amount) {
    return new Intl.NumberFormat('de-DE', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0 
    }).format(amount);
}

// Event Modal öffnen
function openEventModal(eventType) {
    if (!isAuthenticated) {
        alert('❌ Bitte zuerst einloggen!');
        return;
    }
    
    currentEvent = eventType;
    const modal = document.getElementById('eventModal');
    const eventName = document.getElementById('eventName');
    
    eventName.textContent = EVENT_NAMES[eventType];
    modal.style.display = 'flex';
}

// Modal schließen
function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
    resetForm();
}

// Formular zurücksetzen
function resetForm() {
    document.getElementById('playerName').value = '';
    document.getElementById('killCount').value = '1';
    document.getElementById('proofLink').value = '';
    currentEvent = null;
}

// Auszahlung zum Bot senden
async function addPayout() {
    if (!isAuthenticated) {
        alert('❌ Bitte zuerst einloggen!');
        return;
    }

    const playerName = document.getElementById('playerName').value;
    const killCount = document.getElementById('killCount').value;
    const proofLink = document.getElementById('proofLink').value;
    
    if (!playerName) {
        alert('❌ Bitte Spielernamen eingeben!');
        return;
    }
    
    const kills = parseInt(killCount) || 1;
    const baseAmount = EVENT_PRICES[currentEvent];
    let totalAmount = baseAmount;
    
    // Bei Kill-Events: Betrag mit Kills multiplizieren
    if (currentEvent.includes('kill') || currentEvent.includes('win') || currentEvent.includes('lose')) {
        totalAmount = baseAmount * kills;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/add-payout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player: playerName,
                event: EVENT_NAMES[currentEvent],
                amount: totalAmount,
                kills: kills,
                proof: proofLink
            })
        });

        const data = await response.json();

        if (data.success) {
            alert(`✅ Auszahlung gespeichert!\n${playerName}: ${EVENT_NAMES[currentEvent]} - ${formatMoney(totalAmount)}`);
            closeModal();
            await loadDashboard(); // Neu laden
        } else {
            alert('❌ Fehler: ' + data.message);
        }
    } catch (error) {
        alert('❌ Verbindung zum Bot fehlgeschlagen!');
        console.error('Add payout error:', error);
    }
}

// Mitgliederliste rendern
function renderMembersList(payouts) {
    const membersList = document.getElementById('membersList');
    
    // Mitglieder mit Auszahlungen gruppieren
    const memberTotals = {};
    
    payouts.forEach(payout => {
        if (!memberTotals[payout.player]) {
            memberTotals[payout.player] = {
                total: 0,
                payouts: []
            };
        }
        memberTotals[payout.player].total += payout.amount;
        memberTotals[payout.player].payouts.push(payout);
    });
    
    // HTML generieren
    let html = '';
    
    if (Object.keys(memberTotals).length === 0) {
        html = '<p class="no-data">Noch keine Auszahlungen eingetragen...</p>';
    } else {
        // Nach Gesamtbetrag sortieren
        const sortedMembers = Object.entries(memberTotals)
            .sort(([,a], [,b]) => b.total - a.total);
        
        sortedMembers.forEach(([playerName, data]) => {
            html += `
                <div class="member-card">
                    <div class="member-info">
                        <div class="member-name">${playerName}</div>
                        <div class="member-payout">${formatMoney(data.total)}</div>
                        <div class="member-events">
                            ${data.payouts.slice(0, 3).map(p => `
                                <small>${p.event}${p.kills > 1 ? ` (${p.kills}x)` : ''}</small>
                            `).join('')}
                            ${data.payouts.length > 3 ? `<small>+${data.payouts.length - 3} weitere</small>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    membersList.innerHTML = html;
}

// Mitglieder suchen/filtern
function filterMembers() {
    const searchInput = document.getElementById('searchInput').value.toLowerCase();
    const memberCards = document.querySelectorAll('.member-card');
    
    memberCards.forEach(card => {
        const playerName = card.querySelector('.member-name').textContent.toLowerCase();
        if (playerName.includes(searchInput)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Enter-Taste für Suche
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        filterMembers();
    }
});

// Verbindungs-Status prüfen
async function checkConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        return response.ok;
    } catch (error) {
        return false;
    }
}

// Regelmäßig Statistiken aktualisieren
setInterval(async () => {
    if (isAuthenticated) {
        await updateStats();
    }
}, 30000); // Alle 30 Sekunden

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏆 Familien Auszahlungen Dashboard geladen');
    console.log('Bot API URL:', API_BASE_URL);
});
