
let game = {
    coins: 0,
    gems: 0,
    power: 1,
    level: 1,
    xp: 0,
    rebirths: 0,
    pets: [],
    equipped: [],
    upgrades: {}
};

const petTypes = [
    {name:"Gatinho Branco", emoji:"🐱", rarity:"Comum", mult:1, chance:45},
    {name:"Gatinho Rosa", emoji:"🎀", rarity:"Comum", mult:1.5, chance:25},
    {name:"Gato Morango", emoji:"🍓", rarity:"Raro", mult:3, chance:15},
    {name:"Gato Nuvem", emoji:"☁️", rarity:"Épico", mult:7, chance:8},
    {name:"Gato Unicórnio", emoji:"🦄", rarity:"Lendário", mult:20, chance:5},
    {name:"Gato Estelar", emoji:"🌟", rarity:"Mítico", mult:75, chance:2}
];

const eggs = [
    {name:"Ovo Rosa", emoji:"🥚", cost:100},
    {name:"Ovo Morango", emoji:"🍓", cost:1000},
    {name:"Ovo Mágico", emoji:"💗", cost:10000},
    {name:"Ovo Celestial", emoji:"🌈", cost:100000}
];

const upgrades = [
    {name:"Patinha fofinha", emoji:"🐾", power:2, cost:50},
    {name:"Varinha mágica", emoji:"🪄", power:5, cost:250},
    {name:"Coração brilhante", emoji:"💗", power:15, cost:1500},
    {name:"Poder de morango", emoji:"🍓", power:50, cost:10000},
    {name:"Coroa de princesa", emoji:"👑", power:200, cost:100000},
    {name:"Magia celestial", emoji:"🌟", power:1000, cost:1000000}
];

function format(n) {
    if (n >= 1e12) return (n/1e12).toFixed(2)+"T";
    if (n >= 1e9) return (n/1e9).toFixed(2)+"B";
    if (n >= 1e6) return (n/1e6).toFixed(2)+"M";
    if (n >= 1e3) return (n/1e3).toFixed(2)+"K";
    return Math.floor(n).toString();
}

function multiplier() {
    return game.equipped.reduce((total, id) => {
        const pet = game.pets.find(p => p.id === id);
        return total * (pet ? pet.mult : 1);
    }, 1) * (1 + game.rebirths);
}

function clickGain() {
    return game.power * multiplier();
}

function autoGain() {
    return game.equipped.reduce((total, id) => {
        const pet = game.pets.find(p => p.id === id);
        return total + (pet ? pet.mult * 2 : 0);
    }, 0) * (1 + game.rebirths);
}

function notify(message) {
    const box = document.getElementById("notification");
    box.textContent = message;
    box.style.display = "block";

    clearTimeout(window.noticeTimer);
    window.noticeTimer = setTimeout(() => {
        box.style.display = "none";
    }, 2200);
}

function addCoins(amount) {
    game.coins += amount;
    game.xp += Math.max(1, Math.floor(amount));

    while (game.xp >= game.level * 100) {
        game.xp -= game.level * 100;
        game.level++;
        notify("🌸 Você subiu para o nível " + game.level + "!");
    }
}

function update() {
    document.getElementById("coins").textContent = format(game.coins);
    document.getElementById("gems").textContent = format(game.gems);
    document.getElementById("power").textContent = format(clickGain());
    document.getElementById("level").textContent = game.level;

    document.getElementById("progressBar").style.width =
        Math.min(100, game.xp / (game.level * 100) * 100) + "%";

    document.getElementById("rebirthInfo").textContent =
        "Rebirths: " + game.rebirths + " | Próximo: " +
        format(10000 * Math.pow(5, game.rebirths)) + " 🍓";

    render();
}

