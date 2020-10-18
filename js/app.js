// deck of all cards in game
const deck_holder = document.getElementById("card-deck-placeholder");
const player_list = document.getElementById("player-list");

// declaring move variable
let moves = 0;
let counter = document.querySelector(".moves");

// declaring variable of matchedCards
let matchedCard = document.getElementsByClassName("match");

// close icon in modal
let closeicon = document.querySelector(".close");

// declare modal
let modal = document.getElementById("popup1")


let player_id = Math.round(Date.now() * Math.random());
let player_name;
let room = "default";

let my_cards;

let socket = io.connect();


class GameState{

    game_start;
    moves;
    timestamp;
    cardDeck;
    players;
    order;
    turn;
    active;
    
    admin;
    constructor() {
        this.moves = 0;
        this.game_start = false;
        this.timestamp = Date.now();
        this.turn = player_id;
        this.players = [];
        this.order = [];
        this.active = {};
        this.admin = false;
    }
    
    be_admin(){
        this.admin = true;
    }

    sync(){
        this.send();
    }

    add_player(id, name){

        if(!this.game_start){
            this.players.push(name);
            this.order.push(id);

            if(this.turn === 0){
                this.turn = id;
            }

            this.update_player_list();
        }
    }

    remove_player(id, name){

        if(!this.game_start){
            const index = this.players.indexOf(name);
            const order_index = this.order.indexOf(id);

            if (index > -1) {
                this.players.splice(index, 1);
            }

            if (index > -1){
                this.order.splice(order_index, 1);
            }

            this.update_player_list()
        }
    }

    purge_inactive(){
        if(this.players !== undefined){
            for(let i = 0; i < this.players.length; i++){
                let player = this.players[i];
                let id = this.order[i];

                let ts = gameState.active[id];

                console.log(id);
                console.log(ts);
                console.log(player);

                if(ts + 10000 < Date.now() || ts === undefined){
                    this.remove_player(id, player);
                    this.update_player_list();
                }
            }
        }
    }

    update_player_list(){
        player_list.innerHTML = "";

        for(let i = 0; i < this.players.length; i++){
            let player_label = document.createElement("i");
            player_label.innerText = this.players[i] + "\n";
            player_list.appendChild(player_label);
        }
    }

    send(){
        socket.emit("sync", {"room": room,
            "game_start": this.game_start,
            "moves": this.moves,
            "players": this.players,
            "order": this.order,
            "turn": this.turn,
            "timestamp": this.timestamp,
            "cardDeck": this.cardDeck});
    }

    next_player(){
        let next_index = this.order.indexOf(this.turn) + 1;

        if(next_index < this.order.length){
            this.turn = this.order[next_index]
        }else{
            this.turn = this.order[0];
        }
    }

    same_player(){
    }

    recieve(data){
        let ids = [];
        let contents = [];
        let headers = [];

        try{
            for(let i = 0; i < data.cardDeck.card_no; i++){
                ids.push(data.cardDeck.Cards[i].id);
                contents.push(data.cardDeck.Cards[i].content);
                headers.push(data.cardDeck.Cards[i].header);
            }

            let cd = new CardDeck(ids, contents, headers);


            deck_holder.innerHTML = "";

            cd.generateDOM();

            for(let i = 0; i < data.cardDeck.card_no; i++){
                cd.Cards[i].opened = data.cardDeck.Cards[i].opened;
                cd.Cards[i].matched = data.cardDeck.Cards[i].matched;
                cd.Cards[i].unmatched = data.cardDeck.Cards[i].unmatched;
                cd.Cards[i].owner = data.cardDeck.Cards[i].owner;
                cd.Cards[i].partner_id = data.cardDeck.Cards[i].partner_id;

                if(cd.Cards[i].matched){
                    cd.matched_cards.push(cd.Cards[i]);
                }
            }

            deck_holder.innerHTML = "";
            cd.generateDOM();

            this.cardDeck = cd;

        } catch (e){
            console.log(e)
        }

        this.moves = data.moves;
        if(this.admin){
            for(let i = 0; i < data.players.length; i++){

                console.log(data.players[i]);

                if(this.players.indexOf(data.players[i]) === -1){
                    this.players.push(data.players[i]);
                }else{

                }

                if(this.order.indexOf(data.order[i]) === -1){
                    this.order.push(data.order[i]);
                }else{

                }
            }
        }else{
            this.players = data.players;
            this.order = data.order;
        }


        this.game_start = data.game_start;

        if(data.turn !== 0){
            this.turn = data.turn;
        }


        this.updateUI();

    }

