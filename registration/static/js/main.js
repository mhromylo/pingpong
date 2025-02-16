document.addEventListener("DOMContentLoaded", function () {

    const container = document.getElementById("content");

    function loadPage(url, addToHistory = true) {
        fetch(url)
            .then(response => response.text())
            .then(html => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                const newContent = tempDiv.querySelector('#content');
    
                if (newContent) {
                    container.innerHTML = newContent.innerHTML;
                }

                if (url === '/game_setup')
                    loadMyCanvasScript();
    
                if (addToHistory) {
                    history.pushState({ path: url }, "", url);
                }
            })
            .catch(error => console.error("Error loading page:", error));
    }
    

    document.querySelectorAll("a.nav-link").forEach(link => {
        link.addEventListener("click", function (event) {
            event.preventDefault();
            const url = this.getAttribute("href").replace("#", ""); // Remove #
            loadPage(url);
        });
    });

    window.addEventListener("popstate", function (event) {
        if (event.state) {
            loadPage(event.state.path, false);
        }
    });

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

    // const ws = new WebSocket('wss://localhost/ws/status/');

    // ws.onmessage = function(event) {
    //     const data = JSON.parse(event.data);
    //     if (data.type === "friend_status") {
    //         const friendId = data.user_id;
    //         const status = data.status;
    //         updateFriendStatus(friendId, status); // Update the UI for the friend
    //     }
    // };

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


    function handleFormTournamentSubmission(formId, endpoint, onSuccess) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', function (event) {
            event.preventDefault();  // Prevent default form submission
            const formData = new FormData(form);
            const csrfToken = getCSRFToken();

            fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken || ''  // Ensure no error if token is missing
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    onSuccess(data);
                } else {
                    alert(data.message || 'An error occurred.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while processing the request.');
            });
        });
    }

    // Handle create tournament form
    handleFormTournamentSubmission('create-tournament-form', '/create_tournament/', function (data) {
        const tournamentDiv = document.getElementById('tournament-info');
        if (!tournamentDiv) return;

        tournamentDiv.innerHTML = `
            <h3>Created Tournament: ${data.tournament_name}</h3>
            <p><strong>Creator:</strong> ${data.creator}</p>
            <p><strong>Players:</strong> ${data.player_count}</p>
            <p><strong>Avatar:</strong> <img src="${data.player1_avatar}" alt="Player Avatar" class="avatar"></p>
            <a href="/tournament/${data.tournament_id}/">View Tournament</a>
        `;
        tournamentDiv.style.display = 'block';
    });

    function handleSecondFormSubmission(formId, url, callback) {
        const form = document.getElementById(formId);
        if (!form) return;
        form.addEventListener('submit', function (event) {
            event.preventDefault();  // Prevent default form submission
            const formData = new FormData(form);
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
            fetch(url, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken,  // Include CSRF token
                    'Accept': 'application/json'  // Explicitly expect JSON response
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    callback(data);  // Pass the response data to the callback function
                } else {
                    alert('!Error: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('?An error occurred.');
            });
        });
    }
    
    // Handle second player form
    handleSecondFormSubmission('second-player-form', '/second_player_tournament/', function (data) {
        alert(data.message);
    
        // Show the player profile and populate the data
    
        
    
            // Populate the data
            document.getElementById('second-player-display-name').innerHTML = `<strong>Display Name:</strong> ${data.player2_display_name}`;
            document.getElementById('second-player-wins').innerHTML = `<strong>Wins:</strong> ${data.player2_wins}`;
            document.getElementById('second-player-losses').innerHTML = `<strong>Losses:</strong> ${data.player2_losses}`;
            document.getElementById('second-player-id').innerHTML = `<strong>ID:</strong> ${data.player2_id}`;
    
            const avatar = document.getElementById('player2-avatar');
            if (avatar) {
                avatar.src = data.player2_avatar || '/media/avatars/default.png';  // Set default avatar if none
            }
        
    
        // Hide the form after success
       
    });

});


function loadMyCanvasScript() {
    var existingScript = document.querySelector('script[src="/static/js/myCanvas.js"]');
    if (existingScript) {
        existingScript.remove();
    }
    var script = document.createElement('script');
    script.type = 'module';
    script.src = "/static/js/myCanvas.js";
    script.onload = function() {};
    document.head.appendChild(script);
}
