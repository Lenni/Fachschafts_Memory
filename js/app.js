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


let player_id = Math.round($.now() * Math.random());
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

    constructor() {
        this.moves = 0;
        this.game_start = false;
        this.timestamp = $.now();
        this.turn = 0;
        this.players = [];
        this.order = [];
    }

    sync(){
        this.send();
    }

    add_player(id, name){
        this.players.push(name);
        this.order.push(id);

        if(this.turn === 0){
            this.turn = id;
        }

        player_list.innerHTML = "";

        for(let i = 0; i < this.players.length; i++){
            let player_label = document.createElement("i");
            player_label.innerText = this.players[i] + "\n";
            player_list.appendChild(player_label);
        }
    }

    remove_player(name){
        const index = this.players.indexOf(name);
        if (index > -1) {
            this.players.splice(index, 1);
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

            if(cd.Cards[i].matched){
                cd.matched_cards.push(cd.Cards[i]);
            }
        }

        deck_holder.innerHTML = "";
        cd.generateDOM();

        this.cardDeck = cd;
        this.moves = data.moves;
        this.turn = data.turn;
        this.order = data.order;
        this.game_start = data.game_start;

        deck_holder.appendChild(this.cardDeck.DOMElement);

        if(player_id === gameState.turn){
            enable();
        }else{
            disable();
        }

    }
}

let gameState = new GameState();


class Card{
    id;

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
        header.innerText = this.header;
        content.innerText = this.content;

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

            this.play_unmatch_animation();
            let t = this;
            setTimeout(function () {
                t.play_cover_animation();
            }, 1000);
        }
    }

    open_card(){
        if(this.opened === false && this.matched === false && this.unmatched === false)
        {
            this.opened = true;

            this.play_open_animation();
        }
    }

    play_open_animation(){
        this.DOMElement.classList.add("open");
        this.DOMElement.classList.add("show");
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
    }

    display_owner(){

        this.DOMElement.innerHTML = "";

        let child = document.createElement("i");
        let header = document.createElement("h6");

        header.innerText=this.owner;
        child.innerHTML = this.content;

        this.DOMElement.appendChild(header);
        this.DOMElement.appendChild(child);
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
    }

    open_card(id, sync){

        this.opened_cards.push(this.Cards[id]);
        this.Cards[id].open_card();

        let t = this;

        if(sync){
            gameState.sync();
        }

        if(this.opened_cards.length === 2){
            gameState.moves++;
            this.opened_cards[1].DOMElement.classList.add("prio");

            setTimeout(function (){
            if (t.opened_cards[0].content === t.opened_cards[1].content) {

                t.matched()
                my_cards = 0;
                for(let i = 0; i < gameState.cardDeck.length;i++){
                    if(gameState.cardDeck.Cards[i].owner === player_name){
                        my_cards++;
                    }
                }
                counter.innerHTML = my_cards;
            } else {
                t.unmatched();
            }
            if(sync){
                gameState.sync();
            }
            }, 1000);
        }
    }

    matched() {

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

        gameState.sync();
    }

    unmatched() {
        this.opened_cards[0].play_unmatch_animation();
        this.opened_cards[1].play_unmatch_animation();

        this.opened_cards[0].unmatched = true;
        this.opened_cards[1].unmatched = true;

        this.opened_cards[0].opened = false;
        this.opened_cards[1].opened = false;

        gameState.next_player();

        let c = this.opened_cards;
        let t = this;

        setTimeout(function () {
            c[0].play_cover_animation();
            c[1].play_cover_animation();
            c[0].unmatched= false;
            c[1].unmatched= false;
            t.opened_cards = [];
            gameState.sync();

            if(player_id === gameState.turn){
                enable();
            }else{
                disable();
            }

        }, 1000);
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



// @description shuffles cards when page is refreshed / loads
//document.body.onload = startGame();

socket.on("sync", function (data){
    console.log(data)
    gameState.recieve(data)});

socket.on("start", function (data){
    startGame(gameState.cardDeck);
});



socket.on("join", function (data){
    gameState.add_player(data.id, data.name);
    gameState.sync();
});

function joinGame(){
    if(document.getElementById("game-code").value !== ""){
        room = document.getElementById("game-code").value;
    }else{
        room = "default";
    }

    player_name = document.getElementById("player-name").value;

    socket.emit("join",{"id": player_id, "name": player_name, "room": room});
}




function masterStart() {

    let headers = ["Melone", "Melone", "Kiwi", "Kiwi", "Baguette", "Baguette"];
    let contents = ["Das ist eine Melone", "Das ist eine Melone", "Das ist eine Kiwi", "Das ist eine Kiwi", "Avec", "fromage"]
    let ids = [0, 1, 2, 3, 4, 5];

   /* for(let i = 0; i < 32; i++){
        contents.push(Math.round(i/2))
        ids.push(i)
    }
    */

    let cd = new CardDeck(ids, contents, headers);

    cd.shuffle();
    gameState.cardDeck = cd;
    gameState.sync();

    socket.emit("start", {"room": room});


    startGame(gameState.cardDeck.Cards);
}

// @description function to start a new play with pre shuffled cards
function startGame(_cards) {

    deck_holder.innerHTML = "";

    gameState.cardDeck.generateDOM();

    deck_holder.appendChild(gameState.cardDeck.DOMElement);

    // reset moves
    moves = 0;
    //counter.innerHTML = moves;

    let timer = document.querySelector(".timer");
    timer.innerHTML = "0 mins 0 secs";
    clearInterval(interval);

    gameState.sync();
}

function updateScreen(){

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

// @description game timer
second = 0;
minute = 0;
hour = 0;
const timer = document.querySelector(".timer");
var interval;

function startTimer() {
    interval = setInterval(function () {
        timer.innerHTML = minute + "mins " + second + "secs";
        second++;
        if (second == 60) {
            minute++;
            second = 0;
        }
        if (minute == 60) {
            hour++;
            minute = 0;
        }
    }, 1000);
}


// @description congratulations when all cards match, show modal and moves, time and rating
function congratulations() {
    let finalTime;

    if (matchedCard.length === 16) {
        clearInterval(interval);
        finalTime = timer.innerHTML;

        // show congratulations modal
        modal.classList.add("show");

        // declare star rating variable
        var starRating = document.querySelector(".stars").innerHTML;

        //showing move, rating, time on modal
        document.getElementById("finalMove").innerHTML = moves;
        document.getElementById("starRating").innerHTML = starRating;
        document.getElementById("totalTime").innerHTML = finalTime;

        //closeicon on modal
        closeModal();
    }
}


// @description close icon on modal
function closeModal() {
    closeicon.addEventListener("click", function (e) {
        modal.classList.remove("show");
        startGame();
    });
}


// @desciption for user to play Again 
function playAgain() {
    modal.classList.remove("show");
    masterStart();
}