function floating(x, y, amount) {
    const el = document.createElement("div");
    el.className = "float";
    el.textContent = "+" + format(amount) + " 🍓";
    el.style.left = x + "px";
    el.style.top = y + "px";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

document.getElementById("clickButton").addEventListener("click", e => {
    const gain = clickGain();
    addCoins(gain);
    floating(e.clientX, e.clientY, gain);
    update();
});

function hatchEgg(index) {
    const egg = eggs[index];
    const cost = egg.cost;

    if (game.coins < cost) {
        notify("🍓 Você precisa de mais moranguinhos!");
        return;
    }

    game.coins -= cost;

    let pool = petTypes.map((pet, i) => ({
        ...pet,
        chance: pet.chance / Math.pow(1.4, index)
    }));

    if (index === 1) pool = petTypes.slice(1);
    if (index === 2) pool = petTypes.slice(2);
    if (index === 3) pool = petTypes.slice(3);

    const total = pool.reduce((s, p) => s + p.chance, 0);
    let roll = Math.random() * total;
    let chosen = pool[0];

    for (const pet of pool) {
        roll -= pet.chance;
        if (roll <= 0) {
            chosen = pet;
            break;
        }
    }

    const newPet = {
        ...chosen,
        id: Date.now() + Math.random()
    };

    game.pets.push(newPet);

    notify("🎀 VOCÊ GANHOU: " + newPet.name + "!");
    update();
    saveGame(false);
}

function buyUpgrade(index) {
    const item = upgrades[index];
    const owned = game.upgrades[index] || 0;
    const cost = Math.floor(item.cost * Math.pow(2, owned));

    if (game.coins < cost) {
        notify("💗 Moedinhas insuficientes!");
        return;
    }

    game.coins -= cost;
    game.power += item.power;
    game.upgrades[index] = owned + 1;

    notify("🎀 Upgrade comprado!");
    update();
}

function equipPet(id) {
    if (game.equipped.includes(id)) {
        game.equipped = game.equipped.filter(x => x !== id);
        notify("🐾 Gatinho desequipado!");
    } else {
        if (game.equipped.length >= 3) {
            notify("💗 Você só pode equipar 3 gatinhos!");
            return;
        }

        game.equipped.push(id);
        notify("🎀 Gatinho equipado!");
    }

    update();
}

function render() {
    document.getElementById("eggs").innerHTML = eggs.map((egg, i) => `
        <div class="item">
            <div class="emoji">${egg.emoji}</div>
            <h3>${egg.name}</h3>
            <p>Descubra um gatinho!</p>
            <p>🍓 ${format(egg.cost)}</p>
            <button ${game.coins < egg.cost ? "disabled" : ""}
                onclick="hatchEgg(${i})">
                CHOCAR ♡
            </button>
        </div>
    `).join("");

    document.getElementById("shop").innerHTML = `
        <div class="item">
            <div class="emoji">🐱</div>
            <h3>Espaço de pet</h3>
            <p>Equipe até 3 gatinhos!</p>
            <p>${game.equipped.length}/3 equipados</p>
        </div>
        <div class="item">
            <div class="emoji">💎</div>
            <h3>Joias mágicas</h3>
            <p>Ganhe joias fazendo rebirth!</p>
            <p>💗 ${format(game.gems)}</p>
        </div>
        <div class="item">
            <div class="emoji">🌸</div>
            <h3>Multiplicador</h3>
            <p>x${multiplier().toFixed(2)}</p>
            <p>Seu poder total!</p>
        </div>
    `;

    document.getElementById("upgrades").innerHTML =
        upgrades.map((item, i) => {
            const owned = game.upgrades[i] || 0;
            const cost = Math.floor(item.cost * Math.pow(2, owned));

            return `
                <div class="item">
                    <div class="emoji">${item.emoji}</div>
                    <h3>${item.name}</h3>
                    <p>+${format(item.power)} por clique</p>
                    <p>Comprados: ${owned}</p>
                    <p>🍓 ${format(cost)}</p>
                    <button ${game.coins < cost ? "disabled" : ""}
                        onclick="buyUpgrade(${i})">
                        COMPRAR
                    </button>
                </div>
            `;
        }).join("");

    document.getElementById("inventory").innerHTML =
        game.pets.length ? game.pets.map(pet => `
            <div class="pet-card ${game.equipped.includes(pet.id) ? "equipped" : ""}">
                <div class="emoji">${pet.emoji}</div>
                <h3>${pet.name}</h3>
                <p class="rarity">${pet.rarity}</p>
                <p>Multiplicador x${pet.mult}</p>
                <button onclick="equipPet(${pet.id})">
                    ${game.equipped.includes(pet.id) ? "DESEQUIPAR" : "EQUIPAR"}
                </button>
            </div>
        `).join("") : "<p>Você ainda não tem gatinhos! Chocque um ovo! 🥚</p>";

    document.getElementById("equipInfo").textContent =
        "🐾 " + game.equipped.length + "/3 gatinhos equipados";
}

document.getElementById("rebirthButton").addEventListener("click", () => {
    const cost = 10000 * Math.pow(5, game.rebirths);

    if (game.coins < cost) {
        notify("🍓 Você precisa de " + format(cost) + " moranguinhos!");
        return;
    }

    if (!confirm("Quer fazer renascimento? Seus upgrades e moedas serão resetados!")) return;

    game.coins = 0;
    game.power = 1;
    game.level = 1;
    game.xp = 0;
    game.upgrades = {};
    game.rebirths++;
    game.gems += 10;

    notify("💗 REBIRTH! Você ganhou 10 joias!");
    update();
    saveGame(false);
});

function saveGame(show = true) {
    localStorage.setItem("kittyFarmSave", JSON.stringify(game));
    if (show) notify("💾 Progresso salvo!");
}

function loadGame() {
    try {
        const saved = localStorage.getItem("kittyFarmSave");
        if (!saved) return;

        const data = JSON.parse(saved);

        game = {...game, ...data};

        if (!Array.isArray(game.pets)) game.pets = [];
        if (!Array.isArray(game.equipped)) game.equipped = [];

        const validIds = new Set(game.pets.map(p => p.id));
        game.equipped = game.equipped.filter(id => validIds.has(id)).slice(0, 3);

    } catch (e) {
        console.error("Não foi possível carregar o progresso.", e);
    }
}

function resetGame() {
    if (!confirm("Apagar todos os seus gatinhos e moranguinhos?")) return;

    localStorage.removeItem("kittyFarmSave");

    game = {
        coins: 0,
        gems: 0,
        power: 1,
        level: 1,
        xp: 0,
        rebirths: 0,
        pets: [],
        equipped: [],
        upgrades: {}
    };

    update();
    notify("🎀 Novo jogo iniciado!");
}

setInterval(() => {
    const gain = autoGain();

    if (gain > 0) {
        addCoins(gain);
        update();
    }
}, 1000);

setInterval(() => saveGame(false), 10000);

loadGame();
update();
