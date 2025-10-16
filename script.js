// script.js
// Familien-Passwort - Ändere das!
const FAMILY_PASSWORD = "Familie123";

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

// Event-Namen für Anzeige
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

// Daten speichern
let members = JSON.parse(localStorage.getItem('family_members')) || [];
let payouts = JSON.parse(localStorage.getItem('family_payouts')) || [];
let currentEvent = null;

// Login Funktion
function checkPassword() {
    const passwordInput = document.getElementById('passwordInput');
    const loginError = document.getElementById('loginError');
    const password = passwordInput.value;
    
    if (password === FAMILY_PASSWORD) {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadDashboard();
    } else {
        loginError.textContent = '❌ Falsches Passwort!';
        passwordInput.value = '';
    }
}

// Enter-Taste für Login
document.getElementById('passwordInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkPassword();
    }
});

// Dashboard laden
function loadDashboard() {
    updateWeekInfo();
    renderMembersList();
}

// Wocheninfo aktualisieren
function updateWeekInfo() {
    const weekNumber = getCurrentWeek();
    const total = calculateTotalPayout();
    
    document.getElementById('currentWeek').textContent = `Woche ${weekNumber}`;
    document.getElementById('totalPayout').textContent = `Gesamt: ${formatMoney(total)}`;
}

// Aktuelle Kalenderwoche
function getCurrentWeek() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - start) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
}

// Gesamtsumme berechnen
function calculateTotalPayout() {
    return payouts.reduce((total, payout) => total + payout.amount, 0);
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
    currentEvent = eventType;
    const modal = document.getElementById('eventModal');
    const eventName = document.getElementById('eventName');
    
    eventName.textContent = EVENT_NAMES[eventType];
    modal.style.display = 'flex';
    
    // Mitglieder Dropdown füllen
    const memberSelect = document.getElementById('memberSelect');
    memberSelect.innerHTML = '<option value="">Mitglied auswählen...</option>';
    
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = `${member.name} (${member.id})`;
        memberSelect.appendChild(option);
    });
}

// Modal schließen
function closeModal() {
    document.getElementById('eventModal').style.display = 'none';
    resetForm();
}

// Formular zurücksetzen
function resetForm() {
    document.getElementById('memberSelect').value = '';
    document.getElementById('killCount').value = '1';
    document.getElementById('proofLink').value = '';
    currentEvent = null;
}

// Auszahlung hinzufügen
function addPayout() {
    const memberSelect = document.getElementById('memberSelect');
    const killCount = document.getElementById('killCount');
    const proofLink = document.getElementById('proofLink');
    
    const memberId = memberSelect.value;
    const kills = parseInt(killCount.value) || 1;
    const proof = proofLink.value;
    
    if (!memberId) {
        alert('❌ Bitte wähle ein Mitglied aus!');
        return;
    }
    
    const member = members.find(m => m.id === memberId);
    const baseAmount = EVENT_PRICES[currentEvent];
    let totalAmount = baseAmount;
    
    // Bei Kill-Events: Betrag mit Kills multiplizieren
    if (currentEvent.includes('kill') || currentEvent.includes('win') || currentEvent.includes('lose')) {
        totalAmount = baseAmount * kills;
    }
    
    // Bei Team-Events: Betrag durch Anzahl Teilnehmer teilen (später)
    if (currentEvent === 'rp-fabrik' || currentEvent === 'cayo-perico') {
        // Hier kommt später die Team-Logik
    }
    
    // Auszahlung speichern
    const payout = {
        id: Date.now(),
        memberId: memberId,
        memberName: member.name,
        eventType: currentEvent,
        eventName: EVENT_NAMES[currentEvent],
        amount: totalAmount,
        kills: kills,
        proof: proof,
        date: new Date().toLocaleDateString('de-DE'),
        timestamp: Date.now()
    };
    
    payouts.push(payout);
    saveData();
    
    // Erfolgsmeldung
    alert(`✅ Auszahlung hinzugefügt!\n${member.name}: ${EVENT_NAMES[currentEvent]} - ${formatMoney(totalAmount)}`);
    
    closeModal();
    loadDashboard();
}

// Daten speichern
function saveData() {
    localStorage.setItem('family_members', JSON.stringify(members));
    localStorage.setItem('family_payouts', JSON.stringify(payouts));
}