    updateUI(){

        this.update_player_list();

        if(this.cardDeck !== undefined){
            deck_holder.innerHTML = "";
            this.cardDeck.generateDOM();
            deck_holder.appendChild(this.cardDeck.DOMElement);

            if(player_id === gameState.turn){
                enable();
            }else{
                disable();
            }
        }

    }
}

let gameState = new GameState();

class Card{
    id;
    partner_id;

    header;
    content;

    opened;
    DOMElement;
    matched;
    unmatched;

    owner = "";

    constructor(id, content, header) {
        this.id = id;
        this.opened = false;
        this.matched = false;
        this.unmatched = false;
        this.content = content;
        this.header = header;
    }

    generateDOM(){
        this.DOMElement = document.createElement("li");

        let content = document.createElement("div");
        let header = document.createElement("i");
        let name = document.createElement("h6");

        name.innerText=this.owner;
        header.innerHTML = this.header;
        content.innerHTML = this.content;

        content.classList.add("description");

        this.DOMElement.appendChild(name);
        this.DOMElement.appendChild(header);
        this.DOMElement.appendChild(content);


        this.DOMElement.classList.add("card");
        this.DOMElement.id = "card_" + this.id


        if(this.opened){
            this.play_open_animation();
        }

        if(this.matched){
            this.display_matched();
        }

        if(this.unmatched){
            disable();
            this.play_unmatch_animation();
            let t = this;

            setTimeout(function () {
                t.play_cover_animation();
            }, 1000);

            setTimeout(function (){enable()}, 1500);
        }
    }

    open_card(){
        if(this.opened === false && this.matched === false && this.unmatched === false)
        {
            this.opened = true;

            this.play_open_animation();
        }
        disable();
        if(gameState.cardDeck.opened_cards.length === 2){
            if(gameState.turn === player_id){
                setTimeout(function (){ enable()}, 4000);
            }else{
                disable();
            }
        }else{
            if(gameState.turn === player_id){
                setTimeout(function (){ enable()}, 500);
            }else{
                disable();
            }
        }
    }

    play_open_animation(){
        this.DOMElement.classList.add("open");
        this.DOMElement.classList.add("show");
        this.DOMElement.getElementsByTagName("img")[0].classList.remove("dis");
        this.DOMElement.getElementsByTagName("img")[0].classList.add("hide");
    }

    play_match_animation(){
        this.DOMElement.classList.add("match", "disabled");

        this.DOMElement.classList.remove("show", "open", "no-event");
    }

    enable(){

        this.DOMElement.classList.remove("disabled");
    }

    disable(){
        this.DOMElement.classList.add("disabled");
    }

    display_matched(){
        this.DOMElement.classList.add("show");
        this.DOMElement.classList.add("open");

        this.DOMElement.classList.add("match", "disabled");
        this.DOMElement.classList.add("no-anim");
    }

    play_unmatch_animation(){

        this.DOMElement.classList.add("show");
        this.DOMElement.classList.add("open");
        this.DOMElement.classList.add("unmatched", "disabled");
        this.DOMElement.classList.add("no-anim");

    }

    play_cover_animation(){

        this.DOMElement.classList.remove("show", "unmatched", "open", "disabled", "no-anim");

        this.DOMElement.getElementsByTagName("img")[0].classList.add("dis");
        this.DOMElement.getElementsByTagName("img")[0].classList.remove("hide");
    }

    display_owner(){

        this.DOMElement.innerHTML = "";

        let content = document.createElement("div");
        let header = document.createElement("i");
        let name = document.createElement("h6");

        name.innerText=this.owner;
        header.innerHTML = this.header;
        content.innerHTML = this.content;

        content.classList.add("description");

        this.DOMElement.appendChild(name);
        this.DOMElement.appendChild(header);
        this.DOMElement.appendChild(content);
    }
}

