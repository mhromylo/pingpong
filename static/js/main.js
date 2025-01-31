let socket;
document.addEventListener("DOMContentLoaded", function () {
    const container = document.getElementById("content");

    function Navigate(page) {
        fetch("/" + page + "/")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Responce wrong ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success && data.html) {
                    container.innerHTML = data.html;
                } else {
                    container.innerHTML = `<h2>Page not found: ${page}</h2>`;
                }
            })
            .catch(error => {
                console.error("Error fetching regidtration", error);
                container.innerHTML = `<h2>Page not found: ${page}</h2>`;
            });
    }

    function handleFormSubmit(event) {
        event.preventDefault(); // Prevent normal form submission
        const form = event.target;
        const formData = new FormData(form);
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;


        fetch(form.action, {
            method: 'POST',
            contentType: 'application/json',
            headers: {'X-CSRFToken': csrfToken},
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    container.innerHTML = `<h2>${data.message}</h2>`;
                } else if (data.errors) {
                    const errors = Object.entries(data.errors)
                        .map(([field, msgs]) => `<p><strong>${field}:</strong> ${msgs.join(', ')}</p>`)
                        .join('');
                    container.innerHTML = `<div class="alert alert-danger">${errors}</div>`;
                }
            })
            .catch(error => {
                console.error("Error submitting form", error);
            });
    }

    document.querySelectorAll("nav a").forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();

            let page = this.getAttribute("href").substring(1);

            Navigate(page);
        });
    });

    function handleDefaultFormSubmit(event) {
        const form = event.target;
        const formData = new FormData(form);
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;


        fetch(form.action, {
            method: 'POST',
            contentType: 'application/json',
            headers: {'X-CSRFToken': csrfToken},
            body: formData,
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    window.location.reload();
                } else if (data.errors) {
                    const errors = Object.entries(data.errors)
                        .map(([field, msgs]) => `<p><strong>${field}:</strong> ${msgs.join(', ')}</p>`)
                        .join('');
                    container.innerHTML = `<div class="alert alert-danger">${errors}</div>`;
                }
            })
            .catch(error => {
                console.error("Error submitting form", error);
            });
    }

    document.addEventListener("DOMContentLoaded", function() {
        const forms = document.querySelectorAll('form');
    
        forms.forEach(function(form) {
            if (form.id !== 'logout-form') { // Check if form does not have the ID 'logout-form'
                form.addEventListener("submit", handleFormSubmit);
            }
        });
    });

    document.addEventListener("DOMContentLoaded", function() {
        const form = document.getElementById("logout-form");
        if (form) {
            form.addEventListener("submit", handleDefaultFormSubmit);
        }
    });
	const multiplayerButton = document.getElementById("multiplayerButton");
	multiplayerButton.addEventListener("click", function(){
		socket = new WebSocket("wss://localhost/ws/socket-server/");

		socket.onopen = function(event){
			console.log("Websocket connection established,");
			socket.send(JSON.stringify({message: "ready", playerId: player1Id}));
		};
	
		socket.onmessage = function(event) {
			const message = JSON.parse(event.data);
			console.log("Recived from server:", message);

			if(message.status === "ready"){
				startGame();
			}
			updateGameState(message);
		 };
	
		socket.onerror = function(event){
			console.error("Websocket error:", event);
		};
	
		socket.onclose = function(event){
			console.log("Websocket connection closed.");
		};
		this.disabled = true;
	})
  
	
	
    function updateFriendStatus(friendId, status) {
        const statusElement = document.getElementById(`status-${friendId}`);
        if (statusElement) {
            statusElement.textContent = status === "online" ? "Online" : "Offline";
            statusElement.setAttribute("data-status", status);
        }
    }

    function updateStatus(status) {
        ws.send(JSON.stringify({
            type: "status_update",
            status: status
        }));
}


});

function updateGameState(state){
	paddleY_1 = state.paddles.player1;
    paddleY_2 = state.paddles.player2;
    x = state.ball.x;
    y = state.ball.y;
    dx = state.ball.dx;
    dy = state.ball.dy;
    pl_1_score = state.score.player1;
    pl_2_score = state.score.player2;

	draw();
}

function sendPlayerMove(){
	const moveData = {
		playerId: player1Id,
		paddleY: paddleY_1,
		action: 'move'
	};
	socket.send(JSON.stringify(moveData));
}

document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);

function keyDownHandler(e) {
    if (e.key === "W" || e.key === "w") {
        Wpressed = true;
        sendPlayerMove();
    } else if (e.key === "S" || e.key === "s") {
        Spressed = true;
        sendPlayerMove();
    }

    if (e.key === "ArrowUp" || e.key === "Up") {
        UpPressed = true;
        e.preventDefault();
    } else if (e.key === "ArrowDown" || e.key === "Down") {
        DownPressed = true;
        e.preventDefault();
    }
}

function keyUpHandler(e) {
    if (e.key === "W" || e.key === "w") {
        Wpressed = false;
        sendPlayerMove();
    } else if (e.key === "S" || e.key === "s") {
        Spressed = false;
        sendPlayerMove();
    }

    if (e.key === "ArrowUp") {
        UpPressed = false;
    } else if (e.key === "ArrowDown") {
        DownPressed = false;
    }
}