// Mitgliederliste rendern
function renderMembersList(filter = '') {
    const membersList = document.getElementById('membersList');
    
    // Mitglieder mit ihren Auszahlungen gruppieren
    const memberTotals = {};
    
    payouts.forEach(payout => {
        if (!memberTotals[payout.memberId]) {
            memberTotals[payout.memberId] = {
                name: payout.memberName,
                total: 0,
                payouts: []
            };
        }
        memberTotals[payout.memberId].total += payout.amount;
        memberTotals[payout.memberId].payouts.push(payout);
    });
    
    // HTML generieren
    let html = '';
    
    if (Object.keys(memberTotals).length === 0) {
        html = '<p class="no-data">Noch keine Auszahlungen eingetragen...</p>';
    } else {
        // Nach Gesamtbetrag sortieren
        const sortedMembers = Object.entries(memberTotals)
            .sort(([,a], [,b]) => b.total - a.total)
            .filter(([id, data]) => 
                data.name.toLowerCase().includes(filter.toLowerCase())
            );
        
        sortedMembers.forEach(([id, data]) => {
            html += `
                <div class="member-card">
                    <div class="member-info">
                        <div class="member-name">${data.name}</div>
                        <div class="member-payout">${formatMoney(data.total)}</div>
                        <div class="member-events">
                            ${data.payouts.slice(0, 3).map(p => `
                                <small>${p.eventName}${p.kills > 1 ? ` (${p.kills}x)` : ''}</small>
                            `).join('')}
                            ${data.payouts.length > 3 ? `<small>+${data.payouts.length - 3} weitere</small>` : ''}
                        </div>
                    </div>
                    <div class="member-actions">
                        <button class="btn-edit" onclick="viewMemberDetails('${id}')">📊</button>
                        <button class="btn-delete" onclick="deleteMemberPayouts('${id}')">🗑️</button>
                    </div>
                </div>
            `;
        });
    }
    
    membersList.innerHTML = html;
}

// Mitglieder suchen/filtern
function filterMembers() {
    const searchInput = document.getElementById('searchInput');
    renderMembersList(searchInput.value);
}

// Enter-Taste für Suche
document.getElementById('searchInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        filterMembers();
    }
});

// Mitglieder-Details anzeigen
function viewMemberDetails(memberId) {
    const memberPayouts = payouts.filter(p => p.memberId === memberId);
    const member = members.find(m => m.id === memberId);
    
    let details = `📊 Auszahlungen für ${member.name}\n\n`;
    memberPayouts.forEach(payout => {
        details += `• ${payout.eventName}${payout.kills > 1 ? ` (${payout.kills}x)` : ''}: ${formatMoney(payout.amount)}\n`;
    });
    details += `\n💰 Gesamt: ${formatMoney(memberPayouts.reduce((sum, p) => sum + p.amount, 0))}`;
    
    alert(details);
}

// Auszahlungen eines Mitglieds löschen
function deleteMemberPayouts(memberId) {
    if (confirm('❌ Alle Auszahlungen dieses Mitglieds löschen?')) {
        payouts = payouts.filter(p => p.memberId !== memberId);
        saveData();
        loadDashboard();
    }
}

// Test-Daten hinzufügen (kannst du später löschen)
function addTestData() {
    if (members.length === 0) {
        members = [
            { id: '1', name: 'Max_Mustermann' },
            { id: '2', name: 'Sarah_RP' },
            { id: '3', name: 'Mike_Stone' }
        ];
        
        payouts = [
            {
                id: 1,
                memberId: '1',
                memberName: 'Max_Mustermann',
                eventType: 'bizwar-win',
                eventName: '🏢 Bizwar Win',
                amount: 60000,
                kills: 3,
                proof: '',
                date: new Date().toLocaleDateString('de-DE'),
                timestamp: Date.now()
            }
        ];
        
        saveData();
        loadDashboard();
    }
}

// Mitglieder verwalten Modal
function openManageMembers() {
    // Hier kommt später die Mitglieder-Verwaltung
    alert('👥 Mitglieder-Verwaltung kommt bald!');
}

// Wöchentlichen Reset
function resetWeek() {
    if (confirm('🔄 Wirklich alle Auszahlungen dieser Woche zurücksetzen?')) {
        payouts = [];
        saveData();
        loadDashboard();
        alert('✅ Woche zurückgesetzt!');
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
});

// Export Funktion (später)
function exportData() {
    alert('📁 Export-Funktion kommt bald!');
}