class CardDeck{

    card_no;
    Cards;

    opened_cards = [];
    matched_cards = [];

    DOMElement;

    constructor(ids, contents, headers) {
        this.Cards = [];
        this.card_no = ids.length;

        for(let i = 0; i < this.card_no; i++){
            this.Cards.push(new Card(ids[i], contents[i], headers[i]));
        }

        for(let i = 0; i < this.card_no/2 ; i++){
            this.Cards[i*2].partner_id = this.Cards[i*2 + 1].id;
            this.Cards[i*2 +1].partner_id = this.Cards[i*2].id;
        }
    }

    shorten(card_no){
        let overflow = (this.card_no/2) - (card_no/2);

        for(let i = 0; i < overflow; i++){
            let random_card = Math.floor(Math.random()*(this.card_no/2));

            let partner_card_id = this.Cards[random_card].partner_id

            console.log(random_card);
            console.log(this.Cards[random_card]);

            this.Cards.splice(random_card, 1);

            for(let i = 0; i < this.Cards.length; i++){
                if(this.Cards[i].id === partner_card_id){
                    this.Cards.splice(i, 1);
                }
            }

            this.card_no = this.Cards.length;
        }
    }

    open_card(id, sync){

        this.opened_cards.push(this.Cards[id]);
        this.Cards[id].open_card();

        console.log(this.opened_cards);

        let t = this;

        if(sync){
            gameState.sync();
        }

        if(this.opened_cards.length === 2){

            disable();
            gameState.moves++;
            this.opened_cards[1].DOMElement.classList.add("prio");

            setTimeout(function (){
            if (t.opened_cards[0].id === t.opened_cards[1].partner_id) {

                t.matched();
                my_cards = 0;
                for(let i = 0; i < gameState.cardDeck.length;i++){
                    if(gameState.cardDeck.Cards[i].owner === player_name){
                        my_cards++;
                    }
                }
            } else {
                t.unmatched();
            }

            if(sync){
                gameState.sync();
            }
            }, 4000);
        }
    }

    matched() {
        disable();

        this.opened_cards[0].play_match_animation();
        this.opened_cards[1].play_match_animation();

        this.opened_cards[0].matched= true;
        this.opened_cards[1].matched= true;


        this.opened_cards[0].owner = player_name;
        this.opened_cards[1].owner = player_name;

        this.opened_cards[0].display_owner();
        this.opened_cards[1].display_owner();

        this.opened_cards[0].opened = false;
        this.opened_cards[1].opened = false;

        gameState.same_player();

        this.matched_cards.push(this.opened_cards);

        this.opened_cards = [];

        setTimeout(function (){enable()}, 1000);

        gameState.sync();
    }

    unmatched() {
        disable();
        this.opened_cards[0].play_unmatch_animation();
        this.opened_cards[1].play_unmatch_animation();

        this.opened_cards[0].unmatched = true;
        this.opened_cards[1].unmatched = true;

        this.opened_cards[0].opened = false;
        this.opened_cards[1].opened = false;

        gameState.next_player();

        let c = this.opened_cards;
        let t = this;

        this.opened_cards = [];

        gameState.sync();

        setTimeout(function () {
            c[0].play_cover_animation();
            c[1].play_cover_animation();
            c[0].unmatched= false;
            c[1].unmatched= false;
            t.opened_cards = [];
            gameState.sync();

        }, 1000);

        setTimeout(function (){
            if(player_id === gameState.turn){
                enable();
            }else{
                disable();
            }
        }, 1500);
    }

    generateDOM(){

        this.DOMElement = document.createElement("ul");
        this.DOMElement.classList.add("deck");
        this.DOMElement.id = "card-deck";


        for(let i = 0; i < this.card_no; i++){
            this.Cards[i].generateDOM();
            this.Cards[i].DOMElement.addEventListener("click", cardOpen);
            this.DOMElement.appendChild(this.Cards[i].DOMElement)
        }

    }

    shuffle() {
        let currentIndex = this.Cards.length;
        let randomIndex = this.Cards.length;


        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;
            let temporaryValue = this.Cards[currentIndex];
            this.Cards[currentIndex] = this.Cards[randomIndex];
            this.Cards[randomIndex] = temporaryValue;
        }
    }
}



//setInterval(gameState.purge_inactive, 5000);

socket.on("sync", function (data){
    console.log(data)
    gameState.recieve(data)});

socket.on("start", function (data){
    gameState.game_start = true;
    startGame(gameState.cardDeck);
});

socket.on("alive", function(data){
    console.log(data)
    gameState.active[data.id] = data.timestamp;
});


socket.on("join", function (data){
    gameState.add_player(data.id, data.name);
    setTimeout(function (){
        gameState.sync();
    }, 400);
});

socket.on("leave", function (data){

    gameState.remove_player(data.id, data.name);

    setTimeout(function (){
        gameState.sync();
    }, 400);
});

function admin(){
    gameState.be_admin();
}

function leaveGame(){

    let button = document.getElementById("join_leave");

    document.getElementById("player-name").disabled = false;
    document.getElementById("game-code").disabled = false;
    button.classList.remove();

    button.innerText = "Spiel betreten";
    button.onclick = joinGame;

    gameState.remove_player(player_id, player_name);


    player_name = document.getElementById("player-name").value;

    gameState = new GameState();

    socket.emit("leave",{"id": player_id, "name": player_name, "room": room});

    room = "";
}

function joinGame(){

    let button = document.getElementById("join_leave");

    button.classList.remove();
    document.getElementById("player-name").disabled = true;
    document.getElementById("game-code").disabled = true;

    button.innerText = "Spiel Verlassen";
    button.onclick = leaveGame;

    if(document.getElementById("game-code").value !== ""){
        room = document.getElementById("game-code").value;
    }else{
        room = "default";
    }

    player_name = document.getElementById("player-name").value;

    socket.emit("join",{"id": player_id, "name": player_name, "room": room});

    gameState.sync();
}




function masterStart() {

    //let headers = ["Melone", "Melone", "Kiwi", "Kiwi", "Baguette", "Baguette"];
    //let contents = ["Das ist eine Melone", "Das ist eine Melone", "Das ist eine Kiwi", "Das ist eine Kiwi", "Avec", "fromage"]
    //let ids = [0, 1, 2, 3, 4, 5];

   /* for(let i = 0; i < 32; i++){
        contents.push(Math.round(i/2))
        ids.push(i)
    }
    */

    let cd = new CardDeck(ids, contents, headers);
    let card_number = document.getElementById("card_counter").value;

    cd.shorten(card_number*2);

    cd.shuffle();
    gameState.cardDeck = cd;
    gameState.game_start = true;
    gameState.admin = true;

    socket.emit("start", {"room": room});


    startGame(gameState.cardDeck.Cards);
}

// @description function to start a new play with pre shuffled cards
function startGame(_cards) {

    deck_holder.innerHTML = "";

    gameState.cardDeck.generateDOM();

    deck_holder.appendChild(gameState.cardDeck.DOMElement);

    if(gameState.turn === player_id){
        enable();
    }else{
        disable();
    }

    gameState.sync();
}

function sendKeepalive(){
    socket.emit("alive", {"id": player_id, "room": room, "timestamp": Date.now()});
}

// @description add opened cards to OpenedCards list and check if cards are match or not
function cardOpen() {

    for(let i = 0; i < gameState.cardDeck.Cards.length; i++){
        if(this === gameState.cardDeck.Cards[i].DOMElement){
            gameState.cardDeck.open_card(i, true);
        }
    }
}



// @description disable cards temporarily
function disable() {
    Array.prototype.filter.call(gameState.cardDeck.Cards, function (card) {
        card.DOMElement.classList.add('disabled');
    });
}


// @description enable cards and disable matched cards
function enable() {
    Array.prototype.filter.call(gameState.cardDeck.Cards, function (card) {
        card.DOMElement.classList.remove('disabled');
        if(card.matched || card.opened){
            card.DOMElement.classList.add('disabled');
        }
    });
}
